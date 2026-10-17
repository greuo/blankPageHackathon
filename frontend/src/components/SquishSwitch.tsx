import { useId } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import './SquishSwitch.css';

export interface SquishSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  describedBy?: string;
  id?: string;
  className?: string;
}

/** Adapted from the supplied React Bits SquishSwitch for a controlled preference. */
export default function SquishSwitch({
  checked,
  onChange,
  label,
  disabled = false,
  describedBy,
  id,
  className = '',
}: SquishSwitchProps) {
  const generatedId = useId();
  const buttonId = id ?? generatedId;
  const reducedMotion = useReducedMotion();

  return (
    <span className={`squish-switch-root ${className}`}>
      <button
        id={buttonId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={describedBy}
        disabled={disabled}
        className="squish-switch"
        data-on={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="squish-switch__track" aria-hidden="true">
          <motion.span
            className="squish-switch__thumb"
            initial={false}
            animate={{
              x: checked ? 22 : 0,
              scaleX: reducedMotion ? 1 : [1, 1.18, 1],
              scaleY: reducedMotion ? 1 : [1, 0.88, 1],
            }}
            transition={{ duration: reducedMotion ? 0 : 0.36, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
      </button>
      <label htmlFor={buttonId} className="squish-switch__label">
        {label}
      </label>
    </span>
  );
}
