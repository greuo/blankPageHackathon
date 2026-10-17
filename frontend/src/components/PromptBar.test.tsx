// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PromptBar from './PromptBar';

let host: HTMLDivElement;
let root: Root;
const send = vi.fn();
const stop = vi.fn();
const change = vi.fn();
const report = vi.fn();
function render(busy = false, value = 'My question') {
  return act(async () =>
    root.render(
      <PromptBar
        value={value}
        onChange={change}
        busy={busy}
        onSend={send}
        onStop={stop}
        onReport={report}
      />,
    ),
  );
}
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
it('submits without clearing the controlled draft and preserves focus while preparing', async () => {
  await render();
  const field = host.querySelector('textarea')!;
  field.focus();
  await act(async () =>
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    ),
  );
  expect(send).toHaveBeenCalledTimes(1);
  expect(change).not.toHaveBeenCalled();
  expect(field.value).toBe('My question');
  await render(true);
  expect(field.readOnly).toBe(true);
  expect(field.disabled).toBe(false);
  expect(document.activeElement).toBe(field);
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[aria-label="Stop response"]')!.click(),
  );
  expect(stop).toHaveBeenCalledTimes(1);
});
it('keeps Shift+Enter and IME composition from sending', async () => {
  await render();
  const field = host.querySelector('textarea')!;
  await act(async () => {
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
    );
    field.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true }),
    );
  });
  expect(send).not.toHaveBeenCalled();
});
it('Escape dismisses shortcuts without falling through to a containing dialog', async () => {
  await render();
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[aria-label="Care plan shortcuts"]')!.click(),
  );
  const item = host.querySelector<HTMLButtonElement>('.care-prompt-menu button')!;
  item.focus();
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  await act(async () => item.dispatchEvent(event));
  expect(event.defaultPrevented).toBe(true);
  expect(
    host.querySelector('[aria-label="Care plan shortcuts"]')?.getAttribute('aria-expanded'),
  ).toBe('false');
  expect(document.activeElement).toBe(host.querySelector('[aria-label="Care plan shortcuts"]'));
});
