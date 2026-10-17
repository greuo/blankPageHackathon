// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PATIENT_KEY, patientStore } from './store';
beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  patientStore.reset();
});
describe('patient persistence', () => {
  it('rolls back the entire mutation when browser storage fails', () => {
    const before = patientStore.getSnapshot();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full');
    });
    expect(() =>
      patientStore.update((s) => {
        s.doctor = 'Changed';
      }),
    ).toThrow('Storage is full');
    expect(patientStore.getSnapshot()).toBe(before);
  });
  it('keeps patient changes across serialized reload data', () => {
    patientStore.update((s) => {
      s.tasks['2026-10-17'] = ['movement'];
    });
    expect(JSON.parse(localStorage.getItem(PATIENT_KEY)!).tasks['2026-10-17']).toEqual([
      'movement',
    ]);
  });
  it('surfaces corrupt incoming storage while keeping the last readable records', () => {
    const before = patientStore.getSnapshot();
    window.dispatchEvent(new StorageEvent('storage', { key: PATIENT_KEY, newValue: '{}' }));
    expect(patientStore.error()).toContain('invalid');
    expect(patientStore.getSnapshot().patient).toBe(before.patient);
    expect(patientStore.getSnapshot()).not.toBe(before);
    expect(() => patientStore.update(() => {})).toThrow('Reset');
  });
});
