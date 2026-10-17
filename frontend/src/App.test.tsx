// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';
import { patientStore } from './patient/store';
import { signIn, signOut, watchSession, type AuthUser } from './data/supabase';

// Only the Supabase boundary is replaced: the real gate, login page and patient app run together.
vi.mock('./data/supabase', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./data/supabase')>()),
  watchSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

const admin: AuthUser = { id: 'admin-1', email: 'admin@demo.example.com', name: 'Admin' };
let emit: (user: AuthUser | null) => void;
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
  localStorage.clear();
  patientStore.setOwner(null);
  sessionStorage.setItem('patient-opening-v1', 'seen');
  vi.mocked(watchSession).mockImplementation((onChange) => {
    emit = onChange;
    return () => {};
  });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<App />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  patientStore.setOwner(null);
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const button = (label: string) =>
  Array.from(host.querySelectorAll('button')).find(
    (b) => b.textContent?.includes(label) || b.getAttribute('aria-label')?.startsWith(label),
  );
async function type(id: string, value: string) {
  const input = host.querySelector<HTMLInputElement>(`#${id}`)!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

it('keeps the whole app behind the login page until someone is signed in', async () => {
  await act(async () => emit(null));
  expect(host.querySelector('form.auth-form')).not.toBeNull();
  expect(host.querySelector('.patient-app')).toBeNull();
  expect(button('Sign out')).toBeUndefined();
  expect(host.textContent).not.toContain('Dr. Maya Chen');
});

it('opens the patient app for the account that signs in, with its own name', async () => {
  vi.mocked(signIn).mockImplementation(async () => {
    emit(admin);
  });
  await act(async () => emit(null));
  await type('auth-email', 'admin@demo.example.com');
  await type('auth-password', 'secret');
  await act(async () => host.querySelector<HTMLButtonElement>('button[type=submit]')!.click());
  expect(signIn).toHaveBeenCalledExactlyOnceWith('admin@demo.example.com', 'secret');
  expect(host.querySelector('.patient-app')).not.toBeNull();
  expect(host.querySelector('form.auth-form')).toBeNull();
  expect(host.querySelector('h1')?.textContent).toBe('Good afternoon, Admin');
});

it('signing out goes back to the login page', async () => {
  vi.mocked(signOut).mockImplementation(async () => {
    emit(null);
  });
  await act(async () => emit(admin));
  await act(async () => button('Sign out')!.click());
  expect(signOut).toHaveBeenCalledTimes(1);
  expect(host.querySelector('.patient-app')).toBeNull();
  expect(host.querySelector('form.auth-form')).not.toBeNull();
});
