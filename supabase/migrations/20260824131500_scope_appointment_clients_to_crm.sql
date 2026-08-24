begin;

-- Keep appointment-created/selected customers explicitly in the CRM client role.
-- Team members must never be selected as CRM customers through the appointment flow.
comment on function public.add_client_from_completed_appointment(uuid, uuid)
is 'Links or creates a CRM client with role=client from a confirmed/completed appointment; never creates a team member.';

commit;
