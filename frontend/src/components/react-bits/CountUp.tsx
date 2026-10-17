// Adapted from https://reactbits.dev/text-animations/count-up (count mode).
// The final real value is immediately available to assistive technology.
import { useRef } from 'react';
import { gsap, useGSAP } from '../motion';
import { useReducedMotion } from './useReducedMotion';
import './react-bits.css';

export interface CountUpProps {
  value: number;
  suffix?: string;
}

export function CountUp({ value, suffix = '' }: CountUpProps) {
  const root = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const previous = useRef(0);
  const reduce = useReducedMotion();
  useGSAP(
    () => {
      const progress = { value: previous.current };
      const format = (number: number) =>
        `${Number.isInteger(value) ? Math.round(number) : Number(number.toFixed(1))}${suffix}`;
      const write = () => {
        previous.current = progress.value;
        if (text.current) text.current.textContent = format(progress.value);
      };
      if (reduce) {
        progress.value = value;
        write();
        return;
      }
      write();
      gsap.to(progress, {
        value,
        duration: 0.55,
        ease: 'power3.out',
        onUpdate: write,
        onComplete: () => {
          if (text.current) text.current.textContent = `${value}${suffix}`;
        },
      });
    },
    { scope: root, dependencies: [value, suffix, reduce], revertOnUpdate: true },
  );
  return (
    <span ref={root} className="rb-count-up">
      <span ref={text} aria-hidden="true">
        {value}
        {suffix}
      </span>
      <span className="rb-sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}

export default CountUp;
