import { useId, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { getActivePlan, getActor, repository } from '../data/repository';
import type { Instruction, Plan } from '../data/types';
import './PlanBuilder.css';

interface PlanBuilderProps {
  spaceId: string;
  onClose: () => void;
}
type EditableInstruction = Omit<Instruction, 'dueAt' | 'endsAt'> & {
  dueAt: string;
  endsAt: string;
};
const stages = ['Source & template', 'Review instructions', 'Preview & publish'];

function localTime(value: string | undefined) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}
function newInstruction(text = '', sourceLabel = '', sourcePassage = ''): EditableInstruction {
  return {
    id: crypto.randomUUID(),
    kind: 'action',
    text,
    sourceLabel,
    sourcePassage,
    dueAt: '',
    endsAt: '',
    recurrence: 'once',
  };
}
function readableTime(value: string) {
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Keying the editor isolates unsaved work when the selected care space changes. */
export function PlanBuilder(props: PlanBuilderProps) {
  return <BuilderEditor key={props.spaceId} {...props} />;
}

function BuilderEditor({ spaceId, onClose }: PlanBuilderProps) {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const actor = getActor(state);
  const activePlan = getActivePlan(state, spaceId);
  const space = state.spaces.find((item) => item.id === spaceId);
  const [base] = useState(() => {
    const savedDraft = state.plans.find(
      (item) => item.spaceId === spaceId && item.status === 'draft',
    );
    const original = savedDraft ?? activePlan;
    const maxApproved = Math.max(
      0,
      ...state.plans
        .filter((item) => item.spaceId === spaceId && item.status === 'approved')
        .map((item) => item.version),
    );
    const nextVersion =
      Math.max(
        0,
        ...state.plans.filter((item) => item.spaceId === spaceId).map((item) => item.version),
      ) + 1;
    const rebased = !!savedDraft && savedDraft.version <= maxApproved;
    return {
      id: savedDraft?.id ?? crypto.randomUUID(),
      version: rebased ? nextVersion : (savedDraft?.version ?? nextVersion),
      rebased,
      title: original?.title ?? 'My recovery plan',
      instructions: (original?.instructions ?? []).map((item) => ({
        ...item,
        dueAt: localTime(item.dueAt),
        endsAt: localTime(item.endsAt),
      })),
      saved: !!savedDraft && !rebased,
      fingerprint: savedDraft && !rebased ? JSON.stringify(savedDraft) : null,
    };
  });
  const [title, setTitle] = useState(base.title);
  const [instructions, setInstructions] = useState<EditableInstruction[]>(base.instructions);
  const [step, setStep] = useState(0);
  const [sourceText, setSourceText] = useState('');
  const [sourceLabel, setSourceLabel] = useState('Clinician-entered instructions');
  const [saved, setSaved] = useState(base.saved);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(base.fingerprint);
  const [approved, setApproved] = useState(false);
  const [published, setPublished] = useState(false);
  const [pending, setPending] = useState<'upload' | 'save' | 'publish' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(
    base.rebased
      ? 'A newer plan was published while this draft was open. Your content is preserved in the next version. Review and save it again before approving.'
      : '',
  );
  const [uploadName, setUploadName] = useState('');
  const [template, setTemplate] = useState('General recovery');
  const busy = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const prefix = useId();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  function markChanged() {
    setSaved(false);
    setApproved(false);
    setNotice('');
    setError('');
  }
  function updateInstruction(id: string, changes: Partial<EditableInstruction>) {
    markChanged();
    setInstructions((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }
  function fail(message: string) {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  }
  function goTo(next: number) {
    setStep(next);
    setError('');
    requestAnimationFrame(() => headingRef.current?.focus());
  }
  function addFromSource() {
    const lines = sourceText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return fail('Add at least one instruction line before creating drafts.');
    if (!sourceLabel.trim()) return fail('Give these instructions a source label first.');
    if (lines.length > 50)
      return fail(
        'Please review at most 50 lines per batch. Shorten the pasted text and try again.',
      );
    markChanged();
    setInstructions((items) => [
      ...items,
      ...lines.map((line) => newInstruction(line, sourceLabel.trim(), line)),
    ]);
    setSourceText('');
    setNotice(
      `${lines.length} line${lines.length === 1 ? '' : 's'} added as unapproved drafts. Review every line and set its timing.`,
    );
  }
  function useTemplate() {
    markChanged();
    const reminders = [
      'Read your approved recovery instructions',
      'Write down questions for your care team',
    ];
    setInstructions((items) => [
      ...items,
      ...reminders.map((text) =>
        newInstruction(text, `${template}: fictional nonmedical demo template`, text),
      ),
    ]);
    setNotice(
      'Two nonmedical reminders added. Set their dates before saving. No clinical orders were generated.',
    );
  }
  async function upload(file: File | undefined) {
    if (!file || busy.current) return;
    busy.current = true;
    setPending('upload');
    setError('');
    setNotice('');
    try {
      const document = await repository.uploadDocument(spaceId, file);
      setSourceText(document.text);
      setSourceLabel(document.name);
      setUploadName(document.name);
      setNotice(
        'Text file saved in this local demo. Review the text, then select “Create line drafts” to structure it.',
      );
    } catch (reason) {
      fail(
        reason instanceof Error
          ? reason.message
          : 'The text file could not be uploaded. Your existing work is preserved.',
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  function validatedPlan(): Plan | null {
    if (!title.trim()) {
      fail('Give this plan a title.');
      return null;
    }
    if (!instructions.length) {
      fail('Add at least one instruction before saving.');
      return null;
    }
    const prepared: Instruction[] = [];
    for (const [index, item] of instructions.entries()) {
      const label = `Instruction ${index + 1}`;
      if (!item.text.trim() || !item.sourceLabel.trim() || !item.sourcePassage.trim()) {
        fail(`${label}: instruction text, source label, and original source passage are required.`);
        return null;
      }
      const due = new Date(item.dueAt);
      if (
        !item.dueAt ||
        !Number.isFinite(due.getTime()) ||
        localTime(due.toISOString()) !== item.dueAt
      ) {
        fail(`${label}: choose a valid date and time in ${timezone}.`);
        return null;
      }
      const end = item.endsAt ? new Date(item.endsAt) : undefined;
      if (item.kind === 'restriction' && !end) {
        fail(`${label}: restrictions need an end date and time.`);
        return null;
      }
      if (
        end &&
        (!Number.isFinite(end.getTime()) ||
          localTime(end.toISOString()) !== item.endsAt ||
          end.getTime() <= due.getTime())
      ) {
        fail(`${label}: the end must be after the start.`);
        return null;
      }
      prepared.push({
        ...item,
        text: item.text.trim(),
        sourceLabel: item.sourceLabel.trim(),
        sourcePassage: item.sourcePassage.trim(),
        dueAt: due.toISOString(),
        endsAt: end?.toISOString(),
        recurrence: item.kind === 'restriction' ? 'once' : item.recurrence,
      });
    }
    return {
      id: base.id,
      spaceId,
      title: title.trim(),
      version: base.version,
      status: 'draft',
      instructions: prepared,
    };
  }
  async function saveDraft() {
    if (busy.current) return;
    const plan = validatedPlan();
    if (!plan) return;
    busy.current = true;
    setPending('save');
    setError('');
    try {
      await repository.saveDraft(plan);
      // Compare the persisted record on publish, including IDs normalized by the repository.
      const storedDraft = repository.getSnapshot().plans.find((item) => item.id === base.id);
      if (!storedDraft || storedDraft.status !== 'draft')
        throw new Error('The saved draft could not be verified. Your edits are preserved.');
      setSavedFingerprint(JSON.stringify(storedDraft));
      setSaved(true);
      setNotice(`Version ${base.version} saved as a draft. It is not on the patient checklist.`);
      goTo(2);
    } catch (reason) {
      fail(
        reason instanceof Error
          ? reason.message
          : 'The draft could not be saved. Your edits are preserved; please retry.',
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  async function publish() {
    if (busy.current || !saved || !approved || published) return;
    const storedDraft = repository.getSnapshot().plans.find((item) => item.id === base.id);
    if (!savedFingerprint || !storedDraft || JSON.stringify(storedDraft) !== savedFingerprint) {
      setSaved(false);
      setApproved(false);
      setNotice('');
      setStep(1);
      fail(
        storedDraft?.status === 'approved'
          ? 'Another session already published this draft. Approval was cleared and your edits are preserved here. Close and reopen the builder to review the latest version before creating a new draft.'
          : 'Another session changed this draft. Publication was stopped and approval cleared. Review your preserved edits, then save again before approving.',
      );
      return;
    }
    busy.current = true;
    setPending('publish');
    setError('');
    try {
      await repository.publishPlan(base.id);
      setPublished(true);
      setNotice(
        `Version ${base.version} published. The patient checklist now uses this approved version.`,
      );
    } catch (reason) {
      fail(
        reason instanceof Error
          ? reason.message
          : 'Publication failed. Your saved draft is preserved; please retry.',
      );
    } finally {
      busy.current = false;
      setPending(null);
    }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 0) goTo(1);
    else if (step === 1) void saveDraft();
    else if (!saved) void saveDraft();
    else void publish();
  }

  if (actor.role !== 'doctor')
    return (
      <div className="builder stack">
        <h2>Clinician access required</h2>
        <p>Only the clinician can edit and approve recovery instructions.</p>
        <button className="btn secondary" onClick={onClose}>
          Close builder
        </button>
      </div>
    );
  if (!space)
    return (
      <div className="builder stack">
        <h2>Care space unavailable</h2>
        <p>This care space could not be found.</p>
        <button className="btn secondary" onClick={onClose}>
          Close builder
        </button>
      </div>
    );

  return (
    <div className="builder">
      <header className="builder-heading row">
        <div>
          <p className="eyebrow">CLINICIAN STUDIO · {space.name}</p>
          <h2 id="builder-title">A little guidance. A better recovery.</h2>
          <p className="muted">
            Shape an approved plan into a companion your patient can use every day.
          </p>
        </div>
        <button
          type="button"
          className="btn quiet"
          onClick={onClose}
          disabled={!!pending}
          aria-label="Close plan builder"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>
      <ol className="builder-steps" aria-label="Plan creation progress">
        {stages.map((name, index) => (
          <li key={name} aria-current={step === index ? 'step' : undefined}>
            <span>{index < step ? <Check size={15} aria-hidden="true" /> : index + 1}</span>
            <strong>{name}</strong>
          </li>
        ))}
      </ol>
      <div className="builder-status-row row">
        <span className="badge">
          Version {base.version} · {published ? 'Approved' : 'Draft'}
        </span>
        <span className="muted">
          {published
            ? 'Published to the local demo'
            : saved
              ? 'Draft saved locally'
              : 'Unsaved changes'}{' '}
          · {timezone}
        </span>
      </div>
      {error && (
        <div className="alert error" role="alert" ref={errorRef} tabIndex={-1}>
          {error}
        </div>
      )}
      {notice && (
        <div className={`alert ${published ? 'success' : ''}`} role="status">
          {notice}
        </div>
      )}
      {published ? (
        <section className="builder-published stack">
          <span className="builder-published-icon">
            <ShieldCheck size={36} aria-hidden="true" />
          </span>
          <p className="eyebrow">READY FOR YOUR PATIENT</p>
          <h3>{title}</h3>
          <p>
            {instructions.length} approved instruction{instructions.length === 1 ? '' : 's'}, with
            timing and sources preserved.
          </p>
          <p className="muted">
            This is a fictional browser-local demonstration. It has not delivered a clinical plan to
            a real patient.
          </p>
          <button className="btn primary" onClick={onClose}>
            Return to care space <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>
      ) : (
        <form onSubmit={submit} noValidate>
          <fieldset disabled={!!pending} className="builder-fieldset">
            <h3 ref={headingRef} tabIndex={-1} className="builder-stage-title">
              {stages[step]}
            </h3>
            {step === 0 && (
              <div className="builder-grid">
                <section className="panel stack">
                  <div>
                    <span className="eyebrow">START WITH WHAT YOU KNOW</span>
                    <h4>Bring your instructions</h4>
                    <p className="muted">
                      Paste approved source text. Each line becomes an editable draft for you to
                      review.
                    </p>
                  </div>
                  <label className="field">
                    Plan title
                    <input
                      name="planTitle"
                      value={title}
                      onChange={(event) => {
                        markChanged();
                        setTitle(event.target.value);
                      }}
                      maxLength={150}
                    />
                  </label>
                  <label className="field">
                    Source label
                    <input
                      name="sourceLabel"
                      value={sourceLabel}
                      onChange={(event) => setSourceLabel(event.target.value)}
                      placeholder="e.g. Approved discharge notes"
                    />
                  </label>
                  <label className="field">
                    Original instructions
                    <textarea
                      name="sourceText"
                      rows={7}
                      value={sourceText}
                      onChange={(event) => setSourceText(event.target.value)}
                      placeholder="Paste one instruction per line. Keep the original clinical wording."
                    />
                  </label>
                  <button type="button" className="btn secondary" onClick={addFromSource}>
                    <Plus size={17} aria-hidden="true" /> Create line drafts
                  </button>
                  <p className="muted">
                    {instructions.length} draft instruction{instructions.length === 1 ? '' : 's'}{' '}
                    ready for review. No AI extraction is running.
                  </p>
                </section>
                <aside className="stack">
                  <section className="panel builder-template stack">
                    <span className="builder-template-icon">
                      <FileText size={23} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="eyebrow">OPTIONAL STARTER</p>
                      <h4>Recovery essentials</h4>
                      <p>
                        Two everyday reminders. A clean starting point for your own approved
                        guidance.
                      </p>
                    </div>
                    <span className="badge">Fictional · nonmedical</span>
                    <label className="field">
                      Procedure template
                      <select
                        value={template}
                        onChange={(event) => setTemplate(event.target.value)}
                      >
                        <option>General recovery</option>
                        <option>After a clinic visit</option>
                        <option>After a procedure</option>
                      </select>
                    </label>
                    <p className="muted">
                      These starters contain nonmedical reminders only. The clinician supplies every
                      procedure-specific instruction.
                    </p>
                    <button type="button" className="btn secondary" onClick={useTemplate}>
                      Add template reminders
                    </button>
                  </section>
                  <section className="panel stack">
                    <h4>
                      <Upload size={18} aria-hidden="true" /> Upload source text
                    </h4>
                    <p id={`${prefix}-upload-policy`} className="muted">
                      UTF-8 plain text (.txt) only, up to 1 MiB. PDF, Word, images, and automatic
                      clinical extraction are not supported in this prototype.
                    </p>
                    <label className="field">
                      Choose a text file
                      <input
                        name="sourceFile"
                        type="file"
                        accept=".txt,text/plain"
                        aria-describedby={`${prefix}-upload-policy`}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          void upload(file);
                        }}
                      />
                    </label>
                    {pending === 'upload' && (
                      <div role="status">
                        <progress aria-label="Reading and saving source text" />
                        <p>Reading and saving text…</p>
                      </div>
                    )}
                    {uploadName && <p className="muted">Loaded: {uploadName}</p>}
                  </section>
                </aside>
              </div>
            )}
            {step === 1 && (
              <section className="stack">
                <p className="muted">
                  Review the original wording, choose the instruction type, and confirm every date.
                  Times are entered in {timezone} and saved as UTC timestamps.
                </p>
                <label className="field">
                  Plan title
                  <input
                    name="reviewPlanTitle"
                    value={title}
                    maxLength={150}
                    onChange={(event) => {
                      markChanged();
                      setTitle(event.target.value);
                    }}
                  />
                </label>
                {!instructions.length && (
                  <div className="panel">
                    <h4>Your plan starts here</h4>
                    <p>Add an instruction below, or go back to bring in source text.</p>
                  </div>
                )}
                {instructions.map((instruction, index) => (
                  <InstructionEditor
                    key={instruction.id}
                    instruction={instruction}
                    index={index}
                    prefix={prefix}
                    onChange={(changes) => updateInstruction(instruction.id, changes)}
                    onRemove={() => {
                      markChanged();
                      setInstructions((items) =>
                        items.filter((item) => item.id !== instruction.id),
                      );
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    markChanged();
                    setInstructions((items) => [...items, newInstruction()]);
                  }}
                >
                  <Plus size={17} aria-hidden="true" /> Add instruction
                </button>
                <div className="source-box">
                  <ShieldCheck size={20} aria-hidden="true" />
                  <p>
                    <strong>Clinician review is the final step.</strong> This builder does not fill
                    in missing doses, thresholds, restrictions, or dates. Add only guidance you have
                    verified.
                  </p>
                </div>
              </section>
            )}
            {step === 2 && (
              <section className="builder-grid">
                <div className="preview-plan panel stack">
                  <div className="row">
                    <span className="eyebrow">PATIENT PREVIEW</span>
                    <span className="badge">Unpublished draft</span>
                  </div>
                  <h4>{title}</h4>
                  <p className="muted">A preview of the instructions in this version.</p>
                  {instructions.map((item) => (
                    <article key={item.id} className="builder-preview-item">
                      <span className="badge">
                        {item.kind === 'restriction'
                          ? 'Restriction'
                          : item.kind === 'appointment'
                            ? 'Appointment'
                            : 'Action'}
                        {item.recurrence === 'daily' && item.kind !== 'restriction'
                          ? ' · Daily'
                          : ''}
                      </span>
                      <h5>{item.text}</h5>
                      <p className="muted">
                        {item.dueAt ? readableTime(item.dueAt) : 'Date required'}
                        {item.endsAt ? ` to ${readableTime(item.endsAt)}` : ''}
                      </p>
                      {item.kind === 'restriction' && (
                        <p className="muted">
                          Remains in force through its end time; it is not a task to check off.
                        </p>
                      )}
                      <details>
                        <summary>View source</summary>
                        <p className="muted">{item.sourceLabel}</p>
                        <blockquote>{item.sourcePassage}</blockquote>
                      </details>
                    </article>
                  ))}
                </div>
                <aside className="panel stack builder-publish-panel">
                  <ShieldCheck size={28} aria-hidden="true" />
                  <h4>Make it ready for recovery.</h4>
                  <p>
                    Only published, approved instructions become checklist items. Publishing
                    replaces the active plan for future occurrences; existing reports remain
                    attributed.
                  </p>
                  <p className="muted">
                    {activePlan
                      ? `Current patient plan: version ${activePlan.version}.`
                      : 'This care space has no approved plan yet.'}{' '}
                    You are reviewing version {base.version}.
                  </p>
                  <label className="builder-approval">
                    <input
                      name="clinicianApproval"
                      type="checkbox"
                      checked={approved}
                      disabled={!saved}
                      onChange={(event) => setApproved(event.target.checked)}
                    />
                    <span>
                      I have reviewed every instruction, source, and timing rule, and approve this
                      version for the fictional patient.
                    </span>
                  </label>
                  <p className="muted">Approved by {actor.name}. Browser-local demo only.</p>
                </aside>
              </section>
            )}
            <footer className="builder-footer row">
              <div>
                {step > 0 && (
                  <button type="button" className="btn quiet" onClick={() => goTo(step - 1)}>
                    <ArrowLeft size={17} aria-hidden="true" /> Back
                  </button>
                )}
              </div>
              <div className="row">
                <button type="button" className="btn secondary" onClick={onClose}>
                  Close
                </button>
                {step === 0 ? (
                  <button type="submit" className="btn primary">
                    Review instructions <ArrowRight size={17} aria-hidden="true" />
                  </button>
                ) : step === 1 || !saved ? (
                  <button type="submit" className="btn primary">
                    {pending === 'save' ? 'Saving draft…' : 'Save draft & preview'}{' '}
                    <ArrowRight size={17} aria-hidden="true" />
                  </button>
                ) : (
                  <button type="submit" className="btn primary" disabled={!approved}>
                    {pending === 'publish' ? 'Publishing…' : `Approve & publish v${base.version}`}{' '}
                    <ShieldCheck size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            </footer>
          </fieldset>
        </form>
      )}
    </div>
  );
}

function InstructionEditor({
  instruction,
  index,
  prefix,
  onChange,
  onRemove,
}: {
  instruction: EditableInstruction;
  index: number;
  prefix: string;
  onChange: (changes: Partial<EditableInstruction>) => void;
  onRemove: () => void;
}) {
  const id = `${prefix}-${instruction.id}`;
  return (
    <section className="instruction-editor panel stack" aria-labelledby={`${id}-heading`}>
      <div className="row builder-instruction-header">
        <h4 id={`${id}-heading`}>Instruction {index + 1}</h4>
        <button
          type="button"
          className="btn quiet"
          aria-label={`Remove instruction ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 size={17} aria-hidden="true" /> Remove
        </button>
      </div>
      <div className="builder-instruction-grid">
        <label className="field">
          Type
          <select
            name={`${id}-kind`}
            value={instruction.kind}
            onChange={(event) =>
              onChange({
                kind: event.target.value as Instruction['kind'],
                recurrence: event.target.value === 'restriction' ? 'once' : instruction.recurrence,
              })
            }
          >
            <option value="action">Action to report complete</option>
            <option value="restriction">Restriction with an end time</option>
            <option value="appointment">Appointment or follow-up</option>
          </select>
        </label>
        <label className="field">
          {instruction.kind === 'restriction' ? 'Starts at' : 'Date and time'}
          <input
            name={`${id}-due`}
            type="datetime-local"
            value={instruction.dueAt}
            onChange={(event) => onChange({ dueAt: event.target.value })}
            required
          />
        </label>
        {instruction.kind === 'restriction' ? (
          <label className="field">
            Restriction ends
            <input
              name={`${id}-end`}
              type="datetime-local"
              value={instruction.endsAt}
              min={instruction.dueAt || undefined}
              onChange={(event) => onChange({ endsAt: event.target.value })}
              required
            />
          </label>
        ) : (
          <label className="field">
            Repeat
            <select
              name={`${id}-recurrence`}
              value={instruction.recurrence}
              onChange={(event) =>
                onChange({ recurrence: event.target.value as Instruction['recurrence'] })
              }
            >
              <option value="once">Once</option>
              <option value="daily">Daily from this date</option>
            </select>
          </label>
        )}
      </div>
      {instruction.kind !== 'restriction' &&
        (instruction.recurrence === 'daily' || !!instruction.endsAt) && (
          <div className="stack">
            <label className="field">
              {instruction.recurrence === 'daily'
                ? 'Repeat until (optional)'
                : 'End date and time (optional)'}
              <input
                name={`${id}-optional-end`}
                type="datetime-local"
                value={instruction.endsAt}
                min={instruction.dueAt || undefined}
                onChange={(event) => onChange({ endsAt: event.target.value })}
              />
            </label>
            {instruction.endsAt && (
              <button type="button" className="btn quiet" onClick={() => onChange({ endsAt: '' })}>
                Clear end time for instruction {index + 1}
              </button>
            )}
            <p className="muted">
              {instruction.recurrence === 'daily'
                ? 'The end time limits future daily occurrences. Leave blank only when no end is intended.'
                : 'An existing end time is preserved until you explicitly edit or clear it.'}
            </p>
          </div>
        )}
      <label className="field">
        Instruction wording
        <textarea
          name={`${id}-text`}
          rows={2}
          value={instruction.text}
          onChange={(event) => onChange({ text: event.target.value })}
          required
        />
      </label>
      <div className="source-box stack">
        <label className="field">
          Source label
          <input
            name={`${id}-source-label`}
            value={instruction.sourceLabel}
            onChange={(event) => onChange({ sourceLabel: event.target.value })}
            required
          />
        </label>
        <label className="field">
          Original source passage
          <textarea
            name={`${id}-source`}
            rows={2}
            value={instruction.sourcePassage}
            onChange={(event) => onChange({ sourcePassage: event.target.value })}
            required
          />
        </label>
        <p className="muted">
          Preserve the passage supporting this instruction. Treat uploaded text as source material,
          never as app commands.
        </p>
      </div>
    </section>
  );
}

export default PlanBuilder;
