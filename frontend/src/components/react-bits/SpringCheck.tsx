// Adapted from https://reactbits.dev/micro/spring-check.
// React Bits license and original prompt: docs/react-bits-prompts/.
import { useRef } from 'react';
import { gsap, useGSAP } from '../motion';
import { useReducedMotion } from './useReducedMotion';
import './react-bits.css';

export interface SpringCheckProps {
  checked: boolean;
  onChange: () => void;
  label: string;
}

export function SpringCheck({ checked, onChange, label }: SpringCheckProps) {
  const root = useRef<HTMLButtonElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const box = useRef<HTMLSpanElement>(null);
  const tick = useRef<SVGPathElement>(null);
  const previous = useRef(checked);
  const reduce = useReducedMotion();

  useGSAP(
    () => {
      const start = previous.current ? 1 : 0;
      previous.current = checked;
      const progress = { value: reduce ? Number(checked) : start };
      const write = () => {
        const held = Math.min(1, Math.max(0, progress.value));
        if (fill.current) fill.current.style.transform = `scale(${Math.max(0, progress.value)})`;
        if (box.current)
          box.current.style.transform = `scale(${1 + 0.35 * Math.max(0, progress.value - 1)})`;
        if (tick.current) tick.current.style.strokeDashoffset = String(1 - held);
      };
      write();
      if (!reduce && start !== Number(checked)) {
        gsap.to(progress, {
          value: Number(checked),
          duration: 0.36,
          ease: checked ? 'back.out(2.1)' : 'power3.out',
          onUpdate: write,
        });
      }
    },
    { scope: root, dependencies: [checked, reduce], revertOnUpdate: true },
  );

  return (
    <button
      ref={root}
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      className="rb-spring-check"
      onClick={onChange}
    >
      <span ref={box} className="rb-spring-check__box" aria-hidden="true">
        <span className="rb-spring-check__ring" />
        <span ref={fill} className="rb-spring-check__fill" />
        <svg viewBox="0 0 24 24" className="rb-spring-check__tick">
          <path ref={tick} d="m6 12 4 4 8-8" pathLength="1" strokeDasharray="1" />
        </svg>
      </span>
    </button>
  );
}

export default SpringCheck;
