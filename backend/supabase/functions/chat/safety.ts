// The bot's safety rules, kept free of I/O so they can be unit-tested (safety_test.ts).
//
// Two layers, both fail closed:
//   1. redFlag(): a keyword screen that runs before the model. A match escalates as high urgency
//      and tells the patient to call 911, whatever the model would have said.
//   2. decide(): checks the model's verdict in code. The bot only answers when the model says the
//      care team's notes fully cover the question, cites notes that really exist, and the question
//      doesn't touch symptoms or treatment changes. Anything else escalates.

import type { Urgency } from "../_shared/escalation.ts";

const RED_FLAGS: [RegExp, string][] = [
  [/\bchest (pain|pressure|tightness)\b|\bheart attack\b/i, "chest pain"],
  [/\b(can'?t|cannot|can not|hard to|trouble|difficulty|struggling to) breath(e|ing)?\b|\bshort(ness)? of breath\b/i, "trouble breathing"],
  [/\bsuicid|\bkill (myself|me)\b|\bend (my life|it all)\b|\bwant to die\b|\bself[- ]?harm|\bhurt(ing)? myself\b/i, "self-harm risk"],
  [/\boverdos|\btook too (many|much)\b/i, "possible overdose"],
  [/\b(passed|passing) out\b|\bfaint(ed|ing)?\b|\bunconscious\b|\bseizure\b|\bunresponsive\b/i, "loss of consciousness or seizure"],
  [/\bstroke\b|\bface (is )?droop|\bslurred speech\b|\bnumb(ness)? on one side\b/i, "possible stroke"],
  [/\b(heavy|severe|uncontrolled|a lot of) bleeding\b|\bbleeding (won'?t|will not|doesn'?t) stop\b|\b(coughing|vomiting|throwing) up blood\b/i, "severe bleeding"],
  [/\banaphyla|\bthroat (is )?(swelling|closing|tight)\b|\bsevere allergic\b/i, "severe allergic reaction"],
  [/\b(severe|unbearable|worst) pain\b/i, "severe pain"],
  [/\bemergency\b|\b911\b/i, "patient mentions an emergency"],
];

export function redFlag(text: string): string | null {
  const normalized = text.replace(/[‘’]/g, "'"); // phone keyboards type curly apostrophes
  for (const [pattern, label] of RED_FLAGS) if (pattern.test(normalized)) return label;
  return null;
}

export const EMERGENCY_NOTICE =
  "This could be serious. If you are in danger or your symptoms are severe, call 911 or go to the nearest " +
  "emergency room now. I've also alerted your care team, and a doctor will follow up here.";

export const UNSURE_NOTICE =
  "I'm not able to answer that with certainty, so I've passed your question to your care team. " +
  "A doctor or nurse will follow up here.";

export const SMALL_TALK_REPLY =
  "Happy to help. Ask me anything about your care plan, and if I can't answer it for certain I'll pass it " +
  "to your care team.";

// What the model returns (schema in bot.ts).
export type Verdict = {
  action: "answer" | "small_talk" | "escalate";
  answer: string;
  cited_note_ids: string[];
  fully_covered_by_notes: boolean;
  involves_symptoms_or_treatment_change: boolean;
  escalation_reason: string;
  urgency: Urgency;
};

export type Decision =
  | { action: "answered"; reply: string; cited: string[]; reason: string }
  | { action: "small_talk"; reply: string; reason: string }
  | { action: "escalated"; reason: string; urgency: Urgency };

const atLeastMedium = (u: Urgency): Urgency => (u === "low" ? "medium" : u);

// `verdict` is null when the model call failed, was refused, or returned something unparseable.
export function decide(verdict: Verdict | null, noteIds: Set<string>): Decision {
  if (!verdict) {
    return { action: "escalated", reason: "The bot could not process this message.", urgency: "medium" };
  }
  const reason = verdict.escalation_reason?.trim();
  if (verdict.action === "escalate") {
    return { action: "escalated", reason: reason || "The bot was not sure how to answer.", urgency: verdict.urgency };
  }
  if (verdict.involves_symptoms_or_treatment_change) {
    return {
      action: "escalated",
      reason: reason || "The message involves symptoms or a change in treatment.",
      urgency: atLeastMedium(verdict.urgency),
    };
  }
  if (verdict.action === "small_talk") {
    return { action: "small_talk", reply: SMALL_TALK_REPLY, reason: "Greeting or thanks, no question." };
  }

  const answer = verdict.answer?.trim();
  const cited = [...new Set(verdict.cited_note_ids ?? [])];
  const doubt = !verdict.fully_covered_by_notes
    ? "The notes don't fully cover the question."
    : !answer
    ? "The bot produced an empty answer."
    : cited.length === 0
    ? "The answer didn't cite any care-team note."
    : cited.some((id) => !noteIds.has(id))
    ? "The answer cited a note that doesn't exist."
    : null;
  if (doubt) return { action: "escalated", reason: reason ? `${doubt} ${reason}` : doubt, urgency: verdict.urgency };

  return { action: "answered", reply: answer!, cited, reason: "Answered from the care team's notes." };
}
