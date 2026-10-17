-- Access model: hospitals, staff and patient accounts, chatbot conversations, escalations.
--
-- Roles (one hospital per user):
--   admin   – manages staff, patients and care teams; never reads chat content
--   doctor  – reads/replies to chats of assigned patients; sees every escalation in the hospital,
--             which also opens that escalated conversation to them
--   nurse   – reads/replies to chats of assigned patients; sees escalations of assigned patients
--   patient – reads/writes own conversations
--
-- The chatbot and the edge functions write with the service role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('admin', 'doctor', 'nurse', 'patient');
create type public.message_sender as enum ('patient', 'bot', 'staff');
create type public.escalation_urgency as enum ('low', 'medium', 'high');
create type public.escalation_status as enum ('open', 'claimed', 'resolved');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.hospitals (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  hospital_id uuid not null references public.hospitals (id) on delete cascade,
  role        public.user_role not null,
  full_name   text not null,
  email       text,
  created_at  timestamptz not null default now()
);
create index profiles_hospital_id_idx on public.profiles (hospital_id);

create table public.patients (
  id                uuid primary key references public.profiles (id) on delete cascade,
  hospital_id       uuid not null references public.hospitals (id) on delete cascade,
  date_of_birth     date,
  mrn               text,
  -- The doctor who treated the patient; escalations are routed here by default.
  primary_doctor_id uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (hospital_id, mrn)
);
create index patients_hospital_id_idx on public.patients (hospital_id);
create index patients_primary_doctor_id_idx on public.patients (primary_doctor_id);

create table public.care_assignments (
  patient_id uuid not null references public.patients (id) on delete cascade,
  staff_id   uuid not null references public.profiles (id) on delete cascade,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (patient_id, staff_id)
);
create index care_assignments_staff_id_idx on public.care_assignments (staff_id);

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null references public.patients (id) on delete cascade,
  hospital_id uuid not null references public.hospitals (id) on delete cascade, -- filled from patient
  created_at  timestamptz not null default now()
);
create index conversations_patient_id_idx on public.conversations (patient_id);
create index conversations_hospital_id_idx on public.conversations (hospital_id);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_type     public.message_sender not null,
  sender_id       uuid references public.profiles (id) on delete set null, -- null for the bot
  content         text not null,
  created_at      timestamptz not null default now(),
  check (sender_type <> 'bot' or sender_id is null)
);
create index messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);
create index messages_sender_id_idx on public.messages (sender_id);

create table public.escalations (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  patient_id      uuid not null references public.patients (id) on delete cascade,  -- filled from conversation
  hospital_id     uuid not null references public.hospitals (id) on delete cascade, -- filled from conversation
  reason          text not null,
  urgency         public.escalation_urgency not null default 'medium',
  status          public.escalation_status not null default 'open',
  routed_to       uuid references public.profiles (id) on delete set null, -- defaults to primary doctor
  claimed_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  claimed_at      timestamptz,
  resolved_at     timestamptz
);
create index escalations_hospital_id_status_idx on public.escalations (hospital_id, status, created_at desc);
create index escalations_conversation_id_idx on public.escalations (conversation_id);
create index escalations_patient_id_idx on public.escalations (patient_id);
create index escalations_routed_to_idx on public.escalations (routed_to);
create index escalations_claimed_by_idx on public.escalations (claimed_by);

-- ---------------------------------------------------------------------------
-- Helpers for RLS (in a schema the API doesn't expose)
-- ---------------------------------------------------------------------------

create schema private;
grant usage on schema private to authenticated;

create function private.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = (select auth.uid()) $$;

create function private.my_hospital()
returns uuid
language sql stable security definer set search_path = ''
as $$ select hospital_id from public.profiles where id = (select auth.uid()) $$;

-- Caller is on the patient's active care team.
create function private.is_care_team(p_patient uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.care_assignments
    where patient_id = p_patient and staff_id = (select auth.uid()) and active
  )
$$;

-- Caller is a patient and p_staff is on their active care team.
create function private.is_my_care_team_member(p_staff uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.care_assignments
    where patient_id = (select auth.uid()) and staff_id = p_staff and active
  )
$$;

-- Caller is a doctor in the patient's hospital and the patient has an escalation.
create function private.doctor_sees_escalated_patient(p_patient uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.my_role() = 'doctor' and exists (
    select 1 from public.escalations
    where patient_id = p_patient and hospital_id = private.my_hospital()
  )
$$;

-- Single source of truth for who may read (and reply in) a conversation.
create function private.can_read_conversation(p_conversation uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.conversations c
    where c.id = p_conversation
      and (
        c.patient_id = (select auth.uid())
        or (
          c.hospital_id = private.my_hospital()
          and private.my_role() in ('doctor', 'nurse')
          and (
            private.is_care_team(c.patient_id)
            or (
              private.my_role() = 'doctor'
              and exists (select 1 from public.escalations e where e.conversation_id = c.id)
            )
          )
        )
      )
  )
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Integrity triggers
-- ---------------------------------------------------------------------------

-- patients: profile must be a patient, primary doctor must be a doctor, all in one hospital.
create function private.check_patient()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.id and role = 'patient' and hospital_id = new.hospital_id
  ) then
    raise exception 'patients.id must be a patient profile in the same hospital';
  end if;
  if new.primary_doctor_id is not null and not exists (
    select 1 from public.profiles
    where id = new.primary_doctor_id and role = 'doctor' and hospital_id = new.hospital_id
  ) then
    raise exception 'primary_doctor_id must be a doctor in the same hospital';
  end if;
  return new;
end $$;

create trigger patients_check before insert or update on public.patients
for each row execute function private.check_patient();

-- care_assignments: staff must be a doctor or nurse in the patient's hospital.
create function private.check_care_assignment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles s join public.patients p on p.id = new.patient_id
    where s.id = new.staff_id and s.role in ('doctor', 'nurse') and s.hospital_id = p.hospital_id
  ) then
    raise exception 'care team member must be a doctor or nurse in the patient''s hospital';
  end if;
  return new;
end $$;

create trigger care_assignments_check before insert or update on public.care_assignments
for each row execute function private.check_care_assignment();

-- conversations: hospital comes from the patient.
create function private.fill_conversation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select hospital_id into new.hospital_id from public.patients where id = new.patient_id;
  return new;
end $$;

create trigger conversations_fill before insert on public.conversations
for each row execute function private.fill_conversation();

-- escalations: patient and hospital come from the conversation, routed_to defaults to the primary doctor.
create function private.fill_escalation()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  select c.patient_id, c.hospital_id, coalesce(new.routed_to, p.primary_doctor_id)
    into new.patient_id, new.hospital_id, new.routed_to
  from public.conversations c join public.patients p on p.id = c.patient_id
  where c.id = new.conversation_id;
  return new;
end $$;

create trigger escalations_fill before insert on public.escalations
for each row execute function private.fill_escalation();

-- escalations: claiming records who and when; resolving records when.
create function private.track_escalation_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'open' then
      new.claimed_by := null;
      new.claimed_at := null;
    elsif new.status = 'claimed' then
      new.claimed_by := coalesce(new.claimed_by, (select auth.uid()));
      new.claimed_at := now();
    elsif new.status = 'resolved' then
      new.claimed_by := coalesce(new.claimed_by, (select auth.uid()));
      new.resolved_at := now();
    end if;
  end if;
  return new;
end $$;

create trigger escalations_track_status before update on public.escalations
for each row execute function private.track_escalation_status();

-- ---------------------------------------------------------------------------
-- Column-level write grants (RLS decides rows, these decide columns)
-- ---------------------------------------------------------------------------

-- Supabase grants ALL by default; truncate in particular would skip RLS.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;

grant update (name) on public.hospitals to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant update (date_of_birth, mrn, primary_doctor_id) on public.patients to authenticated;
grant insert, delete on public.care_assignments to authenticated;
grant update (active) on public.care_assignments to authenticated;
grant insert (patient_id) on public.conversations to authenticated;
grant insert (conversation_id, sender_type, sender_id, content) on public.messages to authenticated;
grant update (status) on public.escalations to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.hospitals        enable row level security;
alter table public.profiles         enable row level security;
alter table public.patients         enable row level security;
alter table public.care_assignments enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;
alter table public.escalations      enable row level security;

-- hospitals
create policy "members read their hospital" on public.hospitals
  for select to authenticated using (id = (select private.my_hospital()));
create policy "admins rename their hospital" on public.hospitals
  for update to authenticated
  using (id = (select private.my_hospital()) and (select private.my_role()) = 'admin');

-- profiles
create policy "read visible profiles" on public.profiles
  for select to authenticated using (
    id = (select auth.uid())
    or (
      hospital_id = (select private.my_hospital())
      and (
        (select private.my_role()) = 'admin'
        or (
          (select private.my_role()) in ('doctor', 'nurse')
          and (
            role <> 'patient'
            or private.is_care_team(id)
            or private.doctor_sees_escalated_patient(id)
          )
        )
        or ((select private.my_role()) = 'patient' and private.is_my_care_team_member(id))
      )
    )
  );
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid()));
create policy "admins update hospital profiles" on public.profiles
  for update to authenticated
  using (hospital_id = (select private.my_hospital()) and (select private.my_role()) = 'admin');

-- patients
create policy "read visible patients" on public.patients
  for select to authenticated using (
    id = (select auth.uid())
    or (
      hospital_id = (select private.my_hospital())
      and (
        (select private.my_role()) = 'admin'
        or private.is_care_team(id)
        or private.doctor_sees_escalated_patient(id)
      )
    )
  );
create policy "admins update patients" on public.patients
  for update to authenticated
  using (hospital_id = (select private.my_hospital()) and (select private.my_role()) = 'admin')
  with check (hospital_id = (select private.my_hospital()));

-- care_assignments
create policy "read relevant care assignments" on public.care_assignments
  for select to authenticated using (
    staff_id = (select auth.uid())
    or patient_id = (select auth.uid())
    or (
      (select private.my_role()) = 'admin'
      and exists (
        select 1 from public.patients p
        where p.id = patient_id and p.hospital_id = (select private.my_hospital())
      )
    )
  );
create policy "admins manage care assignments" on public.care_assignments
  for all to authenticated
  using (
    (select private.my_role()) = 'admin'
    and exists (
      select 1 from public.patients p
      where p.id = patient_id and p.hospital_id = (select private.my_hospital())
    )
  )
  with check (
    (select private.my_role()) = 'admin'
    and exists (
      select 1 from public.patients p
      where p.id = patient_id and p.hospital_id = (select private.my_hospital())
    )
  );

-- conversations
create policy "read visible conversations" on public.conversations
  for select to authenticated using (private.can_read_conversation(id));
create policy "patients start conversations" on public.conversations
  for insert to authenticated with check (patient_id = (select auth.uid()));

-- messages
create policy "read messages in visible conversations" on public.messages
  for select to authenticated using (private.can_read_conversation(conversation_id));
create policy "patients write in own conversations" on public.messages
  for insert to authenticated with check (
    sender_type = 'patient'
    and sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.patient_id = (select auth.uid())
    )
  );
create policy "staff reply in visible conversations" on public.messages
  for insert to authenticated with check (
    sender_type = 'staff'
    and sender_id = (select auth.uid())
    and (select private.my_role()) in ('doctor', 'nurse')
    and private.can_read_conversation(conversation_id)
  );

-- escalations
create policy "doctors read hospital escalations, nurses their patients'" on public.escalations
  for select to authenticated using (
    hospital_id = (select private.my_hospital())
    and (
      (select private.my_role()) = 'doctor'
      or ((select private.my_role()) = 'nurse' and private.is_care_team(patient_id))
    )
  );
create policy "doctors claim and resolve escalations" on public.escalations
  for update to authenticated
  using (hospital_id = (select private.my_hospital()) and (select private.my_role()) = 'doctor')
  with check (hospital_id = (select private.my_hospital()));

-- ---------------------------------------------------------------------------
-- Realtime: live chat and escalation inbox
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages, public.escalations;
