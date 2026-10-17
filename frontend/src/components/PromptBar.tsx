import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import {
  animate,
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from 'motion/react';
import { BookOpen, ClipboardList, FileText, Plus, X } from 'lucide-react';
import { Tooltip } from './Tooltip';
import './PromptBar.css';

// Adapted from the supplied React Bits PromptBar. Keep its morph and growing
// field, with a controlled draft and only actions supported by this companion.
const ARROW = [12, 4.5, 18.5, 11, 14.25, 11, 14.25, 19.5, 9.75, 19.5, 9.75, 11, 5.5, 11];
const SQUARE = [12, 6, 18, 6, 18, 12, 18, 18, 6, 18, 6, 12, 6, 6];
function pathAt(t: number) {
  let path = '';
  for (let i = 0; i < ARROW.length; i += 2) {
    const mix = (n: number) => ARROW[n] + (SQUARE[n] - ARROW[n]) * t;
    path += `${i ? 'L' : 'M'}${mix(i)} ${mix(i + 1)}`;
  }
  return `${path}Z`;
}
function SendGlyph({ busy }: { busy: boolean }) {
  const path = useRef<SVGPathElement>(null);
  const t = useMotionValue(busy ? 1 : 0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const control = animate(t, busy ? 1 : 0, {
      duration: reduce ? 0 : 0.24,
      ease: [0.77, 0, 0.175, 1],
    });
    return () => control.stop();
  }, [busy, reduce, t]);
  useMotionValueEvent(t, 'change', (value) => path.current?.setAttribute('d', pathAt(value)));
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" aria-hidden="true" fill="currentColor">
      <path ref={path} d={pathAt(t.get())} />
    </svg>
  );
}

export default function PromptBar({
  value,
  onChange,
  busy,
  onSend,
  onStop,
  onReport,
}: {
  value: string;
  onChange: (value: string) => void;
  busy: boolean;
  onSend: () => void;
  onStop: () => void;
  onReport: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const root = useRef<HTMLFormElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  useLayoutEffect(() => {
    const field = input.current;
    if (!field) return;
    field.style.height = '0px';
    field.style.height = `${Math.min(130, Math.max(52, field.scrollHeight))}px`;
  }, [value]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  function choose(text: string) {
    onChange(text);
    setOpen(false);
    input.current?.focus();
  }
  return (
    <form
      ref={root}
      className="care-prompt-bar"
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && value.trim()) onSend();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            className="care-prompt-menu"
            id={`${id}-actions`}
            initial={{ opacity: 0, y: reduce ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.16 }}
          >
            <span className="care-prompt-menu-label">Start with your care plan</span>
            <button type="button" onClick={() => choose('Review my tasks')}>
              <ClipboardList size={18} />
              Review my tasks
            </button>
            <button type="button" onClick={() => choose('Show my provided instructions')}>
              <BookOpen size={18} />
              Find an instruction
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onReport();
              }}
            >
              <FileText size={18} />
              Prepare a progress draft
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <label className="sr-only" htmlFor={id}>
        Ask your care assistant
      </label>
      <textarea
        ref={input}
        id={id}
        value={value}
        rows={2}
        maxLength={3000}
        placeholder="Ask about your care plan…"
        readOnly={busy}
        aria-busy={busy}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            if (!busy && value.trim()) onSend();
          }
        }}
      />
      <div className="care-prompt-tools">
        <Tooltip text="Care plan shortcuts">
          <button
            ref={toggle}
            type="button"
            className="care-prompt-add"
            aria-label="Care plan shortcuts"
            aria-expanded={open}
            aria-controls={`${id}-actions`}
            onClick={() => setOpen(!open)}
          >
            {open ? <X size={19} /> : <Plus size={19} />}
          </button>
        </Tooltip>
        <span className="care-prompt-context">
          <BookOpen size={14} /> Your care plan
        </span>
        <Tooltip text={busy ? 'Stop preparing this response' : 'Send question'}>
          <motion.button
            type={busy ? 'button' : 'submit'}
            className="care-prompt-send"
            aria-label={busy ? 'Stop response' : 'Send question'}
            disabled={!busy && !value.trim()}
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.12 }}
            onClick={busy ? onStop : undefined}
          >
            <SendGlyph busy={busy} />
          </motion.button>
        </Tooltip>
      </div>
      <small>Your care team guides your treatment. Local demo.</small>
    </form>
  );
}
