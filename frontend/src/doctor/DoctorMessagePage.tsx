import { useEffect, useState } from 'react';
import { HeartPulse, ShieldCheck } from 'lucide-react';

// Public page for the link a doctor receives by email: foredge.me/doctor-message#<token>.
// No login: the token after "#" is the whole credential, so it never reaches server logs.
// Contract: backend_progress.md → Edge functions → view-doctor-message.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://repvtuxyszlqdjzciojx.supabase.co';

type CareNotes = {
  version: number;
  content: unknown;
  entered_via: string;
  created_at: string;
} | null;

type DoctorMessage = {
  content: string;
  created_at: string;
  expires_at: string;
  opened_at: string | null;
  patient_first_name: string | null;
  doctor_name: string | null;
  care_notes: CareNotes;
};

type ViewState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'failed'; detail: string }
  | { kind: 'ready'; message: DoctorMessage };

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
}

// Care-note content is clinician-entered JSON: today `{ instructions }`, optionally a
// `normal` list of expected-after-the-visit notes. Render those and fall back for the rest.
function NotesContent({ content }: { content: unknown }) {
  if (typeof content === 'string') return <p className="doctor-notes-text">{content}</p>;
  if (content && typeof content === 'object') {
    const { instructions, normal, ...rest } = content as Record<string, unknown>;
    const extras = Object.entries(rest).filter(([, value]) => value != null);
    return (
      <>
        {typeof instructions === 'string' && instructions.trim() && (
          <p className="doctor-notes-text">{instructions}</p>
        )}
        {Array.isArray(normal) && normal.length > 0 && (
          <>
            <h3>What’s normal</h3>
            <ul>
              {normal.map((item, index) => (
                <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ul>
          </>
        )}
        {extras.length > 0 && (
          <pre className="doctor-notes-extra">
            {extras
              .map(
                ([key, value]) =>
                  `${key}: ${typeof value === 'string' ? value : JSON.stringify(value, null, 2)}`,
              )
              .join('\n')}
          </pre>
        )}
      </>
    );
  }
  return <p className="doctor-notes-text">No care notes on file yet.</p>;
}

export default function DoctorMessagePage() {
  const [state, setState] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    const token = location.hash.startsWith('#') ? location.hash.slice(1) : '';
    if (!token) {
      setState({ kind: 'invalid' });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/view-doctor-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (response.ok && body) {
          setState({ kind: 'ready', message: body as DoctorMessage });
        } else if (response.status === 410 || body?.code === 'expired') {
          setState({ kind: 'expired' });
        } else if (response.status === 404 || response.status === 400) {
          setState({ kind: 'invalid' });
        } else {
          setState({
            kind: 'failed',
            detail:
              typeof body?.error === 'string'
                ? body.error
                : 'Could not open the message. Please try again.',
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            kind: 'failed',
            detail: 'Could not reach the server. Check your connection and try again.',
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="doctor-message-page">
      <header className="doctor-message-brand">
        <HeartPulse aria-hidden="true" />
        <span>Care companion</span>
      </header>

      {state.kind === 'loading' && (
        <section className="doctor-message-card" aria-busy="true">
          <p className="doctor-message-muted">Opening the message…</p>
        </section>
      )}

      {state.kind === 'invalid' && (
        <section className="doctor-message-card">
          <h1>This link isn’t valid</h1>
          <p className="doctor-message-muted">
            Check that the whole link from the email was opened, or ask your patient to send the
            message again.
          </p>
        </section>
      )}

      {state.kind === 'expired' && (
        <section className="doctor-message-card">
          <h1>This link has expired</h1>
          <p className="doctor-message-muted">
            For privacy, message links stop working after 7 days. Ask your patient to send it
            again.
          </p>
        </section>
      )}

      {state.kind === 'failed' && (
        <section className="doctor-message-card">
          <h1>Something went wrong</h1>
          <p className="alert error" role="alert">
            {state.detail}
          </p>
          <button className="btn primary" onClick={() => location.reload()}>
            Try again
          </button>
        </section>
      )}

      {state.kind === 'ready' && (
        <section className="doctor-message-card">
          <h1>
            {state.message.patient_first_name
              ? `A message from ${state.message.patient_first_name}`
              : 'A message from your patient'}
          </h1>
          <p className="doctor-message-muted">Sent {formatDate(state.message.created_at)}</p>
          <blockquote className="doctor-message-content">{state.message.content}</blockquote>

          <h2>Their current care notes</h2>
          {state.message.care_notes ? (
            <>
              <NotesContent content={state.message.care_notes.content} />
              <p className="doctor-message-muted">
                Version {state.message.care_notes.version} · entered{' '}
                {formatDate(state.message.care_notes.created_at)}
              </p>
            </>
          ) : (
            <p className="doctor-message-muted">No care notes on file yet.</p>
          )}

          <p className="doctor-message-privacy">
            <ShieldCheck aria-hidden="true" />
            Anyone with this link can read the message until {formatDate(
              state.message.expires_at,
            )}, so please don’t forward it. Not for emergencies.
          </p>
        </section>
      )}
    </main>
  );
}
