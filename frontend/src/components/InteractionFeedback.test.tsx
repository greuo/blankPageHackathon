// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createClickAudio, InteractionFeedback, SoundToggle } from './InteractionFeedback';

const motion = vi.hoisted(() => ({
  timeline: vi.fn(),
  timelines: [] as Array<{ kill: ReturnType<typeof vi.fn>; to: ReturnType<typeof vi.fn> }>,
}));
vi.mock('./motion', async () => {
  const { useEffect } = await import('react');
  return {
    gsap: { timeline: motion.timeline },
    useGSAP: (callback: () => void | (() => void)) => useEffect(callback, []),
  };
});

let host: HTMLDivElement;
let root: Root;
let reduce = false;
const instances: FakeAudioContext[] = [];
function parameter() {
  return { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
}
class FakeAudioContext {
  state = 'running';
  currentTime = 1;
  destination = {};
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  oscillator = {
    type: '',
    frequency: parameter(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    onended: null as (() => void) | null,
  };
  gain = { gain: parameter(), connect: vi.fn(), disconnect: vi.fn() };
  createOscillator = vi.fn(() => this.oscillator);
  createGain = vi.fn(() => this.gain);
  constructor() {
    instances.push(this);
  }
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('AudioContext', FakeAudioContext);
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduce;
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  reduce = false;
  instances.length = 0;
  motion.timelines.length = 0;
  motion.timeline.mockReset().mockImplementation(() => {
    const timeline = { kill: vi.fn(), to: vi.fn() };
    timeline.to.mockReturnValue(timeline);
    motion.timelines.push(timeline);
    return timeline;
  });
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.unstubAllGlobals();
});

it('adds feedback without duplicating actions or replacing component transforms', async () => {
  const action = vi.fn();
  await act(async () =>
    root.render(
      <InteractionFeedback>
        <button style={{ transform: 'translateX(4px)' }} onClick={action}>
          <span>Open task</span>
        </button>
      </InteractionFeedback>,
    ),
  );
  const button = host.querySelector('button')!;
  await act(async () => host.querySelector('span')!.click());
  expect(action).toHaveBeenCalledTimes(1);
  expect(motion.timeline).toHaveBeenCalledTimes(1);
  expect(button.style.transform).toBe('translateX(4px)');
  expect(button.hasAttribute('data-care-press')).toBe(true);
  expect(instances).toHaveLength(0); // Synthetic clicks never authorize audio.
  await act(async () => root.render(null));
  expect(motion.timelines[0].kill).toHaveBeenCalled();
  expect(button.hasAttribute('data-care-press')).toBe(false);
});

it('ignores disabled controls and text keystrokes, and respects reduced motion', async () => {
  const action = vi.fn();
  await act(async () =>
    root.render(
      <InteractionFeedback>
        <button disabled>Disabled</button>
        <button aria-disabled="true">Unavailable</button>
        <input aria-label="Question" />
        <button onClick={action}>Available</button>
      </InteractionFeedback>,
    ),
  );
  const buttons = host.querySelectorAll('button');
  await act(async () => {
    buttons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    buttons[1].click();
    host
      .querySelector('input')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
  });
  expect(motion.timeline).not.toHaveBeenCalled();
  reduce = true;
  await act(async () => buttons[2].click());
  expect(action).toHaveBeenCalledTimes(1);
  expect(motion.timeline).not.toHaveBeenCalled();
});

it('exposes and remembers the sound setting without playing on load or synthetic clicks', async () => {
  await act(async () =>
    root.render(
      <InteractionFeedback>
        <SoundToggle />
      </InteractionFeedback>,
    ),
  );
  const toggle = host.querySelector('button')!;
  expect(toggle.getAttribute('aria-pressed')).toBe('true');
  expect(toggle.textContent).toBe('Sound on');
  expect(instances).toHaveLength(0);
  await act(async () => toggle.click());
  expect(toggle.getAttribute('aria-pressed')).toBe('false');
  expect(localStorage.getItem('care-companion-sound-v1')).toBe('off');
  await act(async () => root.render(null));
  await act(async () =>
    root.render(
      <InteractionFeedback>
        <SoundToggle />
      </InteractionFeedback>,
    ),
  );
  expect(host.querySelector('button')!.getAttribute('aria-pressed')).toBe('false');
  expect(instances).toHaveLength(0);
});

it('disables the sound switch when WebAudio is unavailable', async () => {
  vi.stubGlobal('AudioContext', undefined);
  await act(async () =>
    root.render(
      <InteractionFeedback>
        <SoundToggle />
      </InteractionFeedback>,
    ),
  );
  const toggle = host.querySelector('button')!;
  expect(toggle.disabled).toBe(true);
  expect(toggle.textContent).toBe('Sound unavailable');
});

it('creates a short bounded voice lazily and releases its nodes and context', async () => {
  const audio = createClickAudio();
  expect(instances).toHaveLength(0);
  await audio.play();
  const context = instances[0];
  expect(context.oscillator.start).toHaveBeenCalledWith(1);
  expect(context.oscillator.stop).toHaveBeenCalledWith(1.06);
  await audio.play();
  expect(context.createOscillator).toHaveBeenCalledTimes(1); // Deduplicate rapid clicks.
  context.oscillator.onended!();
  expect(context.oscillator.disconnect).toHaveBeenCalled();
  expect(context.gain.disconnect).toHaveBeenCalled();
  audio.dispose();
  expect(context.close).toHaveBeenCalledTimes(1);
  await audio.play();
  expect(context.createOscillator).toHaveBeenCalledTimes(1);
});

it('does not play a delayed audio resume after muting or disposing', async () => {
  let resume!: () => void;
  class SuspendedAudioContext extends FakeAudioContext {
    override state = 'suspended';
    override resume = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resume = () => {
            this.state = 'running';
            resolve();
          };
        }),
    );
  }
  vi.stubGlobal('AudioContext', SuspendedAudioContext);
  const audio = createClickAudio();
  const pending = audio.play();
  audio.setEnabled(false);
  resume();
  await pending;
  expect(instances[0].createOscillator).not.toHaveBeenCalled();
  audio.dispose();
});
