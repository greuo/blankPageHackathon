import type {
  AccessLevel,
  Conversation,
  Document,
  Instruction,
  Plan,
  Space,
  Store,
  User,
} from './types';
export type * from './types';

/** DEMO ONLY: all records are fictional and readable through browser storage/devtools.
 * Operation checks model desired behavior; they are NOT authentication or server security.
 * A real integration must authorize database, document and realtime access server-side.
 */
export const DEMO_STORAGE_KEY = 'discharge-companion:fictional-demo:v1';
export const DEMO_ACTOR_KEY = 'discharge-companion:demo-actor:v1';
const isoNow = (): string => new Date().toISOString();
export const uid = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const localDate = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateAt = (days: number, hour = 9): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const text = (value: string, label: string, max = 8000): string => {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error(`${label} is required (maximum ${max} characters).`);
  return value.trim();
};
const validDate = (value: string): boolean =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}

export function createSeed(): Store {
  const contexts: {
    id: string;
    name: string;
    category: string;
    tone: Space['tone'];
    instruction: string;
  }[] = [
    {
      id: 'recovery',
      name: 'Everyday recovery',
      category: 'Recovery',
      tone: 'mint',
      instruction: 'Record how you are feeling in your recovery journal.',
    },
    {
      id: 'medication',
      name: 'Medication notes',
      category: 'Medication',
      tone: 'blue',
      instruction: 'Review the medication schedule in your clinician-provided discharge document.',
    },
    {
      id: 'movement',
      name: 'Moving forward',
      category: 'Movement',
      tone: 'peach',
      instruction: 'Review your clinician-provided movement instructions before planning activity.',
    },
    {
      id: 'nutrition',
      name: 'Food & wellbeing',
      category: 'Wellbeing',
      tone: 'lavender',
      instruction: 'Record any questions about meals for your care team.',
    },
    {
      id: 'followup',
      name: 'Your next visit',
      category: 'Follow-up',
      tone: 'yellow',
      instruction: 'Bring your recovery questions to your fictional follow-up visit.',
    },
  ];
  const users: User[] = [
    { id: 'doctor', name: 'Dr. Maya Chen', role: 'doctor', initials: 'MC' },
    { id: 'patient', name: 'Jamie Morgan', role: 'patient', initials: 'JM' },
    { id: 'family', name: 'Alex Morgan', role: 'family', initials: 'AM' },
  ];
  const spaces: Space[] = contexts.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    description: `Jamie Morgan’s fictional ${c.category.toLowerCase()} space`,
    patientId: 'patient',
    memberIds: users.map((u) => u.id),
    updatedAt: isoNow(),
    tone: c.tone,
  }));
  const conversations: Conversation[] = spaces.flatMap((s) => [
    {
      id: `${s.id}-ai`,
      spaceId: s.id,
      title: 'Recovery companion',
      kind: 'ai' as const,
      participantIds: ['patient'],
    },
    {
      id: `${s.id}-care`,
      spaceId: s.id,
      title: 'Care circle',
      kind: 'group' as const,
      participantIds: ['doctor', 'patient', 'family'],
    },
    {
      id: `${s.id}-doctor`,
      spaceId: s.id,
      title: 'Jamie & Dr. Chen',
      kind: 'direct' as const,
      participantIds: ['doctor', 'patient'],
    },
    {
      id: `${s.id}-family`,
      spaceId: s.id,
      title: 'Jamie & Alex',
      kind: 'direct' as const,
      participantIds: ['patient', 'family'],
    },
  ]);
  const plans: Plan[] = contexts.map((c) => ({
    id: `${c.id}-plan-1`,
    spaceId: c.id,
    title: `${c.category} companion`,
    version: 1,
    status: 'approved',
    approvedAt: isoNow(),
    approvedBy: 'doctor',
    instructions: [
      {
        id: `${c.id}-instruction-1`,
        kind: c.id === 'followup' ? 'appointment' : 'action',
        text: c.instruction,
        sourceLabel: 'Fictional demonstration instructions · Dr. Maya Chen',
        sourcePassage: c.instruction,
        dueAt: dateAt(c.id === 'followup' ? 2 : 0),
        recurrence: c.id === 'followup' ? 'once' : 'daily',
        endsAt: dateAt(7, 23),
      },
    ],
  }));
  plans[0].instructions.push({
    id: 'recovery-restriction',
    kind: 'restriction',
    text: 'Keep clinician-restricted activities on hold until your listed review date.',
    sourceLabel: 'Fictional demonstration instructions · Dr. Maya Chen',
    sourcePassage: 'Keep clinician-restricted activities on hold until your listed review date.',
    dueAt: dateAt(-1),
    endsAt: dateAt(3, 17),
    recurrence: 'daily',
  });
  return {
    actorId: 'patient',
    users,
    spaces,
    conversations,
    messages: [
      {
        id: 'welcome-care',
        conversationId: 'recovery-care',
        authorId: 'doctor',
        body: 'Welcome, Jamie. This is our fictional demo care circle. Your approved instructions live in the care plan.',
        createdAt: isoNow(),
      },
    ],
    plans,
    reports: [],
    documents: [],
    grants: spaces.map((s) => ({
      id: `${s.id}-grant`,
      spaceId: s.id,
      familyId: 'family',
      level: 'Full',
    })),
    audit: [],
    handoffs: [],
  };
}

export function getActor(state: Store): User {
  const actor = state.users.find((u) => u.id === state.actorId);
  if (!actor) throw new Error('Choose a valid demo role.');
  return actor;
}
function familyLevel(state: Store, spaceId: string): AccessLevel | undefined {
  return state.grants.find((g) => g.spaceId === spaceId && g.familyId === state.actorId)?.level;
}
function canAccessSpace(state: Store, space: Space): boolean {
  const actor = getActor(state);
  const grant = familyLevel(state, space.id);
  return (
    space.memberIds.includes(actor.id) &&
    (actor.role !== 'family' || (grant !== undefined && grant !== 'revoked'))
  );
}
export const getVisibleSpaces = (state: Store): Space[] =>
  state.spaces
    .filter((s) => canAccessSpace(state, s))
    .map((space, index) =>
      getActor(state).role === 'family' && familyLevel(state, space.id) !== 'Full'
        ? {
            ...space,
            name: `Shared recovery space ${index + 1}`,
            description: 'Shared updates and conversations you have joined.',
            category: 'Shared updates',
          }
        : space,
    );
export function canViewPlan(state: Store, spaceId: string): boolean {
  return (
    getVisibleSpaces(state).some((s) => s.id === spaceId) &&
    (getActor(state).role !== 'family' || familyLevel(state, spaceId) === 'Full')
  );
}
export const canViewDocuments = canViewPlan;
export function canViewChecklist(state: Store, spaceId: string): boolean {
  return (
    getVisibleSpaces(state).some((s) => s.id === spaceId) &&
    (getActor(state).role !== 'family' ||
      ['Support', 'Full'].includes(familyLevel(state, spaceId) ?? ''))
  );
}
export function getVisibleConversations(state: Store, spaceId: string): Conversation[] {
  if (!getVisibleSpaces(state).some((s) => s.id === spaceId)) return [];
  return state.conversations.filter(
    (c) => c.spaceId === spaceId && c.participantIds.includes(state.actorId),
  );
}
export function getVisibleMessages(state: Store, conversationId: string) {
  const conversation = state.conversations.find((c) => c.id === conversationId);
  return conversation &&
    getVisibleConversations(state, conversation.spaceId).some((c) => c.id === conversationId)
    ? state.messages.filter((m) => m.conversationId === conversationId)
    : [];
}
export function getVisibleHandoffs(state: Store, spaceId: string) {
  return getVisibleSpaces(state).some((s) => s.id === spaceId)
    ? state.handoffs.filter(
        (h) =>
          h.spaceId === spaceId && (h.patientId === state.actorId || h.doctorId === state.actorId),
      )
    : [];
}
export function getVisibleDocuments(state: Store, spaceId: string): Document[] {
  return canViewDocuments(state, spaceId)
    ? state.documents.filter((d) => d.spaceId === spaceId)
    : [];
}
const approvedPlan = (state: Store, spaceId: string): Plan | undefined =>
  state.plans
    .filter((p) => p.spaceId === spaceId && p.status === 'approved')
    .sort((a, b) => b.version - a.version)[0];
function approvedPlanOnDate(state: Store, spaceId: string, date: string): Plan | undefined {
  // Calendar arithmetic preserves the user's local date even across DST changes.
  // A publication affects its local day and future days, never historical days.
  const nextDay = new Date(`${date}T00:00:00`);
  nextDay.setDate(nextDay.getDate() + 1);
  const cutoff = nextDay.getTime();
  return state.plans
    .filter(
      (p) =>
        p.spaceId === spaceId &&
        p.status === 'approved' &&
        p.approvedAt &&
        validDate(p.approvedAt) &&
        Date.parse(p.approvedAt) < cutoff,
    )
    .sort((a, b) => b.version - a.version)[0];
}
export function getActivePlan(state: Store, spaceId: string): Plan | undefined {
  return canViewPlan(state, spaceId) ? approvedPlan(state, spaceId) : undefined;
}
export interface ChecklistOccurrence {
  space: Space;
  instruction: Instruction;
  date: string;
}
export function getChecklistOccurrences(
  state: Store,
  date: string = localDate(),
): ChecklistOccurrence[] {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !validDate(`${date}T12:00:00`) ||
    localDate(new Date(`${date}T12:00:00`)) !== date
  )
    return [];
  return getVisibleSpaces(state)
    .filter((space) => canViewChecklist(state, space.id))
    .flatMap((space) =>
      (approvedPlanOnDate(state, space.id, date)?.instructions ?? [])
        .filter((i) => {
          const due = new Date(i.dueAt);
          const start = due.getTime();
          const end = i.endsAt ? new Date(i.endsAt).getTime() : Infinity;
          const dayStart = new Date(`${date}T00:00:00`);
          if (i.kind === 'restriction') {
            const nextDay = new Date(dayStart);
            nextDay.setDate(nextDay.getDate() + 1);
            return start < nextDay.getTime() && end >= dayStart.getTime();
          }
          if (i.recurrence === 'once') return localDate(due) === date && start <= end;
          // Recreate the due wall-clock time on this local calendar day rather
          // than adding 24 hours, which would shift times at DST boundaries.
          const occurrence = new Date(dayStart);
          occurrence.setHours(
            due.getHours(),
            due.getMinutes(),
            due.getSeconds(),
            due.getMilliseconds(),
          );
          return occurrence.getTime() >= start && occurrence.getTime() <= end;
        })
        .map((instruction) => ({ space, instruction, date })),
    );
}

/** Validate stored records before adopting them. Browser-local data remains user-editable. */
function parseStore(raw: string): Store {
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object') throw new Error('Invalid demo snapshot.');
  const v = value as Record<string, unknown>;
  const arrays = [
    'users',
    'spaces',
    'conversations',
    'messages',
    'plans',
    'reports',
    'documents',
    'grants',
    'audit',
    'handoffs',
  ] as const;
  if (typeof v.actorId !== 'string' || arrays.some((k) => !Array.isArray(v[k])))
    throw new Error('Invalid demo snapshot.');
  const records = arrays.flatMap((k) => v[k] as unknown[]);
  if (
    records.some(
      (r) => !r || typeof r !== 'object' || typeof (r as { id?: unknown }).id !== 'string',
    )
  )
    throw new Error('Invalid demo record.');
  const fields = {
    users: ['name', 'role', 'initials'],
    spaces: ['name', 'description', 'category', 'patientId', 'updatedAt', 'tone'],
    conversations: ['spaceId', 'title', 'kind'],
    messages: ['conversationId', 'authorId', 'body', 'createdAt'],
    plans: ['spaceId', 'title', 'status'],
    reports: ['spaceId', 'instructionId', 'date', 'authorId', 'reportedAt'],
    documents: ['spaceId', 'name', 'mime', 'text', 'createdAt'],
    grants: ['spaceId', 'familyId', 'level'],
    audit: ['spaceId', 'actorId', 'previousLevel', 'newLevel', 'createdAt'],
    handoffs: ['spaceId', 'patientId', 'doctorId', 'summary', 'status', 'createdAt'],
  };
  for (const key of arrays) {
    const rows = v[key] as Record<string, unknown>[];
    if (
      new Set(rows.map((r) => r.id)).size !== rows.length ||
      rows.some((row) => fields[key].some((field) => typeof row[field] !== 'string'))
    )
      throw new Error('Invalid demo fields.');
  }
  // Validate shape before the cast; operation-level checks still validate each mutation.
  const state = value as Store;
  if (
    !state.users.some((u) => u.id === state.actorId) ||
    state.users.some((u) => !['doctor', 'patient', 'family'].includes(u.role)) ||
    state.spaces.some(
      (s) => !Array.isArray(s.memberIds) || s.memberIds.some((id) => typeof id !== 'string'),
    ) ||
    state.conversations.some(
      (c) =>
        !Array.isArray(c.participantIds) ||
        c.participantIds.some((id) => typeof id !== 'string') ||
        !['ai', 'direct', 'group'].includes(c.kind),
    ) ||
    state.plans.some(
      (p) =>
        !Number.isInteger(p.version) ||
        !['draft', 'approved'].includes(p.status) ||
        !Array.isArray(p.instructions) ||
        p.instructions.some(
          (i) =>
            !i ||
            typeof i.text !== 'string' ||
            typeof i.sourceLabel !== 'string' ||
            typeof i.sourcePassage !== 'string' ||
            typeof i.id !== 'string' ||
            !validDate(i.dueAt) ||
            (i.endsAt !== undefined && !validDate(i.endsAt)) ||
            !['daily', 'once'].includes(i.recurrence) ||
            !['action', 'restriction', 'appointment'].includes(i.kind),
        ),
    ) ||
    state.grants.some((g) => !['Full', 'Basic', 'Support', 'revoked'].includes(g.level)) ||
    state.handoffs.some((h) => !['sent', 'acknowledged'].includes(h.status))
  )
    throw new Error('Invalid demo relationships.');
  return state;
}

export function createDemoRepository(
  storage: Storage | null = null,
  actorStorage: Storage | null = null,
) {
  let state = deepFreeze(createSeed());
  let persistenceError: string | null = null;
  const listeners = new Set<() => void>();
  const emit = (): void => {
    listeners.forEach((listener) => listener());
  };
  try {
    const saved = storage?.getItem(DEMO_STORAGE_KEY);
    const loaded = saved ? parseStore(saved) : state;
    const savedActor = actorStorage?.getItem(DEMO_ACTOR_KEY);
    const actorId =
      savedActor && loaded.users.some((user) => user.id === savedActor)
        ? savedActor
        : createSeed().actorId;
    state = deepFreeze({ ...loaded, actorId });
  } catch {
    persistenceError = 'Saved demo data could not be loaded. Reset the demo to recover.';
  }
  const commit = (next: Store): void => {
    if (storage) {
      try {
        storage.setItem(
          DEMO_STORAGE_KEY,
          JSON.stringify({ ...next, actorId: createSeed().actorId }),
        );
      } catch {
        persistenceError =
          'Your browser could not save this change. Check storage permissions or available space, then retry.';
        emit();
        throw new Error(persistenceError);
      }
    }
    state = deepFreeze(next);
    persistenceError = null;
    emit();
  };
  const copy = (): Store => structuredClone(state);
  const requireSpace = (id: string): Space => {
    const space = state.spaces.find((s) => s.id === id);
    if (!space || !canAccessSpace(state, space))
      throw new Error('This demo role does not have access to that care space.');
    return space;
  };
  const requireDoctor = (spaceId: string): void => {
    requireSpace(spaceId);
    if (getActor(state).role !== 'doctor')
      throw new Error('Only the clinician can edit and approve clinical instructions.');
  };
  const requireConversation = (id: string): Conversation => {
    const c = state.conversations.find((c) => c.id === id);
    if (!c || !getVisibleConversations(state, c.spaceId).some((v) => v.id === id))
      throw new Error('This conversation is private to its current participants.');
    return c;
  };
  return {
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot(): Store {
      return state;
    },
    getPersistenceError(): string | null {
      return persistenceError;
    },
    receiveStorage(raw: string | null): void {
      try {
        const loaded = raw ? parseStore(raw) : createSeed();
        const actorId = loaded.users.some((user) => user.id === state.actorId)
          ? state.actorId
          : createSeed().actorId;
        state = deepFreeze({ ...loaded, actorId });
        persistenceError = null;
      } catch {
        persistenceError = 'Another tab saved invalid demo data. Reset the demo to recover.';
      }
      emit();
    },
    setActor(id: string): void {
      if (!state.users.some((u) => u.id === id)) throw new Error('Unknown demo role.');
      try {
        actorStorage?.setItem(DEMO_ACTOR_KEY, id);
      } catch {
        persistenceError =
          'Your browser could not save this tab’s demo role. Check session storage permissions and retry.';
        emit();
        throw new Error(persistenceError);
      }
      state = deepFreeze({ ...state, actorId: id });
      persistenceError = null;
      emit();
    },
    resetDemo(): void {
      commit({ ...createSeed(), actorId: state.actorId });
    },
    async createSpace(input: {
      name: string;
      description: string;
      category: string;
    }): Promise<Space> {
      if (getActor(state).role !== 'doctor')
        throw new Error('Only the clinician can create care spaces.');
      const patient = state.users.find((u) => u.role === 'patient');
      const family = state.users.find((u) => u.role === 'family');
      if (!patient || !family) throw new Error('Demo participants are missing. Reset the demo.');
      const space: Space = {
        id: uid(),
        name: text(input.name, 'Space name', 80),
        description: text(input.description, 'Description', 500),
        category: text(input.category, 'Category', 60),
        patientId: patient.id,
        memberIds: [state.actorId, patient.id, family.id],
        updatedAt: isoNow(),
        tone: 'mint',
      };
      const next = copy();
      next.spaces.push(space);
      next.grants.push({ id: uid(), spaceId: space.id, familyId: family.id, level: 'revoked' });
      next.conversations.push(
        {
          id: `${space.id}-ai`,
          spaceId: space.id,
          title: 'Recovery companion',
          kind: 'ai',
          participantIds: [patient.id],
        },
        {
          id: `${space.id}-care`,
          spaceId: space.id,
          title: 'Care circle',
          kind: 'group',
          participantIds: [state.actorId, patient.id],
        },
      );
      commit(next);
      return space;
    },
    createConversation(input: {
      spaceId: string;
      title: string;
      kind: Conversation['kind'];
      participantIds: string[];
    }): Conversation {
      const space = requireSpace(input.spaceId);
      const ids = [...new Set(input.participantIds)];
      if (
        !ids.includes(state.actorId) ||
        ids.some((id) => !space.memberIds.includes(id) || !state.users.some((u) => u.id === id))
      )
        throw new Error('Select current care-space members, including yourself.');
      if (
        ids.some(
          (id) =>
            state.users.find((u) => u.id === id)?.role === 'family' &&
            !state.grants.some(
              (g) => g.spaceId === space.id && g.familyId === id && g.level !== 'revoked',
            ),
        )
      )
        throw new Error('Family access is currently revoked.');
      if (input.kind === 'ai' && (ids.length !== 1 || getActor(state).role !== 'patient'))
        throw new Error('The demo AI conversation belongs to the patient only.');
      if (input.kind === 'direct' && ids.length !== 2)
        throw new Error('A private conversation needs exactly two participants.');
      if (input.kind === 'group' && ids.length < 2)
        throw new Error('Select at least two group participants.');
      if (!['ai', 'direct', 'group'].includes(input.kind))
        throw new Error('Select a valid conversation type.');
      const conversation: Conversation = {
        id: uid(),
        ...input,
        title: text(input.title, 'Conversation title', 80),
        participantIds: ids,
      };
      const next = copy();
      next.conversations.push(conversation);
      commit(next);
      return conversation;
    },
    sendMessage(input: { id: string; conversationId: string; body: string }): void {
      const conversation = requireConversation(input.conversationId);
      const body = text(input.body, 'Message', 8000);
      text(input.id, 'Message ID', 100);
      const existing = state.messages.find((m) => m.id === input.id);
      if (existing) {
        if (
          existing.authorId === state.actorId &&
          existing.conversationId === conversation.id &&
          existing.body === body
        )
          return;
        throw new Error('Message ID is already in use.');
      }
      const next = copy();
      next.messages.push({ ...input, body, authorId: state.actorId, createdAt: isoNow() });
      if (conversation.kind === 'ai') {
        const tokens =
          body
            .toLowerCase()
            .match(/[a-z]{4,}/g)
            ?.filter(
              (t) =>
                ![
                  'what',
                  'when',
                  'does',
                  'have',
                  'this',
                  'that',
                  'with',
                  'from',
                  'your',
                  'about',
                  'should',
                  'could',
                  'please',
                ].includes(t),
            ) ?? [];
        const instructions = getActivePlan(state, conversation.spaceId)?.instructions ?? [];
        const match = instructions.find((i) =>
          tokens.some((t) => i.text.toLowerCase().includes(t)),
        );
        next.messages.push({
          id: `${input.id}-reply`,
          conversationId: conversation.id,
          authorId: 'companion',
          body: match
            ? `Approved-plan excerpt (fictional demo): “${match.text}”\nSource: ${match.sourceLabel}. This is a matching excerpt, not an interpretation of your question.`
            : 'Your approved plan does not cover this question. This local demo cannot provide clinical advice. You can prepare a message for Dr. Maya Chen using Contact care team.',
          createdAt: isoNow(),
          ...(match ? { sourceInstructionId: match.id } : { needsHandoff: true }),
        });
      }
      commit(next);
    },
    saveDraft(plan: Plan): void {
      requireDoctor(plan.spaceId);
      text(plan.id, 'Plan ID', 100);
      text(plan.title, 'Plan title', 150);
      if (plan.status !== 'draft')
        throw new Error('Save a draft before requesting clinician approval.');
      const old = state.plans.find((p) => p.id === plan.id);
      if (old && (old.status === 'approved' || old.spaceId !== plan.spaceId))
        throw new Error('Approved versions are immutable. Create a new draft version.');
      const maxApproved = Math.max(
        0,
        ...state.plans
          .filter((p) => p.spaceId === plan.spaceId && p.status === 'approved')
          .map((p) => p.version),
      );
      if (!Number.isInteger(plan.version) || plan.version <= maxApproved)
        throw new Error('A new draft needs a version higher than the published plan.');
      if (!plan.instructions.length) throw new Error('Add at least one sourced instruction.');
      if (new Set(plan.instructions.map((i) => i.id)).size !== plan.instructions.length)
        throw new Error('Each instruction needs a unique ID.');
      plan.instructions.forEach((i) => {
        text(i.id, 'Instruction ID', 100);
        text(i.text, 'Instruction');
        text(i.sourceLabel, 'Source label', 300);
        text(i.sourcePassage, 'Source passage');
        if (
          !['action', 'restriction', 'appointment'].includes(i.kind) ||
          !['daily', 'once'].includes(i.recurrence) ||
          !validDate(i.dueAt) ||
          (i.endsAt && (!validDate(i.endsAt) || Date.parse(i.endsAt) <= Date.parse(i.dueAt))) ||
          (i.kind === 'restriction' && !i.endsAt)
        )
          throw new Error('Check instruction type, timing, recurrence and restriction end date.');
      });
      const next = copy();
      const draft: Plan = {
        ...structuredClone(plan),
        approvedAt: undefined,
        approvedBy: undefined,
      };
      // A changed order is a new occurrence identity, so an old completion cannot
      // silently mark a revised instruction complete. Old approved plans stay intact.
      const previous = approvedPlan(state, plan.spaceId);
      draft.instructions = draft.instructions.map((instruction) => {
        const original = previous?.instructions.find((i) => i.id === instruction.id);
        if (!original || JSON.stringify(original) === JSON.stringify(instruction))
          return instruction;
        const priorDraft = old?.instructions.find(
          (i) =>
            i.id !== original.id &&
            i.text === instruction.text &&
            i.kind === instruction.kind &&
            i.dueAt === instruction.dueAt &&
            i.endsAt === instruction.endsAt &&
            i.recurrence === instruction.recurrence &&
            i.sourceLabel === instruction.sourceLabel &&
            i.sourcePassage === instruction.sourcePassage,
        );
        return { ...instruction, id: priorDraft?.id ?? uid() };
      });
      next.plans = [...next.plans.filter((p) => p.id !== plan.id), draft];
      commit(next);
    },
    publishPlan(planId: string): void {
      const plan = state.plans.find((p) => p.id === planId);
      if (!plan) throw new Error('Plan draft not found.');
      requireDoctor(plan.spaceId);
      if (plan.status !== 'draft') throw new Error('This plan is already approved.');
      const current = getActivePlan(state, plan.spaceId);
      if (current && plan.version <= current.version)
        throw new Error('A newer plan was published. Review and update this draft version.');
      const next = copy();
      next.plans = next.plans.map((p) =>
        p.id === planId
          ? { ...p, status: 'approved', approvedAt: isoNow(), approvedBy: state.actorId }
          : p,
      );
      commit(next);
    },
    report(input: { id: string; spaceId: string; instructionId: string; date: string }): void {
      requireSpace(input.spaceId);
      if (getActor(state).role === 'doctor')
        throw new Error('The patient or authorized family member can report an action.');
      text(input.id, 'Report ID', 100);
      const duplicate = state.reports.find((r) => r.id === input.id);
      if (duplicate) {
        if (
          duplicate.spaceId === input.spaceId &&
          duplicate.instructionId === input.instructionId &&
          duplicate.date === input.date &&
          duplicate.authorId === state.actorId
        )
          return;
        throw new Error('Report ID is already in use.');
      }
      const occurrence = getChecklistOccurrences(state, input.date).find(
        (o) => o.space.id === input.spaceId && o.instruction.id === input.instructionId,
      );
      if (!occurrence || occurrence.instruction.kind !== 'action')
        throw new Error('Only approved actions scheduled on this date can be reported.');
      if (input.date > localDate()) throw new Error('Future actions cannot be reported early.');
      if (
        state.reports.some(
          (r) =>
            r.spaceId === input.spaceId &&
            r.instructionId === input.instructionId &&
            r.date === input.date &&
            !r.undoneAt,
        )
      )
        return;
      const next = copy();
      next.reports.push({ ...input, authorId: state.actorId, reportedAt: isoNow() });
      commit(next);
    },
    undoReport(reportId: string): void {
      const report = state.reports.find((r) => r.id === reportId);
      if (!report) throw new Error('Report not found.');
      requireSpace(report.spaceId);
      if (report.authorId !== state.actorId)
        throw new Error('Only the person who submitted this report can correct it.');
      if (report.undoneAt) return;
      const next = copy();
      next.reports = next.reports.map((r) =>
        r.id === reportId ? { ...r, undoneAt: isoNow() } : r,
      );
      commit(next);
    },
    async uploadDocument(spaceId: string, file: File): Promise<Document> {
      requireDoctor(spaceId);
      const actorId = state.actorId;
      if (
        file.type !== 'text/plain' ||
        !file.name.toLowerCase().endsWith('.txt') ||
        file.size > 1024 * 1024 ||
        file.size === 0
      )
        throw new Error(
          'Upload a nonempty UTF-8 .txt file (text/plain), up to 1 MiB. PDF and Word extraction are not supported.',
        );
      let contents: string;
      try {
        contents = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      } catch {
        throw new Error(
          'This file could not be read as UTF-8 text. Your existing draft is preserved.',
        );
      }
      if (state.actorId !== actorId)
        throw new Error('The demo role changed during upload. Please retry.');
      requireDoctor(spaceId);
      const document: Document = {
        id: uid(),
        spaceId,
        name: file.name,
        size: file.size,
        mime: file.type,
        text: contents,
        createdAt: isoNow(),
      };
      const next = copy();
      next.documents.push(document);
      commit(next);
      return document;
    },
    changeGrant(spaceId: string, level: AccessLevel, familyId: string): void {
      const space = requireSpace(spaceId);
      const actor = getActor(state);
      if (actor.role !== 'doctor' && actor.id !== space.patientId)
        throw new Error('Only the patient and clinician can manage family access.');
      if (!['Full', 'Basic', 'Support', 'revoked'].includes(level))
        throw new Error('Choose a valid family access level.');
      const grant = state.grants.find((g) => g.spaceId === spaceId && g.familyId === familyId);
      if (!grant) throw new Error('No family invitation exists in this space.');
      if (grant.level === level) return;
      const next = copy();
      next.grants = next.grants.map((g) => (g.id === grant.id ? { ...g, level } : g));
      next.audit.push({
        id: uid(),
        spaceId,
        actorId: actor.id,
        familyId,
        previousLevel: grant.level,
        newLevel: level,
        createdAt: isoNow(),
      });
      commit(next);
    },
    sendHandoff(input: { id: string; spaceId: string; summary: string }): void {
      const space = requireSpace(input.spaceId);
      if (getActor(state).role !== 'patient' || state.actorId !== space.patientId)
        throw new Error('Only the patient can approve and send this handoff.');
      const summary = text(input.summary, 'Approved summary', 8000);
      text(input.id, 'Handoff ID', 100);
      const old = state.handoffs.find((h) => h.id === input.id);
      if (old) {
        if (old.spaceId === space.id && old.patientId === state.actorId && old.summary === summary)
          return;
        throw new Error('Handoff ID is already in use.');
      }
      const doctor = state.users.find((u) => u.role === 'doctor' && space.memberIds.includes(u.id));
      if (!doctor) throw new Error('No clinician is assigned to this space.');
      const next = copy();
      next.handoffs.push({
        ...input,
        summary,
        patientId: state.actorId,
        doctorId: doctor.id,
        status: 'sent',
        createdAt: isoNow(),
      });
      commit(next);
    },
    acknowledgeHandoff(id: string): void {
      const handoff = state.handoffs.find((h) => h.id === id);
      if (!handoff) throw new Error('Handoff not found.');
      requireDoctor(handoff.spaceId);
      if (handoff.doctorId !== state.actorId)
        throw new Error('Only the receiving clinician can acknowledge this request.');
      if (handoff.status === 'acknowledged') return;
      const next = copy();
      next.handoffs = next.handoffs.map((h) =>
        h.id === id ? { ...h, status: 'acknowledged' } : h,
      );
      commit(next);
    },
  };
}

let browserStorage: Storage | null = null;
if (typeof window !== 'undefined') {
  try {
    browserStorage = window.localStorage;
  } catch {
    // Keep failed writes visible instead of silently pretending memory-only changes persisted.
    const fail = (): never => {
      throw new Error('Browser storage unavailable.');
    };
    browserStorage = {
      getItem: fail,
      setItem: fail,
      removeItem: fail,
      clear: fail,
      key: fail,
      length: 0,
    };
  }
}
let browserSession: Storage | null = null;
if (typeof window !== 'undefined') {
  try {
    browserSession = window.sessionStorage;
  } catch {
    // A tab can still demonstrate a role in memory when session storage is unavailable.
  }
}
export const repository = createDemoRepository(browserStorage, browserSession);
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key === DEMO_STORAGE_KEY || event.key === null)
      repository.receiveStorage(event.newValue);
  });
