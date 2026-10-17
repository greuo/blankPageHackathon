import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Bot, Maximize2, Minimize2, Send, FileText, CircleHelp } from 'lucide-react';
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
    pinned.current = true;
    setPending(true);
    setError('');
    try {
      // Local response preparation only. No live LLM or fabricated network wait.
      const response = await Promise.resolve(reply(state, value));
      patientStore.update((s) => {
        s.messages.push(
          { id: id(), role: 'patient', text: value.trim() },
          { id: id(), role: 'assistant', text: response },
        );
      });
      setText('');
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setPending(false);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    void send();
  }
  return (
    <section
      className={`patient-assistant ${expanded ? 'expanded' : ''}`}
      aria-label="Care assistant"
      ref={scope}
    >
      <header className="assistant-heading">
        <span className="patient-icon">
          <Bot size={26} />
        </span>
        <div>
          <h2>Care assistant</h2>
          <p>Ask about your care plan</p>
        </div>
        <button
          className="icon-btn"
          aria-label={expanded ? 'Exit full-screen assistant' : 'Open full-screen assistant'}
          onClick={onExpand}
        >
          {expanded ? <Minimize2 /> : <Maximize2 />}
        </button>
        <button
          className="icon-btn"
          aria-label="About your companion"
          aria-expanded={help}
          onClick={() => setHelp(!help)}
        >
          <CircleHelp size={20} />
        </button>
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
          <div key={message.id} className={`patient-message ${message.role}`}>
            {message.role === 'assistant' && (
              <span className="message-icon">
                <Bot size={19} />
              </span>
            )}
            <p>{message.text}</p>
          </div>
        ))}
        {pending && <Skeleton kind="conversation" />}
      </div>
      <div className="assistant-prompts">
        <button onClick={() => void send('Review my tasks')}>Review my tasks</button>
        <button onClick={() => void send('What can you do?')}>How you can help</button>
        <button onClick={onReport}>
          <FileText size={15} />
          Progress report
        </button>
      </div>
      {error && (
        <p className="alert error" role="alert">
          {error} Your question is kept here. Try again.
        </p>
      )}
      <form onSubmit={submit} className="patient-composer">
        <label className="sr-only" htmlFor={expanded ? 'expanded-question' : 'care-question'}>
          Ask your care assistant
        </label>
        <textarea
          id={expanded ? 'expanded-question' : 'care-question'}
          value={text}
          maxLength={3000}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a question…"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          className="icon-btn send-button"
          aria-label="Send question"
          disabled={!text.trim() || pending}
        >
          <Send size={21} />
        </button>
        <small>Your care team guides your treatment. Local demo.</small>
      </form>
    </section>
  );
}
