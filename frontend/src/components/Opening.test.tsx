// @vitest-environment jsdom
import { StrictMode, act, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Opening from './Opening';
import { CareImage } from './ui';

let host: HTMLDivElement;
let root: Root;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({ matches: false })),
  );
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function Harness({ enter }: { enter: () => void }) {
  const [done, setDone] = useState(false);
  return done ? (
    <h1>Workspace ready</h1>
  ) : (
    <Opening
      onEnter={() => {
        enter();
        setDone(true);
      }}
    />
  );
}
describe('opening lifecycle', () => {
  it('automatically enters exactly once under StrictMode', async () => {
    const enter = vi.fn();
    await act(async () =>
      root.render(
        <StrictMode>
          <Harness enter={enter} />
        </StrictMode>,
      ),
    );
    expect(host.querySelector('.splash-screen')).not.toBeNull();
    await act(async () => {
      await wait(1350);
    });
    expect(host.textContent).toBe('Workspace ready');
    expect(enter).toHaveBeenCalledTimes(1);
  });
  it('skip immediately enters and cancels the later completion', async () => {
    const enter = vi.fn();
    await act(async () =>
      root.render(
        <StrictMode>
          <Harness enter={enter} />
        </StrictMode>,
      ),
    );
    await act(async () => host.querySelector<HTMLButtonElement>('.splash-skip')!.click());
    expect(host.textContent).toBe('Workspace ready');
    await act(async () => {
      await wait(1200);
    });
    expect(enter).toHaveBeenCalledTimes(1);
  });
  it('reduced motion bypasses the timed sequence', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true })),
    );
    const enter = vi.fn();
    await act(async () =>
      root.render(
        <StrictMode>
          <Harness enter={enter} />
        </StrictMode>,
      ),
    );
    await act(async () => {
      await wait(60);
    });
    expect(host.textContent).toBe('Workspace ready');
    expect(enter).toHaveBeenCalledTimes(1);
  });
});
it('image skeleton exists only while the image is unresolved', async () => {
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
  await act(async () => root.render(<CareImage src="/fictional-photo.jpg" alt="Demo coast" />));
  expect(host.querySelector('[role="status"]')?.textContent).toContain('Loading image');
  expect(host.querySelector('.care-image')?.getAttribute('aria-busy')).toBe('true');
  await act(async () => host.querySelector('img')!.dispatchEvent(new Event('load')));
  expect(host.querySelector('[role="status"]')).toBeNull();
  expect(host.querySelector('.care-image')?.getAttribute('aria-busy')).toBe('false');
});
