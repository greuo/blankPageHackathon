import { useRef, useState, type FormEvent } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { signIn } from '../data/supabase';
import './auth.css';

type FieldErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Checks the form before anything is sent. Passwords are never trimmed or inspected. */
export function validateLogin(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Enter your email.';
  else if (!EMAIL_PATTERN.test(email))
    errors.email = 'Enter a valid email address, like name@example.com.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

/**
 * The front door. Email + password only: registration is closed (sign-ups are off on the project)
 * and there is no guest mode, so there is deliberately no "create account" or "continue as guest".
 * A successful sign-in is picked up by AuthGate, which replaces this page with the app.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  // Bumped on every failed check so an unchanged message is announced again on the next attempt.
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const emailInput = useRef<HTMLInputElement>(null);
  const passwordInput = useRef<HTMLInputElement>(null);
  const submitting = useRef(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    const cleanEmail = email.trim();
    const problems = validateLogin(cleanEmail, password);
    setFieldErrors(problems);
    setError('');
    if (problems.email || problems.password) setAttempt((n) => n + 1);
    if (problems.email) return void emailInput.current?.focus();
    if (problems.password) return void passwordInput.current?.focus();
    submitting.current = true;
    setPending(true);
    try {
      await signIn(cleanEmail, password);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'We couldn’t sign you in. Try again in a moment.',
      );
      setPassword('');
      passwordInput.current?.focus();
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <main className="auth-screen" aria-labelledby="auth-title">
      <section className="auth-card">
        <svg className="auth-symbol" viewBox="0 0 120 120" aria-hidden="true">
          <path d="M18 102V21a3 3 0 0 1 3-3h81" />
          <path d="M102 18v81a3 3 0 0 1-3 3H18" />
          <text x="59" y="79" textAnchor="middle">
            dc
          </text>
        </svg>
        <h1 id="auth-title">Welcome back</h1>
        <p className="auth-lead">Sign in to open your care companion.</p>
        <form className="auth-form" onSubmit={submit} noValidate aria-busy={pending}>
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              ref={emailInput}
              className="auth-input"
              type="email"
              name="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              readOnly={pending}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? 'auth-email-error' : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
            {fieldErrors.email && (
              <p key={attempt} className="auth-field-error" id="auth-email-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <div className="auth-password">
              <input
                id="auth-password"
                ref={passwordInput}
                className="auth-input"
                type={reveal ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                readOnly={pending}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? 'auth-password-error' : undefined}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-reveal"
                aria-label="Show password"
                aria-pressed={reveal}
                onClick={() => setReveal((value) => !value)}
              >
                {reveal ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p key={attempt} className="auth-field-error" id="auth-password-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>
          {error && (
            <p className="auth-alert" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="auth-submit" aria-disabled={pending}>
            {pending ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
        <p className="auth-note">
          Registration is closed for now. Ask the person who shared this app with you for an
          account.
        </p>
      </section>
      <p className="auth-footnote">
        A fictional care experience. Do not enter real patient details.
      </p>
    </main>
  );
}
