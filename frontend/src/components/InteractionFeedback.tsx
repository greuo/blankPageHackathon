import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { gsap, useGSAP } from './motion';
import './InteractionFeedback.css';

const SOUND_KEY = 'care-companion-sound-v1';
const CONTROLS =
  'button, a[href], summary, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="checkbox"], [role="radio"], [role="switch"]';

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
const audioConstructor = () => window.AudioContext ?? (window as AudioWindow).webkitAudioContext;

/** Lazy audio: the provider only calls play from a trusted activating click. */
export function createClickAudio() {
  let context: AudioContext | undefined;
  let disposed = false;
  let enabled = true;
  let lastClick = -Infinity;
  const voices = new Set<OscillatorNode>();

  function stopVoices() {
    voices.forEach((voice) => {
      try {
        voice.stop();
      } catch {
        // A very short voice may already have ended.
      }
    });
  }

  return {
    setEnabled(value: boolean) {
      enabled = value;
      if (!value) stopVoices();
    },
    async play() {
      if (!enabled || disposed) return;
      try {
        const Constructor = audioConstructor();
        if (!Constructor) return;
        context ??= new Constructor();
        if (context.state === 'suspended') await context.resume();
        if (!enabled || disposed || context.state !== 'running') return;
        const now = context.currentTime;
        if (now - lastClick < 0.04) return;
        lastClick = now;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(620, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.045);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.028, now + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
        oscillator.connect(gain);
        gain.connect(context.destination);
        voices.add(oscillator);
        oscillator.onended = () => {
          voices.delete(oscillator);
          oscillator.disconnect();
          gain.disconnect();
        };
        oscillator.start(now);
        oscillator.stop(now + 0.06);
      } catch {
        // Sound is optional. Browser audio restrictions must never stop an action.
      }
    },
    dispose() {
      disposed = true;
      stopVoices();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    },
  };
}

type SoundPreference = { enabled: boolean; available: boolean; toggle: (trusted: boolean) => void };
const SoundContext = createContext<SoundPreference | null>(null);

function initialSound() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

/** Keeps feedback local to the app, including native dialogs, without changing its layout. */
export function InteractionFeedback({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(initialSound);
  const enabledRef = useRef(enabled);
  const [available] = useState(() => typeof window !== 'undefined' && !!audioConstructor());
  const audio = useRef<ReturnType<typeof createClickAudio> | null>(null);

  useEffect(() => {
    const engine = createClickAudio();
    engine.setEnabled(enabledRef.current);
    audio.current = engine;
    return () => {
      engine.dispose();
      audio.current = null;
    };
  }, []);

  useGSAP(
    () => {
      const container = root.current;
      if (!container) return;
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const presses = new Map<HTMLElement, () => void>();

      function pulse(target: HTMLElement) {
        presses.get(target)?.();
        if (media.matches || !target.isConnected) return;
        const original = target.style.getPropertyValue('--care-press-scale');
        const priority = target.style.getPropertyPriority('--care-press-scale');
        const attribute = target.getAttribute('data-care-press');
        const value = { scale: 1 };
        target.setAttribute('data-care-press', '');
        const restore = () => {
          timeline.kill();
          if (original) target.style.setProperty('--care-press-scale', original, priority);
          else target.style.removeProperty('--care-press-scale');
          if (attribute === null) target.removeAttribute('data-care-press');
          else target.setAttribute('data-care-press', attribute);
          presses.delete(target);
        };
        // An individual CSS scale composes with the component's existing transform.
        const timeline = gsap.timeline({
          onUpdate: () => {
            if (!target.isConnected) restore();
            else target.style.setProperty('--care-press-scale', `${value.scale}`);
          },
          onComplete: restore,
        });
        presses.set(target, restore);
        timeline
          .to(value, { scale: 0.96, duration: 0.07, ease: 'power2.out' })
          .to(value, { scale: 1, duration: 0.21, ease: 'power3.out' });
      }

      function activate(event: MouseEvent) {
        if (!(event.target instanceof Element)) return;
        const control = event.target.closest<HTMLElement>(CONTROLS);
        if (
          !control ||
          !container?.contains(control) ||
          control.matches(':disabled') ||
          control.closest('[inert], [aria-disabled="true"]')
        )
          return;
        const visual =
          control instanceof HTMLInputElement ? (control.closest('label') ?? control) : control;
        if (!control.closest('[data-interaction-motion="off"]')) pulse(visual);
        if (
          event.isTrusted &&
          enabledRef.current &&
          !control.closest('[data-interaction-sound="off"]')
        )
          void audio.current?.play();
      }

      function stopMotion() {
        if (media.matches) Array.from(presses.values()).forEach((restore) => restore());
      }
      // Native click covers mouse, touch and keyboard activation without extra action handlers.
      container.addEventListener('click', activate, true);
      media.addEventListener('change', stopMotion);
      return () => {
        container.removeEventListener('click', activate, true);
        media.removeEventListener('change', stopMotion);
        Array.from(presses.values()).forEach((restore) => restore());
      };
    },
    { scope: root },
  );

  function toggle(trusted: boolean) {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    audio.current?.setEnabled(next);
    try {
      localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
    } catch {
      // The in-session switch still works when browser storage is unavailable.
    }
    if (next && trusted) void audio.current?.play();
  }

  return (
    <SoundContext.Provider value={{ enabled, available, toggle }}>
      <div ref={root} className="interaction-feedback">
        {children}
      </div>
    </SoundContext.Provider>
  );
}

export function SoundToggle({ className = '' }: { className?: string }) {
  const sound = useContext(SoundContext);
  if (!sound) return null;
  const label = !sound.available ? 'Sound unavailable' : sound.enabled ? 'Sound on' : 'Sound off';
  return (
    <button
      type="button"
      className={`care-sound-toggle ${className}`}
      aria-label="Interaction sounds"
      aria-pressed={sound.available && sound.enabled}
      title={
        !sound.available
          ? 'Your browser does not support click sounds'
          : `${label}. Click to change.`
      }
      disabled={!sound.available}
      data-interaction-sound="off"
      onClick={(event) => sound.toggle(event.nativeEvent.isTrusted)}
    >
      {sound.available && sound.enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
      <span>{label}</span>
    </button>
  );
}
