// POST /functions/v1/chat  (any signed-in patient: guest or email account)
// Body: { content }
// Saves the patient's message, then the bot answers from the patient's current care notes (including
// clear implications and "is this normal?" when the notes say), points out a matching warning sign,
// or tells them to check with their doctor. See safety.ts for the rules. The bot never emails anyone;
// "Send to my doctor" is the patient's choice (suggest_notify_doctor tells the UI to offer it).
//
// Response 201: { patient_message, reply, action, suggest_notify_doctor }
//   reply   – the bot's message row (also delivered by realtime on `messages`)
//   action  – "answered" | "warning_sign" | "small_talk" | "referred" | "emergency"
//             (suggest_notify_doctor is true for "warning_sign" and "referred")
// Response 429: { error, code, retry_after_seconds } (and a Retry-After header) when a limit is full:
//   code "rate_limited_user"   this account sent too many messages
//   code "rate_limited_ip"     too many from this network address
//   code "rate_limited_global" the whole app is at its Claude-call budget
//   See limits.ts for the numbers and how to change them.
// Response 503: { error, code: "limiter_unavailable" } when the limits can't be checked (the chat
//   refuses rather than run unlimited).
import { callerClient, corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";
import { checkLimits, clientIp, hashKey, waitText } from "../_shared/ratelimit.ts";
import { askClaude, type Turn } from "./bot.ts";
import { chatLimits, limitMessage } from "./limits.ts";
import { capNotes, doctorNote, flattenNotes } from "./notes.ts";
import { decide, emergencyNotice, patientReply, redFlag, referNotice } from "./safety.ts";

// What one message can cost is bounded too: a short message, a short history, a bounded set of notes.
const MAX_LENGTH = 1000;
const HISTORY_LIMIT = 12;
const NOTES_MAX_CHARS = 20_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const admin = serviceClient();
  const caller = await getCaller(req, admin);
  if (caller instanceof Response) return caller;
  const patient_id = caller.user.id;

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content || content.length > MAX_LENGTH) {
    return json({ error: `content (1-${MAX_LENGTH} characters) is required` }, 400);
  }

  // Before anything is saved or any Claude call is made. Fails closed: no limiter, no chat.
  const ip = clientIp(req.headers);
  let blocked;
  try {
    blocked = await checkLimits(admin, chatLimits(patient_id, ip ? await hashKey(ip) : null, (name) => Deno.env.get(name)));
  } catch (e) {
    console.error("chat: rate limiter failed:", e);
    return json({ error: "The assistant is unavailable right now. Please try again in a few minutes.", code: "limiter_unavailable" }, 503);
  }
  if (blocked) {
    console.log(`chat: ${blocked.scope} limit (${blocked.window}s) full for patient ${patient_id}`);
    return json(
      {
        error: limitMessage(blocked.scope, waitText(blocked.retryAfter)),
        code: `rate_limited_${blocked.scope}`,
        retry_after_seconds: blocked.retryAfter,
      },
      429,
      { "Retry-After": String(blocked.retryAfter) },
    );
  }

  // Insert as the caller so RLS and the column grants apply.
  const { data: patientMessage, error: insertError } = await callerClient(req)
    .from("messages")
    .insert({ content })
    .select()
    .single();
  if (insertError || !patientMessage) {
    console.error("chat: insert failed:", insertError);
    return json({ error: "Could not save your message" }, 400);
  }

  const { data: current } = await admin
    .from("current_care_notes")
    .select("content, doctor_id")
    .eq("patient_id", patient_id)
    .maybeSingle();
  const { data: doctor } = current?.doctor_id
    ? await admin.from("doctors").select("name, clinic, clinic_phone").eq("id", current.doctor_id).maybeSingle()
    : { data: null };

  const reply = async (text: string, action: string, suggest_notify_doctor: boolean) => {
    const { data: botMessage, error } = await admin
      .from("messages")
      .insert({ patient_id, sender: "bot", content: text })
      .select()
      .single();
    if (error) throw error;
    return json({ patient_message: patientMessage, reply: botMessage, action, suggest_notify_doctor }, 201);
  };

  // 1. Red flags: 911 / clinic phone, without asking the model.
  const flag = redFlag(content);
  try {
    if (flag) {
      console.log(`chat: red flag (${flag}) for patient ${patient_id}`);
      return await reply(emergencyNotice(doctor), "emergency", false);
    }

    // 2. Ask Claude, using only this patient's current notes.
    const notes = [...capNotes(flattenNotes(current?.content), NOTES_MAX_CHARS), ...doctorNote(doctor)];
    const { data: earlier } = await admin
      .from("messages")
      .select("sender, content")
      .eq("patient_id", patient_id)
      .neq("id", patientMessage.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    const history: Turn[] = (earlier ?? []).reverse().map((m) => ({
      from: m.sender === "patient" ? "patient" : "assistant",
      text: m.content.slice(0, MAX_LENGTH),
    }));
    const verdict = await askClaude(notes, history, content);

    // 3. Check the verdict in code; any doubt refers the patient to their doctor.
    const decision = decide(verdict, new Set(notes.map((n) => n.id)));
    console.log(`chat: ${decision.action} for patient ${patient_id}: ${decision.reason}`);

    if (decision.action === "referred") {
      return await reply(referNotice(doctor, decision.urgency), "referred", true);
    }
    return await reply(patientReply(decision, doctor), decision.action, decision.action === "warning_sign");
  } catch (e) {
    console.error("chat:", e);
    try {
      // Never downgrade an emergency to a referral on retry.
      return flag
        ? await reply(emergencyNotice(doctor), "emergency", false)
        : await reply(referNotice(doctor, "medium"), "referred", true);
    } catch {
      return json({ error: "Your message was saved, but the bot failed. Please contact your doctor directly." }, 500);
    }
  }
});
