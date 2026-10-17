import { useRef, useState, useSyncExternalStore } from 'react';
import { ShieldCheck, Users } from 'lucide-react';
import { getActor, getVisibleSpaces, repository } from '../data/repository';
import type { AccessLevel, Store } from '../data/types';

const levels: AccessLevel[] = ['Basic', 'Support', 'Full', 'revoked'];
const levelName = (level: AccessLevel): string => (level === 'revoked' ? 'Revoked' : level);
const dateLabel = (value: string): string =>
  new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

export function AccessPanel({ spaceId }: { spaceId: string }) {
  const store = useSyncExternalStore(
    repository.subscribe,
    repository.getSnapshot,
    repository.getSnapshot,
  );
  return <AccessContent key={`${spaceId}:${store.actorId}`} spaceId={spaceId} store={store} />;
}

function AccessContent({ spaceId, store }: { spaceId: string; store: Store }) {
  const actor = getActor(store);
  const space = getVisibleSpaces(store).find((item) => item.id === spaceId);
  const grant = store.grants.find((item) => item.spaceId === spaceId);
  const family = store.users.find((user) => user.id === grant?.familyId);
  const [selection, setSelection] = useState<AccessLevel>(grant?.level ?? 'Basic');
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'error' | 'success'; text: string } | null>(
    null,
  );
  const busy = useRef(false);
  const canManage = Boolean(space && (actor.role === 'doctor' || actor.id === space.patientId));
  const changes = store.audit.filter((entry) => entry.spaceId === spaceId).reverse();

  async function save(level: AccessLevel) {
    if (busy.current || !canManage) return;
    busy.current = true;
    setPending(true);
    setFeedback(null);
    try {
      await repository.changeGrant(spaceId, level);
      setSelection(level);
      setFeedback({
        kind: 'success',
        text: `Family access ${level === 'revoked' ? 'revoked' : `changed to ${level}`} in this browser demo.`,
      });
    } catch (error) {
      setFeedback({
        kind: 'error',
        text: error instanceof Error ? error.message : 'Access could not be saved. Please retry.',
      });
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  if (!space)
    return (
      <section className="panel">
        <h2>Family access</h2>
        <p>This care space is unavailable for this demo role.</p>
      </section>
    );

  return (
    <section className="panel stack" aria-labelledby={`access-title-${spaceId}`}>
      <div className="row">
        <ShieldCheck aria-hidden="true" size={22} />
        <h2 id={`access-title-${spaceId}`}>Your circle, your choice</h2>
      </div>
      <p className="muted">
        The patient and clinician can equally grant, change, or revoke family access in this space.
      </p>
      {family && grant ? (
        <div className="row">
          <Users size={20} aria-hidden="true" />
          <div>
            <strong>{family.name}</strong>
            <p className="muted">Family member</p>
          </div>
          <span className="badge">{levelName(grant.level)}</span>
        </div>
      ) : (
        <p>No family invitation exists in this space yet.</p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="permission-table">
          <caption>Basic, Support, and Full offer increasing access to shared information.</caption>
          <thead>
            <tr>
              <th scope="col">Level</th>
              <th scope="col">What is shared</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Basic</th>
              <td>
                Nonclinical space updates and conversations the family member has explicitly joined.
              </td>
            </tr>
            <tr>
              <th scope="row">Support</th>
              <td>
                Basic access, plus the approved daily checklist, observations, questions, and
                attributed family completion reports.
              </td>
            </tr>
            <tr>
              <th scope="row">Full</th>
              <td>Support access, plus all shared approved care plans and documents.</td>
            </tr>
            <tr>
              <th scope="row">Revoked</th>
              <td>No access to this space until the patient or clinician restores a level.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted">
        Private conversations always require explicit participation, including with Full access.
        Family members cannot manage access or edit clinician-approved orders. The AI conversation
        stays patient-only.
      </p>

      {canManage && grant && (
        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void save(selection);
          }}
        >
          <div className="field">
            <label htmlFor={`family-level-${spaceId}`}>
              Access for {family?.name ?? 'your family member'}
            </label>
            <select
              id={`family-level-${spaceId}`}
              value={selection}
              disabled={pending}
              onChange={(event) => {
                setSelection(event.target.value as AccessLevel);
                setFeedback(null);
              }}
            >
              {levels.map((level) => (
                <option key={level} value={level}>
                  {levelName(level)}
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <button
              className="btn primary"
              type="submit"
              disabled={pending || selection === grant.level}
            >
              {pending
                ? 'Saving access…'
                : grant.level === 'revoked' && selection !== 'revoked'
                  ? 'Restore selected access'
                  : 'Save access'}
            </button>
            {grant.level !== 'revoked' && (
              <button
                className="btn danger"
                type="button"
                disabled={pending}
                onClick={() => {
                  void save('revoked');
                }}
              >
                Revoke access
              </button>
            )}
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

      {canManage && (
        <div className="stack">
          <h3>Access history</h3>
          {changes.length === 0 ? (
            <p className="muted">No access changes yet. Changes record who made them and when.</p>
          ) : (
            <ul className="audit-list">
              {changes.map((entry) => (
                <li key={entry.id}>
                  <strong>
                    {store.users.find((user) => user.id === entry.actorId)?.name ??
                      'Care-space participant'}
                  </strong>{' '}
                  changed {levelName(entry.previousLevel)} → {levelName(entry.newLevel)}
                  <br />
                  <time dateTime={entry.createdAt} className="muted">
                    {dateLabel(entry.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="muted">
        Fictional browser demo: these controls model permissions locally. Live security and
        revocation need the team’s authenticated backend.
      </p>
    </section>
  );
}

export default AccessPanel;
