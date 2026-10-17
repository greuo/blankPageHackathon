import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canViewChecklist,
  canViewDocuments,
  canViewPlan,
  createDemoRepository,
  DEMO_STORAGE_KEY,
  DEMO_ACTOR_KEY,
  uid,
  getActivePlan,
  getChecklistOccurrences,
  getVisibleConversations,
  getVisibleHandoffs,
  getVisibleMessages,
  getVisibleSpaces,
  localDate,
} from './repository';
import type { Plan } from './types';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
}
let repo: ReturnType<typeof createDemoRepository>;
const draft = (): Plan => ({
  ...structuredClone(repo.getSnapshot().plans[0]),
  id: 'draft-next',
  version: 2,
  status: 'draft',
  title: 'Reviewed next version',
});
beforeEach(() => {
  repo = createDemoRepository();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('fictional approval and care orders', () => {
  it('keeps draft changes out of the approved plan until a clinician publishes', () => {
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions[0].text = 'A clinician-reviewed demonstration instruction.';
    repo.saveDraft(plan);
    expect(getActivePlan(repo.getSnapshot(), 'recovery')?.version).toBe(1);
    repo.publishPlan(plan.id);
    expect(getActivePlan(repo.getSnapshot(), 'recovery')?.version).toBe(2);
    expect(getActivePlan(repo.getSnapshot(), 'recovery')?.approvedBy).toBe('doctor');
    expect(() => repo.saveDraft({ ...plan, status: 'draft' })).toThrow(/immutable/);
  });
  it('rejects patient and family clinical edits and publication', () => {
    const plan = draft();
    expect(() => repo.saveDraft(plan)).toThrow(/clinician/);
    repo.setActor('doctor');
    repo.saveDraft(plan);
    repo.setActor('family');
    expect(() => repo.publishPlan(plan.id)).toThrow(/clinician/);
    expect(() => repo.saveDraft(plan)).toThrow(/clinician/);
  });
  it('requires source passages and a finite end for restrictions', () => {
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions[0].sourcePassage = '';
    expect(() => repo.saveDraft(plan)).toThrow(/Source passage/);
    plan.instructions[0].sourcePassage = 'Fictional source';
    plan.instructions[1].endsAt = undefined;
    expect(() => repo.saveDraft(plan)).toThrow(/timing/);
  });
  it('does not silently turn casual messages into clinical instructions', () => {
    repo.setActor('doctor');
    repo.sendMessage({
      id: 'casual',
      conversationId: 'recovery-doctor',
      body: 'An ordinary conversation message.',
    });
    expect(getActivePlan(repo.getSnapshot(), 'recovery')?.version).toBe(1);
    expect(
      getActivePlan(repo.getSnapshot(), 'recovery')?.instructions.some((i) =>
        i.text.includes('ordinary'),
      ),
    ).toBe(false);
  });
});

describe('conversation and care-space boundaries in the local adapter', () => {
  it('hides and blocks nonparticipant conversations even for the administering doctor', () => {
    repo.sendMessage({
      id: 'private',
      conversationId: 'recovery-family',
      body: 'Private fictional family note',
    });
    repo.setActor('doctor');
    expect(getVisibleMessages(repo.getSnapshot(), 'recovery-family')).toEqual([]);
    expect(
      getVisibleConversations(repo.getSnapshot(), 'recovery').map((c) => c.kind),
    ).not.toContain('ai');
    expect(() =>
      repo.sendMessage({ id: 'intrusion', conversationId: 'recovery-family', body: 'No' }),
    ).toThrow(/private/);
    repo.setActor('family');
    expect(getVisibleMessages(repo.getSnapshot(), 'recovery-doctor')).toEqual([]);
  });
  it('requires actual space membership for a new conversation', () => {
    expect(() =>
      repo.createConversation({
        spaceId: 'recovery',
        title: 'Bad participant',
        kind: 'group',
        participantIds: ['patient', 'stranger'],
      }),
    ).toThrow(/current care-space/);
    expect(() =>
      repo.createConversation({
        spaceId: 'missing',
        title: 'Missing space',
        kind: 'group',
        participantIds: ['patient', 'doctor'],
      }),
    ).toThrow(/access/);
  });
  it('retries messages without creating duplicates and rejects ID reuse', () => {
    const message = { id: 'message-retry', conversationId: 'recovery-care', body: 'Hello' };
    repo.sendMessage(message);
    repo.sendMessage(message);
    expect(repo.getSnapshot().messages.filter((m) => m.id === message.id)).toHaveLength(1);
    expect(() => repo.sendMessage({ ...message, body: 'Changed body' })).toThrow(/already/);
  });
  it('only returns sourced exact approved excerpts, or an honest handoff path', () => {
    repo.sendMessage({
      id: 'question',
      conversationId: 'recovery-ai',
      body: 'Where is my recovery journal?',
    });
    const answer = repo.getSnapshot().messages.find((m) => m.id === 'question-reply');
    expect(answer?.body).toContain(repo.getSnapshot().plans[0].instructions[0].text);
    expect(answer?.sourceInstructionId).toBe('recovery-instruction-1');
    repo.sendMessage({
      id: 'uncovered',
      conversationId: 'recovery-ai',
      body: 'What is the capital of France?',
    });
    expect(repo.getSnapshot().messages.find((m) => m.id === 'uncovered-reply')?.needsHandoff).toBe(
      true,
    );
    repo.sendMessage({
      id: 'cross-context',
      conversationId: 'recovery-ai',
      body: 'medication schedule',
    });
    expect(
      repo.getSnapshot().messages.find((m) => m.id === 'cross-context-reply')?.needsHandoff,
    ).toBe(true);
  });
});

describe('approved family matrix and revocation', () => {
  it('projects free-form clinical context away for Basic and Support, including checklist context', async () => {
    repo.setActor('doctor');
    const space = await repo.createSpace({
      name: 'Fictional private diagnosis recovery',
      description: 'Fictional private clinical treatment detail',
      category: 'Fictional private diagnosis',
    });
    repo.saveDraft({
      id: 'context-projection-plan',
      spaceId: space.id,
      title: 'Fictional shared action',
      version: 1,
      status: 'draft',
      instructions: [
        {
          ...structuredClone(repo.getSnapshot().plans[0].instructions[0]),
          id: 'context-projection-action',
        },
      ],
    });
    repo.publishPlan('context-projection-plan');
    for (const level of ['Basic', 'Support', 'Full'] as const) {
      repo.setActor('patient');
      repo.changeGrant(space.id, level, 'family');
      repo.setActor('family');
      const visible = getVisibleSpaces(repo.getSnapshot()).find((s) => s.id === space.id)!;
      expect(visible.memberIds).toEqual(space.memberIds);
      expect(visible.updatedAt).toBe(space.updatedAt);
      if (level === 'Full') {
        expect(visible.name).toBe(space.name);
        expect(visible.description).toBe(space.description);
        expect(visible.category).toBe(space.category);
      } else {
        expect(visible.name).toMatch(/^Shared recovery space \d+$/);
        expect(visible.description).toBe('Shared updates and conversations you have joined.');
        expect(visible.category).toBe('Shared updates');
        expect(JSON.stringify(visible)).not.toContain('Fictional private');
      }
      const occurrences = getChecklistOccurrences(repo.getSnapshot()).filter(
        (o) => o.space.id === space.id,
      );
      if (level === 'Support') {
        expect(occurrences).toHaveLength(1);
        expect(JSON.stringify(occurrences[0].space)).not.toContain('Fictional private');
      }
      if (level === 'Basic') expect(occurrences).toEqual([]);
    }
  });
  it('creates new spaces without automatically granting family access or conversation membership', async () => {
    repo.setActor('doctor');
    const space = await repo.createSpace({
      name: 'New recovery context',
      description: 'Fictional patient context',
      category: 'Recovery',
    });
    expect(repo.getSnapshot().grants.find((g) => g.spaceId === space.id)?.level).toBe('revoked');
    expect(
      repo.getSnapshot().conversations.find((c) => c.id === `${space.id}-care`)?.participantIds,
    ).toEqual(['doctor', 'patient']);
    repo.setActor('family');
    expect(getVisibleSpaces(repo.getSnapshot()).some((s) => s.id === space.id)).toBe(false);
    repo.setActor('patient');
    repo.changeGrant(space.id, 'Support', 'family');
    repo.setActor('family');
    expect(getVisibleSpaces(repo.getSnapshot()).some((s) => s.id === space.id)).toBe(true);
    expect(getVisibleConversations(repo.getSnapshot(), space.id)).toEqual([]);
    repo.setActor('patient');
    const conversation = repo.createConversation({
      spaceId: space.id,
      title: 'Explicitly selected family group',
      kind: 'group',
      participantIds: ['patient', 'family'],
    });
    repo.setActor('family');
    expect(getVisibleConversations(repo.getSnapshot(), space.id).map((c) => c.id)).toEqual([
      conversation.id,
    ]);
  });
  it.each(['Basic', 'Support', 'Full'] as const)(
    '%s implements only its agreed shared information access',
    (level) => {
      repo.changeGrant('recovery', level, 'family');
      repo.setActor('family');
      expect(getVisibleSpaces(repo.getSnapshot()).some((s) => s.id === 'recovery')).toBe(true);
      expect(canViewPlan(repo.getSnapshot(), 'recovery')).toBe(level === 'Full');
      expect(canViewDocuments(repo.getSnapshot(), 'recovery')).toBe(level === 'Full');
      expect(canViewChecklist(repo.getSnapshot(), 'recovery')).toBe(level !== 'Basic');
      expect(getVisibleConversations(repo.getSnapshot(), 'recovery').map((c) => c.id)).toContain(
        'recovery-family',
      );
      expect(
        getVisibleConversations(repo.getSnapshot(), 'recovery').map((c) => c.id),
      ).not.toContain('recovery-doctor');
      expect(() => repo.changeGrant('recovery', 'Full', 'family')).toThrow(/Only/);
      const report = {
        id: 'family-report',
        spaceId: 'recovery',
        instructionId: 'recovery-instruction-1',
        date: localDate(),
      };
      if (level === 'Basic') expect(() => repo.report(report)).toThrow(/approved actions/);
      else {
        repo.report(report);
        expect(repo.getSnapshot().reports[0].authorId).toBe('family');
      }
    },
  );
  it('blocks already-open conversations and reports after revocation while preserving history', () => {
    repo.setActor('family');
    repo.sendMessage({ id: 'prior', conversationId: 'recovery-family', body: 'Prior access' });
    repo.setActor('doctor');
    repo.changeGrant('recovery', 'revoked', 'family');
    repo.setActor('family');
    expect(getVisibleConversations(repo.getSnapshot(), 'recovery')).toEqual([]);
    expect(() =>
      repo.sendMessage({
        id: 'late',
        conversationId: 'recovery-family',
        body: 'No longer allowed',
      }),
    ).toThrow(/private/);
    expect(() =>
      repo.report({
        id: 'late-report',
        spaceId: 'recovery',
        instructionId: 'recovery-instruction-1',
        date: localDate(),
      }),
    ).toThrow(/access/);
    expect(repo.getSnapshot().messages.some((m) => m.id === 'prior')).toBe(true);
    expect(repo.getSnapshot().audit[0]).toMatchObject({
      actorId: 'doctor',
      previousLevel: 'Full',
      newLevel: 'revoked',
    });
    repo.setActor('patient');
    repo.changeGrant('recovery', 'Support', 'family');
    expect(repo.getSnapshot().audit[1].actorId).toBe('patient');
  });
});

describe('dated reports and occurrences', () => {
  it.each([
    { endHour: 8, endMinute: 59, included: false },
    { endHour: 9, endMinute: 0, included: true },
    { endHour: 9, endMinute: 1, included: true },
  ])(
    'bounds daily occurrence timestamps at an inclusive end ($endHour:$endMinute)',
    ({ endHour, endMinute, included }) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 17, 8, 0));
      repo = createDemoRepository();
      repo.setActor('doctor');
      const plan = draft();
      plan.instructions = [
        {
          ...plan.instructions[0],
          id: 'timed-action',
          dueAt: new Date(2026, 9, 17, 9, 0).toISOString(),
          endsAt: new Date(2026, 9, 18, endHour, endMinute).toISOString(),
          recurrence: 'daily',
        },
      ];
      repo.saveDraft(plan);
      repo.publishPlan(plan.id);
      repo.setActor('patient');
      expect(
        getChecklistOccurrences(repo.getSnapshot(), '2026-10-17').some(
          (o) => o.instruction.id === 'timed-action',
        ),
      ).toBe(true);
      expect(
        getChecklistOccurrences(repo.getSnapshot(), '2026-10-18').some(
          (o) => o.instruction.id === 'timed-action',
        ),
      ).toBe(included);
      expect(
        getChecklistOccurrences(repo.getSnapshot(), '2026-10-19').some(
          (o) => o.instruction.id === 'timed-action',
        ),
      ).toBe(false);
    },
  );
  it('uses local wall-clock recurrence across the daylight-saving transition', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 7, 8, 0));
    repo = createDemoRepository();
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions = [
      {
        ...plan.instructions[0],
        id: 'calendar-action',
        dueAt: new Date(2026, 2, 7, 9, 0).toISOString(),
        endsAt: new Date(2026, 2, 8, 9, 0).toISOString(),
        recurrence: 'daily',
      },
    ];
    repo.saveDraft(plan);
    repo.publishPlan(plan.id);
    repo.setActor('patient');
    expect(
      getChecklistOccurrences(repo.getSnapshot(), '2026-03-08').some(
        (o) => o.instruction.id === 'calendar-action',
      ),
    ).toBe(true);
  });
  it('saves an idempotent report, records correction without deleting history, then permits a new report', () => {
    const input = {
      id: 'report-1',
      spaceId: 'recovery',
      instructionId: 'recovery-instruction-1',
      date: localDate(),
    };
    repo.report(input);
    repo.report(input);
    repo.report({ ...input, id: 'duplicate-click' });
    expect(repo.getSnapshot().reports).toHaveLength(1);
    expect(repo.getSnapshot().reports[0].reportedAt).toBeTruthy();
    repo.undoReport(input.id);
    expect(repo.getSnapshot().reports[0].undoneAt).toBeTruthy();
    repo.report({ ...input, id: 'correction' });
    expect(repo.getSnapshot().reports).toHaveLength(2);
    repo.setActor('family');
    expect(() => repo.undoReport('correction')).toThrow(/person who submitted/);
  });
  it('repeats daily actions, shows a once appointment only on its date, and rejects restriction completion', () => {
    const state = repo.getSnapshot();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(
      getChecklistOccurrences(state, localDate(tomorrow)).some(
        (o) => o.instruction.id === 'recovery-instruction-1',
      ),
    ).toBe(true);
    const appointment = state.plans.find((p) => p.spaceId === 'followup')!.instructions[0];
    const appointmentDate = localDate(new Date(appointment.dueAt));
    expect(
      getChecklistOccurrences(state, localDate()).some((o) => o.instruction.id === appointment.id),
    ).toBe(false);
    expect(
      getChecklistOccurrences(state, appointmentDate).some(
        (o) => o.instruction.id === appointment.id,
      ),
    ).toBe(true);
    expect(() =>
      repo.report({
        id: 'restriction-report',
        spaceId: 'recovery',
        instructionId: 'recovery-restriction',
        date: localDate(),
      }),
    ).toThrow(/Only approved actions/);
    expect(() =>
      repo.report({
        id: 'future-report',
        spaceId: 'recovery',
        instructionId: 'recovery-instruction-1',
        date: localDate(tomorrow),
      }),
    ).toThrow(/Future/);
  });
  it('keeps a once restriction visible throughout its active date range', () => {
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions[1].recurrence = 'once';
    repo.saveDraft(plan);
    repo.publishPlan(plan.id);
    repo.setActor('patient');
    expect(
      getChecklistOccurrences(repo.getSnapshot()).some((o) => o.instruction.kind === 'restriction'),
    ).toBe(true);
    expect(getChecklistOccurrences(repo.getSnapshot(), '2026-02-31')).toEqual([]);
  });
  it('does not reuse an old completion for a changed approved instruction', () => {
    repo.report({
      id: 'old-report',
      spaceId: 'recovery',
      instructionId: 'recovery-instruction-1',
      date: localDate(),
    });
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions[0].text = 'A revised clinician-approved demonstration action.';
    repo.saveDraft(plan);
    const identity = repo.getSnapshot().plans.find((p) => p.id === plan.id)!.instructions[0].id;
    expect(identity).not.toBe('recovery-instruction-1');
    repo.saveDraft(plan);
    expect(repo.getSnapshot().plans.find((p) => p.id === plan.id)!.instructions[0].id).toBe(
      identity,
    );
    repo.publishPlan(plan.id);
    repo.setActor('patient');
    const revised = getChecklistOccurrences(repo.getSnapshot()).find(
      (o) => o.instruction.id === identity,
    );
    expect(revised).toBeDefined();
    expect(repo.getSnapshot().reports.some((r) => r.instructionId === identity)).toBe(false);
    expect(
      repo.getSnapshot().plans.find((p) => p.version === 1 && p.spaceId === 'recovery')!
        .instructions[0].id,
    ).toBe('recovery-instruction-1');
  });
  it('preserves the approved plan and report context for past local dates after a later publication', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 17, 10, 0, 0));
    repo = createDemoRepository();
    const firstDate = localDate();
    const beforeApproval = new Date();
    beforeApproval.setDate(beforeApproval.getDate() - 1);
    // Even the seed restriction starts yesterday, but its plan was only approved today.
    expect(getChecklistOccurrences(repo.getSnapshot(), localDate(beforeApproval))).toEqual([]);
    const original = getChecklistOccurrences(repo.getSnapshot(), firstDate).find(
      (o) => o.instruction.id === 'recovery-instruction-1',
    )!;
    repo.report({
      id: 'historical-report',
      spaceId: 'recovery',
      instructionId: original.instruction.id,
      date: firstDate,
    });
    vi.setSystemTime(new Date(2026, 9, 18, 0, 5, 0));
    const publicationDate = localDate();
    repo.setActor('doctor');
    const plan = draft();
    plan.instructions[0].text = 'Revised fictional recovery action for the new day.';
    plan.instructions[0].dueAt = new Date(2026, 9, 18, 9, 0, 0).toISOString();
    repo.saveDraft(plan);
    repo.publishPlan(plan.id);
    repo.setActor('patient');
    const past = getChecklistOccurrences(repo.getSnapshot(), firstDate).find(
      (o) => o.instruction.id === original.instruction.id,
    );
    expect(past?.instruction.text).toBe(original.instruction.text);
    expect(
      repo.getSnapshot().reports.find((r) => r.instructionId === past?.instruction.id)?.date,
    ).toBe(firstDate);
    const today = getChecklistOccurrences(repo.getSnapshot(), publicationDate).find(
      (o) => o.space.id === 'recovery' && o.instruction.kind === 'action',
    );
    expect(today?.instruction.text).toBe(plan.instructions[0].text);
    expect(today?.instruction.id).not.toBe(original.instruction.id);
    const future = new Date();
    future.setDate(future.getDate() + 1);
    expect(
      getChecklistOccurrences(repo.getSnapshot(), localDate(future)).some(
        (o) => o.instruction.id === today?.instruction.id,
      ),
    ).toBe(true);
    repo.changeGrant('recovery', 'Support', 'family');
    repo.setActor('family');
    expect(
      getChecklistOccurrences(repo.getSnapshot(), firstDate).some(
        (o) => o.instruction.id === original.instruction.id,
      ),
    ).toBe(true);
    expect(getActivePlan(repo.getSnapshot(), 'recovery')).toBeUndefined();
    repo.setActor('patient');
    repo.changeGrant('recovery', 'Basic', 'family');
    repo.setActor('family');
    expect(
      getChecklistOccurrences(repo.getSnapshot(), firstDate).some((o) => o.space.id === 'recovery'),
    ).toBe(false);
  });
});

describe('patient-approved local handoff', () => {
  it('stores exactly the approved summary once and permits only its clinician to acknowledge', () => {
    const input = {
      id: 'handoff',
      spaceId: 'recovery',
      summary: 'Only this approved fictional content.',
    };
    repo.sendHandoff(input);
    repo.sendHandoff(input);
    expect(repo.getSnapshot().handoffs).toHaveLength(1);
    expect(repo.getSnapshot().handoffs[0].summary).toBe(input.summary);
    expect(() => repo.acknowledgeHandoff(input.id)).toThrow(/clinician/);
    repo.setActor('family');
    expect(getVisibleHandoffs(repo.getSnapshot(), 'recovery')).toEqual([]);
    expect(() => repo.sendHandoff({ ...input, id: 'family-handoff' })).toThrow(/patient/);
    repo.setActor('doctor');
    repo.acknowledgeHandoff(input.id);
    expect(repo.getSnapshot().handoffs[0].status).toBe('acknowledged');
  });
});

describe('truthful browser storage and document handling', () => {
  it('uses stable immutable snapshots and restores namespaced fictional records', () => {
    const storage = memoryStorage();
    const first = createDemoRepository(storage);
    expect(first.getSnapshot()).toBe(first.getSnapshot());
    expect(Object.isFrozen(first.getSnapshot().spaces)).toBe(true);
    first.setActor('doctor');
    first.changeGrant('recovery', 'Support', 'family');
    expect(storage.getItem(DEMO_STORAGE_KEY)).toBeTruthy();
    const restored = createDemoRepository(storage);
    expect(restored.getSnapshot().actorId).toBe('patient');
    expect(restored.getSnapshot().grants[0].level).toBe('Support');
  });
  it('surfaces quota failures and does not claim the mutation succeeded', () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new Error('Quota exceeded');
    };
    const broken = createDemoRepository(storage);
    expect(() => broken.changeGrant('recovery', 'Basic', 'family')).toThrow(/could not save/);
    expect(broken.getSnapshot().actorId).toBe('patient');
    expect(broken.getPersistenceError()).toBeTruthy();
  });
  it('handles cross-tab snapshot changes, invalid input and subscription cleanup', () => {
    let changes = 0;
    const unsubscribe = repo.subscribe(() => {
      changes += 1;
    });
    const next = structuredClone(repo.getSnapshot());
    next.actorId = 'family';
    repo.receiveStorage(JSON.stringify(next));
    expect(repo.getSnapshot().actorId).toBe('patient');
    repo.receiveStorage('{broken');
    expect(repo.getPersistenceError()).toContain('invalid');
    expect(changes).toBe(2);
    unsubscribe();
    repo.setActor('patient');
    expect(changes).toBe(2);
  });
  it('rejects PDF without claiming extraction and restricts uploads to the clinician', async () => {
    const fake = { name: 'instructions.pdf', type: 'application/pdf', size: 10 } as File;
    await expect(repo.uploadDocument('recovery', fake)).rejects.toThrow(/clinician/);
    repo.setActor('doctor');
    await expect(repo.uploadDocument('recovery', fake)).rejects.toThrow(/PDF and Word/);
    const file = {
      name: 'demo.txt',
      type: 'text/plain',
      size: 10,
      arrayBuffer: async () => new TextEncoder().encode('Fictional source text').buffer,
    } as File;
    const document = await repo.uploadDocument('recovery', file);
    expect(document.text).toBe('Fictional source text');
    expect(repo.getSnapshot().plans[0].version).toBe(1);
  });
});

describe('PR review regressions', () => {
  it('keeps roles separate across tabs while sharing care changes and restoring each session', () => {
    const shared = memoryStorage();
    const doctorSession = memoryStorage();
    const patientSession = memoryStorage();
    const doctor = createDemoRepository(shared, doctorSession);
    const patient = createDemoRepository(shared, patientSession);
    doctor.setActor('doctor');
    expect(doctorSession.getItem(DEMO_ACTOR_KEY)).toBe('doctor');
    expect(shared.getItem(DEMO_STORAGE_KEY)).toBeNull();
    doctor.changeGrant('recovery', 'Support', 'family');
    patient.receiveStorage(shared.getItem(DEMO_STORAGE_KEY));
    expect(patient.getSnapshot().actorId).toBe('patient');
    expect(patient.getSnapshot().grants[0].level).toBe('Support');
    patient.changeGrant('recovery', 'Basic', 'family');
    doctor.receiveStorage(shared.getItem(DEMO_STORAGE_KEY));
    expect(doctor.getSnapshot().actorId).toBe('doctor');
    expect(doctor.getSnapshot().grants[0].level).toBe('Basic');
    expect(createDemoRepository(shared, doctorSession).getSnapshot().actorId).toBe('doctor');
    expect(createDemoRepository(shared, patientSession).getSnapshot().actorId).toBe('patient');
  });
  it('changes only the selected family grant when two family members share a space', () => {
    const seed = structuredClone(repo.getSnapshot());
    seed.users.push({ id: 'family-2', name: 'Taylor Morgan', role: 'family', initials: 'TM' });
    seed.spaces[0].memberIds.push('family-2');
    seed.grants.push({
      id: 'second-grant',
      spaceId: 'recovery',
      familyId: 'family-2',
      level: 'Basic',
    });
    repo.receiveStorage(JSON.stringify(seed));
    repo.changeGrant('recovery', 'Support', 'family-2');
    expect(
      repo.getSnapshot().grants.find((g) => g.familyId === 'family' && g.spaceId === 'recovery')
        ?.level,
    ).toBe('Full');
    expect(repo.getSnapshot().grants.find((g) => g.id === 'second-grant')?.level).toBe('Support');
    expect(repo.getSnapshot().audit[0].familyId).toBe('family-2');
    expect(() => repo.changeGrant('recovery', 'Full', 'missing-family')).toThrow(/invitation/);
  });
  it('creates unique demo request IDs when secure-context randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', undefined);
    try {
      const first = uid();
      expect(first).toMatch(/^demo-/);
      expect(uid()).not.toBe(first);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
