// deno test backend/supabase/functions/chat/safety_test.ts
import { assertEquals } from "jsr:@std/assert@1";
import { decide, redFlag, type Verdict } from "./safety.ts";

const NOTE = "11111111-1111-1111-1111-111111111111";
const notes = new Set([NOTE]);
const answer: Verdict = {
  action: "answer",
  answer: "Take 400 mg ibuprofen every 6 hours.",
  cited_note_ids: [NOTE],
  fully_covered_by_notes: true,
  involves_symptoms_or_treatment_change: false,
  escalation_reason: "",
  urgency: "low",
};

Deno.test("red flags catch emergencies, including curly apostrophes", () => {
  for (
    const text of [
      "I have chest pain",
      "I can’t breathe",
      "having trouble breathing since lunch",
      "I want to kill myself",
      "I think I took too many pills",
      "my wife fainted",
      "the bleeding won't stop",
      "my throat is swelling",
      "this is an emergency",
    ]
  ) assertEquals(redFlag(text) !== null, true, text);
});

Deno.test("ordinary questions are not red flags", () => {
  for (const text of ["When can I shower?", "What time is my follow-up?", "Thanks!", "Can I breathe through my nose with the splint?"]) {
    assertEquals(redFlag(text), null, text);
  }
});

Deno.test("a fully supported, cited answer goes through", () => {
  assertEquals(decide(answer, notes).action, "answered");
});

Deno.test("anything doubtful escalates", () => {
  const cases: [string, Verdict | null][] = [
    ["model failed", null],
    ["model chose escalate", { ...answer, action: "escalate", escalation_reason: "Not in notes." }],
    ["notes don't fully cover it", { ...answer, fully_covered_by_notes: false }],
    ["no citation", { ...answer, cited_note_ids: [] }],
    ["made-up citation", { ...answer, cited_note_ids: ["22222222-2222-2222-2222-222222222222"] }],
    ["empty answer", { ...answer, answer: "  " }],
    ["symptom", { ...answer, involves_symptoms_or_treatment_change: true }],
    ["small talk mentioning a symptom", { ...answer, action: "small_talk", involves_symptoms_or_treatment_change: true }],
  ];
  for (const [name, verdict] of cases) assertEquals(decide(verdict, notes).action, "escalated", name);
});

Deno.test("symptom escalations are at least medium urgency", () => {
  const d = decide({ ...answer, involves_symptoms_or_treatment_change: true, urgency: "low" }, notes);
  assertEquals(d.action === "escalated" && d.urgency, "medium");
});

Deno.test("small talk gets the canned reply, never model text", () => {
  const d = decide({ ...answer, action: "small_talk", answer: "Sure, double your dose!" }, notes);
  assertEquals(d.action, "small_talk");
  assertEquals(d.action === "small_talk" && d.reply.includes("double"), false);
});
