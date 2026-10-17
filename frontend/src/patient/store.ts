import { parseState, seed, type PatientState } from './model';
export const PATIENT_KEY = 'discharge-patient-only-v1';
let current: PatientState;
let failure = '';
try {
  const saved = localStorage.getItem(PATIENT_KEY);
  current = saved ? parseState(saved) : seed();
} catch (e) {
  current = seed();
  failure = e instanceof Error ? e.message : 'Browser storage is unavailable.';
}
const listeners = new Set<() => void>();
export const patientStore = {
  getSnapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  error: () => failure,
  update: (change: (draft: PatientState) => void) => {
    if (failure)
      throw new Error(
        `${failure} Reset the fictional demo or restore browser storage before saving.`,
      );
    const next = structuredClone(current);
    change(next);
    localStorage.setItem(PATIENT_KEY, JSON.stringify(next));
    current = next;
    listeners.forEach((listener) => listener());
  },
  reset: () => {
    const next = seed();
    localStorage.setItem(PATIENT_KEY, JSON.stringify(next));
    current = next;
    failure = '';
    listeners.forEach((listener) => listener());
  },
};
window.addEventListener('storage', (e) => {
  if (e.key !== PATIENT_KEY && e.key !== null) return;
  try {
    current = e.newValue ? parseState(e.newValue) : seed();
    failure = '';
  } catch (error) {
    failure = error instanceof Error ? error.message : 'Saved demo could not be read.';
    current = structuredClone(current);
  }
  listeners.forEach((listener) => listener());
});
