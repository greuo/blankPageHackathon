// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ReportDraft, { buildEmailDraft } from './ReportDraft';
import { seed, summary } from './model';

let host: HTMLDivElement;
let root: Root;
const now = new Date(2026, 9, 17, 12);

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (handle: number) => clearTimeout(handle));
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function click(label: string) {
  const button = [...host.querySelectorAll<HTMLButtonElement>('button')].find(
    (item) => item.textContent === label,
  );
  expect(button, label).toBeTruthy();
  await act(async () => button!.click());
}

it('preserves the complete original report when instructions are included', () => {
  const state = seed(now);
  state.doses = { '2026-10-16': ['morning'], '2026-10-17': ['morning', 'evening'] };
  state.checkIns = [
    {
      date: '2026-10-17',
      pain: 2,
      temperature: '37',
      feeling: 'Okay',
      notes: 'A question for my doctor.',
    },
  ];
  const draft = buildEmailDraft(state, now, true);
  expect(draft.to).toBe(state.email);
  expect(draft.body).toContain(summary(state, now));
  expect(draft.body).toContain('3 dose reports across 2 days');
  expect(draft.body).toContain('No dose report confirms ingestion.');
});

it('omits only the optional instruction text and keeps the original state intact', () => {
  const state = seed(now);
  const original = structuredClone(state);
  const draft = buildEmailDraft(state, now, false);
  expect(draft.body).not.toContain(state.instructions);
  expect(draft.body).toContain('The full text remains in your progress report.');
  expect(draft.body).toContain('CHECK-INS');
  expect(draft.body).toContain('EMERGENCY EVENTS');
  expect(draft.body).toContain('No email sent.');
  expect(state).toEqual(original);
});

it('shows preparation feedback and a local preview without contacting a service', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch');
  await act(async () => root.render(<ReportDraft state={seed(now)} now={now} />));
  await click('Prepare email draft');
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Preparing your draft');
  expect(host.querySelector('.report-draft__skeleton')).not.toBeNull();
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Draft ready to review');
  expect(host.querySelector('.report-draft__skeleton')).toBeNull();
  expect(host.querySelector('pre')?.textContent).toContain('No email sent.');
  expect(fetch).not.toHaveBeenCalled();
});

it('cancels scheduled preparation and never reveals a stale result', async () => {
  await act(async () => root.render(<ReportDraft state={seed(now)} now={now} />));
  await click('Prepare email draft');
  await click('Cancel');
  await act(async () => vi.advanceTimersByTimeAsync(30));
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Preparation cancelled');
  expect(host.querySelector('pre')).toBeNull();
});

it('invalidates an existing draft when reported records change', async () => {
  const state = seed(now);
  await act(async () => root.render(<ReportDraft state={state} now={now} />));
  await click('Prepare email draft');
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(host.querySelector('pre')).not.toBeNull();
  await act(async () =>
    root.render(
      <ReportDraft state={{ ...state, doses: { '2026-10-17': ['morning'] } }} now={now} />,
    ),
  );
  expect(host.querySelector('pre')).toBeNull();
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Ready to prepare');
});

it('keeps a prepared snapshot while the dashboard clock ticks on the same day', async () => {
  const state = seed(now);
  await act(async () => root.render(<ReportDraft state={state} now={now} />));
  await click('Prepare email draft');
  await act(async () => vi.advanceTimersByTimeAsync(20));
  const prepared = host.querySelector('pre')?.textContent;
  await act(async () =>
    root.render(<ReportDraft state={state} now={new Date(now.getTime() + 30000)} />),
  );
  expect(host.querySelector('pre')?.textContent).toBe(prepared);
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Draft ready to review');
});

it('surfaces formatting failure instead of marking the draft ready', async () => {
  await act(async () => root.render(<ReportDraft state={seed(now)} now={new Date(NaN)} />));
  await click('Prepare email draft');
  await act(async () => vi.advanceTimersByTimeAsync(20));
  expect(host.querySelector('[role="status"]')?.textContent).toBe('Draft could not be prepared');
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(
    'A valid report date is required.',
  );
  expect(host.querySelector('pre')).toBeNull();
});

it('cancels scheduled work when the draft view unmounts', async () => {
  await act(async () => root.render(<ReportDraft state={seed(now)} now={now} />));
  await click('Prepare email draft');
  await act(async () => root.render(<p>Closed</p>));
  await act(async () => vi.advanceTimersByTimeAsync(30));
  expect(host.textContent).toBe('Closed');
});
