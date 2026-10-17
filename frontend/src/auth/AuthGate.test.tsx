// @vitest-environment jsdom
import { act, useEffect } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import AuthGate from './AuthGate';
import { watchSession, type AuthUser } from '../data/supabase';
import { PATIENT_KEY, patientStore } from '../patient/store';

vi.mock('../data/supabase', () => ({ signIn: vi.fn(), watchSession: vi.fn() }));

const admin: AuthUser = { id: 'admin-1', email: 'admin@demo.example.com', name: 'Admin' };
const alex: AuthUser = { id: 'alex-1', email: 'alex@demo.example.com', name: 'Alex Rivera' };

let root: Root;
let host: HTMLDivElement;
let emit: (user: AuthUser | null) => void;
let unsubscribe: ReturnType<typeof vi.fn>;
let mounts = 0;
function Probe({ user }: { user: AuthUser }) {
  useEffect(() => {
    mounts += 1;
  }, []);
  return (
    <main id="main" tabIndex={-1}>
      <p id="app">App for {user.email}</p>
    </main>
  );
}
const frame = () =>
  act(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
beforeEach(async () => {
  mounts = 0;
  localStorage.clear();
  patientStore.setOwner(null);
  unsubscribe = vi.fn();
  vi.mocked(watchSession).mockImplementation((onChange) => {
    emit = onChange;
    return unsubscribe as unknown as () => void;
  });
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<AuthGate>{(user) => <Probe user={user} />}</AuthGate>));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  patientStore.setOwner(null);
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

it('shows neither the form nor the app until the stored session has been checked', () => {
  expect(host.querySelector('main')?.getAttribute('aria-busy')).toBe('true');
  expect(host.querySelector('[role=status]')?.textContent).toBe('Checking your session…');
  expect(host.querySelector('form')).toBeNull();
  expect(host.querySelector('#app')).toBeNull();
});

it('shows the login page when nobody is signed in and never mounts the app', async () => {
  await act(async () => emit(null));
  expect(host.querySelector('h1')?.textContent).toBe('Welcome back');
  expect(host.querySelector('form')).not.toBeNull();
  expect(host.querySelector('#app')).toBeNull();
  expect(mounts).toBe(0);
});

it('renders the app for the signed-in account and returns to login when the session ends', async () => {
  await act(async () => emit(admin));
  expect(host.querySelector('#app')?.textContent).toBe('App for admin@demo.example.com');
  expect(host.querySelector('form')).toBeNull();
  await act(async () => emit(null));
  expect(host.querySelector('#app')).toBeNull();
  expect(host.querySelector('form')).not.toBeNull();
});

it('starts the app afresh when a different account signs in', async () => {
  await act(async () => emit(admin));
  await act(async () => emit(admin));
  expect(mounts).toBe(1);
  await act(async () => emit(alex));
  expect(mounts).toBe(2);
  expect(host.querySelector('#app')?.textContent).toBe('App for alex@demo.example.com');
});

it('gives every account its own local demo data, never the previous account’s', async () => {
  await act(async () => emit(admin));
  expect(patientStore.getSnapshot().patient).toBe('Admin');
  act(() =>
    patientStore.update((s) => {
      s.instructions = 'Admin’s private instructions';
      s.doctor = 'Dr. Admin Only';
    }),
  );
  await act(async () => emit(null));
  await act(async () => emit(alex));
  const seenByAlex = patientStore.getSnapshot();
  expect(seenByAlex.patient).toBe('Alex Rivera');
  expect(seenByAlex.instructions).not.toContain('Admin’s private');
  expect(seenByAlex.doctor).not.toBe('Dr. Admin Only');
  expect(localStorage.getItem(`${PATIENT_KEY}:admin-1`)).toContain('Admin’s private');
  await act(async () => emit(admin));
  expect(patientStore.getSnapshot().instructions).toBe('Admin’s private instructions');
});

it('moves keyboard focus to the new page after signing in and out, but not on first load', async () => {
  await act(async () => emit(null));
  await frame();
  expect(document.activeElement).toBe(document.body);
  await act(async () => emit(admin));
  await frame();
  expect(document.activeElement?.id).toBe('main');
  await act(async () => emit(null));
  await frame();
  expect(document.activeElement?.id).toBe('auth-email');
});

it('stops listening to the session when it unmounts', async () => {
  await act(async () => root.render(<div />));
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
