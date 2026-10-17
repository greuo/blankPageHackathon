import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { watchSession, type AuthUser } from '../data/supabase';
import { patientStore } from '../patient/store';
import { displayName } from './identity';
import LoginPage from './LoginPage';
import './auth.css';

/**
 * Shows the app only to a signed-in account. `undefined` means the stored session hasn't been
 * checked yet, so a signed-in patient never sees a flash of the login form. The session ending
 * (sign-out, expiry, a revoked refresh token) puts the login page back without a reload.
 */
export default function AuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(
    () =>
      watchSession((next) => {
        // Point the local demo store at this account before React renders anything from it.
        patientStore.setOwner(next?.id ?? null, next ? displayName(next) : '');
        setUser(next);
      }),
    [],
  );
  // After the gate swaps pages, put keyboard focus on the new one instead of dropping it on <body>.
  // The first answer (page load) is left alone so the page isn't grabbed on arrival.
  const settled = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (user === undefined) return;
    const signedIn = user !== null;
    const before = settled.current;
    settled.current = signedIn;
    if (before === undefined || before === signedIn) return;
    const frame = requestAnimationFrame(() =>
      document.getElementById(signedIn ? 'main' : 'auth-email')?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [user]);
  if (user === undefined)
    return (
      <main className="auth-screen" aria-busy="true">
        <p className="auth-loading" role="status">
          <span className="spinner" aria-hidden="true" />
          Checking your session…
        </p>
      </main>
    );
  if (user === null) return <LoginPage />;
  // Keyed by account so signing in as someone else never carries over the previous screen's state.
  return <Fragment key={user.id}>{children(user)}</Fragment>;
}
