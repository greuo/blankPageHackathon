import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Maximize2, Minimize2, FileText, CircleHelp } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import PromptBar from '../components/PromptBar';
import { Tooltip } from '../components/Tooltip';
import { Skeleton, errorText } from '../components/ui';
import { useSurfaceEntrance } from '../components/motion';
import { id, isEmergency, reply, type PatientState } from './model';
import { patientStore } from './store';
export default function Assistant({
  state,
  expanded = false,
  onExpand,
  onReport,
  onEmergency,
  text,
  setText,
}: {
  text: string;
  setText: (value: string) => void;
  state: PatientState;
  expanded?: boolean;
  onExpand?: () => void;
  onReport: () => void;
  onEmergency: (text: string) => void;
}) {
  const request = useRef(0);
  const reduce = useReducedMotion();
  useEffect(
    () => () => {
      request.current += 1;
    },
    [],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const messageLog = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const scope = useRef<HTMLElement>(null);
  useSurfaceEntrance(scope, []);
  useEffect(() => {
    if (messageLog.current && pinned.current)
      messageLog.current.scrollTop = messageLog.current.scrollHeight;
  }, [state.messages.length, pending]);
  async function send(value = text) {
    if (!value.trim() || pending) return;
    if (isEmergency(value)) {
      onEmergency(value);
      return;
    }
    const sequence = ++request.current;
    pinned.current = true;
    setPending(true);
    setError('');
    try {
      // Yield for rendering, then prepare the local response. No simulated network delay.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (request.current !== sequence) return;
      const response = reply(state, value);
      patientStore.update((s) => {
        s.messages.push(
          { id: id(), role: 'patient', text: value.trim() },
          { id: id(), role: 'assistant', text: response },
        );
      });
      setText('');
    } catch (reason) {
      if (request.current === sequence) setError(errorText(reason));
    } finally {
      if (request.current === sequence) setPending(false);
    }
  }
  return (
    <section
      className={`patient-assistant ${expanded ? 'expanded' : ''}`}
      aria-label="Care assistant"
      ref={scope}
    >
      <header className="assistant-heading">
        <span className="patient-icon">
          <MessageCircle size={25} />
        </span>
        <div>
          {!expanded && <h2>Care assistant</h2>}
          <p>
            {expanded ? 'Your questions. Your provided guidance.' : 'Here with your care plan.'}
          </p>
        </div>
        <Tooltip text={expanded ? 'Close full screen' : 'Open full screen'}>
          <button
            className="icon-btn"
            aria-label={expanded ? 'Exit full-screen assistant' : 'Open full-screen assistant'}
            onClick={onExpand}
          >
            {expanded ? <Minimize2 /> : <Maximize2 />}
          </button>
        </Tooltip>
        <Tooltip text="About your companion">
          <button
            className="icon-btn"
            aria-label="About your companion"
            aria-expanded={help}
            onClick={() => setHelp(!help)}
          >
            <CircleHelp size={20} />
          </button>
        </Tooltip>
      </header>
      {help && (
        <div className="assistant-about">
          <strong>Here to help you keep track.</strong>
          <p>
            I find provided instructions and summarize your own reports. I do not diagnose, adjust
            treatment or verify that a dose was taken. This demo uses prepared responses and sends
            no email.
          </p>
        </div>
      )}
      <div
        className="patient-messages"
        ref={messageLog}
        onScroll={() => {
          const log = messageLog.current;
          if (log) pinned.current = log.scrollHeight - log.scrollTop - log.clientHeight < 80;
        }}
        role="log"
        aria-label="Care conversation"
        aria-live="polite"
        aria-busy={pending}
      >
        {state.messages.map((message) => (
          <motion.div
            key={message.id}
            className={`patient-message ${message.role}`}
            initial={{ opacity: 0, y: reduce ? 0 : 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.22 }}
          >
            {message.role === 'assistant' && (
              <span className="message-icon">
                <MessageCircle size={18} />
              </span>
            )}
            <p>{message.text}</p>
          </motion.div>
        ))}
        {pending && <Skeleton kind="conversation" />}
      </div>
      <div className="assistant-prompts">
        <button onClick={() => void send('Review my tasks')}>Review my tasks</button>
        <button onClick={() => void send('Show my provided instructions')}>
          Your instructions
        </button>
        <button className="assistant-report-link" onClick={onReport}>
          <FileText size={15} />
          Progress report
        </button>
      </div>
      {error && (
        <p className="alert error" role="alert">
          {error} Your question is kept here. Try again.
        </p>
      )}
      <PromptBar
        value={text}
        onChange={setText}
        busy={pending}
        onSend={() => void send()}
        onStop={() => {
          request.current += 1;
          setPending(false);
        }}
        onReport={onReport}
      />
    </section>
  );
}
