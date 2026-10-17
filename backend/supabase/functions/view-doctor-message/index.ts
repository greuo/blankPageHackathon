// POST /functions/v1/view-doctor-message  (anyone holding the link; no login, verify_jwt = false)
// Body: { token }   (the part after "#" in APP_URL/doctor-message#<token>)
// Looks the token up by its sha256, checks expires_at, marks opened_at the first time, and returns
// the message plus what the doctor needs to answer it.
//
// Response 200: { content, created_at, expires_at, opened_at, patient_first_name, doctor_name,
//                 care_notes: { version, content, entered_via, created_at } | null }
// Errors: 400 malformed token, 404 no such link, 410 link expired (code "expired": ask the patient
//         to send it again), 429 too many tries from this IP.
// Responses are no-store so the message isn't cached by the browser or a proxy.
import { corsHeaders, serviceClient } from "../_shared/http.ts";
import { firstName } from "../notify-doctor/email.ts";
import { isToken, sha256Hex } from "../notify-doctor/token.ts";

function reply(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}

// Best-effort per-IP limit, per function instance. Tokens are 256-bit random, so guessing is
// already hopeless; this just stops one client hammering the database.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 30;
const tries = new Map<string, { count: number; since: number }>();

function tooManyTries(ip: string): boolean {
  const now = Date.now();
  if (tries.size > 10_000) {
    for (const [key, t] of tries) if (now - t.since > WINDOW_MS) tries.delete(key);
  }
  const t = tries.get(ip);
  if (!t || now - t.since > WINDOW_MS) {
    tries.set(ip, { count: 1, since: now });
    return false;
  }
  t.count += 1;
  return t.count > MAX_TRIES;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Use POST" }, 405);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (tooManyTries(ip)) return reply({ error: "Too many tries. Please wait a few minutes." }, 429);

  const body = await req.json().catch(() => null);
  if (!isToken(body?.token)) return reply({ error: "This link isn't valid." }, 400);

  const admin = serviceClient();
  const { data: message, error } = await admin
    .from("doctor_messages")
    .select("id, patient_id, doctor_id, content, created_at, expires_at, opened_at")
    .eq("token_hash", await sha256Hex(body.token))
    .maybeSingle();
  if (error) {
    console.error("view-doctor-message: lookup failed:", error);
    return reply({ error: "Could not open the message. Please try again." }, 500);
  }
  if (!message) return reply({ error: "This link isn't valid." }, 404);
  if (new Date(message.expires_at).getTime() <= Date.now()) {
    return reply({ error: "This link has expired. Ask your patient to send the message again.", code: "expired" }, 410);
  }

  let opened_at = message.opened_at;
  if (!opened_at) {
    const { data: opened } = await admin
      .from("doctor_messages")
      .update({ opened_at: new Date().toISOString() })
      .eq("id", message.id)
      .is("opened_at", null)
      .select("opened_at")
      .maybeSingle();
    opened_at = opened?.opened_at ?? opened_at;
  }

  const [{ data: patient }, { data: doctor }, { data: notes }] = await Promise.all([
    admin.from("patients").select("display_name").eq("id", message.patient_id).maybeSingle(),
    message.doctor_id
      ? admin.from("doctors").select("name").eq("id", message.doctor_id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("current_care_notes")
      .select("version, content, entered_via, created_at")
      .eq("patient_id", message.patient_id)
      .maybeSingle(),
  ]);

  return reply({
    content: message.content,
    created_at: message.created_at,
    expires_at: message.expires_at,
    opened_at,
    patient_first_name: firstName(patient?.display_name),
    doctor_name: doctor?.name ?? null,
    care_notes: notes ?? null,
  });
});
