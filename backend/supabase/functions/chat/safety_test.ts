// deno test backend/supabase/functions/chat/
import { assertEquals } from "jsr:@std/assert@1";
import { decide, emergencyNotice, redFlag, referNotice, type Verdict } from "./safety.ts";

const NOTE = "medications.1";
const notes = new Set([NOTE]);
const answer: Verdict = {
  action: "answer",
  answer: "Take 400 mg ibuprofen every 6 hours.",
  cited_note_ids: [NOTE],
  fully_covered_by_notes: true,
  involves_symptoms_or_treatment_change: false,
  refer_reason: "",
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
      "No chest pain, but I cannot breathe",
      "no idea why I have chest pain",
      "I've never had chest pain like this before",
      "No I can't breathe",
      "I'm not ok I can't breathe",
    ]
  ) assertEquals(redFlag(text) !== null, true, text);
});

Deno.test("ordinary or negated messages are not red flags", () => {
  for (
    const text of [
      "When can I shower?",
      "What time is my follow-up?",
      "Thanks!",
      "Can I breathe through my nose with the splint?",
      "no chest pain today",
      "I haven't had any chest pain",
      "I'm not short of breath anymore",
      "who is my emergency contact?",
    ]
  ) assertEquals(redFlag(text), null, text);
});

Deno.test("a fully supported, cited answer goes through", () => {
  assertEquals(decide(answer, notes).action, "answered");
});

Deno.test("anything doubtful refers the patient to their doctor", () => {
  const cases: [string, Verdict | null][] = [
    ["model failed or no API key", null],
    ["model chose refer", { ...answer, action: "refer", refer_reason: "Not in notes." }],
    ["notes don't fully cover it", { ...answer, fully_covered_by_notes: false }],
    ["no citation", { ...answer, cited_note_ids: [] }],
    ["made-up citation", { ...answer, cited_note_ids: ["instructions.99"] }],
    ["empty answer", { ...answer, answer: "  " }],
    ["symptom", { ...answer, involves_symptoms_or_treatment_change: true }],
    ["small talk mentioning a symptom", { ...answer, action: "small_talk", involves_symptoms_or_treatment_change: true }],
  ];
  for (const [name, verdict] of cases) assertEquals(decide(verdict, notes).action, "referred", name);
});

Deno.test("symptom referrals are at least medium urgency", () => {
  const d = decide({ ...answer, involves_symptoms_or_treatment_change: true, urgency: "low" }, notes);
  assertEquals(d.action === "referred" && d.urgency, "medium");
});

Deno.test("small talk gets the canned reply, never model text", () => {
  const d = decide({ ...answer, action: "small_talk", answer: "Sure, double your dose!" }, notes);
  assertEquals(d.action, "small_talk");
  assertEquals(d.action === "small_talk" && d.reply.includes("double"), false);
});

Deno.test("notices point to 911 / the clinic phone, never email", () => {
  const clinic = { clinic: "Bayside Urgent Care", clinic_phone: "555-0187" };
  assertEquals(emergencyNotice(clinic).includes("911"), true);
  assertEquals(emergencyNotice(clinic).includes("555-0187"), true);
  assertEquals(emergencyNotice(null).includes("911"), true);
  assertEquals(referNotice(clinic, "high").includes("911"), true);
  assertEquals(referNotice(null, "low").includes("Send to my doctor"), true);
});
