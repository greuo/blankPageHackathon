// @vitest-environment jsdom
import { act, useState, useSyncExternalStore } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import Assistant from './Assistant';
import { patientStore } from './store';
import { EdgeError, ensureDoctor, notifyDoctor, sendChat, syncCareNotes } from '../data/supabase';

// The live backend is mocked: tests verify the contract binding, not the service.
vi.mock('../data/supabase', () => {
  class EdgeError extends Error {
    constructor(
      message: string,
      public status: number,
      public code?: string,
      public retryAfterSeconds?: number,
    ) {
      super(message);
    }
  }
  return {
    EdgeError,
    ensureSession: vi.fn(async () => {}),
    syncCareNotes: vi.fn(async () => {}),
    sendChat: vi.fn(),
    notifyDoctor: vi.fn(),
    ensureDoctor: vi.fn(),
  };
});

const messageRow = (sender: 'patient' | 'bot', content: string) => ({
  id: `${sender}-${content.length}-row`,
  patient_id: 'patient-1',
  sender,
  content,
  created_at: new Date().toISOString(),
});

let root: Root;
let host: HTMLDivElement;
function Harness() {
  const state = useSyncExternalStore(patientStore.subscribe, patientStore.getSnapshot);
  const [text, setText] = useState('');
  return (
    <Assistant
      state={state}
      text={text}
      setText={setText}
      onReport={() => {}}
      onEmergency={() => {}}
    />
  );
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('matchMedia', () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  }));
  patientStore.reset();
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  await act(async () => root.render(<Harness />));
});
afterEach(async () => {
  await act(async () => root.unmount());
  host.remove();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});
async function click(name: string) {
  const button = Array.from(host.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(name),
  );
  expect(button, `button ${name}`).toBeTruthy();
  await act(async () => button!.click());
}

it('shows the live bot reply and offers Send to my doctor when suggested', async () => {
  vi.mocked(sendChat).mockResolvedValue({
    patient_message: messageRow('patient', 'Review my tasks'),
    reply: messageRow('bot', 'Your notes say to keep the wound dry; check with your doctor.'),
    action: 'referred',
    suggest_notify_doctor: true,
  });
  vi.mocked(ensureDoctor).mockResolvedValue('doctor-1');
  vi.mocked(notifyDoctor).mockResolvedValue({
    id: 'dm-1',
    expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
  });
  await click('Review my tasks');
  expect(vi.mocked(sendChat)).toHaveBeenCalledWith('Review my tasks');
  // The notes reached the server before the question was asked.
  const seed = patientStore.getSnapshot();
  expect(vi.mocked(syncCareNotes)).toHaveBeenCalledWith({
    doctor: seed.doctor,
    email: seed.email,
    instructions: seed.instructions,
  });
  expect(Math.min(...vi.mocked(syncCareNotes).mock.invocationCallOrder)).toBeLessThan(
    Math.min(...vi.mocked(sendChat).mock.invocationCallOrder),
  );
  const log = host.querySelector('[role=log]');
  expect(log?.textContent).toContain('keep the wound dry');
  expect(patientStore.getSnapshot().messages.at(-1)).toMatchObject({
    role: 'assistant',
    suggestNotifyDoctor: true,
    patientText: 'Review my tasks',
  });
  await click('Send to my doctor');
  expect(vi.mocked(notifyDoctor)).toHaveBeenCalledWith('doctor-1', 'Review my tasks');
  expect(log?.textContent).toContain('secure link');
});

it('keeps the question and explains the wait when chat answers 429', async () => {
  vi.mocked(sendChat).mockRejectedValue(
    new EdgeError('You’re sending messages too quickly.', 429, undefined, 600),
  );
  const before = patientStore.getSnapshot().messages.length;
  await click('Review my tasks');
  expect(host.querySelector('[role=alert]')?.textContent).toContain('about 10 minutes');
  expect(patientStore.getSnapshot().messages.length).toBe(before);
});

it('asks guests to add an email when notify-doctor answers guest_must_sign_up', async () => {
  vi.mocked(sendChat).mockResolvedValue({
    patient_message: messageRow('patient', 'Review my tasks'),
    reply: messageRow('bot', 'Please check with your doctor.'),
    action: 'referred',
    suggest_notify_doctor: true,
  });
  vi.mocked(ensureDoctor).mockResolvedValue('doctor-1');
  vi.mocked(notifyDoctor).mockRejectedValue(
    new EdgeError('Guests cannot send doctor messages.', 403, 'guest_must_sign_up'),
  );
  await click('Review my tasks');
  await click('Send to my doctor');
  expect(host.querySelector('.assistant-notify [role=alert]')?.textContent).toContain(
    'Add an email',
  );
});

it('does not ask the bot when the notes could not reach the server', async () => {
  vi.mocked(syncCareNotes).mockRejectedValue(
    new EdgeError('Could not update your care notes. Try again.', 0),
  );
  const before = patientStore.getSnapshot().messages.length;
  await click('Review my tasks');
  expect(vi.mocked(sendChat)).not.toHaveBeenCalled();
  expect(host.querySelector('[role=alert]')?.textContent).toContain('care notes');
  expect(patientStore.getSnapshot().messages.length).toBe(before);
});
