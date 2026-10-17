import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, UploadCloud, FileText, X, Save } from 'lucide-react';
import { errorText } from '../components/ui';
import { useSurfaceEntrance } from '../components/motion';
import { patientStore } from './store';
import type { Attachment, PatientState } from './model';
export default function Instructions({
  state,
  onBack,
  onSaved,
}: {
  state: PatientState;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [doctor, setDoctor] = useState(state.doctor),
    [email, setEmail] = useState(state.email),
    [text, setText] = useState(state.instructions);
  const [files, setFiles] = useState<Attachment[]>(state.attachments),
    [error, setError] = useState(''),
    [reading, setReading] = useState(false);
  const root = useRef<HTMLElement>(null);
  useSurfaceEntrance(root, []);
  async function attach(list: FileList | null) {
    if (!list?.length) return;
    setReading(true);
    setError('');
    try {
      const incoming = Array.from(list);
      if (incoming.length + files.length > 5)
        throw new Error('Keep up to 5 attachments. Remove one before adding another.');
      if (
        incoming.reduce((n, f) => n + f.size, 0) + files.reduce((n, f) => n + f.size, 0) >
        2 * 1024 * 1024
      )
        throw new Error('Attachments must total 2 MB or less for this local demo.');
      const accepted = ['text/plain', 'application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
      if (incoming.some((f) => !accepted.includes(f.type)))
        throw new Error('Choose TXT, PDF, PNG, JPEG or WebP files.');
      const added = await Promise.all(
        incoming.map(
          (file) =>
            new Promise<Attachment>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () =>
                resolve({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: String(reader.result),
                });
              reader.onerror = () =>
                reject(new Error(`Could not read ${file.name}. Try the file again.`));
              reader.readAsDataURL(file);
            }),
        ),
      );
      setFiles([...files, ...added]);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setReading(false);
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      if (!text.trim()) throw new Error('Paste the instructions your doctor provided.');
      patientStore.update((s) => {
        s.doctor = doctor.trim();
        s.email = email.trim();
        s.instructions = text.trim();
        s.attachments = files;
      });
      onSaved();
    } catch (reason) {
      setError(errorText(reason));
    }
  }
  return (
    <main className="instructions-page" id="main" tabIndex={-1} ref={root}>
      <button className="text-button" onClick={onBack}>
        <ArrowLeft size={20} />
        Back to Home
      </button>
      <header>
        <h1>Add instructions</h1>
        <p>Add your doctor’s guidance to keep your daily care close.</p>
      </header>
      <form className="patient-panel instruction-form" onSubmit={save}>
        <div className="doctor-fields">
          <label>
            Doctor’s name
            <input
              required
              maxLength={120}
              value={doctor}
              onChange={(e) => setDoctor(e.target.value)}
              placeholder="Dr. First and last name"
            />
          </label>
          <label>
            Doctor’s email
            <input
              required
              type="email"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@example.com"
            />
            <small>Used for the report preview. Email delivery is not connected.</small>
          </label>
        </div>
        <label>
          Care instructions
          <span className="field-help">
            Paste the exact guidance, medication schedule, precautions and recovery timeline you
            received.
          </span>
          <textarea
            required
            rows={8}
            maxLength={20000}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste instructions provided by your doctor…"
          />
        </label>
        <div className="attachment-field">
          <strong>Files & images</strong>
          <label
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!reading) void attach(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={28} />
            <span>
              {reading ? (
                'Reading attachments…'
              ) : (
                <>
                  Drop files here, or <u>browse</u>
                </>
              )}
              <small>TXT, PDF or images · up to 5 files, 2 MB total</small>
            </span>
            <input
              className="file-input"
              type="file"
              multiple
              accept=".txt,.pdf,.png,.jpg,.jpeg,.webp"
              disabled={reading}
              aria-label="Attach files or images"
              onChange={(e) => {
                void attach(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
          <p className="field-help">
            Attachments are saved with your instructions. Paste their care guidance above; document
            and image text extraction comes later.
          </p>
          {files.map((file, index) => (
            <div className="attachment-row" key={`${file.name}-${index}`}>
              <FileText size={18} />
              <span>
                {file.name}
                <small>{Math.ceil(file.size / 1024)} KB</small>
              </span>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${file.name}`}
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
        <p className="import-note">
          Saved wording stays exactly as provided. Adding text does not change the prepared dose
          schedule or roadmap.
        </p>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" className="btn secondary" onClick={onBack}>
            Cancel
          </button>
          <button className="btn primary" disabled={reading}>
            <Save size={18} />
            Save instructions
          </button>
        </footer>
      </form>
    </main>
  );
}
