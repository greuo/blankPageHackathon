import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Footprints,
  Home,
  Mail,
  Pill,
  Plus,
  Phone,
  TriangleAlert,
  X,
} from 'lucide-react';
import Opening from '../components/Opening';
import { Modal, errorText } from '../components/ui';
import { useSurfaceEntrance, reducedMotion } from '../components/motion';
import Assistant from './Assistant';
import Instructions from './Instructions';
import { patientStore } from './store';
import {
  clock,
  dailyTasks,
  dateKey,
  doseSlots,
  doseStatus,
  id,
  isEmergency,
  milestones,
  quietHours,
  summary,
  timeline,
  validateCheckIn,
  type CheckIn,
  type Emergency,
} from './model';
import './patient.css';
type Dialog =
  'pills' | 'checkin' | 'roadmap' | 'report' | 'notifications' | 'source' | 'reset' | null;
export default function PatientApp() {
  const state = useSyncExternalStore(patientStore.subscribe, patientStore.getSnapshot);
  const [showOpening, setShowOpening] = useState(() => {
    try {
      return sessionStorage.getItem('patient-opening-v1') !== 'seen';
    } catch {
      return true;
    }
  });
  const [route, setRoute] = useState<'home' | 'add'>('home'),
    [dialog, setDialog] = useState<Dialog>(null),
    [fullChat, setFullChat] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const [resumeCheckIn, setResumeCheckIn] = useState(false);
  const [emergencyFallback, setEmergencyFallback] = useState<Emergency | null>(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(timer);
  }, []);
  const now = clock(state);
  void tick;
  const today = dateKey(now),
    progress = timeline(state, now),
    todayCheck = state.checkIns.find((c) => c.date === today);
  const [check, setCheck] = useState<CheckIn>({
    date: today,
    pain: 5,
    temperature: '',
    feeling: '',
    notes: '',
  });
  const [emergencyId, setEmergencyId] = useState<string | null>(null),
    [callStage, setCallStage] = useState<'idle' | 'calling' | 'complete'>('idle');
  const emergency =
    state.emergencies.find((e) => e.id === emergencyId) ??
    (emergencyFallback?.id === emergencyId ? emergencyFallback : null);
  const root = useRef<HTMLDivElement>(null);
  useSurfaceEntrance(root, [showOpening, route], '.patient-greeting, .patient-dashboard');
  function action(change: Parameters<typeof patientStore.update>[0]) {
    setError('');
    try {
      patientStore.update(change);
      return true;
    } catch (reason) {
      setError(errorText(reason));
      return false;
    }
  }
  function enter() {
    try {
      sessionStorage.setItem('patient-opening-v1', 'seen');
    } catch {
      /* Optional session preference. */
    }
    setShowOpening(false);
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  }
  function navigate(next: 'home' | 'add') {
    setRoute(next);
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'instant' });
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }));
  }
  function trigger(text: string, fromCheckIn = false, demo = false) {
    const eventId = id();
    const event = { id: eventId, at: now.toISOString(), trigger: text, demo };
    setResumeCheckIn(fromCheckIn);
    setDraft('');
    setEmergencyFallback(event);
    setEmergencyId(eventId);
    setCallStage('idle');
    setFullChat(false);
    setDialog(null);
    action((s) => s.emergencies.push(event));
  }
  const important = state.instructions
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3);
  const missed = doseSlots.filter((slot) => doseStatus(state, slot, now) === 'Not reported');
  const reminders = [
    ...missed.map(
      (slot) =>
        `${slot.label} dose has no report. Check your prescribed instructions; ask your doctor what to do about a missed dose.`,
    ),
    ...(!todayCheck && now.getHours() >= 9 ? ['Your daily check-in is ready.'] : []),
    ...(quietHours(state, now) >= 48
      ? [
          'No recent check-in is recorded. The prepared demo uses a 48-hour reminder threshold. No doctor notification has been sent.',
        ]
      : []),
  ];
  const done = (task: (typeof dailyTasks)[number]) =>
    task.kind === 'dose'
      ? doseSlots.every((slot) => state.doses[today]?.includes(slot.id))
      : task.kind === 'checkin'
        ? !!todayCheck
        : !!state.tasks[today]?.includes(task.id);
  function taskClick(task: (typeof dailyTasks)[number]) {
    if (task.kind === 'dose') setDialog('pills');
    else if (task.kind === 'checkin') {
      setCheck(todayCheck ?? { date: today, pain: 5, temperature: '', feeling: '', notes: '' });
      setDialog('checkin');
    } else
      action((s) => {
        const list = s.tasks[today] ?? [];
        s.tasks[today] = list.includes(task.id)
          ? list.filter((value) => value !== task.id)
          : [...list, task.id];
      });
  }
  function saveCheck(event: FormEvent) {
    event.preventDefault();
    try {
      if (isEmergency(check.notes)) {
        trigger(check.notes, true);
        return;
      }
      validateCheckIn(check);
      if (
        action((s) => {
          s.checkIns = [
            ...s.checkIns.filter((c) => c.date !== today),
            { ...check, date: today },
          ].sort((a, b) => a.date.localeCompare(b.date));
        })
      ) {
        setDialog(null);
        setNotice('Today’s check-in is saved. You can review or update it anytime today.');
      }
    } catch (reason) {
      setError(errorText(reason));
    }
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([summary(state, now)], { type: 'text/plain;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `care-progress-${today}.txt`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const assistant = (expanded = false) => (
    <Assistant
      state={state}
      text={draft}
      setText={setDraft}
      expanded={expanded}
      onExpand={() => setFullChat(!expanded)}
      onReport={() => {
        setFullChat(false);
        setDialog('report');
      }}
      onEmergency={trigger}
    />
  );
  if (showOpening) return <Opening onEnter={enter} />;
  const modal = (title: string, children: ReactNode) => (
    <Modal
      title={title}
      onClose={() => {
        setDialog(null);
        setError('');
      }}
      wide
    >
      {error && (
        <p className="alert error" role="alert">
          {error}
        </p>
      )}
      {children}
    </Modal>
  );
  return (
    <div className="patient-app" ref={root}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="patient-header">
        <button
          className="patient-brand"
          onClick={() => navigate('home')}
          aria-label="Care companion home"
        >
          Care <span>companion</span>
        </button>
        <nav aria-label="Main navigation">
          <button className={route === 'home' ? 'current' : ''} onClick={() => navigate('home')}>
            <Home size={21} />
            Home
          </button>
        </nav>
        <div className="patient-header-actions">
          <button
            className="icon-btn notification-button"
            aria-label={`Notifications, ${reminders.length} reminders`}
            onClick={() => setDialog('notifications')}
          >
            <Bell size={23} />
            {reminders.length > 0 && <span />}
          </button>
          <button
            className="patient-profile"
            aria-label="Patient profile and progress"
            onClick={() => setDialog('report')}
          >
            A
          </button>
        </div>
      </header>
      {(patientStore.error() || error) && (
        <p className="alert error patient-storage-error" role="alert">
          {patientStore.error() || error}{' '}
          {patientStore.error() && (
            <button onClick={() => setDialog('reset')}>Reset fictional demo</button>
          )}
        </p>
      )}
      {route === 'add' ? (
        <Instructions
          state={state}
          onBack={() => navigate('home')}
          onSaved={() => {
            navigate('home');
            setNotice('Instructions saved exactly as provided.');
          }}
        />
      ) : (
        <main id="main" tabIndex={-1} className="patient-home">
          <div className="patient-dashboard">
            <div className="patient-content">
              <header className="patient-greeting">
                <div>
                  <h1>
                    {now.getHours() < 12
                      ? 'Good morning'
                      : now.getHours() < 18
                        ? 'Good afternoon'
                        : 'Good evening'}
                    , Alex
                  </h1>
                  <p>Your care plan, one step at a time.</p>
                </div>
                <button className="btn primary add-instructions" onClick={() => navigate('add')}>
                  <Plus size={22} />
                  Add instructions
                </button>
              </header>
              {notice && (
                <p className="patient-success" role="status">
                  <Check size={18} />
                  {notice}
                  <button
                    className="icon-btn"
                    aria-label="Dismiss confirmation"
                    onClick={() => setNotice('')}
                  >
                    <X size={16} />
                  </button>
                </p>
              )}
              <section className="patient-panel today-tasks">
                <div className="patient-section-heading">
                  <div>
                    <h2>To-Do</h2>
                    <p>Daily steps from your prepared plan</p>
                  </div>
                  <span>
                    {dailyTasks.length} tasks · {dailyTasks.filter(done).length} completed
                  </span>
                </div>
                <div className="patient-task-list">
                  {dailyTasks.map((task, index) => {
                    const Icon = [Footprints, Pill, ClipboardList][index];
                    return (
                      <div className={`patient-task ${done(task) ? 'is-done' : ''}`} key={task.id}>
                        <button
                          role="checkbox"
                          aria-checked={done(task)}
                          aria-label={`${done(task) ? 'Review or undo' : 'Record'} ${task.title}`}
                          className="task-check"
                          onClick={() => taskClick(task)}
                        >
                          {done(task) && <Check size={19} />}
                        </button>
                        <span className="patient-icon">
                          <Icon size={24} />
                        </span>
                        <button
                          className="task-open"
                          onClick={() =>
                            task.kind === 'task' ? setDialog('source') : taskClick(task)
                          }
                        >
                          <span>
                            <strong>{task.title}</strong>
                            <small>{done(task) ? 'Reported today' : task.detail}</small>
                          </span>
                          <ChevronRight size={19} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
              <section className="patient-panel important-instructions">
                <div className="patient-section-heading">
                  <span className="caution-icon">
                    <TriangleAlert size={23} />
                  </span>
                  <div>
                    <h2>Important instructions</h2>
                    <p>From your care guidance</p>
                  </div>
                  <button className="text-button" onClick={() => setDialog('source')}>
                    View all
                    <ChevronRight size={17} />
                  </button>
                </div>
                {important.map((text, index) => (
                  <button key={text} className="precaution-row" onClick={() => setDialog('source')}>
                    <span className="patient-icon">
                      {index === 0 ? (
                        <Activity size={21} />
                      ) : index === 1 ? (
                        <CalendarDays size={21} />
                      ) : (
                        <FileText size={21} />
                      )}
                    </span>
                    <span>{text}</span>
                    <ChevronRight size={17} />
                  </button>
                ))}
              </section>
              <section className="patient-panel recovery-progress">
                <div className="progress-heading">
                  <h2>Recovery timeline</h2>
                  <strong>{progress.percent}%</strong>
                  <button className="text-button" onClick={() => setDialog('roadmap')}>
                    View roadmap
                    <ChevronRight size={17} />
                  </button>
                </div>
                <p>
                  Day {progress.day} of {state.duration} · Timeline from the prepared demo plan
                </p>
                <progress
                  max="100"
                  value={progress.percent}
                  aria-label="Planned timeline elapsed"
                />
                <div className="progress-scale">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <small>Elapsed time is separate from how you are healing.</small>
              </section>
              <section className="patient-lower">
                <div>
                  <h2>A moment for you</h2>
                  <p>
                    {todayCheck
                      ? `Today’s pain report: ${todayCheck.pain}/10. Feeling ${todayCheck.feeling.toLowerCase()}.`
                      : 'Your daily check-in helps you keep a record of how you feel.'}
                  </p>
                  <button
                    className="text-button"
                    onClick={() => {
                      setCheck(
                        todayCheck ?? {
                          date: today,
                          pain: 5,
                          temperature: '',
                          feeling: '',
                          notes: '',
                        },
                      );
                      setDialog('checkin');
                    }}
                  >
                    {todayCheck ? 'Review check-in' : 'Start today’s check-in'}
                    <ArrowRight size={17} />
                  </button>
                </div>
                <button className="btn secondary" onClick={() => setDialog('report')}>
                  <FileText size={18} />
                  Progress report
                </button>
              </section>
              <footer className="patient-demo-footer">
                <span>
                  Fictional patient demo · saved in this browser. Do not enter real patient details.
                </span>
                <details>
                  <summary>Demo controls</summary>
                  <p>
                    Prepared plan: 9 AM check-in, two daily dose slots, 48-hour quiet threshold.
                    These settings are fixed in this demo.
                  </p>
                  <button
                    onClick={() =>
                      action((s) => {
                        s.demoHours += 12;
                      })
                    }
                  >
                    Skip ahead 12 hours
                  </button>
                  <button
                    onClick={() => {
                      trigger('Demonstration emergency', false, true);
                    }}
                  >
                    Preview emergency
                  </button>
                  <button onClick={() => setShowOpening(true)}>Replay opening</button>
                  <button onClick={() => setDialog('reset')}>Reset demo</button>
                </details>
                {state.demoHours > 0 && (
                  <strong>Demo clock advanced {state.demoHours} hours</strong>
                )}
              </footer>
            </div>
            {assistant()}
          </div>
        </main>
      )}
      {fullChat && (
        <Modal title="Your care assistant" onClose={() => setFullChat(false)} wide>
          <div className="fullscreen-assistant">{assistant(true)}</div>
        </Modal>
      )}
      {dialog === 'source' &&
        modal(
          'Your provided instructions',
          <div className="patient-source">
            <p>
              Added for {state.doctor}. Wording is stored as provided; clinician identity has not
              been verified in this demo.
            </p>
            <pre>{state.instructions}</pre>
            {state.attachments.map((file, index) => (
              <a key={index} href={file.data} download={file.name} className="attachment-row">
                <FileText size={18} />
                {file.name}
                <Download size={17} />
              </a>
            ))}
            <button
              className="btn secondary"
              onClick={() => {
                setDialog(null);
                navigate('add');
              }}
            >
              Add or update provided text
            </button>
          </div>,
        )}
      {dialog === 'pills' &&
        modal(
          'Your pill tracker',
          <div className="pill-tracker">
            <p>
              Follow the medication and dose written in your discharge instructions. This tracker
              records reports only.
            </p>
            <p className="field-help">
              Two daily slots are preconfigured for this fictional plan. Missed means no report two
              hours after the scheduled time; this is a demo convention.
            </p>
            {doseSlots.map((slot) => {
              const status = doseStatus(state, slot, now);
              return (
                <div className="dose-row" key={slot.id}>
                  <span className="patient-icon">
                    <Pill size={24} />
                  </span>
                  <div>
                    <strong>{slot.label}</strong>
                    <small>
                      {slot.hour === 9 ? '9:00 AM' : '8:00 PM'} · {status}
                    </small>
                  </div>
                  <button
                    className={`btn ${status === 'Reported' ? 'secondary' : 'primary'}`}
                    disabled={status === 'Upcoming'}
                    onClick={() =>
                      action((s) => {
                        const list = s.doses[today] ?? [];
                        s.doses[today] = list.includes(slot.id)
                          ? list.filter((v) => v !== slot.id)
                          : [...list, slot.id];
                      })
                    }
                  >
                    {status === 'Reported'
                      ? 'Undo report'
                      : status === 'Upcoming'
                        ? 'Not due yet'
                        : 'Report taken'}
                  </button>
                </div>
              );
            })}
            {missed.length > 0 && (
              <p className="patient-warning">
                A scheduled dose has no report. Consult your prescribed instructions or doctor about
                a missed dose. This app does not change the next dose.
              </p>
            )}
          </div>,
        )}
      {dialog === 'checkin' &&
        modal(
          'Your daily check-in',
          <form className="checkin-form" onSubmit={saveCheck} noValidate>
            <p>Prepared questions. Keep a record in your own words.</p>
            <label>
              Pain level: {check.pain} out of 10
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={check.pain}
                onChange={(e) => setCheck({ ...check, pain: Number(e.target.value) })}
              />
              <span className="range-labels">
                <small>0 · No pain</small>
                <small>10 · Worst pain</small>
              </span>
            </label>
            <label>
              Temperature in °C <small>Optional</small>
              <input
                type="number"
                min="30"
                max="45"
                step="0.1"
                value={check.temperature}
                onChange={(e) => setCheck({ ...check, temperature: e.target.value })}
                placeholder="e.g. 36.8"
              />
            </label>
            <fieldset>
              <legend>How are you feeling?</legend>
              <div className="feeling-options">
                {['Low', 'Okay', 'Good'].map((feeling) => (
                  <label key={feeling}>
                    <input
                      type="radio"
                      name="feeling"
                      required
                      value={feeling}
                      checked={check.feeling === feeling}
                      onChange={() => setCheck({ ...check, feeling })}
                    />
                    {feeling}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Anything new?
              <textarea
                rows={3}
                maxLength={3000}
                value={check.notes}
                onChange={(e) => {
                  const notes = e.target.value;
                  setCheck({ ...check, notes });
                }}
                placeholder="Record a change or a question for your doctor"
              />
            </label>
            {state.checkIns.length > 1 && (
              <div className="checkin-trend">
                <h3>Your pain reports</h3>
                {state.checkIns.slice(-5).map((c) => (
                  <p key={c.date}>
                    <time>{c.date}</time>
                    <meter min={0} max={10} value={c.pain} aria-label={`Pain on ${c.date}`} />
                    <strong>{c.pain}/10</strong>
                  </p>
                ))}
                <small>Self-reported values. Your doctor can interpret changes.</small>
              </div>
            )}
            {error && (
              <p className="alert error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary">
              <Check size={18} />
              Save check-in
            </button>
          </form>,
        )}
      {dialog === 'roadmap' &&
        modal(
          'Your recovery roadmap',
          <div className="roadmap">
            <p>
              Timing is an estimate from the prepared plan. Milestones do not give clearance to
              change activity or medication.
            </p>
            {milestones.map((milestone, index) => (
              <div className="milestone" key={milestone.id}>
                <span>
                  {milestone.day < progress.day
                    ? 'Earlier'
                    : milestone.day === progress.day
                      ? 'Now'
                      : index === milestones.findIndex((item) => item.day > progress.day)
                        ? 'Next'
                        : 'Later'}{' '}
                  · around day {milestone.day}
                </span>
                <h3>{milestone.title}</h3>
                <p>{milestone.detail}</p>
                <button
                  className="btn secondary"
                  disabled={state.acknowledged.includes(milestone.id)}
                  onClick={() => action((s) => s.acknowledged.push(milestone.id))}
                >
                  {state.acknowledged.includes(milestone.id) ? 'Acknowledged' : 'Got it'}
                </button>
              </div>
            ))}
          </div>,
        )}
      {dialog === 'notifications' &&
        modal(
          'Your reminders',
          <div className="reminders">
            {reminders.length ? (
              reminders.map((text) => (
                <p key={text}>
                  <Bell size={18} />
                  {text}
                </p>
              ))
            ) : (
              <p>You’re up to date. New reminders will appear here.</p>
            )}
            <button className="btn secondary" onClick={() => setDialog('pills')}>
              Open pill tracker
            </button>
          </div>,
        )}
      {dialog === 'report' &&
        modal(
          'Progress report',
          <div className="progress-report">
            <p>
              <Mail size={18} />
              Prepared for {state.doctor} · {state.email}
            </p>
            <p>
              This is the plain-text view a doctor could receive through a future secure link. Email
              delivery and link hosting are not connected.
            </p>
            <pre>{summary(state, now)}</pre>
            <button className="btn primary" onClick={download}>
              <Download size={18} />
              Download text report
            </button>
          </div>,
        )}
      {dialog === 'reset' &&
        modal(
          'Reset fictional demo?',
          <div>
            <p>
              This removes your patient-demo edits, messages and reports from this browser and
              restores sample instructions.
            </p>
            <button
              className="btn danger"
              onClick={() => {
                try {
                  patientStore.reset();
                  setDialog(null);
                  setNotice('Fictional demo reset.');
                } catch (reason) {
                  setError(errorText(reason));
                }
              }}
            >
              Reset fictional demo
            </button>
          </div>,
        )}
      {emergency && (
        <Modal
          title="Get emergency help"
          onClose={() => {
            setEmergencyId(null);
            if (resumeCheckIn) {
              setDialog('checkin');
              setResumeCheckIn(false);
            }
          }}
          wide
        >
          <section className="emergency-panel">
            {error && (
              <p className="alert error" role="alert">
                This event could not be saved: {error}. Emergency help remains available.
              </p>
            )}
            <span className="emergency-symbol">
              <Phone size={34} />
            </span>
            <h2>If this is happening now, call 911.</h2>
            <p>
              Use your phone to call local emergency services. Do not wait for a reply from this app
              or your doctor.
            </p>
            <p className="emergency-demo-label">
              Demo only. This app never places a call or sends an emergency email.
            </p>
            <blockquote>{emergency.trigger}</blockquote>
            {callStage === 'idle' ? (
              <button
                className="btn danger"
                onClick={() => setCallStage(reducedMotion() ? 'complete' : 'calling')}
              >
                <Phone size={18} />
                Play 911 demo
              </button>
            ) : callStage === 'calling' ? (
              <div
                className="demo-call"
                role="status"
                onAnimationEnd={() => setCallStage('complete')}
              >
                <Phone size={24} />
                Simulating a call. No call is being placed.
              </div>
            ) : (
              <p className="patient-success">Call animation complete. No real call was placed.</p>
            )}
            <button
              className="btn secondary"
              disabled={!!emergency.calledAt}
              onClick={() =>
                action((s) => {
                  let saved = s.emergencies.find((e) => e.id === emergency.id);
                  if (!saved) {
                    saved = { ...emergency };
                    s.emergencies.push(saved);
                  }
                  saved.calledAt = now.toISOString();
                })
              }
            >
              {emergency.calledAt ? '911 acknowledgment recorded (demo)' : '911 called (demo)'}
            </button>
            <p className="field-help">
              Emergency events stay in your local report. Emergency email delivery is disabled.
            </p>
            <a
              href="https://www.heart.org/en/news/2025/04/15/call-911-for-heart-attack-or-stroke-symptoms-or-just-drive-to-the-er"
              target="_blank"
              rel="noreferrer"
            >
              Emergency guidance · American Heart Association
            </a>
          </section>
        </Modal>
      )}
    </div>
  );
}
