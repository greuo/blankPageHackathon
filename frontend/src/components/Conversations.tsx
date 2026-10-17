import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Bot,
  LockKeyhole,
  MessageCircle,
  Plus,
  Users,
  RotateCcw,
  Send,
} from 'lucide-react';
import { repository, getActor, getVisibleConversations } from '../data/repository';
import { errorText, time } from './ui';

export default function Conversations({
  spaceId,
  onHandoff,
  onSource,
}: {
  spaceId: string;
  onHandoff: (initialQuestion?: string) => void;
  onSource: (id: string) => void;
}) {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const actor = getActor(state);
  const conversations = getVisibleConversations(state, spaceId);
  const [selected, setSelected] = useState('');
  const active = conversations.find((c) => c.id === selected) ?? conversations[0];
  const [body, setBody] = useState('');
  const [availability, setAvailability] = useState<'ready' | 'unavailable' | 'limited'>('ready');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'direct' | 'group'>('group');
  const [members, setMembers] = useState<string[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const feed = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const messages = state.messages.filter((m) => m.conversationId === active?.id);
  const users = state.users;
  const current = useRef(active?.id);
  useEffect(() => {
    setBody('');
    setError('');
    setRequestId(null);
    setAtBottom(true);
    current.current = active?.id;
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [active?.id]);
  useEffect(() => {
    if (atBottom) feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [messages.length, atBottom]);
  async function send(e: FormEvent) {
    e.preventDefault();
    if (
      !active ||
      !body.trim() ||
      busy.current ||
      (active.kind === 'ai' && availability !== 'ready')
    )
      return;
    busy.current = true;
    const conversationId = active.id;
    const id = requestId ?? crypto.randomUUID();
    setRequestId(id);
    setPending(true);
    setError('');
    try {
      await repository.sendMessage({ id, conversationId, body: body.trim() });
      if (current.current === conversationId) {
        setBody('');
        setRequestId(null);
        setAtBottom(true);
      }
    } catch (e) {
      if (current.current === conversationId) setError(errorText(e));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function create(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const c = await repository.createConversation({
        spaceId,
        title,
        kind,
        participantIds: [actor.id, ...members],
      });
      setSelected(c.id);
      setCreating(false);
      setTitle('');
      setMembers([]);
    } catch (e) {
      setError(errorText(e));
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return (
    <div className="conversation-layout">
      <aside className="conversation-nav">
        <div className="row between">
          <h3>Conversations</h3>
          <button
            className="icon-btn"
            onClick={() => setCreating(!creating)}
            aria-label="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>
        {conversations.map((c) => (
          <button
            className={`conversation-link ${active?.id === c.id ? 'active' : ''}`}
            key={c.id}
            onClick={() => {
              setSelected(c.id);
              setCreating(false);
            }}
          >
            {c.kind === 'ai' ? (
              <Bot size={19} />
            ) : c.kind === 'direct' ? (
              <LockKeyhole size={18} />
            ) : (
              <Users size={18} />
            )}
            <span>
              {c.title}
              <small>
                {c.kind === 'ai'
                  ? 'Only you and the companion'
                  : c.kind === 'direct'
                    ? 'Private conversation'
                    : `${c.participantIds.length} selected participants`}
              </small>
            </span>
          </button>
        ))}
        <p className="privacy-note">
          <LockKeyhole size={15} /> Your private chats stay with their participants.
        </p>
      </aside>
      <section className="chat-panel" aria-label="Conversation">
        {creating ? (
          <form className="stack new-conversation" onSubmit={create}>
            <h3>Start a conversation</h3>
            <label className="field">
              Conversation name
              <input
                required
                maxLength={80}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              Privacy
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value as 'direct' | 'group');
                  setMembers([]);
                }}
              >
                <option value="group">Group · selected people</option>
                <option value="direct">Private · one other person</option>
              </select>
            </label>
            <fieldset>
              <legend>Invite participants</legend>
              {users
                .filter(
                  (u) =>
                    u.id !== actor.id &&
                    state.spaces.find((s) => s.id === spaceId)?.memberIds.includes(u.id) &&
                    (u.role !== 'family' ||
                      state.grants.some(
                        (g) =>
                          g.spaceId === spaceId && g.familyId === u.id && g.level !== 'revoked',
                      )),
                )
                .map((u) => (
                  <label className="check-label" key={u.id}>
                    <input
                      type="checkbox"
                      checked={members.includes(u.id)}
                      onChange={(e) =>
                        setMembers(
                          e.target.checked
                            ? kind === 'direct'
                              ? [u.id]
                              : [...members, u.id]
                            : members.filter((id) => id !== u.id),
                        )
                      }
                    />
                    {u.name} · {u.role}
                  </label>
                ))}
            </fieldset>
            <p className="muted">
              Only the people selected here will see this conversation. Family access levels do not
              add anyone automatically.
            </p>
            {error && (
              <p role="alert" className="alert error">
                {error}
              </p>
            )}
            <div className="row">
              <button className="btn primary" disabled={pending || !members.length}>
                {pending ? 'Creating…' : 'Create conversation'}
              </button>
              <button type="button" className="btn secondary" onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : active ? (
          <>
            <header className="chat-header">
              <span className={`chat-symbol ${active.kind === 'ai' ? 'mint' : ''}`}>
                {active.kind === 'ai' ? <Bot /> : <MessageCircle />}
              </span>
              <div>
                <h3>{active.title}</h3>
                <p>
                  {active.kind === 'ai'
                    ? 'Answers from your approved plan'
                    : active.participantIds
                        .map((id) => users.find((u) => u.id === id)?.name)
                        .join(', ')}
                </p>
              </div>
              <span className="badge">
                <LockKeyhole size={12} />
                {active.kind === 'group' ? 'Selected group' : 'Private'}
              </span>
            </header>
            {active.kind === 'ai' && availability !== 'ready' && (
              <div className="companion-state" role="status">
                <h4>
                  {availability === 'limited'
                    ? 'Companion usage limit reached'
                    : 'Companion is temporarily unavailable'}
                </h4>
                <p>
                  Fictional demo scenario. Your message has not been sent and stays here. You can
                  review a request for Dr. Chen instead.
                </p>
                <button
                  className="btn secondary"
                  onClick={() => onHandoff(body.trim() || undefined)}
                >
                  Contact care team
                </button>
              </div>
            )}
            <div
              className="message-feed"
              ref={feed}
              onScroll={() => {
                const e = feed.current;
                if (e) setAtBottom(e.scrollHeight - e.scrollTop - e.clientHeight < 80);
              }}
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <span className="large-icon">
                    <MessageCircle />
                  </span>
                  <h3>A space to stay connected</h3>
                  <p>
                    {active.kind === 'ai'
                      ? 'Ask about an instruction in your approved plan. When it is not covered, contact your doctor.'
                      : 'Start with a question or a small update.'}
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const own = m.authorId === actor.id;
                  const author = users.find((u) => u.id === m.authorId);
                  return (
                    <article key={m.id} className={`message ${own ? 'own' : ''}`}>
                      <span className="message-author">
                        {m.authorId === 'ai'
                          ? 'Your companion'
                          : (author?.name ?? 'Care companion')}{' '}
                        <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                      </span>
                      <div className="bubble">
                        {m.body}
                        {m.sourceInstructionId && (
                          <button
                            className="source-link"
                            onClick={() => onSource(m.sourceInstructionId!)}
                          >
                            View approved source <ArrowUp size={13} />
                          </button>
                        )}
                        {m.needsHandoff && actor.role === 'patient' && (
                          <button
                            className="btn secondary"
                            onClick={() => onHandoff(body.trim() || undefined)}
                          >
                            Contact care team
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
            {!atBottom && (
              <button
                className="new-message-btn btn secondary"
                onClick={() => {
                  setAtBottom(true);
                  feed.current?.scrollTo({ top: feed.current.scrollHeight });
                }}
              >
                <ArrowDown size={15} />
                Jump to latest
              </button>
            )}
            {active.kind === 'ai' && messages.length < 3 && (
              <div className="chat-suggestions">
                {['What is in my approved plan?', 'I have a question for my doctor'].map((q) => (
                  <button key={q} onClick={() => setBody(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={send} className="composer">
              <label className="sr-only" htmlFor="message-body">
                Message {active.title}
              </label>
              <textarea
                id="message-body"
                rows={2}
                maxLength={4000}
                placeholder={
                  active.kind === 'ai' ? 'Ask about your recovery plan…' : 'Write a message…'
                }
                value={body}
                onChange={(e) => {
                  setBody(e.target.value);
                  setRequestId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
              <button
                className="send-btn"
                aria-label={error ? 'Retry message' : 'Send message'}
                disabled={
                  pending || !body.trim() || (active.kind === 'ai' && availability !== 'ready')
                }
              >
                {pending ? (
                  <span className="spinner" />
                ) : error ? (
                  <RotateCcw size={19} />
                ) : (
                  <Send size={19} />
                )}
              </button>
            </form>
            {error && (
              <p className="alert error" role="alert">
                {error} Your message is preserved. Retry to send it once.
                {active.kind === 'ai' && actor.role === 'patient' && (
                  <button
                    className="btn secondary"
                    onClick={() => onHandoff(body.trim() || undefined)}
                  >
                    Contact care team
                  </button>
                )}
              </p>
            )}
            {active.kind === 'ai' && (
              <details className="demo-scenarios">
                <summary>Demo companion states</summary>
                <label className="field">
                  Companion availability (demo)
                  <select
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value as typeof availability)}
                  >
                    <option value="ready">Source-based demo ready</option>
                    <option value="unavailable">Service unavailable</option>
                    <option value="limited">Usage limit reached</option>
                  </select>
                </label>
                <p>These controls preview frontend states; no live AI service is connected.</p>
              </details>
            )}
            <div className="composer-note">
              {active.kind === 'ai'
                ? 'Fictional demo · source-based replies, no live AI service.'
                : 'Fictional demo · saved in this browser only.'}{' '}
              Enter to send; Shift + Enter for a new line.
            </div>
          </>
        ) : (
          <div className="chat-empty">
            <LockKeyhole />
            <h3>No conversations available</h3>
            <p>You only see conversations you belong to.</p>
          </div>
        )}
      </section>
    </div>
  );
}
