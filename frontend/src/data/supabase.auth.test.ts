// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import {
  ensureSession,
  signIn,
  signInErrorText,
  signOut,
  supabase,
  toAuthUser,
  watchSession,
} from './supabase';

afterEach(() => vi.restoreAllMocks());

it('gives a wrong password and an unknown email the same answer', () => {
  // Supabase answers both with invalid_credentials; anything that would reveal an account is generic.
  const wrong = signInErrorText({ code: 'invalid_credentials', status: 400 });
  expect(wrong).toBe('That email and password don’t match. Check them and try again.');
  const unknown = signInErrorText({ code: 'user_not_found', status: 400 });
  expect(unknown).not.toMatch(/no account|not found|exist|register/i);
});

it('explains rate limits, a lost connection and everything else in patient words', () => {
  expect(signInErrorText({ code: 'over_request_rate_limit', status: 429 })).toContain('Too many');
  expect(signInErrorText({ status: 429 })).toContain('Too many');
  expect(signInErrorText({ name: 'AuthRetryableFetchError', status: 0 })).toContain(
    'Could not reach',
  );
  expect(signInErrorText({ code: 'email_not_confirmed', status: 400 })).toContain('confirmed');
  expect(signInErrorText({ code: 'unexpected_failure', status: 500 })).toBe(
    'We couldn’t sign you in. Try again in a moment.',
  );
});

it('signIn resolves on success and rejects with patient-facing text otherwise', async () => {
  const signInWithPassword = vi.spyOn(supabase.auth, 'signInWithPassword');
  signInWithPassword.mockResolvedValueOnce({ data: {}, error: null } as never);
  await expect(signIn('admin@demo.example.com', 'pw')).resolves.toBeUndefined();
  expect(signInWithPassword).toHaveBeenCalledWith({
    email: 'admin@demo.example.com',
    password: 'pw',
  });

  signInWithPassword.mockResolvedValueOnce({
    data: {},
    error: { code: 'invalid_credentials', status: 400, name: 'AuthApiError' },
  } as never);
  await expect(signIn('admin@demo.example.com', 'bad')).rejects.toThrow('don’t match');

  signInWithPassword.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await expect(signIn('admin@demo.example.com', 'pw')).rejects.toThrow('Could not reach');
});

it('ensureSession never starts a guest session: no session means sign in again', async () => {
  const anonymous = vi.spyOn(supabase.auth, 'signInAnonymously');
  vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
    data: { session: null },
    error: null,
  });
  await expect(ensureSession()).rejects.toThrow('Sign in again');
  expect(anonymous).not.toHaveBeenCalled();

  vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
    data: { session: { access_token: 'token' } },
    error: null,
  } as never);
  await expect(ensureSession()).resolves.toBeUndefined();
});

it('signOut ends only this browser’s session', async () => {
  const out = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
  await signOut();
  expect(out).toHaveBeenCalledWith({ scope: 'local' });
  out.mockResolvedValueOnce({ error: { message: 'boom' } } as never);
  await expect(signOut()).rejects.toThrow('Could not sign you out');
});

it('toAuthUser prefers the display name, then the full name, and tolerates neither', () => {
  expect(
    toAuthUser({
      id: '1',
      email: 'a@b.co',
      user_metadata: { display_name: ' Admin ', full_name: 'X' },
    }),
  ).toEqual({ id: '1', email: 'a@b.co', name: 'Admin' });
  expect(toAuthUser({ id: '2', email: 'a@b.co', user_metadata: { full_name: 'Sam L' } }).name).toBe(
    'Sam L',
  );
  expect(toAuthUser({ id: '3', email: undefined, user_metadata: {} })).toEqual({
    id: '3',
    email: '',
    name: '',
  });
});

it('watchSession reports the account from every auth event and can be stopped', () => {
  const unsubscribe = vi.fn();
  let listener!: (event: string, session: unknown) => void;
  vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation(((cb: typeof listener) => {
    listener = cb;
    return { data: { subscription: { unsubscribe } } };
  }) as never);
  const seen: unknown[] = [];
  const stop = watchSession((user) => seen.push(user));
  listener('INITIAL_SESSION', null);
  listener('SIGNED_IN', {
    user: { id: '1', email: 'admin@demo.example.com', user_metadata: { display_name: 'Admin' } },
  });
  listener('SIGNED_OUT', null);
  expect(seen).toEqual([null, { id: '1', email: 'admin@demo.example.com', name: 'Admin' }, null]);
  stop();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});

it('treats a leftover guest session as signed out and drops it from storage', () => {
  vi.useFakeTimers();
  const signOutLocal = vi.spyOn(supabase.auth, 'signOut').mockResolvedValue({ error: null });
  let listener!: (event: string, session: unknown) => void;
  vi.spyOn(supabase.auth, 'onAuthStateChange').mockImplementation(((cb: typeof listener) => {
    listener = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  }) as never);
  const seen: unknown[] = [];
  watchSession((user) => seen.push(user));
  listener('INITIAL_SESSION', {
    user: { id: 'guest-1', email: undefined, is_anonymous: true, user_metadata: {} },
  });
  expect(seen).toEqual([null]);
  // Dropped later, never from inside the auth callback (auth-js forbids calling it there).
  expect(signOutLocal).not.toHaveBeenCalled();
  vi.runAllTimers();
  expect(signOutLocal).toHaveBeenCalledExactlyOnceWith({ scope: 'local' });
  vi.useRealTimers();
});

it('ensureSession does not accept a guest session either', async () => {
  vi.spyOn(supabase.auth, 'getSession').mockResolvedValueOnce({
    data: { session: { access_token: 'token', user: { id: 'guest-1', is_anonymous: true } } },
    error: null,
  } as never);
  await expect(ensureSession()).rejects.toThrow('Sign in again');
});
