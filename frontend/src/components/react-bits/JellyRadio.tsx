// Adapted from https://reactbits.dev/micro/jelly-radio.
// Swelling chips and neighboring displacement, with native radio semantics.
import { useRef } from 'react';
import { gsap, useGSAP } from '../motion';
import { useReducedMotion } from './useReducedMotion';
import './react-bits.css';

export interface JellyRadioProps {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  name: string;
  label: string;
}

export function JellyRadio({ value, options, onChange, name, label }: JellyRadioProps) {
  const root = useRef<HTMLFieldSetElement>(null);
  const initialized = useRef(false);
  const reduce = useReducedMotion();
  const optionsKey = JSON.stringify(options.map((option) => [option.value, option.label]));
  useGSAP(
    () => {
      const chips = Array.from(
        root.current?.querySelectorAll<HTMLElement>('.rb-jelly-radio__skin') || [],
      );
      const selected = options.findIndex((option) => option.value === value);
      const first = !initialized.current;
      initialized.current = true;
      for (const [index, chip] of chips.entries()) {
        const on = index === selected;
        const distance = Math.abs(index - selected);
        // Small displacement leaves every native radio target inside its allotted space.
        const target = {
          x: selected < 0 ? 0 : Math.sign(index - selected) * 2,
          scaleX: on ? 1.04 : 1,
          scaleY: on ? 1.04 : 1,
        };
        if (first || reduce) gsap.set(chip, reduce ? { x: 0, scaleX: 1, scaleY: 1 } : target);
        else {
          gsap.fromTo(
            chip,
            { x: 0, scaleX: 1, scaleY: 1 },
            {
              x: target.x,
              scaleX: on ? 1.09 : 0.98,
              scaleY: on ? 0.96 : 1.02,
              duration: 0.13,
              delay: distance * 0.018,
              ease: 'power2.out',
            },
          );
          gsap.to(chip, {
            ...target,
            duration: 0.38,
            delay: 0.13 + distance * 0.018,
            ease: 'elastic.out(1,0.55)',
          });
        }
      }
    },
    { scope: root, dependencies: [value, optionsKey, reduce], revertOnUpdate: true },
  );

  return (
    <fieldset ref={root} className="rb-jelly-radio">
      <legend>{label}</legend>
      <div className="rb-jelly-radio__choices">
        {options.map((option) => (
          <label key={option.value} className="rb-jelly-radio__choice">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              required
              onChange={() => onChange(option.value)}
            />
            <span className="rb-jelly-radio__skin">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default JellyRadio;
