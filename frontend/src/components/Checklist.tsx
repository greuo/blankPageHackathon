import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  Check,
  Clock3,
  CalendarDays,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { repository, getActor, getChecklistOccurrences, localDate } from '../data/repository';
import { dateTime, errorText } from './ui';
gsap.registerPlugin(useGSAP);
function CheckControl({
  checked,
  pending,
  disabled,
  onClick,
  label,
}: {
  checked: boolean;
  pending: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const previous = useRef(checked);
  useGSAP(
    () => {
      if (pending) return;
      const icon = ref.current?.querySelector('.check-icon');
      if (
        icon &&
        checked &&
        !previous.current &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        const tl = gsap.timeline();
        tl.fromTo(
          icon,
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.2, ease: 'power2.out' },
        );
      }
      previous.current = checked;
    },
    { scope: ref, dependencies: [checked, pending], revertOnUpdate: true },
  );
  return (
    <button
      ref={ref}
      className={`check-control ${checked ? 'checked' : ''}`}
      aria-label={label}
      aria-pressed={checked}
      disabled={pending || disabled}
      onClick={onClick}
    >
      {pending ? <span className="spinner" /> : <Check size={18} className="check-icon" />}
    </button>
  );
}
export default function Checklist({
  onSource,
}: {
  onSource: (spaceId: string, id: string) => void;
}) {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const actor = getActor(state);
  const [day, setDay] = useState(localDate());
  const [pending, setPending] = useState<string[]>([]);
  const [error, setError] = useState('');
  const requestIds = useRef<Record<string, string>>({});
  const occurrences = getChecklistOccurrences(state, day);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const today = localDate(now);
  const date = new Date(`${day}T12:00:00`);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const move = (n: number) => {
    const d = new Date(`${day}T12:00:00`);
    d.setDate(d.getDate() + n);
    setDay(localDate(d));
  };
  async function toggle(spaceId: string, instructionId: string) {
    const key = `${instructionId}:${day}`;
    if (pending.includes(key)) return;
    const report = state.reports.find(
      (r) =>
        r.instructionId === instructionId && r.spaceId === spaceId && r.date === day && !r.undoneAt,
    );
    setPending((p) => [...p, key]);
    setError('');
    try {
      if (report) await repository.undoReport(report.id);
      else {
        requestIds.current[key] ??= crypto.randomUUID();
        await repository.report({ id: requestIds.current[key], spaceId, instructionId, date: day });
        delete requestIds.current[key];
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setPending((p) => p.filter((x) => x !== key));
    }
  }
  return (
    <section id="checklist" className="daily-section">
      <div className="section-title">
        <div>
          <h2>Your daily checklist</h2>
          <p>Small steps, guided by your approved plan.</p>
        </div>
        <div className="date-controls">
          <button className="icon-btn" aria-label="Previous day" onClick={() => move(-1)}>
            <ChevronLeft size={18} />
          </button>
          <label className="date-picker">
            <CalendarDays size={16} />
            <span>
              {day === today
                ? 'Today'
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
            <input
              aria-label="Checklist date"
              type="date"
              value={day}
              onChange={(e) => e.target.value && setDay(e.target.value)}
            />
          </label>
          <button className="icon-btn" aria-label="Next day" onClick={() => move(1)}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="checklist-panel">
        {error && (
          <p className="alert error" role="alert">
            {error} Your previous report state is unchanged. Try again.
          </p>
        )}
        {occurrences.length === 0 ? (
          <div className="empty-state">
            <ShieldCheck />
            <h3>Nothing scheduled for this day</h3>
            <p>
              Only published instructions appear here. Family Support or Full access is needed for
              checklists.
            </p>
          </div>
        ) : (
          occurrences.map(({ space, instruction }) => {
            const report = state.reports.find(
              (r) =>
                r.spaceId === space.id &&
                r.instructionId === instruction.id &&
                r.date === day &&
                !r.undoneAt,
            );
            const reporter = state.users.find((u) => u.id === report?.authorId);
            const isAction = instruction.kind === 'action';
            const key = `${instruction.id}:${day}`;
            const canCorrect = actor.role !== 'doctor' && (!report || report.authorId === actor.id);
            return (
              <div
                className={`checklist-item ${report ? 'complete' : ''}`}
                key={`${space.id}:${instruction.id}`}
              >
                {isAction ? (
                  <CheckControl
                    checked={!!report}
                    pending={pending.includes(key)}
                    disabled={!canCorrect || day > today}
                    onClick={() => void toggle(space.id, instruction.id)}
                    label={
                      report
                        ? `Correct report: ${instruction.text}`
                        : `Report complete: ${instruction.text}`
                    }
                  />
                ) : (
                  <span
                    className={`item-kind ${instruction.kind === 'restriction' ? 'restriction' : 'appointment'}`}
                  >
                    {instruction.kind === 'restriction' ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <CalendarDays size={20} />
                    )}
                  </span>
                )}
                <div className="checklist-copy">
                  <span className="checklist-space">{space.name}</span>
                  <h3>{instruction.text}</h3>
                  {report ? (
                    <p className="report-label">
                      {reporter?.role === 'family'
                        ? `Reported by ${reporter.name}`
                        : `Reported by ${reporter?.name ?? 'participant'}`}{' '}
                      · {dateTime(report.reportedAt)}
                      {canCorrect && ' · Select the check to correct'}
                    </p>
                  ) : (
                    <p>
                      <Clock3 size={13} />
                      {instruction.kind === 'restriction'
                        ? `${day === today ? (now.getTime() < Date.parse(instruction.dueAt) ? 'Not started · starts ' : instruction.endsAt && now.getTime() >= Date.parse(instruction.endsAt) ? 'Ended · started ' : 'In effect · started ') : 'Starts '}${dateTime(instruction.dueAt)}${instruction.endsAt ? ` · until ${dateTime(instruction.endsAt)}` : ''}`
                        : instruction.kind === 'appointment'
                          ? `Follow-up · ${dateTime(instruction.dueAt)}`
                          : `${new Date(instruction.dueAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · ${instruction.recurrence === 'daily' ? 'Daily action' : 'One-time action'}`}
                    </p>
                  )}
                </div>
                <button
                  className="source-icon icon-btn"
                  aria-label={`View source: ${instruction.text}`}
                  onClick={() => onSource(space.id, instruction.id)}
                >
                  <FileText size={17} />
                </button>
              </div>
            );
          })
        )}
        <footer className="checklist-footer">
          <ShieldCheck size={15} /> Completion is a report, not proof of care. Times shown in {zone}
          .
        </footer>
      </div>
    </section>
  );
}
