// Adapted from https://reactbits.dev/micro/rubber-segment.
// Retains the separate leading/trailing edge stretch; navigation uses explicit clicks.
import { useRef, type ReactNode } from 'react';
import { gsap, useGSAP } from '../motion';
import { useReducedMotion } from './useReducedMotion';
import './react-bits.css';

export interface RubberSegmentProps {
  value: string;
  options: { value: string; label: string; icon?: ReactNode }[];
  onChange: (value: string) => void;
  label: string;
}

export function RubberSegment({ value, options, onChange, label }: RubberSegmentProps) {
  const root = useRef<HTMLDivElement>(null);
  const thumb = useRef<HTMLSpanElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const previous = useRef(value);
  const reduce = useReducedMotion();
  const optionsKey = JSON.stringify(options.map((option) => [option.value, option.label]));

  useGSAP(
    () => {
      const container = root.current;
      const pill = thumb.current;
      if (!container || !pill) return;
      let active = true;
      let tween: gsap.core.Timeline | undefined;
      const fromValue = previous.current;
      previous.current = value;
      const selectedIndex = options.findIndex((option) => option.value === value);
      const fromIndex = options.findIndex((option) => option.value === fromValue);
      const edges = { left: 0, right: 0 };
      let geometry = '';
      const write = () => {
        // Clip the full-width surface to keep the pill ends round throughout the stretch.
        pill.style.clipPath = `inset(0 ${Math.max(0, container.clientWidth - edges.right)}px 0 ${Math.max(0, edges.left)}px round 999px)`;
      };
      const measure = (animate: boolean) => {
        if (!active) return;
        const toButton = buttons.current[selectedIndex];
        const fromButton = buttons.current[fromIndex] || toButton;
        tween?.kill();
        if (!toButton || !fromButton) {
          pill.style.visibility = 'hidden';
          return;
        }
        pill.style.visibility = 'visible';
        const left = toButton.offsetLeft;
        const right = left + toButton.offsetWidth;
        edges.left = animate ? fromButton.offsetLeft : left;
        edges.right = animate ? fromButton.offsetLeft + fromButton.offsetWidth : right;
        write();
        if (!animate || reduce) {
          edges.left = left;
          edges.right = right;
          write();
          return;
        }
        // First span both slots, then let the trailing edge catch the leading edge.
        tween = gsap
          .timeline({ onUpdate: write })
          .to(edges, {
            left: Math.min(edges.left, left),
            right: Math.max(edges.right, right),
            duration: 0.16,
            ease: 'power3.out',
          })
          .to(edges, { left, right, duration: 0.3, ease: 'back.out(1.15)' });
      };
      measure(fromValue !== value && !reduce);
      const resize = () => {
        const next = `${container.clientWidth}:${buttons.current.map((button) => `${button?.offsetLeft}:${button?.offsetWidth}`).join(',')}`;
        if (next === geometry) return;
        geometry = next;
        measure(false);
      };
      geometry = `${container.clientWidth}:${buttons.current.map((button) => `${button?.offsetLeft}:${button?.offsetWidth}`).join(',')}`;
      const observer =
        typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
      observer?.observe(container);
      for (const button of buttons.current) if (button) observer?.observe(button);
      document.fonts?.ready.then(resize);
      return () => {
        active = false;
        observer?.disconnect();
        tween?.kill();
      };
    },
    { scope: root, dependencies: [value, optionsKey, reduce], revertOnUpdate: true },
  );

  return (
    <div ref={root} role="group" aria-label={label} className="rb-rubber-segment">
      <span ref={thumb} className="rb-rubber-segment__thumb" aria-hidden="true" />
      {options.map((option, index) => (
        <button
          key={option.value}
          ref={(node) => {
            buttons.current[index] = node;
          }}
          type="button"
          className="rb-rubber-segment__item"
          aria-current={value === option.value ? 'page' : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.icon && (
            <span aria-hidden="true" className="rb-rubber-segment__icon">
              {option.icon}
            </span>
          )}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
}

export default RubberSegment;
