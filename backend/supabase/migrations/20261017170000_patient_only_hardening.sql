-- Fixes from the Claude reviews of #5 (plan) and #6 (patient-only model).
--
-- 1. New tables start read-only for the API roles. The revoke in 20261017154913 only covered
--    tables that existed then; Supabase's default privileges would give later tables ALL
--    (including TRUNCATE, which skips RLS).
-- 2. Care-note version numbers are never reused. They come from a per-patient counter instead of
--    max(version) + 1, so deleting the latest version doesn't hand its number to the next save.
-- 3. "Send to my doctor" can't be used as an open email relay. Enforced here, so it holds whatever
--    the `notify-doctor` function does:
--      - only a patient with an email account can send (guests must add an email first)
--      - at most 5 doctor messages per patient per hour, and 20 per day
--      - at most 10 doctor messages per recipient email address per day, across all patients
--      - the doctor must have an email address

-- ---------------------------------------------------------------------------
-- 1. Default privileges
-- ---------------------------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Stable care-note versions
-- ---------------------------------------------------------------------------

-- Not in the patients column grants, so the patient can read it but not change it.
alter table public.patients add column last_note_version integer not null default 0;

update public.patients p
set last_note_version = coalesce((select max(version) from public.care_notes c where c.patient_id = p.id), 0);

create or replace function private.number_care_note()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  -- The row lock on patients serialises concurrent saves for the same patient.
  update public.patients
  set last_note_version = last_note_version + 1
  where id = new.patient_id
  returning last_note_version into new.version;
  if new.version is null then
    raise exception 'patient % not found', new.patient_id using errcode = 'foreign_key_violation';
  end if;
  new.created_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Doctor-message limits
-- ---------------------------------------------------------------------------

create index doctor_messages_created_at_idx on public.doctor_messages (created_at desc);

create function private.limit_doctor_messages()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  recipient text;
begin
  if exists (select 1 from auth.users u where u.id = new.patient_id and u.is_anonymous) then
    raise exception 'Add an email to your account before messaging your doctor'
      using errcode = 'check_violation', hint = 'guest_must_sign_up';
  end if;

  select lower(trim(d.email)) into recipient
  from public.doctors d
  where d.id = new.doctor_id and d.patient_id = new.patient_id;
  if recipient is null or recipient = '' then
    raise exception 'This doctor has no email address'
      using errcode = 'check_violation', hint = 'doctor_has_no_email';
  end if;

  -- Serialise sends per patient so the counts below can't race.
  perform 1 from public.patients where id = new.patient_id for update;

  if (select count(*) from public.doctor_messages m
      where m.patient_id = new.patient_id and m.created_at > now() - interval '1 hour') >= 5
     or (select count(*) from public.doctor_messages m
         where m.patient_id = new.patient_id and m.created_at > now() - interval '1 day') >= 20 then
    raise exception 'Too many messages to your doctor. Please try again later.'
      using errcode = 'check_violation', hint = 'patient_rate_limited';
  end if;

  if (select count(*) from public.doctor_messages m
      join public.doctors d on d.id = m.doctor_id
      where lower(trim(d.email)) = recipient and m.created_at > now() - interval '1 day') >= 10 then
    raise exception 'This doctor has received too many messages today. Please call the clinic instead.'
      using errcode = 'check_violation', hint = 'recipient_rate_limited';
  end if;

  return new;
end $$;

create trigger doctor_messages_limit before insert on public.doctor_messages
for each row execute function private.limit_doctor_messages();

revoke all on all functions in schema private from public;
