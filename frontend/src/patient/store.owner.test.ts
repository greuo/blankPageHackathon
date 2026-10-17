// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATIENT_KEY, patientStore } from './store';
import { seed } from './model';

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  patientStore.setOwner(null);
  patientStore.reset();
});

describe('per-account local demo data', () => {
  it('keeps each account’s edits under its own key and restores them on return', () => {
    patientStore.setOwner('user-a', 'Ada Lovelace');
    patientStore.update((s) => {
      s.instructions = 'A only';
    });
    patientStore.setOwner('user-b', 'Bo Chen');
    expect(patientStore.getSnapshot().instructions).not.toBe('A only');
    patientStore.update((s) => {
      s.instructions = 'B only';
    });
    patientStore.setOwner('user-a', 'Ada Lovelace');
    expect(patientStore.getSnapshot().instructions).toBe('A only');
    expect(localStorage.getItem(`${PATIENT_KEY}:user-a`)).toContain('A only');
    expect(localStorage.getItem(`${PATIENT_KEY}:user-b`)).toContain('B only');
    expect(localStorage.getItem(PATIENT_KEY)).not.toContain('A only');
    expect(localStorage.getItem(PATIENT_KEY)).not.toContain('B only');
  });

  it('seeds a new account with its own name and leaves the plain key alone', () => {
    const before = localStorage.getItem(PATIENT_KEY);
    patientStore.setOwner('user-c', 'Cleo Park');
    const state = patientStore.getSnapshot();
    expect(state.patient).toBe('Cleo Park');
    expect(state.messages[0]?.text).toMatch(/^Hi Cleo\./);
    expect(localStorage.getItem(PATIENT_KEY)).toBe(before);
  });

  it('notifies subscribers when the account changes, and not when it stays the same', () => {
    const listener = vi.fn();
    const stop = patientStore.subscribe(listener);
    patientStore.setOwner('user-d', 'Dee');
    expect(listener).toHaveBeenCalledTimes(1);
    patientStore.setOwner('user-d', 'Dee');
    expect(listener).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reset restores the signed-in account’s personalized seed in its own key', () => {
    patientStore.setOwner('user-e', 'Eli Moss');
    patientStore.update((s) => {
      s.doctor = 'Changed';
    });
    patientStore.reset();
    expect(patientStore.getSnapshot().doctor).toBe(seed().doctor);
    expect(patientStore.getSnapshot().patient).toBe('Eli Moss');
    expect(JSON.parse(localStorage.getItem(`${PATIENT_KEY}:user-e`)!).patient).toBe('Eli Moss');
  });

  it('only reacts to storage events for the active account', () => {
    patientStore.setOwner('user-f', 'Fay');
    const mine = JSON.stringify({ ...seed(new Date(), 'Fay'), doctor: 'Dr. From Another Tab' });
    window.dispatchEvent(
      new StorageEvent('storage', { key: `${PATIENT_KEY}:user-f`, newValue: mine }),
    );
    expect(patientStore.getSnapshot().doctor).toBe('Dr. From Another Tab');
    const other = JSON.stringify({ ...seed(), doctor: 'Dr. Someone Else' });
    window.dispatchEvent(
      new StorageEvent('storage', { key: `${PATIENT_KEY}:user-z`, newValue: other }),
    );
    expect(patientStore.getSnapshot().doctor).toBe('Dr. From Another Tab');
  });

  it('seed() keeps Alex as the default patient', () => {
    expect(seed().patient).toBe('Alex Morgan');
    expect(seed().messages[0]?.text).toMatch(/^Hi Alex\./);
    expect(seed(new Date(), '  ').patient).toBe('Alex Morgan');
  });
});
