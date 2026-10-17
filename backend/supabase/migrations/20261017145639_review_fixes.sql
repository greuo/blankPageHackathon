-- Fixes from the review of PR #2.

-- 1. A doctor who isn't on the care team can reply in an escalated chat, so the patient must be
--    able to read that doctor's profile (to show a name). Patients can now read the profile of any
--    staff member who replied in their chats or claimed one of their escalations.
create function private.has_contacted_me(p_staff uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.messages m join public.conversations c on c.id = m.conversation_id
    where c.patient_id = (select auth.uid()) and m.sender_type = 'staff' and m.sender_id = p_staff
  ) or exists (
    select 1 from public.escalations
    where patient_id = (select auth.uid()) and claimed_by = p_staff
  )
$$;

revoke all on function private.has_contacted_me(uuid) from public;
grant execute on function private.has_contacted_me(uuid) to authenticated;

alter policy "read visible profiles" on public.profiles using (
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
      or (
        (select private.my_role()) = 'patient'
        and (private.is_my_care_team_member(id) or private.has_contacted_me(id))
      )
    )
  )
);

-- 2. Reopening a resolved escalation (back to open or claimed) clears the stale resolved_at.
create or replace function private.track_escalation_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status = 'open' then
      new.claimed_by := null;
      new.claimed_at := null;
      new.resolved_at := null;
    elsif new.status = 'claimed' then
      new.claimed_by := coalesce(new.claimed_by, (select auth.uid()));
      new.claimed_at := now();
      new.resolved_at := null;
    elsif new.status = 'resolved' then
      new.claimed_by := coalesce(new.claimed_by, (select auth.uid()));
      new.resolved_at := now();
    end if;
  end if;
  return new;
end $$;
