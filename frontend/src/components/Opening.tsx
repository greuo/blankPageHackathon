import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from './motion';
import LightTunnel from './LightTunnel';
import './Opening.css';

export const OPENING_DURATION_SECONDS = 1.8;

export default function Opening({ onEnter }: { onEnter: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const completed = useRef(false);
  const intro = useRef<gsap.core.Timeline | null>(null);
  function complete() {
    if (completed.current) return;
    completed.current = true;
    intro.current?.kill();
    onEnter();
  }
  useGSAP(
    (_context, contextSafe) => {
      const finish = contextSafe!(complete);
      if (reducedMotion()) {
        const frame = requestAnimationFrame(finish);
        return () => cancelAnimationFrame(frame);
      }
      const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
      const motionChanged = () => {
        if (preference.matches) finish();
      };
      preference.addEventListener?.('change', motionChanged);
      intro.current = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
      intro.current
        .fromTo('.splash-atmosphere', { opacity: 0 }, { opacity: 1, duration: 0.55 }, 0)
        .fromTo(
          '.splash-line',
          { strokeDashoffset: 168 },
          { strokeDashoffset: 0, duration: 0.62, stagger: 0.07 },
          0.02,
        )
        .fromTo(
          '.splash-monogram',
          { scale: 0.94, opacity: 0.6 },
          { scale: 1, opacity: 1, duration: 0.45, transformOrigin: 'center' },
          0.04,
        )
        .fromTo('.splash-title', { y: 8, opacity: 0.65 }, { y: 0, opacity: 1, duration: 0.48 }, 0.1)
        .fromTo(
          '.splash-description',
          { y: 5, opacity: 0.5 },
          { y: 0, opacity: 1, duration: 0.4 },
          0.2,
        )
        .to('.splash-composition', { y: -4, opacity: 0, duration: 0.24 }, 1.52)
        .to(
          '.splash-atmosphere, .splash-note',
          { opacity: 0, duration: 0.26 },
          OPENING_DURATION_SECONDS - 0.26,
        );
      return () => preference.removeEventListener?.('change', motionChanged);
    },
    { scope: ref },
  );
  return (
    <main className="splash-screen care-opening" ref={ref} aria-label="Welcome to Care companion">
      {!reducedMotion() && (
        <div className="splash-atmosphere" aria-hidden="true">
          <LightTunnel />
        </div>
      )}
      <button className="splash-skip" onClick={complete}>
        Skip intro
      </button>
      <div className="splash-composition">
        <svg className="splash-symbol" viewBox="0 0 120 120" aria-hidden="true">
          <path className="splash-line sage-line" d="M18 102V21a3 3 0 0 1 3-3h81" />
          <path className="splash-line green-line" d="M102 18v81a3 3 0 0 1-3 3H18" />
          <text className="splash-monogram" x="59" y="79" textAnchor="middle">
            dc
          </text>
        </svg>
        <h1 className="splash-title">Care companion</h1>
        <p className="splash-description">A little clarity for the days ahead.</p>
      </div>
      <p className="splash-note">A fictional care experience.</p>
    </main>
  );
}
