// POST /functions/v1/escalate  (the patient who owns the conversation)
// Body: { conversation_id, reason, urgency?: "low" | "medium" | "high" }
// Forwards the conversation to the hospital: creates an escalation routed to the patient's
// primary doctor (visible to every doctor in the hospital) and posts a bot message saying so.
// The chatbot will call this when it decides a human needs to look; the UI can also offer a
// "send to my care team" button.
import { callerClient, corsHeaders, getCaller, json, serviceClient } from "../_shared/http.ts";

const URGENCIES = ["low", "medium", "high"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  const admin = serviceClient();
  const caller = await getCaller(req, admin);
  if (caller instanceof Response) return caller;
  if (caller.role !== "patient") return json({ error: "Only the patient can forward their conversation" }, 403);

  const body = await req.json().catch(() => null);
  const { conversation_id, reason, urgency = "medium" } = body ?? {};
  if (!conversation_id || !reason || !URGENCIES.includes(urgency)) {
    return json({ error: "conversation_id, reason and urgency (low|medium|high) are required" }, 400);
  }

  // Read through RLS as the caller: only their own conversation is visible.
  const { data: conversation } = await callerClient(req)
    .from("conversations")
    .select("id, patient_id")
    .eq("id", conversation_id)
    .maybeSingle();
  if (!conversation || conversation.patient_id !== caller.user.id) {
    return json({ error: "Conversation not found" }, 404);
  }

  // patient_id, hospital_id and routed_to are filled in by the escalations_fill trigger.
  const { data: escalation, error } = await admin
    .from("escalations")
    .insert({ conversation_id, reason, urgency })
    .select()
    .single();
  if (error) return json({ error: error.message }, 400);

  await admin.from("messages").insert({
    conversation_id,
    sender_type: "bot",
    content: "I've forwarded this to your care team. A doctor will follow up here.",
  });

  return json(escalation, 201);
});
