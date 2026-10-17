// POST /functions/v1/chat  (patients only)
// Body: { conversation_id, content }
// Saves the patient's message, then the bot either answers from the care team's notes
// (bot_knowledge) or escalates to the care team. It escalates whenever it is at all unsure; see
// safety.ts for the rules. While an escalation is open or claimed, the bot stays quiet and the
// care team replies in the chat themselves (red flags still get the emergency notice).
//
// Response 201: { patient_message, reply, action, handed_off }
//   reply      – the bot's message (also delivered by realtime), or null when the bot stayed quiet
//   action     – "answered" | "small_talk" | "escalated" | "held"
//   handed_off – true when a person on the care team now has the conversation
import { openEscalation } from "../_shared/escalation.ts";
import { callerClient, corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";
import { askClaude, MODEL, type Note, type Turn } from "./bot.ts";
import { decide, EMERGENCY_NOTICE, redFlag, UNSURE_NOTICE } from "./safety.ts";

const MAX_LENGTH = 4000;
const HISTORY_LIMIT = 40;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const admin = serviceClient();
  const caller = await getCaller(req, admin);
  if (caller instanceof Response) return caller;
  if (caller.role !== "patient") return json({ error: "Only patients chat with the bot" }, 403);

  const body = await req.json().catch(() => null);
  const conversation_id = body?.conversation_id;
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!conversation_id || !content || content.length > MAX_LENGTH) {
    return json({ error: `conversation_id and content (1-${MAX_LENGTH} characters) are required` }, 400);
  }

  // Insert as the caller so RLS proves the conversation is theirs.
  const { data: patientMessage, error: insertError } = await callerClient(req)
    .from("messages")
    .insert({ conversation_id, sender_type: "patient", sender_id: caller.user.id, content })
    .select()
    .single();
  if (insertError || !patientMessage) return json({ error: "Conversation not found" }, 404);

  const record = (row: Record<string, unknown>) =>
    admin.from("bot_decisions").insert({ conversation_id, message_id: patientMessage.id, ...row });
  const done = (reply: unknown, action: string, handed_off: boolean) =>
    json({ patient_message: patientMessage, reply, action, handed_off }, 201);

  try {
    // 1. Red flags: escalate right away, even if a person already has the conversation.
    const flag = redFlag(content);
    if (flag) {
      const { escalation, notice } = await openEscalation(admin, {
        conversation_id,
        reason: `Possible emergency (${flag}): "${content.slice(0, 300)}"`,
        urgency: "high",
        source: "bot",
        message_id: patientMessage.id,
        notice: EMERGENCY_NOTICE,
      });
      await record({ action: "escalated", reason: `Red flag: ${flag}`, reply_id: notice?.id, escalation_id: escalation.id });
      return done(notice, "escalated", true);
    }

    // 2. A person already has it: stay out of the way.
    const { count: openCount } = await admin
      .from("escalations")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversation_id)
      .in("status", ["open", "claimed"]);
    if (openCount) {
      await record({ action: "held", reason: "An escalation is open; the care team is handling this conversation." });
      return done(null, "held", true);
    }

    // 3. Ask Claude, using only this patient's active notes.
    const [{ data: notes }, { data: earlier }] = await Promise.all([
      admin
        .from("bot_knowledge")
        .select("id, title, content, updated_at")
        .eq("patient_id", caller.user.id)
        .eq("active", true)
        .order("updated_at"),
      admin
        .from("messages")
        .select("sender_type, content")
        .eq("conversation_id", conversation_id)
        .neq("id", patientMessage.id)
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT),
    ]);
    const history: Turn[] = (earlier ?? []).reverse().map((m) => ({
      from: m.sender_type === "patient" ? "patient" : m.sender_type === "bot" ? "assistant" : "care_team",
      text: m.content,
    }));
    const noteList = (notes ?? []) as Note[];
    const verdict = await askClaude(noteList, history, content);

    // 4. Check the verdict in code; any doubt escalates.
    const decision = decide(verdict, new Set(noteList.map((n) => n.id)));

    if (decision.action === "escalated") {
      const { escalation, notice } = await openEscalation(admin, {
        conversation_id,
        reason: decision.reason,
        urgency: decision.urgency,
        source: "bot",
        message_id: patientMessage.id,
        notice: UNSURE_NOTICE,
      });
      await record({ action: "escalated", reason: decision.reason, reply_id: notice?.id, escalation_id: escalation.id, model: MODEL });
      return done(notice, "escalated", true);
    }

    const { data: reply } = await admin
      .from("messages")
      .insert({ conversation_id, sender_type: "bot", content: decision.reply })
      .select()
      .single();
    await record({
      action: decision.action,
      reason: decision.reason,
      reply_id: reply?.id,
      cited_knowledge_ids: decision.action === "answered" ? decision.cited : [],
      model: MODEL,
    });
    return done(reply, decision.action, false);
  } catch (e) {
    // Last resort: the patient's message is saved, so make sure a person sees it.
    console.error("chat:", e);
    try {
      const { escalation, notice } = await openEscalation(admin, {
        conversation_id,
        reason: "The bot hit an error while handling this message.",
        urgency: "medium",
        source: "bot",
        message_id: patientMessage.id,
        notice: UNSURE_NOTICE,
      });
      await record({ action: "escalated", reason: `Error: ${(e as Error).message}`, reply_id: notice?.id, escalation_id: escalation.id });
      return done(notice, "escalated", true);
    } catch {
      return json({ error: "Your message was saved, but the bot failed. Please use \"send to my care team\"." }, 500);
    }
  }
});
