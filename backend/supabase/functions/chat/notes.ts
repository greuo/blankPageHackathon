// Turns the patient's current care notes (care_notes.content, free-form JSON) into short items with
// stable ids, so the bot can cite exactly which part of the notes an answer came from.
//
// Accepts both shapes in use:
//   - the PLAN.md shape: { reason, medications: [{ name, dose, when, until }], instructions: [..],
//     warning_signs: [{ sign, action }], contact_rules, follow_up }
//   - the frontend's current free-text shape: { instructions: "line one\nline two" }
// Any other keys are passed through too, so new fields don't need a backend change.

export type Note = { id: string; text: string };

const MAX_ITEMS = 200;
const MAX_ITEM_LENGTH = 2000;

function asText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0) ||
    (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0);
}

export function flattenNotes(content: unknown): Note[] {
  if (!content || typeof content !== "object" || Array.isArray(content)) return [];
  const notes: Note[] = [];
  const push = (id: string, value: unknown) => {
    if (isEmpty(value) || notes.length >= MAX_ITEMS) return;
    notes.push({ id, text: asText(value).slice(0, MAX_ITEM_LENGTH) });
  };

  for (const [key, value] of Object.entries(content as Record<string, unknown>)) {
    if (Array.isArray(value)) {
      value.forEach((item, i) => push(`${key}.${i + 1}`, item));
    } else if (typeof value === "string" && value.includes("\n")) {
      // Free text: one item per non-empty line, so a citation points at a line, not the whole blob.
      value.split("\n").map((l) => l.trim()).filter(Boolean).forEach((line, i) => push(`${key}.${i + 1}`, line));
    } else {
      push(key, value);
    }
  }
  return notes;
}

// Every note goes to Claude on every message, and the patient can save a huge one (a single save can
// hold 200 items of 2,000 characters), so keep the first notes that fit in `maxChars` and drop the rest.
export function capNotes(notes: Note[], maxChars: number): Note[] {
  const kept: Note[] = [];
  let used = 0;
  for (const note of notes) {
    used += note.text.length;
    if (used > maxChars) break;
    kept.push(note);
  }
  return kept;
}

export type DoctorContact ={ name: string; clinic: string | null; clinic_phone: string | null };

// The doctor's contact details are notes too ("what's my clinic's number?").
export function doctorNote(doctor: DoctorContact | null): Note[] {
  if (!doctor) return [];
  const parts = [doctor.name, doctor.clinic, doctor.clinic_phone && `phone ${doctor.clinic_phone}`].filter(Boolean);
  return [{ id: "doctor", text: `Doctor who entered these notes: ${parts.join(", ")}` }];
}
