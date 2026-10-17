import type { RefObject } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);
export { gsap, useGSAP };
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useSurfaceEntrance(
  scope: RefObject<HTMLElement | null>,
  dependencies: unknown[] = [],
  selector?: string,
) {
  useGSAP(
    () => {
      if (!scope.current || reducedMotion()) return;
      const targets = selector
        ? Array.from(scope.current.querySelectorAll(selector))
        : [scope.current];
      if (!targets.length) return;
      gsap.fromTo(
        targets,
        { y: 8, opacity: 0.65 },
        { y: 0, opacity: 1, duration: 0.3, stagger: selector ? 0.045 : 0, ease: 'power3.out' },
      );
    },
    { scope, dependencies, revertOnUpdate: true },
  );
}
