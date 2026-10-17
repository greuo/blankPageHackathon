// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PatientApp from './PatientApp';
import { patientStore } from './store';
let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 17, 12));
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  HTMLElement.prototype.scrollIntoView = function () {};
  patientStore.reset();
  sessionStorage.setItem('patient-opening-v1', 'seen');
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<PatientApp />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function click(name: string) {
  const button = Array.from(host.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(name),
  );
  expect(button, `button ${name}`).toBeTruthy();
  await act(async () => button!.click());
}
it('opens emergency help even when event persistence fails', async () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage full');
  });
  await click('Preview emergency');
  const dialog = host.querySelector('dialog[open]');
  expect(dialog?.textContent).toContain('call 911');
  expect(dialog?.querySelector('[role=alert]')?.textContent).toContain('Storage full');
});
it('shows action failure inside the active modal', async () => {
  await click('Prescribed medication');
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Cannot save');
  });
  const report = Array.from(host.querySelectorAll('dialog button')).find(
    (b) => b.textContent === 'Report taken',
  );
  expect(report).toBeTruthy();
  await act(async () => (report as HTMLButtonElement).click());
  expect(host.querySelector('dialog [role=alert]')?.textContent).toContain('Cannot save');
});
