import { motion, useReducedMotion } from 'motion/react';
import './StatusMark.css';

export type StatusMarkState = 'pending' | 'running' | 'done' | 'failed' | 'cancelled';

interface StatusMarkProps {
  status: StatusMarkState;
  label: string;
  className?: string;
}

/** Ring-to-result feedback adapted from the supplied React Bits StatusMark. */
export default function StatusMark({ status, label, className = '' }: StatusMarkProps) {
  const reducedMotion = useReducedMotion();
  const isResult = status === 'done' || status === 'failed' || status === 'cancelled';
  const duration = reducedMotion ? 0 : 0.24;

  return (
    <span
      className={`status-mark ${className}`}
      data-status={status}
      role="status"
      aria-live="polite"
    >
      <svg className="status-mark__glyph" viewBox="0 0 24 24" aria-hidden="true">
        <circle className="status-mark__track" cx="12" cy="12" r="9" />
        <motion.circle
          className="status-mark__ring"
          cx="12"
          cy="12"
          r="9"
          initial={false}
          animate={{
            pathLength: status === 'running' ? 0.68 : 1,
            rotate: status === 'running' && !reducedMotion ? 360 : 0,
            opacity: isResult ? 0.45 : 1,
          }}
          transition={{
            pathLength: { duration },
            opacity: { duration },
            rotate: {
              duration: status === 'running' && !reducedMotion ? 0.5 : 0,
              ease: 'linear',
              repeat: status === 'running' && !reducedMotion ? Infinity : 0,
            },
          }}
        />
        <motion.path
          className="status-mark__result"
          d={status === 'done' ? 'm7.5 12 3 3 6-6' : 'm8.5 8.5 7 7m0-7-7 7'}
          initial={false}
          animate={{ pathLength: isResult ? 1 : 0, opacity: isResult ? 1 : 0 }}
          transition={{ duration }}
        />
      </svg>
      <span>{label}</span>
    </span>
  );
}
