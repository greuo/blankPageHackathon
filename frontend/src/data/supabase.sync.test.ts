import { beforeEach, expect, it, vi } from 'vitest';

// A stand-in Supabase client over a tiny in-memory db, so the sync rules are tested
// without the network: what gets inserted into care_notes, and when nothing should be.
const h = vi.hoisted(() => {
  const db = {
    currentNote: null as null | { content: Record<string, unknown>; doctor_id: string | null },
    doctor: null as null | { id: string; name: string; email: string | null },
    noteInserts: [] as Array<Record<string, unknown>>,
    doctorUpdates: [] as Array<Record<string, unknown>>,
  };
  const ok = (data: unknown) => ({ data, error: null });
  const from = (table: string) => ({
    select() {
      return this;
    },
    order() {
      return this;
    },
    limit() {
      return this;
    },
    async maybeSingle() {
      if (table === 'current_care_notes') return ok(db.currentNote);
      if (table === 'doctors') return ok(db.doctor);
      return ok(null);
    },
    insert(row: Record<string, unknown>) {
      if (table === 'doctors')
        db.doctor = {
          id: 'doc-created',
          name: String(row.name),
          email: (row.email as string | null) ?? null,
        };
      if (table === 'care_notes') {
        db.noteInserts.push(row);
        db.currentNote = {
          content: row.content as Record<string, unknown>,
          doctor_id: (row.doctor_id as string | null) ?? null,
        };
      }
      return {
        select: () => ({ single: async () => ok({ id: db.doctor?.id }) }),
        then: (resolve: (value: unknown) => void) => resolve(ok(null)),
      };
    },
    update(row: Record<string, unknown>) {
      if (table === 'doctors') {
        db.doctorUpdates.push(row);
        if (db.doctor) Object.assign(db.doctor, row);
      }
      return { eq: async () => ok(null) };
    },
  });
  return { db, client: { from, auth: {}, functions: {} } };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => h.client,
  FunctionsHttpError: class FunctionsHttpError extends Error {},
}));

import { syncCareNotes } from './supabase';

const local = {
  doctor: 'Dr. Maya Chen',
  email: 'maya.chen@example.com',
  instructions: 'Keep the wound dry.\nNo soaking until the stitches are out.',
};

beforeEach(() => {
  h.db.currentNote = null;
  h.db.doctor = null;
  h.db.noteInserts = [];
  h.db.doctorUpdates = [];
});

it('creates the doctor and the first note version for a fresh patient', async () => {
  await syncCareNotes(local);
  expect(h.db.doctor).toMatchObject({ name: 'Dr. Maya Chen', email: 'maya.chen@example.com' });
  expect(h.db.noteInserts).toEqual([
    { doctor_id: 'doc-created', content: { instructions: local.instructions } },
  ]);
});

it('adds nothing when the server already matches', async () => {
  await syncCareNotes(local);
  const once = h.db.noteInserts.length;
  await syncCareNotes(local);
  expect(h.db.noteInserts.length).toBe(once);
});

it('inserts a new version when the instructions changed', async () => {
  await syncCareNotes(local);
  await syncCareNotes({ ...local, instructions: 'Stitches come out Friday.' });
  expect(h.db.noteInserts).toHaveLength(2);
  expect(h.db.noteInserts[1].content).toEqual({ instructions: 'Stitches come out Friday.' });
});

it('keeps the doctor row in step with the app', async () => {
  await syncCareNotes(local);
  await syncCareNotes({ ...local, email: 'chen@clinic.example.com' });
  expect(h.db.doctorUpdates).toEqual([
    { name: 'Dr. Maya Chen', email: 'chen@clinic.example.com' },
  ]);
});

it('never overwrites richer structured notes entered elsewhere', async () => {
  h.db.currentNote = {
    content: { instructions: ['Rest the hand.'], warning_signs: [{ sign: 'spreading redness' }] },
    doctor_id: null,
  };
  await syncCareNotes(local);
  expect(h.db.noteInserts).toHaveLength(0);
});

it('sends nothing when the app has no instructions text', async () => {
  await syncCareNotes({ ...local, instructions: '   ' });
  expect(h.db.noteInserts).toHaveLength(0);
  expect(h.db.doctor).toBeNull();
});
