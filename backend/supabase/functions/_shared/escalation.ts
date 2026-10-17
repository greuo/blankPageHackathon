import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export type Urgency = "low" | "medium" | "high";

export const FORWARDED_NOTICE = "I've forwarded this to your care team. A doctor will follow up here.";

// Forwards a conversation to the hospital: creates the escalation (the escalations_fill trigger
// routes it to the primary doctor, the escalations_alert trigger alerts the patient's doctors) and
// posts a bot message telling the patient. `admin` must be the service-role client.
export async function openEscalation(
  admin: SupabaseClient,
  opts: {
    conversation_id: string;
    reason: string;
    urgency: Urgency;
    source: "patient" | "bot";
    message_id?: string;
    notice?: string;
  },
) {
  const { data: escalation, error } = await admin
    .from("escalations")
    .insert({
      conversation_id: opts.conversation_id,
      reason: opts.reason,
      urgency: opts.urgency,
      source: opts.source,
      message_id: opts.message_id ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);

  const { data: notice } = await admin
    .from("messages")
    .insert({ conversation_id: opts.conversation_id, sender_type: "bot", content: opts.notice ?? FORWARDED_NOTICE })
    .select()
    .single();

  return { escalation, notice };
}
