-- Chatbot: what the care team tells the bot, an audit trail of every bot turn, and alerts for
-- doctors when a conversation is escalated.
--
--   bot_knowledge – per-patient notes written by the patient's care team (doctors + nurses).
--                   The bot answers only from these; anything they don't cover gets escalated.
--   bot_decisions – one row per patient message the bot handled: answered / escalated / held, why,
--                   and which knowledge it cited. Staff only, so patients never see the reasoning.
--   alerts        – one row per doctor to notify when an escalation opens. Feeds the doctor
--                   dashboard (realtime); the doctor marks it read.
--
-- Everything the bot writes goes through the `chat` edge function with the service role.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.bot_action as enum ('answered', 'small_talk', 'escalated', 'held');
create type public.escalation_source as enum ('patient', 'bot');
create type public.alert_kind as enum ('escalation');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.bot_knowledge (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients (id) on delete cascade,
  hospital_id uuid not null references public.hospitals (id) on delete cascade, -- filled from patient
  author_id   uuid references public.profiles (id) on delete set null,           -- filled from caller
  title       text not null check (length(title) between 1 and 200),
  content     text not null check (length(content) between 1 and 10000),
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index bot_knowledge_patient_id_idx on public.bot_knowledge (patient_id) where active;
create index bot_knowledge_hospital_id_idx on public.bot_knowledge (hospital_id);
create index bot_knowledge_author_id_idx on public.bot_knowledge (author_id);

-- Escalations now say who raised them and which patient message triggered it.
alter table public.escalations
  add column source     public.escalation_source not null default 'patient',
  add column message_id uuid references public.messages (id) on delete set null;
create index escalations_message_id_idx on public.escalations (message_id);

create table public.bot_decisions (
  id                  uuid primary key default gen_random_uuid(),
  conversation_id     uuid not null references public.conversations (id) on delete cascade,
  message_id          uuid not null references public.messages (id) on delete cascade, -- the patient's message
  reply_id            uuid references public.messages (id) on delete set null,          -- the bot's reply, if any
  escalation_id       uuid references public.escalations (id) on delete set null,
  action              public.bot_action not null,
  reason              text,
  cited_knowledge_ids uuid[] not null default '{}',
  model               text,
  created_at          timestamptz not null default now()
);
create index bot_decisions_conversation_id_idx on public.bot_decisions (conversation_id, created_at);
create index bot_decisions_message_id_idx on public.bot_decisions (message_id);
create index bot_decisions_reply_id_idx on public.bot_decisions (reply_id);
create index bot_decisions_escalation_id_idx on public.bot_decisions (escalation_id);

create table public.alerts (
  id            uuid primary key default gen_random_uuid(),
  recipient_id  uuid not null references public.profiles (id) on delete cascade,
  hospital_id   uuid not null references public.hospitals (id) on delete cascade,
  kind          public.alert_kind not null default 'escalation',
  escalation_id uuid not null references public.escalations (id) on delete cascade,
  read_at       timestamptz,
  created_at    timestamptz not null default now(),
  unique (recipient_id, escalation_id)
);
create index alerts_recipient_unread_idx on public.alerts (recipient_id, created_at desc) where read_at is null;
create index alerts_hospital_id_idx on public.alerts (hospital_id);
create index alerts_escalation_id_idx on public.alerts (escalation_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- bot_knowledge: hospital comes from the patient, author is whoever wrote it, notes can't move
-- between patients, and edits bump updated_at.
create function private.fill_bot_knowledge()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select hospital_id into new.hospital_id from public.patients where id = new.patient_id;
    new.author_id := coalesce((select auth.uid()), new.author_id);
  elsif new.patient_id is distinct from old.patient_id then
    raise exception 'bot_knowledge.patient_id cannot change';
  end if;
  new.updated_at := now();
  return new;
end $$;

create trigger bot_knowledge_fill before insert or update on public.bot_knowledge
for each row execute function private.fill_bot_knowledge();

-- escalations: alert the doctors responsible for the patient. That's the routed-to doctor plus
-- every doctor on the active care team; if there are none, every doctor in the hospital.
create function private.alert_on_escalation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.alerts (recipient_id, hospital_id, escalation_id)
  select d.id, new.hospital_id, new.id
  from public.profiles d
  where d.hospital_id = new.hospital_id
    and d.role = 'doctor'
    and (
      d.id = new.routed_to
      or exists (
        select 1 from public.care_assignments ca
        where ca.patient_id = new.patient_id and ca.staff_id = d.id and ca.active
      )
    )
  on conflict do nothing;

  if not found then
    insert into public.alerts (recipient_id, hospital_id, escalation_id)
    select d.id, new.hospital_id, new.id
    from public.profiles d
    where d.hospital_id = new.hospital_id and d.role = 'doctor'
    on conflict do nothing;
  end if;
  return new;
end $$;

create trigger escalations_alert after insert on public.escalations
for each row execute function private.alert_on_escalation();

-- Escalations opened before this migration get the alerts they would have raised.
insert into public.alerts (recipient_id, hospital_id, escalation_id, created_at)
select d.id, e.hospital_id, e.id, e.created_at
from public.escalations e
join public.profiles d on d.hospital_id = e.hospital_id and d.role = 'doctor'
where e.status in ('open', 'claimed')
  and (
    d.id = e.routed_to
    or exists (
      select 1 from public.care_assignments ca
      where ca.patient_id = e.patient_id and ca.staff_id = d.id and ca.active
    )
  )
on conflict do nothing;

-- escalations: once resolved, its unread alerts are cleared for everyone.
create function private.clear_alerts_on_resolve()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.alerts set read_at = now() where escalation_id = new.id and read_at is null;
  return new;
end $$;

create trigger escalations_clear_alerts after update of status on public.escalations
for each row when (new.status = 'resolved' and old.status is distinct from 'resolved')
execute function private.clear_alerts_on_resolve();

-- ---------------------------------------------------------------------------
-- Patient-facing status: is a human handling this conversation right now?
-- Patients can't read escalations, so this is how their UI shows "with your care team".
-- ---------------------------------------------------------------------------

create function public.conversation_handed_off(p_conversation uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.can_read_conversation(p_conversation) and exists (
    select 1 from public.escalations
    where conversation_id = p_conversation and status in ('open', 'claimed')
  )
$$;

revoke all on function public.conversation_handed_off(uuid) from public, anon;
grant execute on function public.conversation_handed_off(uuid) to authenticated;
revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Column-level write grants (same pattern as the access model)
-- ---------------------------------------------------------------------------

revoke insert, update, delete, truncate, references, trigger
  on public.bot_knowledge, public.bot_decisions, public.alerts from anon, authenticated;

grant insert (patient_id, title, content, active) on public.bot_knowledge to authenticated;
grant update (title, content, active) on public.bot_knowledge to authenticated;
grant delete on public.bot_knowledge to authenticated;
grant update (read_at) on public.alerts to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.bot_knowledge enable row level security;
alter table public.bot_decisions enable row level security;
alter table public.alerts        enable row level security;

-- bot_knowledge: the patient's care team reads and writes; a doctor looking at an escalated
-- patient can read it for context. Patients and admins never see it.
create policy "care team and escalation doctors read knowledge" on public.bot_knowledge
  for select to authenticated using (
    hospital_id = (select private.my_hospital())
    and (private.is_care_team(patient_id) or private.doctor_sees_escalated_patient(patient_id))
  );
create policy "care team adds knowledge" on public.bot_knowledge
  for insert to authenticated with check (private.is_care_team(patient_id));
create policy "care team edits knowledge" on public.bot_knowledge
  for update to authenticated
  using (private.is_care_team(patient_id))
  with check (private.is_care_team(patient_id));
create policy "care team deletes knowledge" on public.bot_knowledge
  for delete to authenticated using (private.is_care_team(patient_id));

-- bot_decisions: staff who can read the conversation. Written only by the chat function.
create policy "staff read bot decisions" on public.bot_decisions
  for select to authenticated using (
    (select private.my_role()) in ('doctor', 'nurse')
    and private.can_read_conversation(conversation_id)
  );

-- alerts: your own, and you can only mark them read.
create policy "read own alerts" on public.alerts
  for select to authenticated using (recipient_id = (select auth.uid()));
create policy "mark own alerts read" on public.alerts
  for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime: the doctor dashboard listens for new alerts
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.alerts;
