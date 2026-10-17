-- Patient-only model (PLAN.md, agreed 2026-10-17). Replaces the hospital / staff / escalation model.
--
-- The patient is the only signed-in user. Guests use Supabase anonymous sign-in, so a guest and an
-- email account are both `authenticated` and RLS treats them the same: every user sees and edits
-- only their own rows. A guest who adds an email keeps the same auth user id, so keeps their data.
--
-- Doctors have no accounts. They enter care notes on the patient's phone (Doctor mode, written as
-- the patient) or through a one-time QR link handled by the `doctor-entry` edge function. Doctor
-- emails, QR links and bot replies are written by edge functions with the service role, which
-- bypasses RLS.

-- ---------------------------------------------------------------------------
-- Drop the old model (if exists, so this also runs where the chatbot migration never did)
-- ---------------------------------------------------------------------------

drop function if exists public.conversation_handed_off(uuid);

drop table if exists
  public.alerts,
  public.bot_decisions,
  public.bot_knowledge,
  public.escalations,
  public.messages,
  public.conversations,
  public.care_assignments,
  public.patients,
  public.profiles,
  public.hospitals
  cascade;

-- Old RLS helpers and triggers; they depend on the old types.
drop schema if exists private cascade;

drop type if exists
  public.alert_kind,
  public.escalation_source,
  public.bot_action,
  public.escalation_status,
  public.escalation_urgency,
  public.message_sender,
  public.user_role;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.message_sender as enum ('patient', 'bot');
create type public.note_entry as enum ('patient_phone', 'qr');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.patients (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

-- The patient's doctors (contact details only; doctors never sign in).
create table public.doctors (
  id           uuid primary key default gen_random_uuid(),
  patient_id   uuid not null default auth.uid() references public.patients (id) on delete cascade,
  name         text not null,
  email        text,
  clinic       text,
  clinic_phone text,
  created_at   timestamptz not null default now(),
  unique (id, patient_id) -- target for the composite foreign keys below
);
create index doctors_patient_id_idx on public.doctors (patient_id);

-- Every save is a new version; the highest version is the current notes.
-- content: { reason, medications: [{ name, dose, when, until }], instructions: [..],
--            warning_signs: [{ sign, action }], contact_rules, follow_up }
create table public.care_notes (
  id          uuid primary key default gen_random_uuid(),
  patient_id  uuid not null default auth.uid() references public.patients (id) on delete cascade,
  doctor_id   uuid,
  version     integer not null, -- set by trigger
  content     jsonb not null check (jsonb_typeof(content) = 'object'),
  entered_via public.note_entry not null default 'patient_phone',
  created_at  timestamptz not null default now(),
  unique (patient_id, version),
  -- The doctor must be one of this patient's doctors.
  foreign key (doctor_id, patient_id) references public.doctors (id, patient_id) on delete set null (doctor_id)
);
create index care_notes_doctor_id_idx on public.care_notes (doctor_id);

-- Chat with the bot. Bot replies come from the `chat` edge function.
create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null default auth.uid() references public.patients (id) on delete cascade,
  sender     public.message_sender not null default 'patient',
  content    text not null check (length(content) > 0),
  created_at timestamptz not null default now()
);
create index messages_patient_id_created_at_idx on public.messages (patient_id, created_at);

-- "Send to my doctor". The email carries only a link with a random token; we store its sha256 hex.
create table public.doctor_messages (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  doctor_id  uuid,
  content    text not null check (length(content) > 0),
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '7 days',
  opened_at  timestamptz,
  created_at timestamptz not null default now(),
  foreign key (doctor_id, patient_id) references public.doctors (id, patient_id) on delete set null (doctor_id)
);
create index doctor_messages_patient_id_idx on public.doctor_messages (patient_id, created_at desc);
create index doctor_messages_doctor_id_idx on public.doctor_messages (doctor_id);

-- QR links for the doctor's own phone: one use, 30 minutes. Token stored as sha256 hex.
create table public.entry_links (
  id         uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null default now() + interval '30 minutes',
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index entry_links_patient_id_idx on public.entry_links (patient_id);

-- Current notes = latest version per patient. security_invoker, so RLS on care_notes applies.
create view public.current_care_notes with (security_invoker = true) as
  select distinct on (patient_id) *
  from public.care_notes
  order by patient_id, version desc;

-- ---------------------------------------------------------------------------
-- Triggers (functions live in a schema the API doesn't expose)
-- ---------------------------------------------------------------------------

create schema private;

-- Every new auth user (guest or email) is a patient.
create function private.create_patient()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.patients (id, display_name)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.create_patient();

-- Number each care-notes save. Locks the patient row so two saves can't get the same version.
create function private.number_care_note()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform 1 from public.patients where id = new.patient_id for update;
  select coalesce(max(version), 0) + 1 into new.version
  from public.care_notes where patient_id = new.patient_id;
  new.created_at := now();
  return new;
end $$;

create trigger care_notes_number before insert on public.care_notes
for each row execute function private.number_care_note();

revoke all on all functions in schema private from public;

-- Users who signed up before this migration.
insert into public.patients (id, display_name)
select id, nullif(coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name'), '')
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Column-level write grants (RLS decides rows, these decide columns)
-- ---------------------------------------------------------------------------

-- Supabase grants ALL by default; truncate in particular would skip RLS.
revoke insert, update, delete, truncate, references, trigger on all tables in schema public from anon, authenticated;
revoke all on public.current_care_notes from anon;

grant update (display_name) on public.patients to authenticated;
grant insert (patient_id, name, email, clinic, clinic_phone) on public.doctors to authenticated;
grant update (name, email, clinic, clinic_phone) on public.doctors to authenticated;
grant delete on public.doctors to authenticated;
-- No update: a save is a new version. entered_via 'qr' is only written by `doctor-entry`.
grant insert (patient_id, doctor_id, content, entered_via) on public.care_notes to authenticated;
grant delete on public.care_notes to authenticated;
grant insert (patient_id, sender, content) on public.messages to authenticated;
-- doctor_messages and entry_links: read-only for the patient, written by edge functions.

-- ---------------------------------------------------------------------------
-- Row Level Security: own rows only
-- ---------------------------------------------------------------------------

alter table public.patients        enable row level security;
alter table public.doctors         enable row level security;
alter table public.care_notes      enable row level security;
alter table public.messages        enable row level security;
alter table public.doctor_messages enable row level security;
alter table public.entry_links     enable row level security;

create policy "read own patient row" on public.patients
  for select to authenticated using (id = (select auth.uid()));
create policy "update own patient row" on public.patients
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "manage own doctors" on public.doctors
  for all to authenticated
  using (patient_id = (select auth.uid()))
  with check (patient_id = (select auth.uid()));

create policy "read own care notes" on public.care_notes
  for select to authenticated using (patient_id = (select auth.uid()));
create policy "save own care notes from own phone" on public.care_notes
  for insert to authenticated
  with check (patient_id = (select auth.uid()) and entered_via = 'patient_phone');
create policy "delete own care notes" on public.care_notes
  for delete to authenticated using (patient_id = (select auth.uid()));

create policy "read own messages" on public.messages
  for select to authenticated using (patient_id = (select auth.uid()));
create policy "write own patient messages" on public.messages
  for insert to authenticated
  with check (patient_id = (select auth.uid()) and sender = 'patient');

create policy "read own doctor messages" on public.doctor_messages
  for select to authenticated using (patient_id = (select auth.uid()));

create policy "read own entry links" on public.entry_links
  for select to authenticated using (patient_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Realtime: live chat, and notes saved from the doctor's own phone
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.messages, public.care_notes;
