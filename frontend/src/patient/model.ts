/** Fictional patient-only prototype. No clinical decision-making or remote services. */
export type Attachment = { name: string; type: string; data: string; size: number };
export type CheckIn = {
  date: string;
  pain: number;
  temperature: string;
  feeling: string;
  notes: string;
};
export type ChatMessage = {
  id: string;
  role: 'patient' | 'assistant';
  text: string;
  /** The live bot suggested sending this exchange to the doctor (chat contract). */
  suggestNotifyDoctor?: boolean;
  /** The patient question behind this reply, used by "Send to my doctor". */
  patientText?: string;
};
export type Emergency = {
  id: string;
  at: string;
  trigger: string;
  calledAt?: string;
  demo?: boolean;
};
export interface PatientState {
  version: 1;
  patient: string;
  discharged: string;
  duration: number;
  doctor: string;
  email: string;
  instructions: string;
  attachments: Attachment[];
  tasks: Record<string, string[]>;
  doses: Record<string, string[]>;
  checkIns: CheckIn[];
  acknowledged: string[];
  messages: ChatMessage[];
  emergencies: Emergency[];
  demoHours: number;
}
export const dateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const id = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const milestones = [
  {
    id: 'start',
    day: 1,
    title: 'Settle into your care plan',
    detail: 'Read your discharge instructions and keep them close.',
  },
  {
    id: 'review',
    day: 8,
    title: 'Review your questions',
    detail: 'Gather questions for your next conversation with your doctor.',
  },
  {
    id: 'visit',
    day: 12,
    title: 'Your planned follow-up',
    detail: 'Check your discharge paperwork for the appointment details.',
  },
];
export const dailyTasks = [
  {
    id: 'movement',
    title: 'Daily movement',
    detail: 'Follow your clinician-provided movement instructions.',
    kind: 'task',
  },
  {
    id: 'medication',
    title: 'Prescribed medication',
    detail: 'Record each scheduled dose in your pill tracker.',
    kind: 'dose',
  },
  {
    id: 'checkin',
    title: 'Daily check-in',
    detail: 'A moment to record how you feel today.',
    kind: 'checkin',
  },
];
export const doseSlots = [
  { id: 'morning', label: 'Morning', hour: 9 },
  { id: 'evening', label: 'Evening', hour: 20 },
];
export const precautions = [
  'Follow the activity limits in your discharge instructions.',
  'Keep your follow-up appointment details with your care plan.',
  'Ask your doctor about guidance that is unclear.',
];
export function seed(now = new Date()): PatientState {
  const discharge = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  return {
    version: 1,
    patient: 'Alex Morgan',
    discharged: dateKey(discharge),
    duration: 12,
    doctor: 'Dr. Maya Chen',
    email: 'maya.chen@example.com',
    instructions:
      'Follow your clinician-provided movement instructions.\nReview the medication schedule in your discharge document before taking a dose.\nRecord a daily check-in.\nFollow the activity limits in your discharge instructions.\nKeep your follow-up appointment details with your care plan.',
    attachments: [],
    tasks: {},
    doses: {},
    checkIns: [],
    acknowledged: [],
    messages: [
      {
        id: id(),
        role: 'assistant',
        text: 'Hi Alex. Your daily tasks are ready. I can help you find your instructions, record a check-in, or review your reported progress.',
      },
    ],
    emergencies: [],
    demoHours: 0,
  };
}
export function clock(state: PatientState, actual = new Date()) {
  return new Date(actual.getTime() + state.demoHours * 3600000);
}
export function timeline(state: PatientState, now = clock(state)) {
  const day = Math.max(
    1,
    Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.parse(`${state.discharged}T00:00:00Z`)) /
        86400000,
    ) + 1,
  );
  return { day, percent: Math.min(100, Math.round((day / state.duration) * 100)) };
}
export function isEmergency(text: string) {
  const normal = text.toLowerCase().normalize('NFKC').replace(/[’‘]/g, "'");
  // Conservative literal demo guard, not a clinical triage classifier.
  const affirmative = normal.replace(
    /\b(?:no|not|without|denies|deny|denied|not having|do not have|don't have)\s+(?:(?:any|current|new|ongoing|signs of|symptoms of)\s+)*(?:chest pain|shortness of breath|trouble breathing|difficulty breathing|unconscious|severe bleeding)(?:\s+or\s+(?:chest pain|shortness of breath|trouble breathing|difficulty breathing|severe bleeding))?\b/g,
    '',
  );
  return /\b(can'?t breathe|cannot breathe|can not breathe|chest pain|shortness of breath|trouble breathing|difficulty breathing|unconscious|severe bleeding)\b/.test(
    affirmative,
  );
}
export function doseStatus(
  state: PatientState,
  slot: (typeof doseSlots)[number],
  now = clock(state),
) {
  if (state.doses[dateKey(now)]?.includes(slot.id)) return 'Reported';
  const due = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slot.hour);
  if (now.getTime() > due.getTime() + 2 * 3600000) return 'Not reported';
  return now >= due ? 'Due' : 'Upcoming';
}
export function quietHours(state: PatientState, now = clock(state)) {
  const last = state.checkIns.at(-1)?.date ?? state.discharged;
  return Math.max(0, (now.getTime() - new Date(`${last}T09:00:00`).getTime()) / 3600000);
}
export function validateCheckIn(input: CheckIn) {
  if (
    !Number.isFinite(input.pain) ||
    input.pain < 0 ||
    input.pain > 10 ||
    !Number.isInteger(input.pain)
  )
    throw new Error('Choose a pain level from 0 to 10.');
  if (!['Low', 'Okay', 'Good'].includes(input.feeling))
    throw new Error('Choose how you are feeling.');
  if (
    input.temperature &&
    (!Number.isFinite(Number(input.temperature)) ||
      Number(input.temperature) < 30 ||
      Number(input.temperature) > 45)
  )
    throw new Error('Enter temperature in °C between 30 and 45, or leave it blank.');
}
export function summary(state: PatientState, now = clock(state)) {
  const { day, percent } = timeline(state, now);
  const reports = Object.values(state.doses).reduce((sum, slots) => sum + slots.length, 0);
  const daysReported = Object.values(state.doses).filter((slots) => slots.length).length;
  return `CARE COMPANION · FICTIONAL PROGRESS REPORT\nPatient: ${state.patient}\nDoctor: ${state.doctor}\nPrepared: ${now.toLocaleString()}\n\nTimeline: Day ${day} of ${state.duration} (${percent}% of planned time). This is elapsed time, not a measure of healing.\nMedication: ${reports} dose report${reports === 1 ? '' : 's'} across ${daysReported} day${daysReported === 1 ? '' : 's'}. No dose report confirms ingestion.\nDaily check-ins: ${state.checkIns.length}\nTask reports: ${Object.values(state.tasks).reduce((n, t) => n + t.length, 0)}\n\nCHECK-INS\n${state.checkIns.length ? state.checkIns.map((c) => `${c.date}: pain ${c.pain}/10; temperature ${c.temperature || 'not entered'}${c.temperature ? ' °C' : ''}; feeling ${c.feeling}; notes: ${c.notes || 'none'}`).join('\n') : 'No check-ins recorded.'}\n\nDOSE REPORTS\n${
    Object.entries(state.doses)
      .map(([date, slots]) => `${date}: ${slots.join(', ')}`)
      .join('\n') || 'No doses reported.'
  }\n\nEMERGENCY EVENTS\n${state.emergencies.map((e) => `${e.demo ? 'DEMO EXERCISE · ' : ''}${e.at}: ${e.trigger}. ${e.calledAt ? '911 called acknowledged at ' + e.calledAt : 'No call acknowledgment recorded.'} Demo only; no call placed or email sent.`).join('\n') || 'No emergency events recorded.'}\n\nPROVIDED INSTRUCTIONS\n${state.instructions}\n\nSource: patient-reported browser-local demo records. No clinical assessment. No email sent.`;
}
export function reply(state: PatientState, question: string) {
  const { day, percent } = timeline(state);
  if (/progress|how far|summary|report/i.test(question))
    return `You are on day ${day} of your ${state.duration}-day plan (${percent}% of planned time). This describes your timeline. Your report includes ${state.checkIns.length} check-ins and ${Object.values(state.doses).reduce((n, a) => n + a.length, 0)} reported doses. Open Progress report to review the details.`;
  if (/show my provided instructions/i.test(question))
    return `Your provided instructions:\n${state.instructions}\nSource: text added for ${state.doctor}. Clinician identity has not been verified in this demo.`;
  if (/tasks|to.do/i.test(question))
    return dailyTasks.map((task) => `${task.title}: ${task.detail}`).join('\n');
  if (/check.?in|feeling/i.test(question))
    return 'Open Daily check-in to record your pain level, temperature, how you feel, and anything new. I keep the prepared questions and answer scales unchanged.';
  if (/took|taken|complete|done/i.test(question))
    return 'Use the task checkbox or pill tracker to confirm a report. I will only count a dose or task after you confirm it there.';
  if (/who|what can you/i.test(question))
    return 'I am your care companion. I help you find provided instructions and review your reported tasks, doses and check-ins. Your doctor guides treatment. I cannot diagnose, change medication or send messages in this local demo.';
  const words = question.toLowerCase().match(/[a-z]{4,}/g) ?? [];
  const lines = state.instructions
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const line = lines.find((line) =>
    words.some(
      (word) =>
        !['what', 'does', 'about', 'please', 'instructions', 'explain'].includes(word) &&
        line.toLowerCase().includes(word),
    ),
  );
  return line
    ? `Your provided instructions say: “${line}”\nSource: instructions added for ${state.doctor}. These have not been independently verified. Ask your doctor if the wording is unclear.`
    : 'I do not have a matching answer in your provided instructions. Keep the question for your doctor. I cannot invent guidance or change your treatment.';
}
export function parseState(raw: string): PatientState {
  const s = JSON.parse(raw) as PatientState;
  if (
    s.version !== 1 ||
    typeof s.patient !== 'string' ||
    typeof s.instructions !== 'string' ||
    typeof s.doctor !== 'string' ||
    typeof s.email !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s.discharged) ||
    !Number.isFinite(Date.parse(s.discharged)) ||
    !Number.isFinite(s.duration) ||
    s.duration < 1 ||
    !Number.isFinite(s.demoHours) ||
    s.demoHours < 0 ||
    !Array.isArray(s.messages) ||
    !s.messages.every(
      (m) =>
        typeof m.id === 'string' &&
        ['patient', 'assistant'].includes(m.role) &&
        typeof m.text === 'string' &&
        (m.suggestNotifyDoctor === undefined || typeof m.suggestNotifyDoctor === 'boolean') &&
        (m.patientText === undefined || typeof m.patientText === 'string'),
    ) ||
    !Array.isArray(s.checkIns) ||
    !Array.isArray(s.attachments) ||
    !Array.isArray(s.emergencies) ||
    !Array.isArray(s.acknowledged) ||
    !s.tasks ||
    !s.doses
  )
    throw new Error('Saved demo data is invalid. Reset the fictional demo to start again.');
  for (const values of [...Object.values(s.tasks), ...Object.values(s.doses)])
    if (!Array.isArray(values) || !values.every((v) => typeof v === 'string'))
      throw new Error('Saved report data is invalid.');
  for (const check of s.checkIns) validateCheckIn(check);
  if (
    !s.attachments.every(
      (a) =>
        typeof a.name === 'string' &&
        typeof a.data === 'string' &&
        /^data:(image\/(png|jpeg|webp)|application\/pdf|text\/plain);base64,/.test(a.data),
    )
  )
    throw new Error('Saved attachment data is invalid.');
  if (
    !s.emergencies.every(
      (e) => typeof e.id === 'string' && typeof e.trigger === 'string' && typeof e.at === 'string',
    )
  )
    throw new Error('Saved emergency data is invalid.');
  return s;
}
