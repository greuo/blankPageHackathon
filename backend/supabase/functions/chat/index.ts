// POST /functions/v1/chat  (any signed-in patient: guest or email account)
// Body: { content }
// Saves the patient's message, then the bot answers from the patient's current care notes or
// tells them to check with their doctor. See safety.ts for the rules. The bot never emails anyone;
// "Send to my doctor" is the patient's choice (suggest_notify_doctor tells the UI to offer it).
//
// Response 201: { patient_message, reply, action, suggest_notify_doctor }
//   reply   – the bot's message row (also delivered by realtime on `messages`)
//   action  – "answered" | "small_talk" | "referred" | "emergency"
// Response 429: { error, retry_after_seconds } when the patient sends too many messages.
import { callerClient, corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";
import { askClaude, type Turn } from "./bot.ts";
import { doctorNote, flattenNotes } from "./notes.ts";
import { decide, emergencyNotice, redFlag, referNotice } from "./safety.ts";

const MAX_LENGTH = 4000;
const HISTORY_LIMIT = 40;
// Each message can cost a Claude call, and anyone can make a guest account, so cap per patient.
const LIMITS = [
  { window: 10 * 60, max: 20 },
  { window: 24 * 60 * 60, max: 200 },
];

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

  for (const { window, max } of LIMITS) {
    const { count, error } = await admin
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("patient_id", patient_id)
      .eq("sender", "patient")
      .gt("created_at", new Date(Date.now() - window * 1000).toISOString());
    if (error) return json({ error: "Could not check the message limit" }, 500);
    if ((count ?? 0) >= max) {
      return json({ error: "You're sending messages too quickly. Please wait a bit.", retry_after_seconds: window }, 429);
    }
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
    const notes = [...flattenNotes(current?.content), ...doctorNote(doctor)];
    const { data: earlier } = await admin
      .from("messages")
      .select("sender, content")
      .eq("patient_id", patient_id)
      .neq("id", patientMessage.id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);
    const history: Turn[] = (earlier ?? []).reverse().map((m) => ({
      from: m.sender === "patient" ? "patient" : "assistant",
      text: m.content,
    }));
    const verdict = await askClaude(notes, history, content);

    // 3. Check the verdict in code; any doubt refers the patient to their doctor.
    const decision = decide(verdict, new Set(notes.map((n) => n.id)));
    console.log(`chat: ${decision.action} for patient ${patient_id}: ${decision.reason}`);

    if (decision.action === "referred") {
      return await reply(referNotice(doctor, decision.urgency), "referred", true);
    }
    return await reply(decision.reply, decision.action, false);
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
