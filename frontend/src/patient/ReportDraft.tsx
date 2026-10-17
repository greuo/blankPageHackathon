import { useEffect, useId, useRef, useState } from 'react';
import { FileText } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import SquishSwitch from '../components/SquishSwitch';
import StatusMark, { type StatusMarkState } from '../components/StatusMark';
import { dateKey, summary, type PatientState } from './model';
import './ReportDraft.css';

export interface EmailDraft {
  to: string;
  subject: string;
  body: string;
}

export function buildEmailDraft(
  state: PatientState,
  now: Date,
  includeInstructions: boolean,
): EmailDraft {
  if (!Number.isFinite(now.getTime())) throw new Error('A valid report date is required.');
  const reportState = includeInstructions
    ? state
    : {
        ...state,
        instructions: 'Not included in this draft. The full text remains in your progress report.',
      };
  return {
    to: state.email,
    subject: `${state.patient} · Care progress · ${dateKey(now)}`,
    body: `Hello ${state.doctor},\n\nHere are my patient-reported care records.\n\n${summary(reportState, now)}`,
  };
}

const labels: Record<StatusMarkState, string> = {
  pending: 'Ready to prepare',
  running: 'Preparing your draft',
  done: 'Draft ready to review',
  failed: 'Draft could not be prepared',
  cancelled: 'Preparation cancelled',
};

/** Creates a local, reviewable text preview. This component never contacts an email service. */
export default function ReportDraft({ state, now }: { state: PatientState; now: Date }) {
  const [includeInstructions, setIncludeInstructions] = useState(false);
  const [status, setStatus] = useState<StatusMarkState>('pending');
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [error, setError] = useState('');
  const pending = useRef<(() => void) | null>(null);
  const generation = useRef(0);
  const reducedMotion = useReducedMotion();
  const descriptionId = useId();
  const titleId = useId();
  const reportDay = dateKey(now);

  // A changed record or date must never leave an outdated draft marked ready.
  useEffect(() => {
    generation.current += 1;
    pending.current?.();
    pending.current = null;
    setDraft(null);
    setStatus('pending');
    setError('');
    return () => {
      generation.current += 1;
      pending.current?.();
      pending.current = null;
    };
  }, [state, reportDay, includeInstructions]);

  function prepare() {
    if (status === 'running') return;
    pending.current?.();
    const current = ++generation.current;
    setDraft(null);
    setError('');
    setStatus('running');
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Yield one paint before formatting the report. There is no artificial loading delay.
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        if (generation.current !== current) return;
        pending.current = null;
        try {
          setDraft(buildEmailDraft(state, now, includeInstructions));
          setStatus('done');
        } catch (reason) {
          setError(
            reason instanceof Error ? reason.message : 'Please try preparing the draft again.',
          );
          setStatus('failed');
        }
      }, 0);
    });
    pending.current = () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }

  function cancel() {
    generation.current += 1;
    pending.current?.();
    pending.current = null;
    setStatus('cancelled');
  }

  return (
    <section className="report-draft" aria-labelledby={titleId}>
      <div className="report-draft__heading">
        <div>
          <span className="report-draft__eyebrow">For your doctor</span>
          <h3 id={titleId}>Prepare an email draft</h3>
        </div>
        <FileText size={22} aria-hidden="true" />
      </div>
      <p id={descriptionId} className="report-draft__description">
        A local preview from your recorded progress. No email is sent.
      </p>
      <div className="report-draft__preference">
        <SquishSwitch
          checked={includeInstructions}
          onChange={setIncludeInstructions}
          label="Include provided instructions"
          describedBy={descriptionId}
        />
      </div>
      <div className="report-draft__actions">
        <button className="btn secondary" onClick={prepare} aria-disabled={status === 'running'}>
          {draft ? 'Prepare again' : 'Prepare email draft'}
        </button>
        {status === 'running' && (
          <button className="report-draft__cancel" onClick={cancel}>
            Cancel
          </button>
        )}
      </div>
      <StatusMark status={status} label={labels[status]} />
      <div className="report-draft__preview" aria-busy={status === 'running'}>
        {status === 'running' && (
          <div className="report-draft__skeleton" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
        {draft && (
          <motion.div
            className="report-draft__document"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reducedMotion ? 0 : 0.2 }}
          >
            <dl>
              <div>
                <dt>To</dt>
                <dd>{draft.to || 'No doctor email added'}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{draft.subject}</dd>
              </div>
            </dl>
            <pre tabIndex={0} aria-label="Prepared email body">
              {draft.body}
            </pre>
          </motion.div>
        )}
      </div>
      {error && (
        <p className="report-draft__error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
