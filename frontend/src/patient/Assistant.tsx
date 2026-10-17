import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Maximize2, Minimize2, FileText, CircleHelp, Mail } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import PromptBar from '../components/PromptBar';
import { Tooltip } from '../components/Tooltip';
import { Skeleton, errorText } from '../components/ui';
import { useSurfaceEntrance } from '../components/motion';
import {
  EdgeError,
  ensureDoctor,
  ensureSession,
  notifyDoctor,
  sendChat,
  syncCareNotes,
} from '../data/supabase';
import { isEmergency, type ChatMessage, type PatientState } from './model';
import { patientStore } from './store';

const MAX_CHAT_LENGTH = 4000;

function chatErrorText(reason: unknown): string {
  if (reason instanceof EdgeError && reason.status === 429) {
    const minutes = Math.max(1, Math.ceil((reason.retryAfterSeconds ?? 600) / 60));
    return `You’ve reached the message limit for now. Try again in about ${minutes} minute${minutes === 1 ? '' : 's'}.`;
  }
  return errorText(reason);
}

function notifyErrorText(reason: unknown): string {
  if (reason instanceof EdgeError) {
    if (reason.code === 'guest_must_sign_up')
      return 'Guest sessions can’t email a doctor yet. Add an email to your account first.';
    if (reason.code === 'doctor_has_no_email')
      return 'Your doctor has no email on file. Add one first.';
    if (reason.status === 429)
      return 'Too many messages to your doctor for now. Please try again later.';
    if (reason.status === 502) return 'The email could not be sent; nothing was saved. Try again.';
    if (reason.status === 503) return 'Doctor email isn’t configured in this demo yet.';
  }
  return errorText(reason);
}
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
  const [notify, setNotify] = useState<{
    id: string;
    status: 'sending' | 'sent' | 'error';
    note: string;
  } | null>(null);
  async function send(value = text) {
    const content = value.trim();
    if (!content || pending) return;
    if (isEmergency(content)) {
      onEmergency(content);
      return;
    }
    if (content.length > MAX_CHAT_LENGTH) {
      setError(`Keep a message under ${MAX_CHAT_LENGTH.toLocaleString()} characters.`);
      return;
    }
    const sequence = ++request.current;
    pinned.current = true;
    setPending(true);
    setError('');
    try {
      await ensureSession();
      // The bot reads notes from the server, so give it the instructions saved in this app.
      await syncCareNotes({
        doctor: state.doctor,
        email: state.email,
        instructions: state.instructions,
      });
      const response = await sendChat(content);
      if (request.current !== sequence) return;
      patientStore.update((s) => {
        s.messages.push(
          { id: response.patient_message.id, role: 'patient', text: content },
          {
            id: response.reply.id,
            role: 'assistant',
            text: response.reply.content,
            ...(response.suggest_notify_doctor
              ? { suggestNotifyDoctor: true, patientText: content }
              : {}),
          },
        );
      });
      setText('');
    } catch (reason) {
      if (request.current === sequence) setError(chatErrorText(reason));
    } finally {
      if (request.current === sequence) setPending(false);
    }
  }
  async function sendToDoctor(message: ChatMessage) {
    if (notify?.status === 'sending') return;
    setNotify({ id: message.id, status: 'sending', note: '' });
    try {
      await ensureSession();
      const doctorId = await ensureDoctor(state.doctor, state.email);
      await notifyDoctor(doctorId, message.patientText ?? message.text);
      setNotify({
        id: message.id,
        status: 'sent',
        note: `Sent. ${state.doctor} will receive an email with a secure link to your message (it expires in 7 days).`,
      });
    } catch (reason) {
      setNotify({ id: message.id, status: 'error', note: notifyErrorText(reason) });
    }
  }
  const last = state.messages.at(-1);
  const suggestion = last?.role === 'assistant' && last.suggestNotifyDoctor ? last : null;
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
            I answer from the care notes your doctor provided, through your care service. I do not
            diagnose, adjust treatment or verify that a dose was taken. When I can’t answer safely,
            I’ll suggest sending your question to your doctor.
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
        {suggestion && (
          <div className="assistant-notify">
            <button
              className="btn secondary"
              disabled={notify?.id === suggestion.id && notify.status !== 'error'}
              onClick={() => void sendToDoctor(suggestion)}
            >
              <Mail size={16} />
              {notify?.id === suggestion.id && notify.status === 'sending'
                ? 'Sending to your doctor…'
                : notify?.id === suggestion.id && notify.status === 'sent'
                  ? 'Sent to your doctor'
                  : 'Send to my doctor'}
            </button>
            {notify?.id === suggestion.id && notify.status === 'sent' && (
              <p className="patient-success">{notify.note}</p>
            )}
            {notify?.id === suggestion.id && notify.status === 'error' && (
              <p className="alert error" role="alert">
                {notify.note}
              </p>
            )}
          </div>
        )}
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
