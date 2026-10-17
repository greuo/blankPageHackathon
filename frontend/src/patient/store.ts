import { parseState, seed, type PatientState } from './model';
export const PATIENT_KEY = 'discharge-patient-only-v1';
// Each signed-in account keeps its local demo data under its own key (`PATIENT_KEY:<user id>`), so
// signing in as someone else on the same browser never shows or uploads the previous account's data.
// Before anyone signs in, and in tests, the plain PATIENT_KEY is used.
let storageKey = PATIENT_KEY;
let ownerName = '';
let current: PatientState = seed();
let failure = '';
function load() {
  try {
    const saved = localStorage.getItem(storageKey);
    current = saved ? parseState(saved) : seed(new Date(), ownerName);
    failure = '';
  } catch (e) {
    current = seed(new Date(), ownerName);
    failure = e instanceof Error ? e.message : 'Browser storage is unavailable.';
  }
}
load();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
export const patientStore = {
  getSnapshot: () => current,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  error: () => failure,
  /** Switch to an account's own data (`null`: nobody signed in). `name` personalizes a fresh seed. */
  setOwner: (owner: string | null, name = '') => {
    const key = owner ? `${PATIENT_KEY}:${owner}` : PATIENT_KEY;
    if (key === storageKey) return;
    storageKey = key;
    ownerName = owner ? name : '';
    load();
    notify();
  },
  update: (change: (draft: PatientState) => void) => {
    if (failure)
      throw new Error(
        `${failure} Reset the fictional demo or restore browser storage before saving.`,
      );
    const next = structuredClone(current);
    change(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    current = next;
    notify();
  },
  reset: () => {
    const next = seed(new Date(), ownerName);
    localStorage.setItem(storageKey, JSON.stringify(next));
    current = next;
    failure = '';
    notify();
  },
};
window.addEventListener('storage', (e) => {
  if (e.key !== storageKey && e.key !== null) return;
  try {
    current = e.newValue ? parseState(e.newValue) : seed(new Date(), ownerName);
    failure = '';
  } catch (error) {
    failure = error instanceof Error ? error.message : 'Saved demo could not be read.';
    current = structuredClone(current);
  }
  notify();
});
