// deno test backend/supabase/functions/chat/
import { assertEquals } from "jsr:@std/assert@1";
import { decide, emergencyNotice, patientReply, redFlag, referNotice, type Verdict } from "./safety.ts";

const NOTE = "medications.1";
const SIGN = "warning_signs.1";
const notes = new Set([NOTE, SIGN, "normal.1", "instructions.2"]);
const answer: Verdict = {
  action: "answer",
  answer: "Take 400 mg ibuprofen every 6 hours.",
  cited_note_ids: [NOTE],
  support: "stated",
  mentions_symptom: false,
  asks_to_change_treatment: false,
  refer_reason: "",
  urgency: "low",
};
const clinic = { clinic: "Bayside Urgent Care", clinic_phone: "555-0187" };

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

Deno.test("a clear implication of the notes is answered (no swimming from 'don't soak it')", () => {
  const d = decide({ ...answer, answer: "No, not until your stitches are out.", cited_note_ids: ["instructions.2"], support: "direct_implication" }, notes);
  assertEquals(d.action, "answered");
});

Deno.test("'is this normal?' backed by the notes is answered, with the fixed safety footer", () => {
  const d = decide({ ...answer, answer: "Some pinkness along the stitches is expected.", cited_note_ids: ["normal.1", SIGN], mentions_symptom: true }, notes);
  assertEquals(d.action, "answered");
  if (d.action !== "answered") return;
  const text = patientReply(d, clinic);
  assertEquals(text.startsWith("Some pinkness"), true);
  assertEquals(text.includes("warning signs") && text.includes("911") && text.includes("555-0187"), true);
});

Deno.test("a matching warning sign gets the notes' action, the footer, and at least medium urgency", () => {
  const d = decide({ ...answer, action: "warning_sign", answer: "Spreading redness is a warning sign: come back today.", cited_note_ids: [SIGN], mentions_symptom: true }, notes);
  assertEquals(d.action, "warning_sign");
  if (d.action !== "warning_sign") return;
  assertEquals(d.urgency, "medium");
  const text = patientReply(d, clinic);
  assertEquals(text.includes("Send to my doctor") && text.includes("911"), true);
});

Deno.test("anything doubtful refers the patient to their doctor", () => {
  const cases: [string, Verdict | null][] = [
    ["model failed or no API key", null],
    ["model chose refer", { ...answer, action: "refer", refer_reason: "Not in notes." }],
    ["notes don't cover it", { ...answer, support: "not_covered" }],
    ["no citation", { ...answer, cited_note_ids: [] }],
    ["made-up citation", { ...answer, cited_note_ids: ["instructions.99"] }],
    ["empty answer", { ...answer, answer: "  " }],
    ["treatment change", { ...answer, asks_to_change_treatment: true }],
    ["treatment change dressed as a warning sign", { ...answer, action: "warning_sign", cited_note_ids: [SIGN], asks_to_change_treatment: true }],
    ["uncited warning sign", { ...answer, action: "warning_sign", cited_note_ids: [] }],
    ["small talk mentioning a symptom", { ...answer, action: "small_talk", mentions_symptom: true }],
  ];
  for (const [name, verdict] of cases) assertEquals(decide(verdict, notes).action, "referred", name);
});

Deno.test("a symptom answer backed only by an unrelated note refers, when the notes cover symptoms", () => {
  const d = decide({ ...answer, answer: "That's normal.", cited_note_ids: [NOTE], mentions_symptom: true }, notes);
  assertEquals(d.action, "referred");
  const w = decide({ ...answer, action: "warning_sign", answer: "Call the clinic.", cited_note_ids: [NOTE], mentions_symptom: true }, notes);
  assertEquals(w.action, "referred");
});

Deno.test("free-text notes (no normal / warning-sign items) can still answer a symptom question, with the footer", () => {
  const d = decide({ ...answer, answer: "Your notes say to rest it.", cited_note_ids: ["instructions.2"], mentions_symptom: true }, new Set(["instructions.1", "instructions.2"]));
  assertEquals(d.action, "answered");
  assertEquals(d.action === "answered" && patientReply(d, clinic).includes("911"), true);
});

Deno.test("citing a normal / warning-sign item adds the footer even if the model forgot the symptom flag", () => {
  const d = decide({ ...answer, answer: "Some pinkness is expected.", cited_note_ids: ["normal.1"], mentions_symptom: false }, notes);
  assertEquals(d.action === "answered" && patientReply(d, clinic).includes("911"), true);
});

Deno.test("referrals about symptoms are at least medium urgency", () => {
  const d = decide({ ...answer, support: "not_covered", mentions_symptom: true, urgency: "low" }, notes);
  assertEquals(d.action === "referred" && d.urgency, "medium");
});

Deno.test("answers without a symptom carry no footer", () => {
  const d = decide(answer, notes);
  assertEquals(d.action === "answered" && patientReply(d, clinic), "Take 400 mg ibuprofen every 6 hours.");
});

Deno.test("small talk gets the canned reply, never model text", () => {
  const d = decide({ ...answer, action: "small_talk", answer: "Sure, double your dose!" }, notes);
  assertEquals(d.action, "small_talk");
  assertEquals(d.action === "small_talk" && d.reply.includes("double"), false);
});

Deno.test("notices point to 911 / the clinic phone, never email", () => {
  assertEquals(emergencyNotice(clinic).includes("911"), true);
  assertEquals(emergencyNotice(clinic).includes("555-0187"), true);
  assertEquals(emergencyNotice(null).includes("911"), true);
  assertEquals(referNotice(clinic, "high").includes("911"), true);
  assertEquals(referNotice(null, "low").includes("Send to my doctor"), true);
});
