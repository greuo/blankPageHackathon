// POST /functions/v1/notify-doctor  (signed-in patient with an email account; guests get 403)
// Body: { doctor_id, content }
// Saves the message in doctor_messages with a random link token (only its sha256 is stored) and
// emails the doctor a link-only notice: "Your patient <first name> sent you a message" + the link.
// The link expires after 7 days (doctor_messages.expires_at) and opens /doctor-message#<token>,
// which reads the message through view-doctor-message.
//
// Response 201: { id, expires_at }   (+ dev_link when EMAIL_DEV_MODE=true, see below)
// Errors: 400 bad body or doctor has no email (code "doctor_has_no_email"), 401 not signed in,
//         403 guest (code "guest_must_sign_up"), 404 not one of my doctors,
//         429 too many sends (code "patient_rate_limited" | "recipient_rate_limited"),
//         502 the email failed (nothing is saved), 503 email isn't configured.
//
// Secrets: APP_URL (frontend's public URL), RESEND_API_KEY, EMAIL_FROM ("Care companion <x@domain>").
// EMAIL_DEV_MODE=true skips sending and returns the link to the patient instead, for demos before a
// sending domain is verified. That only exposes the patient's own message and notes to themselves.
import { callerClient, corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";
import { doctorEmail, firstName, LIMIT_STATUS, messageLink } from "./email.ts";
import { newToken, sha256Hex } from "./token.ts";

const MAX_LENGTH = 4000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const admin = serviceClient();
  const caller = await getCaller(req, admin);
  if (caller instanceof Response) return caller;
  const patient_id = caller.user.id;

  const body = await req.json().catch(() => null);
  const doctor_id = body?.doctor_id;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (typeof doctor_id !== "string" || !UUID.test(doctor_id) || !content || content.length > MAX_LENGTH) {
    return json({ error: `doctor_id and content (1-${MAX_LENGTH} characters) are required` }, 400);
  }

  // Check the email setup before saving anything, so a misconfigured project doesn't eat the limits.
  const appUrl = Deno.env.get("APP_URL");
  const devMode = Deno.env.get("EMAIL_DEV_MODE") === "true";
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("EMAIL_FROM");
  if (!appUrl || (!devMode && (!apiKey || !from))) {
    console.error("notify-doctor: APP_URL, RESEND_API_KEY or EMAIL_FROM is not set");
    return json({ error: "Messaging your doctor isn't set up yet. Please call the clinic." }, 503);
  }

  // Read through RLS as the caller: only their own doctors are visible.
  const { data: doctor } = await callerClient(req).from("doctors").select("id").eq("id", doctor_id).maybeSingle();
  if (!doctor) return json({ error: "Doctor not found" }, 404);

  const { data: patient } = await admin.from("patients").select("display_name").eq("id", patient_id).single();

  const token = newToken();
  // The insert trigger checks guest / no email / rate limits and fills recipient_email.
  const { data: saved, error } = await admin
    .from("doctor_messages")
    .insert({ patient_id, doctor_id, content, token_hash: await sha256Hex(token) })
    .select("id, expires_at, recipient_email")
    .single();
  if (error || !saved) {
    const status = error?.hint ? LIMIT_STATUS[error.hint] : undefined;
    if (status) return json({ error: error!.message, code: error!.hint }, status);
    console.error("notify-doctor: insert failed:", error);
    return json({ error: "Could not save your message" }, 500);
  }

  const link = messageLink(appUrl, token);
  if (devMode) {
    console.log(`notify-doctor: dev mode, not emailing (message ${saved.id})`);
    return json({ id: saved.id, expires_at: saved.expires_at, dev_link: link }, 201);
  }

  // Email exactly the address the trigger counted, not whatever doctors.email says now.
  const email = doctorEmail(firstName(patient?.display_name), link);
  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": saved.id,
    },
    body: JSON.stringify({ from, to: [saved.recipient_email], ...email }),
    signal: AbortSignal.timeout(10_000),
  }).catch((e) => e as Error);

  if (sent instanceof Error || !sent.ok) {
    console.error("notify-doctor: email failed:", sent instanceof Error ? sent.message : `${sent.status} ${await sent.text()}`);
    // No email went out, so don't leave a message the doctor can never open (or count it against the limits).
    await admin.from("doctor_messages").delete().eq("id", saved.id);
    return json({ error: "We couldn't email your doctor. Please try again, or call the clinic." }, 502);
  }

  return json({ id: saved.id, expires_at: saved.expires_at }, 201);
});
