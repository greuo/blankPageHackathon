import { Component, useState, useSyncExternalStore, type FormEvent, type ReactNode } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Heart,
  HeartPulse,
  Home,
  Leaf,
  LogOut,
  MessageCircle,
  Pill,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Stethoscope,
  Users,
  Utensils,
  Footprints,
} from 'lucide-react';
import { repository, getActor, getVisibleSpaces, localDate } from './data/repository';
import type { Space } from './data/types';
import Checklist from './components/Checklist';
import CareSpace from './components/CareSpace';
import { Avatar, Logo, Modal, errorText } from './components/ui';
const spaceIcons = [HeartPulse, Pill, Footprints, Utensils, CalendarDays];
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean; resetError: string }
> {
  state = { error: false, resetError: '' };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main className="fatal-error">
        <HeartPulse />
        <h1>We couldn’t open your companion</h1>
        <p>
          Your browser may have unavailable or invalid demo storage. Reload to try again; do not
          enter real patient information.
        </p>
        <button className="btn primary" onClick={() => location.reload()}>
          Reload companion
        </button>
        <button
          className="btn secondary"
          onClick={() => {
            try {
              repository.resetDemo();
              this.setState({ error: false, resetError: '' });
            } catch (reason) {
              this.setState({ resetError: errorText(reason) });
            }
          }}
        >
          Reset fictional demo
        </button>
        <p>Reset restores sample records and removes local demo edits.</p>
        {this.state.resetError && (
          <p className="alert error" role="alert">
            {this.state.resetError}
          </p>
        )}
      </main>
    ) : (
      this.props.children
    );
  }
}
function Companion() {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const actor = getActor(state);
  const spaces = getVisibleSpaces(state);
  const [showOpening, setShowOpening] = useState(() => {
    try {
      return sessionStorage.getItem('companion-opening-v2') !== 'seen';
    } catch {
      return true;
    }
  });
  function enterWorkspace() {
    try {
      sessionStorage.setItem('companion-opening-v2', 'seen');
    } catch {
      /* The app remains usable without session storage. */
    }
    setShowOpening(false);
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  }
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<{ id: string; tab?: string; sourceId?: string } | null>(
    null,
  );
  const [dialog, setDialog] = useState<'create' | 'guide' | 'reset' | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const filtered = spaces.filter((s) =>
    `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  const today = new Date(`${localDate()}T12:00:00`);
  const persistenceError = repository.getPersistenceError();
  const open = (space: Space, tab = 'conversations') => setSelected({ id: space.id, tab });
  async function create(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    try {
      const space = await repository.createSpace({
        name,
        description,
        category: 'Personal recovery',
      });
      setDialog(null);
      setName('');
      setDescription('');
      setSelected({ id: space.id, tab: 'plan' });
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending(false);
    }
  }
  function switchRole(id: string) {
    setSelected(null);
    setDialog(null);
    setError('');
    try {
      repository.setActor(id);
    } catch (e) {
      setError(errorText(e));
    }
  }
  if (showOpening)
    return (
      <main className="opening" aria-label="Welcome to Discharge Companion">
        <div className="opening-copy">
          <Logo />
          <div className="opening-message">
            <h1>
              Care for the
              <br />
              <span className="opening-second-line">days ahead.</span>
            </h1>
            <p>
              Your clinician’s guidance, the people you trust, and a little clarity for each day.
            </p>
            <button className="btn primary opening-enter" onClick={enterWorkspace}>
              Open my companion
            </button>
          </div>
          <p className="opening-note">A fictional care experience. Saved on this device.</p>
        </div>
        <figure className="opening-landscape">
          <img
            src="/images/coastal-dunes.jpg"
            alt="Quiet dunes beside a blue sea, photographed on film"
            fetchPriority="high"
          />
          <figcaption>Room to take the next step.</figcaption>
        </figure>
      </main>
    );
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="app-shell">
        <aside className="sidebar" aria-label="Workspace navigation">
          <button
            className="brand-home"
            aria-label="Show welcome screen"
            onClick={() => setShowOpening(true)}
          >
            <Logo />
          </button>
          <div className="workspace-label">YOUR RECOVERY SPACE</div>
          <nav className="main-nav" aria-label="Main navigation">
            <a className="selected" href="#main">
              <Home size={19} />
              Overview
            </a>
            <a href="#care-spaces">
              <HeartPulse size={19} />
              Care spaces<span>{spaces.length}</span>
            </a>
            <a href="#checklist">
              <CalendarDays size={19} />
              Daily checklist
            </a>
            <button
              onClick={() =>
                spaces[0] && open(spaces[0], actor.role === 'family' ? 'conversations' : 'handoff')
              }
              disabled={!spaces.length}
            >
              <Users size={19} />
              Care team
            </button>
          </nav>
          <div className="sidebar-help">
            <span className="help-icon">
              <Leaf size={22} />
            </span>
            <h3>You’re not doing this alone.</h3>
            <p>Keep your approved guidance and care team close.</p>
            <button onClick={() => setDialog('guide')}>
              Meet your companion <ArrowRight size={15} />
            </button>
          </div>
          <button className="sidebar-bottom" onClick={() => setDialog('guide')}>
            <CircleHelp size={18} />
            Help & getting started
          </button>
          <div className="sidebar-profile">
            <Avatar name={actor.name} initials={actor.initials} />
            <div>
              <strong>{actor.name}</strong>
              <span>
                {actor.role === 'doctor'
                  ? 'Clinician workspace'
                  : actor.role === 'family'
                    ? 'Family workspace'
                    : 'Patient workspace'}
              </span>
            </div>
          </div>
        </aside>
        <div className="main-shell">
          <header className="topbar">
            <span className="breadcrumb">
              Your companion <ChevronRight size={14} />
              <strong>Overview</strong>
            </span>
            <div className="topbar-actions">
              <span className="demo-label">
                <span />
                Fictional demo
              </span>
              <label className="role-picker">
                <Settings2 size={15} />
                <span className="sr-only">Demo role</span>
                <select
                  aria-label="Demo role"
                  value={actor.id}
                  onChange={(e) => switchRole(e.target.value)}
                >
                  {state.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.role === 'doctor' ? 'Doctor' : u.role === 'family' ? 'Family' : 'Patient'}{' '}
                      · {u.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <header className="page-heading">
              <div>
                <p className="greeting">
                  Welcome back, {actor.role === 'doctor' ? 'Dr. Chen' : actor.name.split(' ')[0]}
                </p>
                <h1>{actor.role === 'doctor' ? 'A plan to carry home.' : 'One day at a time.'}</h1>
                <p>
                  {actor.role === 'doctor'
                    ? 'Create guidance your patient can carry home.'
                    : 'A clear plan. Familiar faces. One step at a time.'}
                </p>
              </div>
              <div className="heading-date">
                <CalendarDays size={18} />
                <span>
                  {today.toLocaleDateString('en-US', { weekday: 'long' })}
                  <strong>
                    {today.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </strong>
                </span>
              </div>
            </header>
            {persistenceError && (
              <p className="alert error" role="alert">
                {persistenceError} Changes cannot be saved until browser storage is available.
              </p>
            )}
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <section className="welcome-strip">
              <div className="welcome-copy">
                <h2>
                  {actor.role === 'doctor'
                    ? 'Care continues beyond the clinic.'
                    : actor.role === 'family'
                      ? 'A place to support Jamie.'
                      : 'Your care, kept close.'}
                </h2>
                <p>
                  {actor.role === 'doctor'
                    ? 'Shape a companion around your patient’s approved instructions.'
                    : actor.role === 'family'
                      ? 'Find the guidance and conversations Jamie has shared with you.'
                      : 'Find your approved guidance, ask a question, or see what’s next for today.'}
                </p>
                <a className="text-link" href="#checklist">
                  {actor.role === 'doctor' ? 'Review daily guidance' : 'View today’s steps'}
                </a>
              </div>
              <img src="/images/coastal-dunes.jpg" alt="" className="welcome-photo" />
            </section>
            <section id="care-spaces" className="care-spaces">
              <div className="section-title">
                <div>
                  <h2>
                    Your care spaces <span className="count">{spaces.length}</span>
                  </h2>
                  <p>A place for each part of your recovery.</p>
                </div>
                {actor.role === 'doctor' ? (
                  <button
                    className="btn primary"
                    onClick={() => {
                      setError('');
                      setDialog('create');
                    }}
                  >
                    <Plus size={17} />
                    Create care space
                  </button>
                ) : (
                  <a className="text-link" href="#checklist">
                    See today’s steps <ArrowDown size={15} />
                  </a>
                )}
              </div>
              <label className="space-search">
                <Search size={17} />
                <input
                  aria-label="Search care spaces"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a care space…"
                />
                {query && (
                  <button className="btn quiet" onClick={() => setQuery('')}>
                    Clear
                  </button>
                )}
              </label>
              <div className="space-grid">
                {filtered.map((s, i) => {
                  const restricted =
                    actor.role === 'family' &&
                    state.grants.find((g) => g.spaceId === s.id && g.familyId === actor.id)
                      ?.level !== 'Full';
                  const Icon = restricted
                    ? Users
                    : (spaceIcons[
                        state.spaces.findIndex((item) => item.id === s.id) % spaceIcons.length
                      ] ?? HeartPulse);
                  const plan = state.plans.find(
                    (p) => p.spaceId === s.id && p.status === 'approved',
                  );
                  return (
                    <button className="care-card" key={s.id} onClick={() => open(s)}>
                      <div className="card-top">
                        <span className="space-symbol">
                          <Icon size={24} />
                        </span>
                      </div>
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <div className="card-update">
                        <span className={`update-dot ${plan ? '' : 'draft'}`} />
                        {restricted
                          ? 'Your joined conversations'
                          : plan
                            ? 'Approved guidance available'
                            : 'Ready for your care plan'}
                      </div>
                      <div className="card-bottom">
                        <span className="avatar-group">
                          {state.users
                            .filter(
                              (u) =>
                                s.memberIds.includes(u.id) &&
                                (u.role !== 'family' ||
                                  state.grants.some(
                                    (g) =>
                                      g.spaceId === s.id &&
                                      g.familyId === u.id &&
                                      g.level !== 'revoked',
                                  )),
                            )
                            .map((u) => (
                              <Avatar name={u.name} initials={u.initials} small key={u.id} />
                            ))}
                        </span>
                        <span>{actor.role === 'doctor' ? 'Jamie Morgan' : 'Your care team'}</span>
                      </div>
                      <span className="sr-only">
                        Open {s.name} care space {i + 1}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filtered.length === 0 && (
                <div className="empty-state">
                  <Search />
                  <h3>{query ? 'No matching care spaces' : 'Your first care space starts here'}</h3>
                  <p>
                    {query
                      ? 'Try another name or clear the search.'
                      : actor.role === 'family'
                        ? 'Your access may have been revoked. Ask Jamie or Dr. Chen to review it.'
                        : 'Your doctor can create a space and publish a plan.'}
                  </p>
                  {query && (
                    <button className="btn secondary" onClick={() => setQuery('')}>
                      Clear search
                    </button>
                  )}
                </div>
              )}
            </section>
            <div className="home-lower">
              <Checklist
                onSource={(spaceId, id) => setSelected({ id: spaceId, tab: 'plan', sourceId: id })}
              />
              <aside className="support-column" aria-label="Care support">
                <section className="team-panel">
                  <div className="row between">
                    <h2>Your care team</h2>
                    <Users size={18} />
                  </div>
                  <div className="team-person">
                    <Avatar name="Dr. Maya Chen" initials="MC" />
                    <div>
                      <h3>Dr. Maya Chen</h3>
                      <p>Your clinician</p>
                    </div>
                    <span className="badge">Doctor</span>
                  </div>
                  <div className="team-person">
                    <Avatar name="Alex Morgan" initials="AM" />
                    <div>
                      <h3>Alex Morgan</h3>
                      <p>Family support</p>
                    </div>
                    <Heart size={16} />
                  </div>
                  <p className="team-caption">
                    Shared with care. Private conversations stay private.
                  </p>
                  {spaces[0] && (
                    <button
                      className="btn secondary full-width"
                      onClick={() => open(spaces[0], 'access')}
                    >
                      People & access <ArrowRight size={16} />
                    </button>
                  )}
                </section>
                <section className="companion-panel">
                  <span className="companion-icon">
                    <MessageCircle size={24} />
                  </span>
                  <h2>Questions along the way?</h2>
                  <p>Your companion can help you find answers in your clinician-approved plan.</p>
                  <button
                    className="btn primary full-width"
                    disabled={!spaces.length}
                    onClick={() => spaces[0] && open(spaces[0])}
                  >
                    Open a conversation <ArrowRight size={16} />
                  </button>
                  <span className="muted small-text">Fictional source-based demonstration</span>
                </section>
              </aside>
            </div>
            <footer className="app-footer">
              <span>
                <ShieldCheck size={15} /> Made for a more supported recovery.
              </span>
              <button onClick={() => setDialog('reset')}>
                <LogOut size={14} />
                Reset fictional demo
              </button>
            </footer>
            <p className="demo-disclosure">
              Demonstration only. All people and instructions are fictional. Records are stored in
              this browser; role switching is not authentication. Do not enter real patient
              information.
            </p>
          </main>
        </div>
      </div>
      {selected && (
        <Modal
          title={spaces.find((s) => s.id === selected.id)?.name ?? 'Care space'}
          wide
          onClose={() => setSelected(null)}
        >
          <CareSpace
            key={`${selected.id}:${actor.id}`}
            spaceId={selected.id}
            initialTab={selected.tab}
            sourceId={selected.sourceId}
            onClose={() => setSelected(null)}
          />
        </Modal>
      )}
      {dialog === 'create' && (
        <Modal title="Create a care space" onClose={() => setDialog(null)}>
          <form className="stack dialog-body" onSubmit={create}>
            <p>
              A focused home for Jamie’s next recovery plan. You can build and publish guidance
              after creating it.
            </p>
            <label className="field">
              Care-space name
              <input
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Getting back to your routine"
              />
            </label>
            <label className="field">
              Recovery context
              <textarea
                required
                maxLength={300}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What will this space help Jamie with?"
              />
            </label>
            <p className="inline-note">
              This demo invites Jamie Morgan. Family access is granted separately; no private
              conversation is shared automatically.
            </p>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <div className="row end">
              <button type="button" className="btn secondary" onClick={() => setDialog(null)}>
                Cancel
              </button>
              <button className="btn primary" disabled={pending}>
                {pending ? 'Creating…' : 'Create care space'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === 'guide' && (
        <Modal title="A companion shaped by your care team" onClose={() => setDialog(null)}>
          <div className="dialog-body stack">
            <div className="guide-step">
              <Stethoscope />
              <div>
                <h3>Your clinician builds the plan</h3>
                <p>
                  Instructions start as drafts, keep their sources, and become active only after
                  approval.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <BookOpen />
              <div>
                <h3>You take it one day at a time</h3>
                <p>
                  Follow approved guidance, report checklist actions, and see when restrictions
                  apply.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <Users />
              <div>
                <h3>You choose who supports you</h3>
                <p>
                  You and your doctor can manage family access. Private chats stay with their
                  participants.
                </p>
              </div>
            </div>
            <div className="guide-step">
              <MessageCircle />
              <div>
                <h3>Know when to contact your doctor</h3>
                <p>
                  When your plan does not cover a question, review and approve a summary before
                  sharing it with Dr. Chen. This demo is not continuously monitored.
                </p>
              </div>
            </div>
            <button className="btn primary" onClick={() => setDialog(null)}>
              <Check size={17} />
              Got it
            </button>
          </div>
        </Modal>
      )}
      {dialog === 'reset' && (
        <Modal title="Reset the fictional demonstration?" onClose={() => setDialog(null)}>
          <div className="dialog-body stack">
            <p>
              This removes the plans, conversations, documents, and reports you created in this
              browser and restores the original fictional examples.
            </p>
            <div className="row end">
              <button className="btn secondary" onClick={() => setDialog(null)}>
                Keep my demo
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  try {
                    repository.resetDemo();
                    setDialog(null);
                  } catch (e) {
                    setError(errorText(e));
                  }
                }}
              >
                Reset demo
              </button>
            </div>
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <Companion />
    </ErrorBoundary>
  );
}
