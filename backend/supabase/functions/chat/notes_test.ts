// deno test backend/supabase/functions/chat/
import { assertEquals } from "jsr:@std/assert@1";
import { capNotes, doctorNote, flattenNotes } from "./notes.ts";

Deno.test("PLAN.md shape: one item per list entry, scalars by key", () => {
  const notes = flattenNotes({
    reason: "Stitches in left palm",
    medications: [{ name: "Ibuprofen", dose: "400 mg" }],
    instructions: ["Keep it dry", "No swimming"],
    follow_up: "",
  });
  assertEquals(notes.map((n) => n.id), ["reason", "medications.1", "instructions.1", "instructions.2"]);
  assertEquals(notes[1].text.includes("Ibuprofen"), true);
});

Deno.test("frontend free-text shape: one item per non-empty line", () => {
  const notes = flattenNotes({ instructions: "Walk daily.\n\n  Check BP every morning.  \n" });
  assertEquals(notes, [
    { id: "instructions.1", text: "Walk daily." },
    { id: "instructions.2", text: "Check BP every morning." },
  ]);
});

Deno.test("single-line free text keeps the plain key", () => {
  assertEquals(flattenNotes({ instructions: "Rest for 2 days." }), [{ id: "instructions", text: "Rest for 2 days." }]);
});

Deno.test("no notes or bad input gives no items", () => {
  assertEquals(flattenNotes(null), []);
  assertEquals(flattenNotes("text"), []);
  assertEquals(flattenNotes([1, 2]), []);
});

Deno.test("doctor contact is a citable note", () => {
  assertEquals(doctorNote(null), []);
  const [note] = doctorNote({ name: "Dr. Leo Martins", clinic: "Bayside Urgent Care", clinic_phone: "555-0187" });
  assertEquals(note.id, "doctor");
  assertEquals(note.text.includes("555-0187"), true);
});

Deno.test("capNotes keeps the first notes that fit and drops the rest", () => {
  const notes = [
    { id: "a", text: "x".repeat(40) },
    { id: "b", text: "x".repeat(40) },
    { id: "c", text: "x".repeat(40) },
  ];
  assertEquals(capNotes(notes, 100).map((n) => n.id), ["a", "b"]);
  assertEquals(capNotes(notes, 120).map((n) => n.id), ["a", "b", "c"]);
  assertEquals(capNotes(notes, 10), []);
  assertEquals(capNotes([], 100), []);
});

Deno.test("a maximal notes save (200 items x 2000 chars) is cut down to the budget", () => {
  const huge = flattenNotes({ instructions: Array.from({ length: 300 }, () => "y".repeat(5000)) });
  assertEquals(huge.length, 200);
  const kept = capNotes(huge, 20_000);
  assertEquals(kept.length, 10);
  assertEquals(kept.reduce((n, x) => n + x.text.length, 0) <= 20_000, true);
});
