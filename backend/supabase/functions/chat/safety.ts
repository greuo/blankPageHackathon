// The bot's safety rules, kept free of I/O so they can be unit-tested (safety_test.ts).
// Carried over from the hospital-model chatbot (#4) and adapted to the patient-only plan:
// there is no care team watching the chat, so "escalate" becomes "refer the patient to their doctor".
//
// Two layers, both fail closed:
//   1. redFlag(): a keyword screen that runs before the model. A match sends the patient to 911 (or
//      the clinic phone), whatever the model would have said. Never by email (PLAN.md).
//   2. decide(): checks the model's verdict in code. The bot answers only when the notes state the
//      answer or it follows directly from them, the answer cites note items that really exist, and the
//      patient isn't asking to change a treatment. Symptom answers and warning-sign replies always get
//      a fixed "contact your doctor / 911" footer. Anything else refers the patient to their doctor.

export type Urgency = "low" | "medium" | "high";

const RED_FLAGS: [RegExp, string][] = [
  [/\bchest (pain|pressure|tightness)\b|\bheart attack\b/i, "chest pain"],
  [/\b(can'?t|cannot|can not|hard to|trouble|difficulty|struggling to) breath(e|ing)?\b|\bshort(ness)? of breath\b/i, "trouble breathing"],
  [/\bsuicid|\bkill (myself|me)\b|\bend (my life|it all)\b|\bwant to die\b|\bself[- ]?harm|\bhurt(ing)? myself\b/i, "self-harm risk"],
  [/\boverdos|\btook too (many|much)\b/i, "possible overdose"],
  [/\b(passed|passing) out\b|\bfainted\b|\bfainting\b|\bunconscious\b|\bseizure\b|\bunresponsive\b/i, "loss of consciousness or seizure"],
  [/\bstroke\b|\bface (is )?droop|\bslurred speech\b|\bnumb(ness)? on one side\b/i, "possible stroke"],
  [/\b(heavy|severe|uncontrolled|a lot of) bleeding\b|\bbleeding (won'?t|will not|doesn'?t) stop\b|\b(coughing|vomiting|throwing) up blood\b/i, "severe bleeding"],
  [/\banaphyla|\bthroat (is )?(swelling|closing|tight)\b|\bsevere allergic\b/i, "severe allergic reaction"],
  [/\b(severe|unbearable|worst) pain\b/i, "severe pain"],
  [/\bemergency\b(?! contact)|\b911\b/i, "patient mentions an emergency"],
];

// "no chest pain", "not short of breath", "haven't had any fainting" etc. Only a negation that attaches
// directly to the symptom counts (optionally "any" / "more" in between). So "no chest pain, but I
// can't breathe", "No I can't breathe", "I'm not ok I can't breathe" and "I've never had chest pain
// like this" all still flag. Errs towards flagging.
const NEGATION = /(\b(no|not|without|denies|free of)|\b(don'?t|do not|haven'?t|have not|hasn'?t|has not) (have|had))\s+(any\s+|more\s+)?$/i;

export function redFlag(text: string): string | null {
  const normalized = text.replace(/[‘’]/g, "'"); // phone keyboards type curly apostrophes
  for (const [pattern, label] of RED_FLAGS) {
    const global = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : pattern.flags + "g");
    for (const match of normalized.matchAll(global)) {
      const before = normalized.slice(0, match.index);
      if (!NEGATION.test(before)) return label;
    }
  }
  return null;
}

export type Clinic = { clinic: string | null; clinic_phone: string | null } | null;

const clinicLine = (c: Clinic) =>
  c?.clinic_phone ? ` If it isn't an emergency, call ${c.clinic ?? "your clinic"} at ${c.clinic_phone}.` : "";

export const emergencyNotice = (c: Clinic) =>
  "This could be serious. If you are in danger or your symptoms are severe, call 911 or go to the nearest " +
  `emergency room now. Don't wait for an email reply.${clinicLine(c)}`;

export const referNotice = (c: Clinic, urgency: Urgency) =>
  "I can't answer that from your doctor's notes, so please check with your doctor. You can tap " +
  `"Send to my doctor" to message them.${clinicLine(c)}` +
  (urgency === "high" ? " If it feels serious or is getting worse, call 911." : "");

export const SMALL_TALK_REPLY =
  "Happy to help. Ask me anything about the notes your doctor left you, and if I can't answer it for " +
  "certain I'll tell you to check with your doctor.";

// Added to the end of every answer about a symptom, and every warning-sign reply. Fixed text, so
// the "contact your doctor / 911" safety net never depends on the model remembering it.
export const symptomFooter = (c: Clinic) =>
  "If it gets worse, or you notice any of the warning signs in your notes, contact your doctor" +
  (c?.clinic_phone ? ` (${c.clinic ?? "your clinic"}: ${c.clinic_phone})` : "") + ". If it feels like an emergency, call 911.";

export const warningFooter = (c: Clinic) =>
  `You can also tap "Send to my doctor" to message them.${clinicLine(c)} If it feels serious or is getting worse, call 911.`;

// What the model returns (schema in bot.ts).
export type Verdict = {
  action: "answer" | "warning_sign" | "small_talk" | "refer";
  answer: string;
  cited_note_ids: string[];
  // How the notes support the answer: they say it outright, it follows from them with no
  // assumptions, or they don't cover it.
  support: "stated" | "direct_implication" | "not_covered";
  mentions_symptom: boolean;
  // Starting, stopping, skipping or changing a medicine or treatment beyond what the notes say.
  asks_to_change_treatment: boolean;
  refer_reason: string;
  urgency: Urgency;
};

export type Decision =
  | { action: "answered"; reply: string; cited: string[]; symptom: boolean; reason: string }
  | { action: "warning_sign"; reply: string; cited: string[]; urgency: Urgency; reason: string }
  | { action: "small_talk"; reply: string; reason: string }
  | { action: "referred"; reason: string; urgency: Urgency };

const atLeastMedium = (u: Urgency): Urgency => (u === "low" ? "medium" : u);

// `verdict` is null when the model call failed, was refused, or returned something unparseable.
//
// The bot may now answer symptom questions ("is some redness normal?") and clear implications of the
// notes ("no swimming" from "don't soak it in a pool"), but only with a citation to a real note item.
// Treatment changes, uncovered questions and anything uncited still go to the doctor.
export function decide(verdict: Verdict | null, noteIds: Set<string>): Decision {
  if (!verdict) {
    return { action: "referred", reason: "The bot could not process this message.", urgency: "medium" };
  }
  const reason = verdict.refer_reason?.trim();
  if (verdict.action === "refer") {
    return { action: "referred", reason: reason || "The bot was not sure how to answer.", urgency: verdict.urgency };
  }
  if (verdict.asks_to_change_treatment) {
    return {
      action: "referred",
      reason: reason || "The patient asked to change a medicine or treatment.",
      urgency: atLeastMedium(verdict.urgency),
    };
  }
  if (verdict.action === "small_talk") {
    if (verdict.mentions_symptom) {
      return { action: "referred", reason: "Small talk that mentions a symptom.", urgency: atLeastMedium(verdict.urgency) };
    }
    return { action: "small_talk", reply: SMALL_TALK_REPLY, reason: "Greeting or thanks, no question." };
  }

  const answer = verdict.answer?.trim();
  const cited = [...new Set(verdict.cited_note_ids ?? [])];
  const doubt = verdict.support === "not_covered"
    ? "The notes don't cover the question."
    : !answer
    ? "The bot produced an empty answer."
    : cited.length === 0
    ? "The answer didn't cite the doctor's notes."
    : cited.some((id) => !noteIds.has(id))
    ? "The answer cited a note that doesn't exist."
    : null;
  if (doubt) {
    const urgency = verdict.mentions_symptom ? atLeastMedium(verdict.urgency) : verdict.urgency;
    return { action: "referred", reason: reason ? `${doubt} ${reason}` : doubt, urgency };
  }

  if (verdict.action === "warning_sign") {
    return {
      action: "warning_sign",
      reply: answer!,
      cited,
      urgency: atLeastMedium(verdict.urgency),
      reason: "The patient described a warning sign from the notes.",
    };
  }
  return {
    action: "answered",
    reply: answer!,
    cited,
    symptom: verdict.mentions_symptom,
    reason: verdict.support === "stated" ? "Answered from the doctor's notes." : "Answered from a direct implication of the notes.",
  };
}

// The text the patient sees for a decision that carries model text.
export function patientReply(decision: Decision & { reply: string }, c: Clinic): string {
  if (decision.action === "warning_sign") return `${decision.reply}\n\n${warningFooter(c)}`;
  if (decision.action === "answered" && decision.symptom) return `${decision.reply}\n\n${symptomFooter(c)}`;
  return decision.reply;
}
