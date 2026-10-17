import { useRef, useState, useSyncExternalStore } from 'react';
import { CheckCheck, Send, Stethoscope } from 'lucide-react';
import {
  getActor,
  getVisibleConversations,
  getVisibleHandoffs,
  getVisibleMessages,
  getVisibleSpaces,
  repository,
} from '../data/repository';
import type { Store } from '../data/types';

const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ??
  `handoff-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateLabel = (value: string): string =>
  new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export function HandoffPanel({
  spaceId,
  initialQuestion,
}: {
  spaceId: string;
  initialQuestion?: string;
}) {
  const store = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  return (
    <HandoffContent
      key={`${spaceId}:${store.actorId}:${initialQuestion ?? ''}`}
      spaceId={spaceId}
      store={store}
      initialQuestion={initialQuestion}
    />
  );
}

function HandoffContent({
  spaceId,
  store,
  initialQuestion,
}: {
  spaceId: string;
  store: Store;
  initialQuestion?: string;
}) {
  const actor = getActor(store);
  const space = getVisibleSpaces(store).find((item) => item.id === spaceId);
  const doctor = store.users.find(
    (user) => user.role === 'doctor' && space?.memberIds.includes(user.id),
  );
  const conversations = getVisibleConversations(store, spaceId);
  const aiConversation = conversations.find(
    (conversation) => conversation.kind === 'ai' && conversation.participantIds.includes(actor.id),
  );
  const messages = aiConversation ? getVisibleMessages(store, aiConversation.id) : [];
  const handoffs = getVisibleHandoffs(store, spaceId).reverse();
  const [summary, setSummary] = useState(() =>
    actor.role === 'patient' ? (initialQuestion ?? '') : '',
  );
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  );
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const attempt = useRef<{ id: string; summary: string } | null>(null);
  const busy = useRef(false);
  const textarea = useRef<HTMLTextAreaElement>(null);

  function editSummary(value: string) {
    setSummary(value);
    setConsent(false);
    setFeedback(null);
  }

  function prepare() {
    const excerpt = messages
      .map(
        (message) =>
          `${store.users.find((user) => user.id === message.authorId)?.name ?? 'Recovery companion'}: ${message.body}`,
      )
      .join('\n\n');
    editSummary(
      excerpt
        ? `I would like help with this recovery question.\n\nConversation excerpts for your review:\n\n${excerpt}`
        : '',
    );
    textarea.current?.focus();
  }

  function cancel() {
    editSummary('');
    attempt.current = null;
    setFeedback({ kind: 'success', text: 'Draft cleared. Nothing was shared.' });
    textarea.current?.focus();
  }

  async function send() {
    if (busy.current || !consent || !summary.trim() || summary.length > 8000 || !doctor) return;
    busy.current = true;
    setPending(true);
    setFeedback(null);
    const approvedSummary = summary.trim();
    if (!attempt.current || attempt.current.summary !== approvedSummary)
      attempt.current = { id: newId(), summary: approvedSummary };
    try {
      await repository.sendHandoff({
        id: attempt.current.id,
        spaceId,
        summary: attempt.current.summary,
      });
      setSummary('');
      setConsent(false);
      attempt.current = null;
      setFeedback({
        kind: 'success',
        text: `Approved content saved to ${doctor.name}’s local demo inbox. No external message was sent.`,
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'This request could not be saved. Your approved draft is preserved; retry when ready.',
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function acknowledge(id: string) {
    if (busy.current) return;
    busy.current = true;
    setAcknowledging(id);
    setFeedback(null);
    try {
      await repository.acknowledgeHandoff(id);
      setFeedback({ kind: 'success', text: 'Acknowledgement saved in this local demo.' });
    } catch (error) {
      setFeedback({
        kind: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Acknowledgement could not be saved. Please retry.',
      });
    } finally {
      busy.current = false;
      setAcknowledging(null);
    }
  }

  if (actor.role === 'family')
    return (
      <section className="panel stack">
        <h2>Contact care team</h2>
        <p>
          The patient’s AI conversation and approved care-team handoffs are private. Use a
          conversation you have joined to share your own questions.
        </p>
      </section>
    );
  if (!space)
    return (
      <section className="panel">
        <h2>Contact care team</h2>
        <p>This care space is unavailable for this demo role.</p>
      </section>
    );

  return (
    <section className="panel stack" aria-labelledby={`handoff-title-${spaceId}`}>
      <div className="row">
        <Stethoscope aria-hidden="true" size={22} />
        <h2 id={`handoff-title-${spaceId}`}>
          {actor.role === 'doctor' ? 'Patient requests' : 'A little human help'}
        </h2>
      </div>
      <p className="muted">
        {doctor?.name ?? 'Your assigned clinician'} receives only content the patient approves here.
        This demo inbox is not continuously monitored; it cannot provide emergency help.
      </p>

      {actor.role === 'patient' && (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void send();
          }}
        >
          <p>
            Ask for human help whenever your question is outside the approved plan, the companion is
            unavailable, or you would prefer to speak with your clinician.
          </p>
          {summary && (
            <span className="badge">
              {pending
                ? 'Saving approved request'
                : consent
                  ? 'Approved draft · not shared yet'
                  : 'Prepared draft · not shared'}
            </span>
          )}
          {aiConversation && (
            <button
              className="btn secondary"
              type="button"
              disabled={pending || messages.length === 0}
              onClick={prepare}
            >
              Prepare summary from this AI conversation
            </button>
          )}
          {aiConversation && messages.length === 0 && (
            <p className="muted">
              No AI messages to include yet. You can write your question below.
            </p>
          )}
          <div className="field">
            <label htmlFor={`handoff-summary-${spaceId}`}>
              Review and edit exactly what will be shared
            </label>
            <textarea
              ref={textarea}
              id={`handoff-summary-${spaceId}`}
              rows={7}
              value={summary}
              maxLength={8000}
              disabled={pending}
              onChange={(event) => editSummary(event.target.value)}
              aria-describedby={`handoff-help-${spaceId}`}
              placeholder="What would you like Dr. Chen to help you understand?"
            />
            <p id={`handoff-help-${spaceId}`} className="muted">
              Recipient: {doctor?.name ?? 'No clinician assigned'}. Only this text is shared; your
              full private conversation is not attached. {summary.length.toLocaleString()} / 8,000
              characters.
            </p>
          </div>
          {summary.length > 8000 && (
            <p className="alert error" role="alert">
              These excerpts exceed 8,000 characters. Edit them to the parts you want to share.
            </p>
          )}
          <label className="row">
            <input
              type="checkbox"
              checked={consent}
              disabled={pending || !summary.trim() || !doctor}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I reviewed this content and approve sharing it with{' '}
            {doctor?.name ?? 'my assigned clinician'}.
          </label>
          <div className="row">
            <button
              className="btn primary"
              type="submit"
              disabled={pending || !consent || !summary.trim() || summary.length > 8000 || !doctor}
            >
              <Send size={16} aria-hidden="true" />
              {pending
                ? 'Saving request…'
                : feedback?.kind === 'error'
                  ? 'Retry approved request'
                  : 'Approve & send request'}
            </button>
            <button
              className="btn quiet"
              type="button"
              disabled={pending || (!summary && !consent)}
              onClick={cancel}
            >
              Cancel draft
            </button>
          </div>
        </form>
      )}

      {feedback && (
        <p
          className={`alert ${feedback.kind}`}
          role={feedback.kind === 'error' ? 'alert' : 'status'}
        >
          {feedback.text}
        </p>
      )}
      <div className="stack">
        <h3>{actor.role === 'doctor' ? 'Local demo inbox' : 'Your shared requests'}</h3>
        {handoffs.length === 0 ? (
          <p className="muted">
            {actor.role === 'doctor'
              ? 'Patient-approved requests will appear here.'
              : 'No requests shared yet. Preparing a draft does not send it.'}
          </p>
        ) : (
          handoffs.map((handoff) => (
            <article className="panel stack" key={handoff.id}>
              <div className="row">
                <strong>
                  {store.users.find((user) => user.id === handoff.patientId)?.name ?? 'Patient'} →{' '}
                  {store.users.find((user) => user.id === handoff.doctorId)?.name ?? 'Clinician'}
                </strong>
                <span className="badge">
                  {handoff.status === 'acknowledged'
                    ? 'Acknowledged in demo'
                    : 'Saved in demo inbox'}
                </span>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{handoff.summary}</p>
              <time className="muted" dateTime={handoff.createdAt}>
                {dateLabel(handoff.createdAt)}
              </time>
              {actor.role === 'doctor' &&
                handoff.doctorId === actor.id &&
                handoff.status === 'sent' && (
                  <button
                    className="btn secondary"
                    type="button"
                    disabled={acknowledging !== null}
                    onClick={() => {
                      void acknowledge(handoff.id);
                    }}
                  >
                    <CheckCheck size={17} aria-hidden="true" />
                    {acknowledging === handoff.id
                      ? 'Saving acknowledgement…'
                      : 'Acknowledge request'}
                  </button>
                )}
            </article>
          ))
        )}
      </div>
      <p className="muted">
        Fictional browser demo. “Saved” and “acknowledged” refer to this prototype only; external
        delivery has not been connected.
      </p>
    </section>
  );
}

export default HandoffPanel;
