// @vitest-environment jsdom
import { StrictMode, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SpringCheck } from './SpringCheck';
import { RubberSegment } from './RubberSegment';
import { JellyRadio } from './JellyRadio';
import { SwipeToast } from './SwipeToast';
import { CountUp } from './CountUp';

let host: HTMLDivElement;
let root: Root;
let reduce = true;
const listeners = new Set<() => void>();
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const options = [
  { value: 'better', label: 'Better' },
  { value: 'same', label: 'About the same' },
];

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  reduce = true;
  vi.stubGlobal('matchMedia', () => ({
    get matches() {
      return reduce;
    },
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  expect(listeners.size).toBe(0);
  host.remove();
  vi.unstubAllGlobals();
});

it('requests one checkbox change while keeping the parent-owned completion state', async () => {
  const onChange = vi.fn();
  await act(async () =>
    root.render(<SpringCheck checked={false} onChange={onChange} label="Record exercise" />),
  );
  const button = host.querySelector('button')!;
  expect(button.getAttribute('role')).toBe('checkbox');
  expect(button.getAttribute('aria-label')).toBe('Record exercise');
  await act(async () => button.click());
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(button.getAttribute('aria-checked')).toBe('false');
  await act(async () =>
    root.render(<SpringCheck checked onChange={onChange} label="Review exercise" />),
  );
  expect(button.getAttribute('aria-checked')).toBe('true');
});

it('supports navigation without falsely selecting a segment for an unmatched route', async () => {
  const onChange = vi.fn();
  await act(async () =>
    root.render(
      <RubberSegment value="" options={options} onChange={onChange} label="Main pages" />,
    ),
  );
  expect(host.querySelector('[aria-current]')).toBeNull();
  expect(host.querySelector<HTMLElement>('.rb-rubber-segment__thumb')!.style.visibility).toBe(
    'hidden',
  );
  await act(async () => host.querySelectorAll('button')[1].click());
  expect(onChange).toHaveBeenCalledExactlyOnceWith('same');
  await act(async () =>
    root.render(
      <RubberSegment value="same" options={options} onChange={onChange} label="Main pages" />,
    ),
  );
  expect(host.querySelector('[aria-current="page"]')?.textContent).toBe('About the same');
});

it('keeps check-in choices as required native radios with their original values', async () => {
  const onChange = vi.fn();
  await act(async () =>
    root.render(
      <form>
        <JellyRadio
          name="feeling"
          label="How are you feeling?"
          value=""
          options={options}
          onChange={onChange}
        />
      </form>,
    ),
  );
  const inputs = host.querySelectorAll<HTMLInputElement>('input[type="radio"]');
  expect(inputs).toHaveLength(2);
  expect(inputs[0].required).toBe(true);
  expect(host.querySelector('form')!.checkValidity()).toBe(false);
  await act(async () => inputs[1].click());
  expect(onChange).toHaveBeenCalledExactlyOnceWith('same');
  await act(async () =>
    root.render(
      <form>
        <JellyRadio
          name="feeling"
          label="How are you feeling?"
          value="same"
          options={options}
          onChange={onChange}
        />
      </form>,
    ),
  );
  expect(inputs[1].checked).toBe(true);
  expect(host.querySelector('form')!.checkValidity()).toBe(true);
});

it('announces a saved message and supports an explicit, single dismissal', async () => {
  const onDismiss = vi.fn();
  await act(async () =>
    root.render(<SwipeToast message="Check-in saved." onDismiss={onDismiss} />),
  );
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Check-in saved.');
  const button = host.querySelector('button')!;
  expect(button.getAttribute('aria-label')).toBe('Dismiss notification');
  await act(async () => {
    button.click();
    button.click();
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

function pointer(type: string, y: number) {
  const event = new MouseEvent(type, { bubbles: true, button: 0, clientY: y });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  return event;
}

it('cancels an interrupted swipe and dismisses only a completed downward swipe', async () => {
  const onDismiss = vi.fn();
  await act(async () => root.render(<SwipeToast message="Saved." onDismiss={onDismiss} />));
  const card = host.querySelector<HTMLElement>('.rb-swipe-toast__card')!;
  await act(async () => {
    card.dispatchEvent(pointer('pointerdown', 0));
    card.dispatchEvent(pointer('pointermove', 60));
    card.dispatchEvent(pointer('pointercancel', 60));
  });
  expect(onDismiss).not.toHaveBeenCalled();
  await act(async () => {
    card.dispatchEvent(pointer('pointerdown', 0));
    card.dispatchEvent(pointer('pointermove', 60));
    card.dispatchEvent(pointer('pointerup', 60));
  });
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('does not dismiss a newer confirmation when the old exit animation finishes', async () => {
  reduce = false;
  const onDismiss = vi.fn();
  await act(async () =>
    root.render(<SwipeToast message="First record saved." onDismiss={onDismiss} />),
  );
  await act(async () => host.querySelector('button')!.click());
  await act(async () =>
    root.render(<SwipeToast message="Second record saved." onDismiss={onDismiss} />),
  );
  await act(async () => {
    await wait(250);
  });
  expect(onDismiss).not.toHaveBeenCalled();
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Second record saved.');
});

it('exposes the real progress immediately and settles the visible count under StrictMode', async () => {
  reduce = false;
  await act(async () =>
    root.render(
      <StrictMode>
        <CountUp value={67} suffix="%" />
      </StrictMode>,
    ),
  );
  expect(host.querySelector('.rb-sr-only')?.textContent).toBe('67%');
  await act(async () => {
    await wait(650);
  });
  expect(host.querySelector('[aria-hidden="true"]')?.textContent).toBe('67%');
  await act(async () => {
    reduce = true;
    for (const listener of listeners) listener();
  });
  await act(async () =>
    root.render(
      <StrictMode>
        <CountUp value={72} suffix="%" />
      </StrictMode>,
    ),
  );
  expect(host.querySelector('[aria-hidden="true"]')?.textContent).toBe('72%');
  expect(host.querySelector('.rb-sr-only')?.textContent).toBe('72%');
});
