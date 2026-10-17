// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PatientApp from './PatientApp';
import { patientStore } from './store';

let root: Root;
let host: HTMLDivElement;
beforeEach(() => {
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
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const admin = { id: 'admin-1', email: 'admin@demo.example.com', name: 'Admin User' };
const signOutButton = () => host.querySelector<HTMLButtonElement>('button[aria-label^="Sign out"]');

it('greets the signed-in account by first name and has a sign-out control', async () => {
  const onSignOut = vi.fn(async () => {});
  await act(async () => root.render(<PatientApp user={admin} onSignOut={onSignOut} />));
  expect(host.querySelector('h1')?.textContent).toBe('Good afternoon, Admin');
  expect(host.querySelector('.patient-profile')?.textContent).toBe('A');
  expect(signOutButton()?.getAttribute('aria-label')).toBe('Sign out admin@demo.example.com');
  await act(async () => signOutButton()!.click());
  expect(onSignOut).toHaveBeenCalledTimes(1);
});

it('falls back to the email name when the account has no display name', async () => {
  await act(async () =>
    root.render(
      <PatientApp
        user={{ id: 'x', email: 'jordan@demo.example.com', name: '' }}
        onSignOut={async () => {}}
      />,
    ),
  );
  expect(host.querySelector('h1')?.textContent).toBe('Good afternoon, jordan');
  expect(host.querySelector('.patient-profile')?.textContent).toBe('J');
});

it('shows a sign-out failure instead of swallowing it', async () => {
  const onSignOut = vi.fn(async () => {
    throw new Error('Could not sign you out. Try again.');
  });
  await act(async () => root.render(<PatientApp user={admin} onSignOut={onSignOut} />));
  await act(async () => signOutButton()!.click());
  expect(host.querySelector('[role=alert]')?.textContent).toContain('Could not sign you out');
});

it('keeps the prepared demo patient and no sign-out control without an account', async () => {
  await act(async () => root.render(<PatientApp />));
  expect(host.querySelector('h1')?.textContent).toBe('Good afternoon, Alex');
  expect(host.querySelector('.patient-profile')?.textContent).toBe('A');
  expect(signOutButton()).toBeNull();
});
