// Adapted from https://reactbits.dev/micro/swipe-toast.
// Saved confirmations stay available until explicitly closed or swiped down.
import { useRef, type PointerEvent } from 'react';
import { X } from 'lucide-react';
import { gsap, useGSAP } from '../motion';
import { useReducedMotion } from './useReducedMotion';
import './react-bits.css';

export interface SwipeToastProps {
  message: string;
  onDismiss: () => void;
}
type Drag = { id: number; start: number; y: number; started: number };

export function SwipeToast({ message, onDismiss }: SwipeToastProps) {
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const closing = useRef(false);
  const callback = useRef(onDismiss);
  callback.current = onDismiss;
  const reduce = useReducedMotion();
  const { contextSafe } = useGSAP(
    () => {
      closing.current = false;
      drag.current = null;
      if (card.current && !reduce)
        gsap.fromTo(
          card.current,
          { y: 10, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.28, ease: 'power3.out' },
        );
      return () => {
        drag.current = null;
        closing.current = false;
      };
    },
    { scope: root, dependencies: [message, reduce], revertOnUpdate: true },
  );

  const dismiss = contextSafe(() => {
    if (closing.current) return;
    closing.current = true;
    drag.current = null;
    if (!card.current || reduce) {
      callback.current();
      return;
    }
    gsap.to(card.current, {
      y: 35,
      opacity: 0,
      duration: 0.18,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => callback.current(),
    });
  });
  const reset = contextSafe(() => {
    drag.current = null;
    if (card.current)
      gsap.to(card.current, {
        y: 0,
        opacity: 1,
        duration: reduce ? 0 : 0.28,
        ease: 'back.out(1.2)',
        overwrite: true,
      });
  });
  const pointerDown = contextSafe((event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || closing.current || (event.target as Element).closest('button'))
      return;
    drag.current = { id: event.pointerId, start: event.clientY, y: 0, started: performance.now() };
    gsap.killTweensOf(card.current);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* Capture is unavailable for synthetic pointers. */
    }
  });
  const pointerMove = contextSafe((event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const distance = event.clientY - current.start;
    current.y =
      distance >= 0 ? distance : (distance * 24 * 0.55) / (24 + 0.55 * Math.abs(distance));
    if (card.current && !reduce)
      gsap.set(card.current, {
        y: current.y,
        opacity: Math.max(0.5, 1 - Math.max(0, distance) / 200),
      });
  });
  const pointerUp = contextSafe((event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    const velocity = current.y / Math.max(1, performance.now() - current.started);
    if (current.y >= 40 || (current.y >= 12 && velocity > 0.3)) dismiss();
    else reset();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  });

  return (
    <div ref={root} className="rb-swipe-toast">
      <div
        ref={card}
        className="rb-swipe-toast__card"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={reset}
        onLostPointerCapture={() => {
          if (drag.current) reset();
        }}
      >
        <span
          className="rb-swipe-toast__message"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </span>
        <button
          type="button"
          className="rb-swipe-toast__close"
          aria-label="Dismiss notification"
          onClick={dismiss}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default SwipeToast;
