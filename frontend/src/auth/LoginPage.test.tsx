// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import LoginPage, { validateLogin } from './LoginPage';
import { signIn } from '../data/supabase';

// The live backend is mocked: these tests cover the form, not Supabase.
vi.mock('../data/supabase', () => ({ signIn: vi.fn() }));

let root: Root;
let host: HTMLDivElement;
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<LoginPage />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

const input = (id: string) => host.querySelector<HTMLInputElement>(`#${id}`)!;
const submit = () => host.querySelector<HTMLButtonElement>('button[type=submit]')!;
async function type(id: string, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => {
    setValue.call(input(id), value);
    input(id).dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function clickSubmit() {
  await act(async () => submit().click());
}

it('is a labelled email + password form with no way to register or browse as a guest', () => {
  expect(host.querySelector('h1')?.textContent).toBe('Welcome back');
  expect(host.querySelector('label[for=auth-email]')?.textContent).toBe('Email');
  expect(host.querySelector('label[for=auth-password]')?.textContent).toBe('Password');
  expect(input('auth-email').autocomplete).toBe('username');
  expect(input('auth-password').autocomplete).toBe('current-password');
  expect(input('auth-password').type).toBe('password');
  const actions = Array.from(host.querySelectorAll('button, a')).map((el) => el.textContent);
  expect(actions.join(' ')).not.toMatch(/sign up|register|create|guest|forgot|reset/i);
  expect(host.textContent).toContain('Registration is closed');
});

it('checks the form before sending anything and focuses the first problem', async () => {
  await clickSubmit();
  expect(signIn).not.toHaveBeenCalled();
  expect(host.querySelector('#auth-email-error')?.textContent).toBe('Enter your email.');
  expect(host.querySelector('#auth-password-error')?.textContent).toBe('Enter your password.');
  expect(input('auth-email').getAttribute('aria-invalid')).toBe('true');
  expect(input('auth-email').getAttribute('aria-describedby')).toBe('auth-email-error');
  expect(document.activeElement).toBe(input('auth-email'));
});

it('announces field errors, and announces them again when the same mistake repeats', async () => {
  await clickSubmit();
  const first = host.querySelector('#auth-email-error')!;
  expect(first.getAttribute('role')).toBe('alert');
  expect(host.querySelector('#auth-password-error')?.getAttribute('role')).toBe('alert');
  await clickSubmit();
  // A fresh node is what makes assistive technology read an unchanged message again.
  expect(host.querySelector('#auth-email-error')).not.toBe(first);
  expect(host.querySelector('#auth-email-error')?.textContent).toBe('Enter your email.');
});

it('rejects a malformed email and a missing password separately', async () => {
  await type('auth-email', 'not-an-email');
  await type('auth-password', 'secret');
  await clickSubmit();
  expect(host.querySelector('#auth-email-error')?.textContent).toContain('valid email');
  expect(host.querySelector('#auth-password-error')).toBeNull();
  await type('auth-email', 'admin@demo.example.com');
  await type('auth-password', '');
  await clickSubmit();
  expect(host.querySelector('#auth-email-error')).toBeNull();
  expect(host.querySelector('#auth-password-error')?.textContent).toBe('Enter your password.');
  expect(document.activeElement).toBe(input('auth-password'));
  expect(signIn).not.toHaveBeenCalled();
});

it('signs in with the email trimmed and the password exactly as typed', async () => {
  vi.mocked(signIn).mockResolvedValue();
  await type('auth-email', '  admin@demo.example.com ');
  await type('auth-password', ' pass word ');
  await clickSubmit();
  expect(signIn).toHaveBeenCalledExactlyOnceWith('admin@demo.example.com', ' pass word ');
  expect(host.querySelector('[role=alert]')).toBeNull();
});

it('shows a failure, keeps the email, clears the password and puts focus back on it', async () => {
  vi.mocked(signIn).mockRejectedValue(new Error('That email and password don’t match.'));
  await type('auth-email', 'admin@demo.example.com');
  await type('auth-password', 'wrong');
  await clickSubmit();
  expect(host.querySelector('[role=alert]')?.textContent).toBe(
    'That email and password don’t match.',
  );
  expect(input('auth-email').value).toBe('admin@demo.example.com');
  expect(input('auth-password').value).toBe('');
  expect(document.activeElement).toBe(input('auth-password'));
  expect(submit().getAttribute('aria-disabled')).toBe('false');
});

it('ignores a second submit while signing in and keeps keyboard focus in place', async () => {
  let finish!: () => void;
  vi.mocked(signIn).mockReturnValue(new Promise<void>((resolve) => (finish = resolve)));
  await type('auth-email', 'admin@demo.example.com');
  await type('auth-password', 'secret');
  await clickSubmit();
  await clickSubmit();
  expect(signIn).toHaveBeenCalledTimes(1);
  expect(submit().getAttribute('aria-disabled')).toBe('true');
  expect(submit().textContent).toContain('Signing in');
  expect(input('auth-email').readOnly).toBe(true);
  expect(input('auth-password').readOnly).toBe(true);
  await act(async () => finish());
  expect(submit().getAttribute('aria-disabled')).toBe('false');
  expect(input('auth-email').readOnly).toBe(false);
});

it('lets the patient reveal and hide the password', async () => {
  const toggle = host.querySelector<HTMLButtonElement>('.auth-reveal')!;
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  await act(async () => toggle.click());
  expect(input('auth-password').type).toBe('text');
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  await act(async () => toggle.click());
  expect(input('auth-password').type).toBe('password');
});

it('validateLogin only trims nothing from the password and flags each field', () => {
  expect(validateLogin('a@b.co', ' ')).toEqual({});
  expect(validateLogin('', '')).toEqual({
    email: 'Enter your email.',
    password: 'Enter your password.',
  });
  expect(validateLogin('a b@c.d', 'x').email).toContain('valid email');
});
