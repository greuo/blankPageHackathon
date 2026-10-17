import { cloneElement, useEffect, useId, useRef, useState, type ReactElement } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import './Tooltip.css';

/** Focus and pointer labels, inspired by React Bits' Warm Tooltip reference. */
export function Tooltip({
  text,
  children,
}: {
  text: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
}) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [position, setPosition] = useState<{ left: number; above: boolean } | null>(null);
  const reduce = useReducedMotion();
  const isOpen = !!position;
  const keep = () => clearTimeout(timer.current);
  function closeSoon() {
    keep();
    timer.current = setTimeout(() => setPosition(null), 150);
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!isOpen) return;
    const close = () => setPosition(null);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [isOpen]);
  function open() {
    keep();
    const rect = anchor.current?.getBoundingClientRect();
    const panel = anchor.current?.closest('.patient-assistant')?.getBoundingClientRect();
    const leftEdge = Math.max(0, panel?.left ?? 0);
    const rightEdge = Math.min(window.innerWidth, panel?.right ?? window.innerWidth);
    if (rect)
      setPosition({
        left:
          Math.max(leftEdge + 112, Math.min(rightEdge - 112, rect.left + rect.width / 2)) -
          rect.left,
        above:
          rect.bottom > window.innerHeight - 90 || !!anchor.current?.closest('.care-prompt-bar'),
      });
  }
  return (
    <span
      ref={anchor}
      className="tooltip-anchor"
      onMouseEnter={open}
      onMouseLeave={closeSoon}
      onFocus={open}
      onBlur={() => setPosition(null)}
      onClick={() => setPosition(null)}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && position) {
          event.preventDefault();
          event.stopPropagation();
          keep();
          setPosition(null);
        }
      }}
    >
      {cloneElement(children, {
        'aria-describedby': position
          ? [children.props['aria-describedby'], id].filter(Boolean).join(' ')
          : children.props['aria-describedby'],
      })}
      <AnimatePresence>
        {position && (
          <motion.span
            key={id}
            id={id}
            role="tooltip"
            className="care-tooltip"
            style={{
              left: position.left,
              ...(position.above ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }),
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.14 }}
            onMouseEnter={keep}
            onMouseLeave={closeSoon}
          >
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
