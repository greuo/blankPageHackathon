// POST /functions/v1/admin-create-user  (hospital admins only)
// Body: { email, password, full_name, role: "doctor" | "nurse" | "patient" | "admin",
//         date_of_birth?, mrn?, primary_doctor_id?, care_team?: string[] }   // last four: patients only
// Creates the login, the profile in the admin's hospital, and for patients the patient row
// plus care team (primary doctor is always on it).
import { corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";

const ROLES = ["admin", "doctor", "nurse", "patient"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const admin = serviceClient();
  const caller = await getCaller(req, admin);
  if (caller instanceof Response) return caller;
  if (caller.role !== "admin") return json({ error: "Only hospital admins can create users" }, 403);

  const body = await req.json().catch(() => null);
  const { email, password, full_name, role } = body ?? {};
  if (!email || !password || !full_name || !ROLES.includes(role)) {
    return json({ error: "email, password, full_name and role (admin|doctor|nurse|patient) are required" }, 400);
  }

  const { data: created, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError || !created.user) return json({ error: authError?.message ?? "Could not create user" }, 400);
  const id = created.user.id;

  // Undo the login if any later step fails, so we never leave a user without a profile.
  const fail = async (message: string) => {
    await admin.auth.admin.deleteUser(id);
    return json({ error: message }, 400);
  };

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id, hospital_id: caller.hospital_id, role, full_name, email });
  if (profileError) return fail(profileError.message);

  if (role === "patient") {
    const { date_of_birth = null, mrn = null, primary_doctor_id = null, care_team = [] } = body;
    const { error: patientError } = await admin
      .from("patients")
      .insert({ id, hospital_id: caller.hospital_id, date_of_birth, mrn, primary_doctor_id });
    if (patientError) return fail(patientError.message);

    const team = [...new Set([primary_doctor_id, ...care_team].filter(Boolean))];
    if (team.length) {
      const { error: teamError } = await admin
        .from("care_assignments")
        .insert(team.map((staff_id) => ({ patient_id: id, staff_id })));
      if (teamError) return fail(teamError.message);
    }
  }

  return json({ id, email, role, full_name, hospital_id: caller.hospital_id }, 201);
});
