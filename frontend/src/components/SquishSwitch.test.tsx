// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SquishSwitch from './SquishSwitch';

let host: HTMLDivElement;
let root: Root;
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
  vi.unstubAllGlobals();
});

it('requests a controlled change and exposes its current state and label', async () => {
  const onChange = vi.fn();
  await act(async () =>
    root.render(<SquishSwitch checked={false} onChange={onChange} label="Include instructions" />),
  );
  const button = host.querySelector<HTMLButtonElement>('[role="switch"]')!;
  expect(button.getAttribute('aria-checked')).toBe('false');
  expect(host.querySelector('label')?.htmlFor).toBe(button.id);
  await act(async () => button.click());
  expect(onChange).toHaveBeenCalledWith(true);
  expect(button.getAttribute('aria-checked')).toBe('false');
  await act(async () =>
    root.render(<SquishSwitch checked onChange={onChange} label="Include instructions" />),
  );
  expect(button.getAttribute('aria-checked')).toBe('true');
});

it('uses a native disabled button to prevent changes', async () => {
  const onChange = vi.fn();
  await act(async () =>
    root.render(
      <SquishSwitch checked={false} onChange={onChange} label="Include instructions" disabled />,
    ),
  );
  const button = host.querySelector<HTMLButtonElement>('button')!;
  expect(button.disabled).toBe(true);
  await act(async () => button.click());
  expect(onChange).not.toHaveBeenCalled();
});
