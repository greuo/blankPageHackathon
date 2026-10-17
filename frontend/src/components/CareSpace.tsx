import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from 'react';
import {
  Bot,
  FileText,
  Users,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Download,
  Upload,
} from 'lucide-react';
import { repository, getActor, getVisibleSpaces, getActivePlan } from '../data/repository';
import Conversations from './Conversations';
import AccessPanel from './AccessPanel';
import HandoffPanel from './HandoffPanel';
import { dateTime, errorText, Skeleton } from './ui';
const PlanBuilder = lazy(() => import('./PlanBuilder'));
export default function CareSpace({
  spaceId,
  onClose,
  initialTab = 'conversations',
  sourceId,
}: {
  spaceId: string;
  onClose: () => void;
  initialTab?: string;
  sourceId?: string;
}) {
  const state = useSyncExternalStore(repository.subscribe, repository.getSnapshot);
  const actor = getActor(state);
  const space = getVisibleSpaces(state).find((s) => s.id === spaceId);
  const [tab, setTab] = useState(initialTab);
  const [handoffQuestion, setHandoffQuestion] = useState<string>();
  const [source, setSource] = useState<string | undefined>(sourceId);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);
  const [builder, setBuilder] = useState(false);
  const [documentId, setDocumentId] = useState<string>();
  const level = state.grants.find((g) => g.spaceId === spaceId && g.familyId === actor.id)?.level;
  const mayViewPlan = actor.role !== 'family' || level === 'Full';
  const plan = mayViewPlan ? getActivePlan(state, spaceId) : undefined;
  const documents = mayViewPlan ? state.documents.filter((d) => d.spaceId === spaceId) : [];
  useEffect(() => {
    if (!space) onClose();
  }, [space, onClose]);
  if (!space) return null;
  const selectedInstruction = state.plans
    .filter((p) => p.spaceId === spaceId && p.status === 'approved')
    .flatMap((p) => p.instructions)
    .find((i) => i.id === source);
  function showSource(id: string) {
    setSource(id);
    setTab('plan');
  }
  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await repository.uploadDocument(spaceId, file);
      setUploadKey((k) => k + 1);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setUploading(false);
    }
  }
  const tabs = [
    ['conversations', 'Conversations', MessageCircle],
    ['plan', 'Care plan', FileText],
    ['documents', 'Documents', Upload],
    ['access', 'People & access', Users],
    ...(actor.role !== 'family'
      ? [
          [
            'handoff',
            actor.role === 'doctor' ? 'Care-team inbox' : 'Contact care team',
            ShieldCheck,
          ],
        ]
      : []),
  ] as const;
  return (
    <div className="space-content">
      <div className="space-summary">
        <span className={`space-symbol ${space.tone}`}>
          <Bot size={23} />
        </span>
        <div>
          <p>{space.description}</p>
          <span className="badge">Jamie Morgan · fictional demo</span>
        </div>
        {actor.role === 'doctor' && (
          <button className="btn primary" onClick={() => setBuilder(true)}>
            Build care plan <ArrowRight size={16} />
          </button>
        )}
      </div>
      {builder ? (
        <Suspense fallback={<Skeleton kind="plan" />}>
          <PlanBuilder key={spaceId} spaceId={spaceId} onClose={() => setBuilder(false)} />
        </Suspense>
      ) : (
        <>
          <nav className="space-tabs" aria-label="Care space sections">
            {tabs.map(([id, label, Icon]) => (
              <button
                key={id as string}
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => {
                  setTab(id as string);
                  setSource(undefined);
                  setHandoffQuestion(undefined);
                }}
              >
                <Icon size={17} />
                {label as string}
              </button>
            ))}
          </nav>
          <div className="space-tab-content">
            {tab === 'conversations' && (
              <Conversations
                key={`${spaceId}:${actor.id}`}
                spaceId={spaceId}
                onHandoff={(question) => {
                  setHandoffQuestion(question);
                  setTab('handoff');
                }}
                onSource={showSource}
              />
            )}
            {tab === 'plan' &&
              (mayViewPlan ? (
                <section className="plan-panel">
                  <div className="section-title">
                    <div>
                      <h3>{plan?.title ?? 'No approved plan yet'}</h3>
                      <p>
                        {plan
                          ? `Version ${plan.version} · Approved ${plan.approvedAt ? dateTime(plan.approvedAt) : 'in this demo'}`
                          : 'Your clinician will review and publish guidance here.'}
                      </p>
                    </div>
                    <span className="badge mint">
                      <ShieldCheck size={14} />
                      {plan ? 'Clinician approved' : 'Awaiting publication'}
                    </span>
                  </div>
                  {selectedInstruction && (
                    <div className="source-box" role="status">
                      <h4>Supporting instruction</h4>
                      <blockquote>{selectedInstruction.sourcePassage}</blockquote>
                      <p>{selectedInstruction.sourceLabel}</p>
                      <button className="btn quiet" onClick={() => setSource(undefined)}>
                        Close source
                      </button>
                    </div>
                  )}
                  {plan?.instructions.map((i) => (
                    <article className="plan-instruction" key={i.id}>
                      <span className={`badge ${i.kind === 'restriction' ? 'peach' : 'blue'}`}>
                        {i.kind}
                      </span>
                      <h4>{i.text}</h4>
                      <p className="muted">
                        {dateTime(i.dueAt)}
                        {i.endsAt ? ` — ${dateTime(i.endsAt)}` : ''} · {i.recurrence}
                      </p>
                      <details>
                        <summary>View approved source</summary>
                        <blockquote>{i.sourcePassage}</blockquote>
                        <p className="muted">{i.sourceLabel}</p>
                      </details>
                    </article>
                  ))}
                  {!plan && (
                    <div className="empty-state">
                      <FileText />
                      <p>Drafts stay in the clinician workspace until approved.</p>
                    </div>
                  )}
                </section>
              ) : (
                <div className="empty-state">
                  <ShieldCheck />
                  <h3>Shared plan requires Full access</h3>
                  <p>
                    {level === 'Support'
                      ? 'Your Support access includes the daily checklist.'
                      : 'Ask Jamie or Dr. Chen to review your access.'}{' '}
                    Private conversations remain separate.
                  </p>
                </div>
              ))}
            {tab === 'documents' &&
              (mayViewPlan ? (
                <section className="documents-panel">
                  <div className="section-title">
                    <div>
                      <h3>Documents & source material</h3>
                      <p>Supporting files for this care space.</p>
                    </div>
                    {actor.role === 'doctor' && (
                      <label className="btn secondary upload-label">
                        <Upload size={17} />
                        {uploading ? 'Reading…' : 'Upload text file'}
                        <input
                          key={uploadKey}
                          type="file"
                          accept=".txt,text/plain"
                          aria-label="Upload supporting document"
                          disabled={uploading}
                          onChange={(e) => void upload(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                  <p className="inline-note">
                    Demo intake supports UTF-8 .txt files up to 1 MiB. PDF and Word extraction are
                    not connected. Uploads do not become approved guidance automatically.
                  </p>
                  {error && (
                    <p className="alert error" role="alert">
                      {error}
                    </p>
                  )}
                  {documents.length ? (
                    documents.map((d) => (
                      <article className="document-row" key={d.id}>
                        <FileText size={25} />
                        <div>
                          <h4>{d.name}</h4>
                          <p>
                            {(d.size / 1024).toFixed(1)} KB · {dateTime(d.createdAt)}
                          </p>
                        </div>
                        <button
                          className="btn quiet"
                          onClick={() => setDocumentId(documentId === d.id ? undefined : d.id)}
                        >
                          {documentId === d.id ? 'Close' : 'Read source'}
                        </button>
                        <button
                          className="icon-btn"
                          aria-label={`Download ${d.name}`}
                          onClick={() => {
                            const url = URL.createObjectURL(
                              new Blob([d.text], { type: 'text/plain' }),
                            );
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = d.name;
                            a.click();
                            setTimeout(() => URL.revokeObjectURL(url), 1000);
                          }}
                        >
                          <Download size={17} />
                        </button>
                        {documentId === d.id && <pre className="document-text">{d.text}</pre>}
                      </article>
                    ))
                  ) : (
                    <div className="empty-state">
                      <FileText />
                      <h3>No documents yet</h3>
                      <p>Dr. Chen can upload supported source material for review.</p>
                    </div>
                  )}
                </section>
              ) : (
                <div className="empty-state">
                  <ShieldCheck />
                  <h3>Documents require Full access</h3>
                  <p>Your current access does not include shared documents.</p>
                </div>
              ))}
            {tab === 'access' && <AccessPanel spaceId={spaceId} />}{' '}
            {tab === 'handoff' && actor.role !== 'family' && (
              <HandoffPanel spaceId={spaceId} initialQuestion={handoffQuestion} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
