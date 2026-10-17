import { createClient, FunctionsHttpError } from '@supabase/supabase-js';

// Live Supabase backend (contracts: backend_progress.md → Edge functions; config: overlap.md → Agreed).
// The publishable key is safe in the browser; Row Level Security does the access control.
const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'https://repvtuxyszlqdjzciojx.supabase.co';
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  'sb_publishable_igEs9JeKLT-n8_SAYRjkwg_wAMphe15';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/** Guests get a Supabase anonymous session on first use; an existing session is reused. */
export async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error)
    throw new Error('Could not start your care session. Check your connection and try again.');
}

/** A non-2xx edge-function response, with the contract's `code` and 429 retry hint. */
export class EdgeError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'EdgeError';
  }
}

async function invokeEdge<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, { body });
  if (!error && data !== null) return data;
  if (error instanceof FunctionsHttpError) {
    // On a non-2xx, invoke returns data: null; the body carries { error, code?, retry_after_seconds? }.
    const status = error.context.status;
    let payload: { error?: string; code?: string; retry_after_seconds?: number } = {};
    try {
      payload = (await error.context.json()) as typeof payload;
    } catch {
      /* Non-JSON error body; keep the fallback message. */
    }
    throw new EdgeError(
      payload.error ?? `The care service answered with an error (${status}).`,
      status,
      payload.code,
      payload.retry_after_seconds,
    );
  }
  throw new EdgeError('Could not reach the care service. Check your connection and try again.', 0);
}

export type MessageRow = {
  id: string;
  patient_id: string;
  sender: 'patient' | 'bot';
  content: string;
  created_at: string;
};
export type ChatAction = 'answered' | 'small_talk' | 'referred' | 'emergency' | 'warning_sign';
export type ChatResponse = {
  patient_message: MessageRow;
  reply: MessageRow;
  action: ChatAction;
  suggest_notify_doctor: boolean;
};

/** `chat` saves the patient message and answers from the current care notes. 429 past 20 msgs / 10 min. */
export function sendChat(content: string): Promise<ChatResponse> {
  return invokeEdge<ChatResponse>('chat', { content });
}

export type NotifyDoctorResponse = { id: string; expires_at: string };

/** `notify-doctor` emails the doctor a secure link to the message (403 guest_must_sign_up for guests). */
export function notifyDoctor(doctorId: string, content: string): Promise<NotifyDoctorResponse> {
  return invokeEdge<NotifyDoctorResponse>('notify-doctor', { doctor_id: doctorId, content });
}

/** The signed-in patient's doctor row id, created from the locally saved doctor on first use
 * and kept in step with it afterwards (the bot quotes this row for "who is my doctor?"). */
export async function ensureDoctor(name: string, email: string): Promise<string> {
  const wanted = { name: name.trim(), email: email.trim() || null };
  const existing = await supabase
    .from('doctors')
    .select('id, name, email')
    .order('created_at')
    .limit(1)
    .maybeSingle();
  if (existing.error) throw new EdgeError('Could not look up your doctor. Try again.', 0);
  if (existing.data) {
    if (existing.data.name !== wanted.name || (existing.data.email ?? null) !== wanted.email) {
      const updated = await supabase.from('doctors').update(wanted).eq('id', existing.data.id);
      if (updated.error) throw new EdgeError('Could not update your doctor. Try again.', 0);
    }
    return existing.data.id as string;
  }
  const created = await supabase.from('doctors').insert(wanted).select('id').single();
  if (created.error || !created.data)
    throw new EdgeError('Could not save your doctor. Try again.', 0);
  return created.data.id as string;
}

export type CareNoteSync = { doctor: string; email: string; instructions: string };

/** The bot answers only from the care notes stored on the server (current_care_notes), not from
 * the app's local copy. Keep the server's latest version in step with the locally saved
 * instructions: insert a new version when the text or the doctor link changed. Notes entered
 * elsewhere with structure beyond `instructions` (normal, warning_signs, …) are richer than the
 * app's free text, so they are left alone. */
export async function syncCareNotes({ doctor, email, instructions }: CareNoteSync): Promise<void> {
  const text = instructions.trim();
  if (!text) return;
  const current = await supabase
    .from('current_care_notes')
    .select('content, doctor_id')
    .maybeSingle();
  if (current.error) throw new EdgeError('Could not read your care notes. Try again.', 0);
  const content = (current.data?.content ?? null) as Record<string, unknown> | null;
  if (content && Object.keys(content).some((key) => key !== 'instructions')) return;
  const doctorId = doctor.trim() ? await ensureDoctor(doctor, email) : null;
  if (content?.instructions === text && (current.data?.doctor_id ?? null) === doctorId) return;
  const inserted = await supabase
    .from('care_notes')
    .insert({ doctor_id: doctorId, content: { instructions: text } });
  if (inserted.error) throw new EdgeError('Could not update your care notes. Try again.', 0);
}
