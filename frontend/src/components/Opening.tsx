import { useRef } from 'react';
import { gsap, useGSAP, reducedMotion } from './motion';

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
      intro.current = gsap.timeline({ defaults: { ease: 'power3.out' }, onComplete: finish });
      intro.current
        .fromTo(
          '.splash-line',
          { strokeDashoffset: 168 },
          { strokeDashoffset: 0, duration: 0.58, stagger: 0.06 },
          0,
        )
        .fromTo(
          '.splash-monogram',
          { scale: 0.88, opacity: 0.5 },
          { scale: 1, opacity: 1, duration: 0.58, transformOrigin: 'center' },
          0.04,
        )
        .fromTo('.splash-title', { y: 9, opacity: 0.6 }, { y: 0, opacity: 1, duration: 0.5 }, 0.14)
        .fromTo(
          '.splash-description',
          { y: 5, opacity: 0.5 },
          { y: 0, opacity: 1, duration: 0.4 },
          0.25,
        )
        .to('.splash-composition', { y: -5, opacity: 0, duration: 0.16, ease: 'power2.in' }, 0.9);
    },
    { scope: ref },
  );
  return (
    <main className="splash-screen" ref={ref} aria-label="Welcome to Discharge Companion">
      <button className="splash-skip" onClick={complete}>
        Skip intro
      </button>
      <div className="splash-composition">
        <svg className="splash-symbol" viewBox="0 0 120 120" aria-hidden="true">
          <path className="splash-line blue-line" d="M18 102V21a3 3 0 0 1 3-3h81" />
          <path className="splash-line green-line" d="M102 18v81a3 3 0 0 1-3 3H18" />
          <text className="splash-monogram" x="59" y="79" textAnchor="middle">
            dc
          </text>
        </svg>
        <h1 className="splash-title">Discharge Companion</h1>
        <p className="splash-description">A little clarity for the days ahead.</p>
      </div>
      <p className="splash-note">A fictional care experience.</p>
    </main>
  );
}
