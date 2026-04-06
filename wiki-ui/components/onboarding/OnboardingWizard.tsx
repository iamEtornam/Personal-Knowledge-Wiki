'use client';

import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Network,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';

// ── Types ──────────────────────────────────────────────────────

type WizardStep = 0 | 1 | 2 | 3 | 4;

type SourceId =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'imessage'
  | 'apple-notes'
  | 'dayone'
  | 'obsidian'
  | 'notion'
  | 'files';

type ProcessingPhase = 'idle' | 'uploading' | 'ingesting' | 'done' | 'error';

type OllamaStatus = 'idle' | 'checking' | 'ok' | 'error';

interface LlmConfig {
  enabled: boolean;
  model: string;
  ollamaUrl: string;
}

interface DataSource {
  id: SourceId;
  name: string;
  emoji: string;
  bg: string;
  description: string;
  category: string;
  exportSteps: string[];
  acceptedTypes: string;
}

interface UploadedFile {
  id: string;
  sourceId: SourceId;
  file: File;
}

// ── Data ───────────────────────────────────────────────────────

const DATA_SOURCES: DataSource[] = [
  {
    id: 'twitter',
    name: 'Twitter / X',
    emoji: '𝕏',
    bg: 'bg-neutral-950',
    description: 'Tweets, threads, replies',
    category: 'Social',
    exportSteps: [
      'Go to twitter.com → Settings → Your account',
      'Click "Download an archive of your data"',
      'Wait for the email (can take a few hours)',
      'Upload the .zip file you receive',
    ],
    acceptedTypes: '.zip,.js,.json',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    emoji: '📸',
    bg: 'bg-gradient-to-br from-purple-600 to-pink-500',
    description: 'Posts, stories, DMs',
    category: 'Social',
    exportSteps: [
      'Go to Settings → Accounts Center',
      'Your information and permissions → Download your information',
      'Select JSON format, then Request a download',
      'Upload the .zip when ready',
    ],
    acceptedTypes: '.zip,.json,.html',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    emoji: '📘',
    bg: 'bg-blue-600',
    description: 'Posts, messages, friends',
    category: 'Social',
    exportSteps: [
      'Settings & Privacy → Settings → Your Facebook information',
      'Click "Download your information"',
      'Choose JSON format, All time, all categories',
      'Upload the .zip when available',
    ],
    acceptedTypes: '.zip,.json,.html',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    emoji: '💬',
    bg: 'bg-green-500',
    description: 'Chat histories',
    category: 'Messaging',
    exportSteps: [
      'Open a chat → ⋮ (three dots) → More → Export chat',
      'Choose "Include media" or "Without media"',
      'Save the .txt or .zip and upload it here',
      'Repeat for each important conversation',
    ],
    acceptedTypes: '.txt,.zip',
  },
  {
    id: 'imessage',
    name: 'iMessage',
    emoji: '💙',
    bg: 'bg-blue-400',
    description: 'iMessage & SMS conversations',
    category: 'Messaging',
    exportSteps: [
      'Use iExporter, Decipher TextMessage, or a similar app',
      'Export conversations as CSV or TXT files',
      'Upload the exported files here',
    ],
    acceptedTypes: '.csv,.txt',
  },
  {
    id: 'apple-notes',
    name: 'Apple Notes',
    emoji: '📝',
    bg: 'bg-yellow-400',
    description: 'Notes and notebooks',
    category: 'Notes',
    exportSteps: [
      'Open the Notes app and select a note',
      'File → Export as PDF, or share as text',
      'For bulk export, use the "Notes Exporter" app from the App Store',
      'Upload HTML, TXT, or PDF files',
    ],
    acceptedTypes: '.html,.txt,.pdf,.md',
  },
  {
    id: 'dayone',
    name: 'Day One',
    emoji: '📔',
    bg: 'bg-blue-500',
    description: 'Journal entries with photos',
    category: 'Journal',
    exportSteps: [
      'Open Day One → File → Export',
      'Choose JSON format for best results',
      'Upload the .json or .zip file',
    ],
    acceptedTypes: '.json,.zip',
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    emoji: '🪨',
    bg: 'bg-purple-600',
    description: 'Markdown notes vault',
    category: 'Notes',
    exportSteps: [
      'Find your vault folder in Finder',
      'Right-click → Compress to create a .zip',
      'Upload the zip here',
    ],
    acceptedTypes: '.md,.zip',
  },
  {
    id: 'notion',
    name: 'Notion',
    emoji: '🗒️',
    bg: 'bg-gray-900',
    description: 'Pages and databases',
    category: 'Notes',
    exportSteps: [
      'Settings → Export content → Export all workspace content',
      'Choose Markdown & CSV format',
      'Upload the .zip when downloaded',
    ],
    acceptedTypes: '.zip,.md,.csv',
  },
  {
    id: 'files',
    name: 'Files & Documents',
    emoji: '📁',
    bg: 'bg-gray-500',
    description: 'PDFs, Word, PowerPoint, images, any file',
    category: 'Files',
    exportSteps: [
      'Upload any files directly — PDFs, Word docs, spreadsheets, presentations, images',
      'The system will extract text and metadata from each file',
    ],
    acceptedTypes: '.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.jpg,.jpeg,.png,.gif',
  },
];

const CATEGORIES = ['Social', 'Messaging', 'Notes', 'Journal', 'Files'];
const STEPS = ['Welcome', 'Sources', 'Upload', 'Processing', 'Done'];

// ── Main Component ─────────────────────────────────────────────

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(0);
  const [ownerName, setOwnerName] = useState('');
  const [selected, setSelected] = useState<Set<SourceId>>(new Set());
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [expandedSource, setExpandedSource] = useState<SourceId | null>(null);
  const [phase, setPhase] = useState<ProcessingPhase>('idle');
  const [phaseMessage, setPhaseMessage] = useState('');
  const [uploadCount, setUploadCount] = useState(0);
  const [ingestRan, setIngestRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  // True once we know the config has loaded; prevents a flash of step 0.
  const [configLoaded, setConfigLoaded] = useState(false);
  // True when the user already has a name set (returning user adding more data).
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [llm, setLlm] = useState<LlmConfig>({
    enabled: false,
    model: 'llama3.2',
    ollamaUrl: 'http://localhost:11434',
  });

  // On mount, check whether the wiki is already configured.
  // If so, jump straight to the upload step with all sources pre-selected.
  useEffect(() => {
    fetch('/api/onboarding/config')
      .then(r => r.json())
      .then((cfg: {
        ownerName?: string;
        llmEnabled?: boolean;
        llmModel?: string;
        llmOllamaUrl?: string;
      }) => {
        if (cfg.ownerName?.trim()) {
          setOwnerName(cfg.ownerName.trim());
          setIsReturningUser(true);
          setSelected(new Set(DATA_SOURCES.map(s => s.id)));
          setStep(2);
        }
        setLlm({
          enabled: cfg.llmEnabled ?? false,
          model: cfg.llmModel ?? 'llama3.2',
          ollamaUrl: cfg.llmOllamaUrl ?? 'http://localhost:11434',
        });
      })
      .catch(() => { /* stay on step 0 */ })
      .finally(() => setConfigLoaded(true));
  }, []);

  async function saveOwnerName() {
    await fetch('/api/onboarding/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: ownerName.trim(),
        llmEnabled: llm.enabled,
        llmModel: llm.model,
        llmOllamaUrl: llm.ollamaUrl,
      }),
    });
  }

  function toggleSource(id: SourceId) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addFiles(sourceId: SourceId, files: FileList | File[]) {
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sourceId,
      file,
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
  }

  function removeFile(id: string) {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }

  async function startProcessing() {
    setStep(3);
    setPhase('uploading');
    setPhaseMessage('Uploading your files…');
    setError(null);

    // Persist LLM settings before running the pipeline.
    await fetch('/api/onboarding/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ownerName: ownerName.trim() || 'User',
        llmEnabled: llm.enabled,
        llmModel: llm.model,
        llmOllamaUrl: llm.ollamaUrl,
      }),
    }).catch(() => { });

    try {
      // Upload all sources in parallel rather than sequentially
      const sourcesToUpload = DATA_SOURCES.filter(
        s => selected.has(s.id) && uploadedFiles.some(f => f.sourceId === s.id),
      );

      await Promise.all(
        sourcesToUpload.map(async source => {
          const sourceFiles = uploadedFiles.filter(f => f.sourceId === source.id);
          const formData = new FormData();
          formData.append('sourceType', source.id);
          for (const uf of sourceFiles) {
            formData.append('files', uf.file, uf.file.name);
          }
          const res = await fetch('/api/onboarding/upload', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`Upload failed for ${source.name}`);
        }),
      );

      setUploadCount(uploadedFiles.length);
      setPhase('ingesting');
      setPhaseMessage(
        llm.enabled
          ? `Running ingest pipeline with AI enhancement (${llm.model})…`
          : 'Running ingest pipeline…',
      );

      const ingestRes = await fetch('/api/onboarding/ingest', { method: 'POST' });
      const ingestData = (await ingestRes.json()) as {
        success: boolean;
        message?: string;
      };

      setIngestRan(ingestData.success);
      setPhase('done');
      setPhaseMessage(
        ingestData.success
          ? 'Ingest complete!'
          : (ingestData.message ?? 'Files saved — ask your agent to ingest them.'),
      );
      setTimeout(() => setStep(4), 1500);
    } catch (err) {
      setPhase('error');
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  // Don't render until we know which step to start on (avoids flash of step 0).
  if (!configLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="min-h-screen flex flex-col">

        {/* ── Header / Progress ── */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold font-serif shadow-sm"
                style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)' }}
              >
                {ownerName.trim() ? ownerName.trim().charAt(0).toUpperCase() : 'W'}
              </div>
              <div>
                <span className="text-sm font-semibold text-gray-700">
                  {ownerName.trim() ? `${ownerName.trim()}pedia` : 'Personal Wiki'}
                  {isReturningUser ? ' — Add Data' : ' Setup'}
                </span>
                {isReturningUser && step !== 0 && (
                  <button
                    onClick={() => setStep(0)}
                    className="block text-[11px] text-blue-600 hover:underline leading-none mt-0.5"
                  >
                    Edit name
                  </button>
                )}
              </div>
            </div>

            {/* Only show the step progress bar during the first-time setup flow */}
            {!isReturningUser && (
              <div className="flex items-center gap-1.5">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      title={s}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300',
                        i < step
                          ? 'bg-green-500 text-white'
                          : i === step
                            ? 'bg-blue-600 text-white shadow-md scale-110'
                            : 'bg-gray-100 text-gray-400',
                      )}
                    >
                      {i < step ? <Check className="w-3 h-3" /> : i + 1}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={cn(
                          'w-5 h-px transition-colors duration-300',
                          i < step ? 'bg-green-400' : 'bg-gray-200',
                        )}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ── Content ── */}
        <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
          {step === 0 && (
            isReturningUser ? (
              <EditNameStep
                ownerName={ownerName}
                onNameChange={setOwnerName}
                onSave={async () => {
                  try {
                    await saveOwnerName();
                    setStep(2);
                  } catch (err) {
                    console.error('Failed to save configuration:', err);
                    setError('Failed to save configuration. Please try again.');
                  }
                }}
                onCancel={() => setStep(2)}
              />
            ) : (
              <WelcomeStep
                ownerName={ownerName}
                onNameChange={setOwnerName}
                onNext={async () => {
                  try {
                    await saveOwnerName();
                    setStep(1);
                  } catch (err) {
                    console.error("Failed to save configuration:", err);
                    setError("Failed to save configuration. Please try again.");
                  }
                }}
              />
            )
          )}

          {step === 1 && (
            <SourcesStep
              sources={DATA_SOURCES}
              categories={CATEGORIES}
              selected={selected}
              onToggle={toggleSource}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <UploadStep
              selectedSources={DATA_SOURCES.filter(s => selected.has(s.id))}
              uploadedFiles={uploadedFiles}
              expandedSource={expandedSource}
              onToggleExpand={id =>
                setExpandedSource(prev => (prev === id ? null : id))
              }
              onAddFiles={addFiles}
              onRemoveFile={removeFile}
              onBack={isReturningUser ? () => router.push('/') : () => setStep(1)}
              onNext={startProcessing}
              isReturningUser={isReturningUser}
              llm={llm}
              onLlmChange={setLlm}
            />
          )}

          {step === 3 && (
            <ProcessingStep
              phase={phase}
              message={phaseMessage}
              fileCount={uploadedFiles.length}
              error={error}
              onRetry={() => {
                setStep(2);
                setPhase('idle');
                setError(null);
              }}
            />
          )}

          {step === 4 && (
            <CompleteStep
              uploadCount={uploadCount}
              sourceCount={selected.size}
              ingestRan={ingestRan}
              onOpenWiki={() => router.push('/')}
            />
          )}

          {/* ── Danger Zone ── */}
          <div className="mt-16 pt-6 border-t border-red-100">
            <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-[13px] font-semibold text-red-800 mb-1">
                    Reset entire site
                  </h3>
                  <p className="text-[12px] text-red-600/80 leading-relaxed mb-3">
                    Permanently deletes all wiki articles, raw entries, uploaded data, and your
                    site configuration. This cannot be undone.
                  </p>

                  {resetDone ? (
                    <div className="flex items-center gap-2 text-[12.5px] text-green-700 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Site reset complete. Redirecting&hellip;
                    </div>
                  ) : !showResetConfirm ? (
                    <button
                      onClick={() => setShowResetConfirm(true)}
                      className="text-[12.5px] font-semibold text-red-600 hover:text-red-700 border border-red-300 bg-white hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                      Reset Everything&hellip;
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          setResetting(true);
                          try {
                            const res = await fetch('/api/onboarding/reset', { method: 'POST' });
                            if (!res.ok) throw new Error('Reset failed');
                            setResetDone(true);
                            setTimeout(() => {
                              window.location.href = '/onboarding';
                            }, 1500);
                          } catch {
                            setError('Failed to reset site. Check server logs.');
                            setResetting(false);
                          }
                        }}
                        disabled={resetting}
                        className={cn(
                          'text-[12.5px] font-semibold px-4 py-2 rounded-lg transition-colors',
                          resetting
                            ? 'bg-red-200 text-red-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white',
                        )}
                      >
                        {resetting ? 'Resetting…' : 'Yes, delete everything'}
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        disabled={resetting}
                        className="text-[12.5px] text-gray-500 hover:text-gray-700 px-3 py-2 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// ── Step: Edit Name (returning users only) ─────────────────────

function EditNameStep({
  ownerName,
  onNameChange,
  onSave,
  onCancel,
}: {
  ownerName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!ownerName.trim()) return;
    setSaving(true);
    await onSave();
    setSaving(false);
  }

  return (
    <div className="max-w-sm mx-auto py-16">
      <h2 className="text-2xl font-serif font-normal text-gray-900 mb-1">Edit your name</h2>
      <p className="text-sm text-gray-500 mb-6">
        This is the name shown in your wiki title and header.
      </p>
      <label htmlFor="edit-owner-name" className="block text-sm font-semibold text-gray-700 mb-2">
        Your name
      </label>
      <input
        id="edit-owner-name"
        type="text"
        value={ownerName}
        onChange={e => onNameChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && ownerName.trim()) handleSave(); }}
        autoFocus
        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base text-gray-900 placeholder:text-gray-300 transition-all mb-4"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={!ownerName.trim() || saving}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm',
            ownerName.trim() && !saving
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none',
          )}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Step: Welcome ──────────────────────────────────────────────

function WelcomeStep({
  ownerName,
  onNameChange,
  onNext,
}: {
  ownerName: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}) {
  const siteName = ownerName.trim() ? `${ownerName.trim()}pedia` : '';
  const [saving, setSaving] = useState(false);

  async function handleContinue() {
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-8 py-12 mb-8 shadow-sm">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-3xl font-serif font-normal text-gray-900 mb-3">
          Build your Personal Wikipedia
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed max-w-md mx-auto mb-8">
          Connect your data — journals, messages, social media, notes — and your AI
          agent will compile everything into a fully interlinked wiki about your life.
        </p>

        <div className="max-w-sm mx-auto">
          <label
            htmlFor="owner-name"
            className="block text-sm font-semibold text-gray-700 mb-2 text-left"
          >
            What&apos;s your name?
          </label>
          <input
            id="owner-name"
            type="text"
            value={ownerName}
            onChange={e => onNameChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && ownerName.trim()) handleContinue();
            }}
            placeholder="e.g. Etornam"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 text-base text-gray-900 placeholder:text-gray-300 transition-all"
          />
          {siteName && (
            <p className="mt-3 text-sm text-gray-500">
              Your wiki will be called{' '}
              <span className="font-bold text-blue-700">{siteName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <FeatureCard
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50 border-blue-200"
          title="Auto-generated articles"
          description="Every person, project, and idea gets its own article"
        />
        <FeatureCard
          icon={<Network className="w-5 h-5 text-purple-600" />}
          bg="bg-purple-50 border-purple-200"
          title="Cross-platform linking"
          description="Jessica on Twitter + Instagram becomes one unified entry"
        />
        <FeatureCard
          icon={<Search className="w-5 h-5 text-teal-600" />}
          bg="bg-teal-50 border-teal-200"
          title="Queryable by agent"
          description="Ask &quot;what&apos;s my biggest inspiration?&quot; and get an answer"
        />
      </div>

      <button
        onClick={handleContinue}
        disabled={!ownerName.trim() || saving}
        className={cn(
          'inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-md',
          ownerName.trim()
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none',
        )}
      >
        {saving ? 'Saving…' : 'Get Started'} <ArrowRight className="w-4 h-4" />
      </button>
      {!ownerName.trim() && (
        <p className="text-xs text-amber-600 mt-3">
          Enter your name to continue
        </p>
      )}
      <p className="text-xs text-gray-400 mt-4">
        Based on Andrej Karpathy&apos;s personal wiki concept
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  bg,
  title,
  description,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  description: string;
}) {
  return (
    <div className={`rounded-xl border p-4 text-left ${bg}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-[13px] font-semibold text-gray-800 mb-1">{title}</p>
      <p className="text-[12px] text-gray-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ── Step: Sources ──────────────────────────────────────────────

function SourcesStep({
  sources,
  categories,
  selected,
  onToggle,
  onBack,
  onNext,
}: {
  sources: DataSource[];
  categories: string[];
  selected: Set<SourceId>;
  onToggle: (id: SourceId) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-normal text-gray-900 mb-1">
          What data do you have?
        </h2>
        <p className="text-sm text-gray-500">
          Select all sources you want to connect. You can always add more later.
        </p>
      </div>

      {categories.map(category => {
        const catSources = sources.filter(s => s.category === category);
        return (
          <div key={category} className="mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
              {category}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {catSources.map(source => {
                const isSelected = selected.has(source.id);
                const isDark =
                  source.bg.includes('950') ||
                  source.bg.includes('900') ||
                  source.bg.includes('600') ||
                  source.bg.includes('500') ||
                  source.bg.includes('400') ||
                  source.bg.includes('gradient');
                return (
                  <button
                    key={source.id}
                    onClick={() => onToggle(source.id)}
                    className={cn(
                      'relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200',
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0',
                        source.bg,
                      )}
                    >
                      <span className={isDark ? 'text-white' : ''}>
                        {source.emoji}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="text-[13px] font-semibold text-gray-900">
                        {source.name}
                      </p>
                      <p className="text-[11.5px] text-gray-500 mt-0.5">
                        {source.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'absolute top-3 right-3 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300',
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {selected.size === 0
              ? 'Select at least one source'
              : `${selected.size} source${selected.size > 1 ? 's' : ''} selected`}
          </span>
          <button
            onClick={onNext}
            disabled={selected.size === 0}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
              selected.size > 0
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed',
            )}
          >
            Continue <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step: Upload ───────────────────────────────────────────────

function UploadStep({
  selectedSources,
  uploadedFiles,
  expandedSource,
  onToggleExpand,
  onAddFiles,
  onRemoveFile,
  onBack,
  onNext,
  isReturningUser = false,
  llm,
  onLlmChange,
}: {
  selectedSources: DataSource[];
  uploadedFiles: UploadedFile[];
  expandedSource: SourceId | null;
  onToggleExpand: (id: SourceId) => void;
  onAddFiles: (sourceId: SourceId, files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  isReturningUser?: boolean;
  llm: LlmConfig;
  onLlmChange: (cfg: LlmConfig) => void;
}) {
  const totalFiles = uploadedFiles.length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-normal text-gray-900 mb-1">
          {isReturningUser ? 'Add more data' : 'Upload your data'}
        </h2>
        <p className="text-sm text-gray-500">
          {isReturningUser
            ? 'Select a source, then drag and drop your files to add them to your wiki.'
            : 'Follow the export instructions for each source, then drag and drop your files. You can skip this step and upload later.'}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {selectedSources.map(source => (
          <SourceUploadPanel
            key={source.id}
            source={source}
            files={uploadedFiles.filter(f => f.sourceId === source.id)}
            isExpanded={expandedSource === source.id}
            onToggle={() => onToggleExpand(source.id)}
            onAddFiles={files => onAddFiles(source.id, files)}
            onRemoveFile={onRemoveFile}
          />
        ))}
      </div>

      <LlmSettingsPanel llm={llm} onChange={onLlmChange} />

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isReturningUser ? 'Back to wiki' : 'Back'}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">
            {totalFiles === 0
              ? 'No files yet'
              : `${totalFiles} file${totalFiles !== 1 ? 's' : ''} ready`}
          </span>
          <button
            onClick={onNext}
            disabled={isReturningUser && totalFiles === 0}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm',
              isReturningUser && totalFiles === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                : 'bg-blue-600 hover:bg-blue-700 text-white',
            )}
          >
            {totalFiles === 0
              ? (isReturningUser ? 'Select files to upload' : 'Skip for now')
              : 'Start Processing'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── LLM Settings Panel ─────────────────────────────────────────

const SUGGESTED_MODELS = [
  'llama3.2',
  'llama3.1',
  'llama3',
  'mistral',
  'mistral-nemo',
  'qwen2.5',
  'qwen2.5:14b',
  'gemma3',
  'phi4',
  'deepseek-r1',
];

function LlmSettingsPanel({
  llm,
  onChange,
}: {
  llm: LlmConfig;
  onChange: (cfg: LlmConfig) => void;
}) {
  const [expanded, setExpanded] = useState(llm.enabled);
  const [status, setStatus] = useState<OllamaStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [installedModels, setInstalledModels] = useState<string[]>([]);

  function update(patch: Partial<LlmConfig>) {
    onChange({ ...llm, ...patch });
  }

  function toggle() {
    const next = !llm.enabled;
    update({ enabled: next });
    if (next && !expanded) setExpanded(true);
  }

  async function testConnection() {
    setStatus('checking');
    setStatusMessage('');
    setInstalledModels([]);
    try {
      const url = `/api/onboarding/test-ollama?url=${encodeURIComponent(llm.ollamaUrl)}`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        connected: boolean;
        models?: string[];
        error?: string;
      };
      if (data.connected) {
        setStatus('ok');
        const models = data.models ?? [];
        setInstalledModels(models);
        setStatusMessage(
          models.length > 0
            ? `Connected — ${models.length} model${models.length !== 1 ? 's' : ''} installed`
            : 'Connected — no models found (run: ollama pull llama3.2)',
        );
        // Auto-select first installed model if current choice isn't installed
        if (models.length > 0 && !models.includes(llm.model)) {
          update({ model: models[0] });
        }
      } else {
        setStatus('error');
        setStatusMessage(data.error ?? 'Could not connect to Ollama');
      }
    } catch {
      setStatus('error');
      setStatusMessage('Request failed — is Ollama running?');
    }
  }

  const allModels = Array.from(new Set([...installedModels, ...SUGGESTED_MODELS]));

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold text-gray-800">
            AI-Enhanced Parsing
          </span>
          <span className="ml-2 text-[11px] text-gray-400">
            {llm.enabled ? `On · ${llm.model}` : 'Optional'}
          </span>
        </div>

        {/* Inline toggle */}
        <div
          role="switch"
          aria-checked={llm.enabled}
          onClick={e => { e.stopPropagation(); toggle(); }}
          className={cn(
            'relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0 cursor-pointer',
            llm.enabled ? 'bg-violet-600' : 'bg-gray-300',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
              llm.enabled ? 'translate-x-4' : 'translate-x-0.5',
            )}
          />
        </div>

        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {/* Body */}
      {expanded && (
        <div className="p-4 bg-white space-y-4">
          <p className="text-[12.5px] text-gray-500 leading-relaxed">
            When enabled, a locally-running Ollama model will clean up extracted PDF and
            HTML text, summarise CSV rows into prose, auto-detect unknown file formats,
            and split plain-text journals into individual dated entries.
          </p>

          {/* Ollama URL */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Ollama URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={llm.ollamaUrl}
                onChange={e => update({ ollamaUrl: e.target.value })}
                placeholder="http://localhost:11434"
                className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all font-mono"
              />
              <button
                onClick={testConnection}
                disabled={status === 'checking'}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12.5px] font-semibold border transition-colors shrink-0',
                  status === 'checking'
                    ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                    : 'border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100',
                )}
              >
                {status === 'checking' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5" />
                )}
                Test
              </button>
            </div>

            {/* Connection status */}
            {status !== 'idle' && status !== 'checking' && (
              <div
                className={cn(
                  'flex items-center gap-1.5 mt-2 text-[12px] font-medium',
                  status === 'ok' ? 'text-green-700' : 'text-red-600',
                )}
              >
                {status === 'ok'
                  ? <Wifi className="w-3.5 h-3.5" />
                  : <WifiOff className="w-3.5 h-3.5" />}
                {statusMessage}
              </div>
            )}
          </div>

          {/* Model */}
          <div>
            <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
              Model
            </label>
            <input
              type="text"
              list="ollama-models"
              value={llm.model}
              onChange={e => update({ model: e.target.value })}
              placeholder="llama3.2"
              className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all font-mono"
            />
            <datalist id="ollama-models">
              {allModels.map(m => (
                <option key={m} value={m} />
              ))}
            </datalist>

            {/* Installed model pills */}
            {installedModels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[11px] text-gray-400 self-center">Installed:</span>
                {installedModels.map(m => (
                  <button
                    key={m}
                    onClick={() => update({ model: m })}
                    className={cn(
                      'text-[11px] px-2 py-0.5 rounded-full border font-mono transition-colors',
                      llm.model === m
                        ? 'bg-violet-600 border-violet-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Install hint */}
          {status === 'ok' && installedModels.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] text-amber-800">
              No models found. Install one first:{' '}
              <code className="bg-amber-100 px-1 rounded font-mono">ollama pull llama3.2</code>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-800">
              Make sure Ollama is running:{' '}
              <code className="bg-red-100 px-1 rounded font-mono">ollama serve</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Source Upload Panel ────────────────────────────────────────

function SourceUploadPanel({
  source,
  files,
  isExpanded,
  onToggle,
  onAddFiles,
  onRemoveFile,
}: {
  source: DataSource;
  files: UploadedFile[];
  isExpanded: boolean;
  onToggle: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (id: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) onAddFiles(e.dataTransfer.files);
    },
    [onAddFiles],
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) onAddFiles(e.target.files);
    },
    [onAddFiles],
  );

  const isDark =
    source.bg.includes('950') ||
    source.bg.includes('900') ||
    source.bg.includes('600') ||
    source.bg.includes('500') ||
    source.bg.includes('400') ||
    source.bg.includes('gradient');

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0',
            source.bg,
          )}
        >
          <span className={isDark ? 'text-white' : ''}>{source.emoji}</span>
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-semibold text-gray-800">
            {source.name}
          </span>
          {files.length > 0 && (
            <span className="ml-2 text-[11px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {isExpanded && (
        <div className="p-4 bg-white space-y-4">
          {/* Export instructions */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[11px] font-bold text-amber-800 mb-2 uppercase tracking-wide">
              How to export from {source.name}
            </p>
            <ol className="space-y-1.5">
              {source.exportSteps.map((s, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] text-amber-900">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-blue-400 bg-blue-50 scale-[1.01]'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50',
            )}
          >
            <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-[13px] text-gray-600 font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-[11.5px] text-gray-400 mt-1">
              Accepts: {source.acceptedTypes}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={source.acceptedTypes}
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map(f => (
                <div
                  key={f.id}
                  className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5 text-[12px] text-green-800 font-medium"
                >
                  <span className="truncate max-w-[160px]">{f.file.name}</span>
                  <span className="text-green-500 text-[10px]">
                    ({formatBytes(f.file.size)})
                  </span>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRemoveFile(f.id);
                    }}
                    className="shrink-0 ml-0.5 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Step: Processing ───────────────────────────────────────────

function ProcessingStep({
  phase,
  message,
  fileCount,
  error,
  onRetry,
}: {
  phase: ProcessingPhase;
  message: string;
  fileCount: number;
  error: string | null;
  onRetry: () => void;
}) {
  const processingSteps = [
    {
      id: 'uploading' as const,
      label: 'Uploading files to data directory',
      done: phase === 'ingesting' || phase === 'done',
    },
    {
      id: 'ingesting' as const,
      label: 'Running ingest pipeline',
      done: phase === 'done',
    },
    {
      id: 'done' as const,
      label: 'Building knowledge base',
      done: phase === 'done',
    },
  ];

  return (
    <div className="max-w-md mx-auto text-center py-8">
      {error ? (
        <>
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 mb-6 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            Go Back and Try Again
          </button>
        </>
      ) : (
        <>
          {phase === 'done' ? (
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          ) : (
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          )}
          <h2 className="text-xl font-serif text-gray-900 mb-1">
            Processing your data
          </h2>
          <p className="text-sm text-gray-500 mb-8">{message || 'Please wait…'}</p>

          <div className="text-left space-y-3">
            {processingSteps.map((s, i) => {
              const isActive = s.id === phase;
              const isDone = s.done;
              return (
                <div
                  key={s.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-all duration-300',
                    isDone
                      ? 'bg-green-50 border-green-200'
                      : isActive
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200',
                  )}
                >
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300',
                      isDone
                        ? 'bg-green-500'
                        : isActive
                          ? 'bg-blue-500'
                          : 'bg-gray-200',
                    )}
                  >
                    {isDone ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : isActive ? (
                      <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                    ) : (
                      <span className="text-[10px] text-gray-400 font-bold">
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[13px] font-medium flex-1',
                      isDone
                        ? 'text-green-800'
                        : isActive
                          ? 'text-blue-800'
                          : 'text-gray-400',
                    )}
                  >
                    {s.label}
                  </span>
                  {isDone && (
                    <span className="text-[11px] text-green-600 font-medium">
                      Done
                    </span>
                  )}
                  {isActive && (
                    <span className="text-[11px] text-blue-600 font-medium">
                      In progress…
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {fileCount > 0 && (
            <p className="text-xs text-gray-400 mt-6">
              {fileCount} file{fileCount !== 1 ? 's' : ''} queued for processing
            </p>
          )}
        </>
      )}
    </div>
  );
}

// ── Step: Complete ─────────────────────────────────────────────

function CompleteStep({
  uploadCount,
  sourceCount,
  ingestRan,
  onOpenWiki,
}: {
  uploadCount: number;
  sourceCount: number;
  ingestRan: boolean;
  onOpenWiki: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-8">
      <div className="text-6xl mb-6">{ingestRan ? '🎉' : '📁'}</div>
      <h2 className="text-2xl font-serif font-normal text-gray-900 mb-3">
        {ingestRan ? 'Files ingested!' : 'Files uploaded!'}
      </h2>
      <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-sm mx-auto">
        {uploadCount > 0
          ? `${uploadCount} file${uploadCount !== 1 ? 's' : ''} from ${sourceCount} source${sourceCount !== 1 ? 's' : ''} saved to `
          : `${sourceCount} source${sourceCount !== 1 ? 's' : ''} saved to `}
        <code className="bg-gray-100 px-1 rounded text-gray-700 text-xs">data/</code>
        {ingestRan
          ? ' and converted into raw entries.'
          : '. Now ask your agent to ingest and absorb them.'}
      </p>

      {/* Status banner */}
      {!ingestRan && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-left">
          <p className="text-[12.5px] text-amber-800">
            <strong>Next:</strong> Your files are saved but not yet processed. Ask your AI
            agent to <strong>ingest my data</strong> to convert them into wiki entries.
          </p>
        </div>
      )}

      {/* Step indicators */}
      <div className="grid grid-cols-3 gap-3 mb-8 text-left">
        <div className={`rounded-lg p-3 border ${uploadCount > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${uploadCount > 0 ? 'text-green-700' : 'text-gray-400'}`}>
            {uploadCount > 0 ? '✓ Done' : 'Step 1'}
          </p>
          <p className={`text-[12.5px] ${uploadCount > 0 ? 'text-green-900' : 'text-gray-400'}`}>
            Upload files to data/
          </p>
        </div>
        <div className={`rounded-lg p-3 border ${ingestRan ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <p className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${ingestRan ? 'text-green-700' : 'text-amber-700'}`}>
            {ingestRan ? '✓ Done' : '→ Next'}
          </p>
          <p className={`text-[12.5px] ${ingestRan ? 'text-green-900' : 'text-amber-900'}`}>
            Ingest into raw entries
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">
            {ingestRan ? '→ Next' : 'Step 3'}
          </p>
          <p className="text-[12.5px] text-gray-400">
            Absorb into wiki articles
          </p>
        </div>
      </div>

      {/* Agent commands */}
      <div className="bg-gray-950 text-gray-100 rounded-xl p-5 text-left font-mono text-sm leading-8 mb-8">
        <p className="text-gray-500 text-xs mb-2"># Tell your agent:</p>
        {!ingestRan && <p className="text-yellow-300">Ingest my data</p>}
        <p>Absorb all entries</p>
        <p>What are my biggest themes?</p>
      </div>

      <button
        onClick={onOpenWiki}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md"
      >
        <Sparkles className="w-4 h-4" />
        Open Your Wiki
      </button>
    </div>
  );
}

// ── Utilities ──────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
