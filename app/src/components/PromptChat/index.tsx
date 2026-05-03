import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Package, X, Loader2, AlertCircle, Play, SkipForward, ExternalLink, Info } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useChatStore } from '../../stores/chatStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAgentStore } from '../../stores/agentStore';
import { TIER_COLORS, TIER_LABELS, PROVIDER_LABELS } from '../../lib/classifier';
import { WorkspaceBar } from './WorkspaceBar';
import { LspStatusBar } from './LspStatusBar';
import { GitBar } from './GitBar';
import { AttachmentBar } from './AttachmentBar';
import { ToolBlock } from './ToolBlock';
import { CopyButton } from '../Common/CopyButton';
import { InfoModal } from '../Common/InfoModal';
import { SaveAsPackModal } from './SaveAsPackModal';
import { Bookmark } from 'lucide-react';
import type { MessageBlock } from '../../stores/chatStore';

function extractVariables(text: string): string[] {
  const matches = new Set<string>();
  const regex = /\{([^}]+)\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) matches.add(match[1]);
  return Array.from(matches);
}

function fillVariables(text: string, values: Record<string, string>): string {
  return text.replace(/\{([^}]+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}

export function PromptChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages, clearError, agentMode } = useChatStore();
  const { cloudPacks, userPacks, loadedPacks, loadedUserPacks, fetchPackPrompts, fetchUserPackPrompts } = useSyncStore();
  const { session } = useAuthStore();
  const { billingTier, serverChatCount } = useSettingsStore();
  const { initWorkspace, workspace, attachments, clearAttachments } = useAgentStore();
  const isLimitReached = billingTier === 'free' && serverChatCount >= 3 && !agentMode;

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  const [input, setInput] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackPicker, setShowPackPicker] = useState(false);
  const [showWhyOneChat, setShowWhyOneChat] = useState(false);
  const [varGuardError, setVarGuardError] = useState<string | null>(null);
  const [saveAsPackText, setSaveAsPackText] = useState<string | null>(null);

  // Single-prompt variable form
  const [variablePrompt, setVariablePrompt] = useState<{ text: string; vars: string[] } | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Pack workflow runner
  const packQueueRef = useRef<string[]>([]);
  const [isRunningPack, setIsRunningPack] = useState(false);
  const [packProgress, setPackProgress] = useState({ current: 0, total: 0 });
  const [packVarForm, setPackVarForm] = useState<{ vars: string[]; prompts: string[] } | null>(null);
  const [packVarValues, setPackVarValues] = useState<Record<string, string>>({});

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // Auto-advance pack sequence after each response
  useEffect(() => {
    if (isLoading || !isRunningPack) return;
    if (packQueueRef.current.length === 0) {
      setIsRunningPack(false);
      setPackProgress({ current: 0, total: 0 });
      return;
    }
    const next = packQueueRef.current.shift()!;
    setPackProgress((p) => ({ ...p, current: p.current + 1 }));
    sendMessage(next, selectedPack?.title, buildSystemPrompt());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isRunningPack]);

  const allPacks = [
    ...cloudPacks.map((p) => ({ ...p, type: 'cloud' as const, title: p.source })),
    ...userPacks.map((p) => ({ ...p, type: 'user' as const })),
  ];

  const selectedPack = allPacks.find((p) => p.id === selectedPackId);

  const getPackPrompts = () => {
    if (!selectedPackId) return [];
    const loaded = loadedPacks[selectedPackId] || loadedUserPacks[selectedPackId];
    return loaded?.prompts ?? [];
  };

  const buildSystemPrompt = (): string | undefined => {
    if (!selectedPack) return undefined;
    const prompts = getPackPrompts();
    const list = prompts
      .slice(0, 10)
      .map((p) => `- ${p.header ? `${p.header}: ` : ''}${p.text.slice(0, 120)}`)
      .join('\n');
    return `You are a helpful assistant working within the "${selectedPack.title}" context.${
      list ? `\n\nAvailable prompt templates:\n${list}` : ''
    }\n\nHelp the user based on this context.`;
  };

  const handleSelectPack = async (packId: string, type: 'cloud' | 'user') => {
    setSelectedPackId(packId);
    setShowPackPicker(false);
    setVariablePrompt(null);
    setPackVarForm(null);
    const pack = type === 'cloud' ? cloudPacks.find((p) => p.id === packId) : userPacks.find((p) => p.id === packId);
    if (!pack) return;
    if (type === 'cloud') fetchPackPrompts(pack as any);
    else fetchUserPackPrompts(pack as any);
  };

  // Run entire pack — collect all unique vars first
  const handleRunPack = () => {
    const prompts = getPackPrompts();
    if (!prompts.length) return;
    const allVars = new Set<string>();
    prompts.forEach((p) => extractVariables(p.text).forEach((v) => allVars.add(v)));
    if (allVars.size > 0) {
      setPackVarForm({ vars: Array.from(allVars), prompts: prompts.map((p) => p.text) });
      setPackVarValues({});
    } else {
      startPackRun(prompts.map((p) => p.text), {});
    }
  };

  const startPackRun = (promptTexts: string[], values: Record<string, string>) => {
    // Guardrail: with agent OFF the model can't gather missing values via
    // tool calls, so any blank variable would silently send "{name}" to
    // the LLM and produce a nonsense response. Block the run and surface
    // a clear error instead. Agent mode can recover by asking the user.
    if (!agentMode) {
      const required = packVarForm?.vars ?? [];
      const missing = required.filter((v) => !(values[v] ?? '').trim());
      if (missing.length > 0) {
        setVarGuardError(
          `Fill in ${missing.map((v) => `{${v}}`).join(', ')} before running. Turn Agent on if you want it to ask for missing values mid-flow.`,
        );
        return;
      }
    }
    setVarGuardError(null);
    const filled = promptTexts.map((t) => fillVariables(t, values));
    setPackVarForm(null);
    setVariablePrompt(null);
    const [first, ...rest] = filled;
    packQueueRef.current = rest;
    setPackProgress({ current: 1, total: filled.length });
    setIsRunningPack(true);
    sendMessage(first, selectedPack?.title, buildSystemPrompt());
  };

  const cancelPackRun = () => {
    packQueueRef.current = [];
    setIsRunningPack(false);
    setPackProgress({ current: 0, total: 0 });
  };

  // Single prompt click from sidebar
  const handlePromptClick = (promptText: string) => {
    const vars = extractVariables(promptText);
    if (vars.length > 0) {
      setVariablePrompt({ text: promptText, vars });
      setVariableValues({});
    } else {
      sendMessage(promptText, selectedPack?.title, buildSystemPrompt());
    }
  };

  const handleVariableSend = () => {
    if (!variablePrompt || isLoading) return;
    if (!agentMode) {
      const missing = variablePrompt.vars.filter((v) => !(variableValues[v] ?? '').trim());
      if (missing.length > 0) {
        setVarGuardError(
          `Fill in ${missing.map((v) => `{${v}}`).join(', ')} before running. Turn Agent on if you want it to ask for missing values mid-flow.`,
        );
        return;
      }
    }
    setVarGuardError(null);
    const filled = fillVariables(variablePrompt.text, variableValues);
    setVariablePrompt(null);
    setVariableValues({});
    sendMessage(filled, selectedPack?.title, buildSystemPrompt());
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    // If attachments are staged, prepend a note so the agent reads them
    // locally instead of expecting their content inline. Also pass the
    // list to the chat store so the user message renders a reusable
    // tooltip with the saved paths.
    let finalText = text;
    let snapshot: string[] | undefined;
    if (attachments.length > 0) {
      const list = attachments.map((p) => `- ${p}`).join('\n');
      finalText = `${text}\n\nAttached files (read with read_file as needed):\n${list}`;
      snapshot = [...attachments];
      clearAttachments();
    }
    await sendMessage(finalText, selectedPack?.title, buildSystemPrompt(), snapshot);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const packPrompts = getPackPrompts();

  return (
    <div className="flex h-full gap-4">
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        <WorkspaceBar />
        <GitBar />
        <LspStatusBar />
        {/* Header */}
        <div className={`flex items-center justify-between ${messages.length === 0 ? 'mb-6' : 'mb-2'}`}>
          {messages.length === 0 ? (
            <div>
              <p
                className="mb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                Skill Chat
              </p>
              <h2 className="text-[28px] font-medium tracking-[-0.02em] leading-none text-[var(--foreground)]">
                One chat. Every model.
              </h2>
              <p className="mt-2 text-[13px] text-[var(--muted-foreground)] max-w-[58ch]">
                Auto-routes each message to the cheapest capable model.
              </p>
              <button
                type="button"
                onClick={() => setShowWhyOneChat(true)}
                className="mt-1 inline-flex items-center gap-1 text-[12px] text-[var(--primary)] hover:underline focus:outline-none"
              >
                <Info size={11} /> Why one chat?
              </button>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            {isRunningPack && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--muted-foreground)]">
                  Running {packProgress.current}/{packProgress.total}
                </span>
                <button
                  onClick={cancelPackRun}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                >
                  <X size={12} /> Cancel
                </button>
              </div>
            )}
            {messages.length > 0 && !isRunningPack && (
              <button
                onClick={clearMessages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                <Trash2 size={14} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {messages.length === 0 && !packVarForm && !variablePrompt && (
            <div className="flex h-full items-center justify-center py-12">
              <div className="relative w-full max-w-[520px]">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 rounded-3xl border border-[var(--border)]"
                />
                <div
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)]"
                  style={{
                    boxShadow:
                      '0 30px 80px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
                      <span className="h-2.5 w-2.5 rounded-full bg-[#3b3b3f]" />
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      ~/skillset
                    </span>
                    <span className="text-[10px] text-[var(--muted-foreground)]">ready</span>
                  </div>
                  <div
                    className="space-y-3 p-6 text-[13px] leading-[1.7]"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    <div className="flex gap-3">
                      <span className="text-[#2563EB]">$</span>
                      <span className="text-[var(--foreground)]">
                        new <span className="text-[#7BA7FF]">conversation</span>
                      </span>
                    </div>
                    <div className="text-[var(--muted-foreground)]">
                      ↳ type a message, pick a pack, or run all prompts in sequence
                    </div>
                    <div className="flex gap-3">
                      <span className="text-[#2563EB]">$</span>
                      <span className="text-[var(--foreground)]">
                        router <span className="text-[#7BA7FF]">--auto</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400/90">
                      <span className="status-ping" />
                      <span>routing live · waiting for input</span>
                    </div>
                  </div>
                </div>
                <p
                  className="mt-6 text-center text-[11px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  Shift + Enter for newline · Enter to send
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => {
            const hasBlocks = msg.role === 'assistant' && msg.blocks && msg.blocks.length > 0;
            const resultByToolUseId: Record<string, MessageBlock> = {};
            if (hasBlocks) {
              for (const b of msg.blocks!) {
                if (b.kind === 'tool_result') resultByToolUseId[b.toolUseId] = b;
              }
            }
            const widthCls = hasBlocks ? 'max-w-[92%]' : 'max-w-[80%]';
            const copyText = () => {
              if (hasBlocks) {
                return msg
                  .blocks!
                  .filter((b) => b.kind === 'text')
                  .map((b) => (b as { kind: 'text'; text: string }).text)
                  .join('\n');
              }
              return msg.content;
            };
            return (
              <div key={msg.id} className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`${widthCls} relative rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)] rounded-br-sm'
                      : 'bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-bl-sm'
                  }`}
                >
                  <div
                    className={`absolute top-1 ${msg.role === 'user' ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}
                  >
                    <CopyButton getText={copyText} size={11} title="Copy message" />
                    {msg.role === 'user' && session && (
                      <button
                        type="button"
                        onClick={() => setSaveAsPackText(msg.content)}
                        title="Save as Skill pack"
                        className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Bookmark size={11} />
                      </button>
                    )}
                  </div>
                  {msg.packName && msg.role === 'user' && (
                    <p className="text-xs opacity-70 mb-1 flex items-center gap-1">
                      <Package size={10} /> {msg.packName}
                    </p>
                  )}
                  {msg.role === 'user' && msg.attachments && msg.attachments.length > 0 && (
                    <p
                      className="text-xs opacity-80 mb-1 cursor-help"
                      title={`Saved to workspace — reference these paths next time without re-attaching:\n${msg.attachments.join('\n')}`}
                    >
                      📎 {msg.attachments.length} file{msg.attachments.length > 1 ? 's' : ''} saved to workspace
                    </p>
                  )}
                  {hasBlocks ? (
                    <div className="space-y-1">
                      {msg.blocks!.map((block, idx) => {
                        if (block.kind === 'text') {
                          return (
                            <p key={idx} className="text-sm whitespace-pre-wrap leading-relaxed">
                              {block.text}
                            </p>
                          );
                        }
                        if (block.kind === 'tool_use') {
                          return (
                            <ToolBlock key={idx} block={block} resultByToolUseId={resultByToolUseId} />
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.preset && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[msg.preset.tier]}`}>
                        {TIER_LABELS[msg.preset.tier]}
                      </span>
                      <span className="text-xs text-[var(--muted-foreground)]">
                        {PROVIDER_LABELS[msg.preset.provider]} · {msg.preset.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-[var(--muted-foreground)]" />
                {isRunningPack && packProgress.total > 0 && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    Prompt {packProgress.current}/{packProgress.total}…
                  </span>
                )}
              </div>
            </div>
          )}

          {error === '__CHAT_LIMIT_REACHED__' || isLimitReached ? (
            <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Enjoying Skillset AI Chat?</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                You've used your 3 free conversations. Upgrade to Pro for unlimited AI chat, more prompt packs, and priority access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => open('https://pmtpk.com/pricing')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                >
                  <ExternalLink size={13} />
                  Upgrade to Pro
                </button>
                <button onClick={clearError} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Dismiss
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span className="flex-1">{error}</span>
              <button onClick={clearError} className="flex-shrink-0 hover:opacity-70"><X size={14} /></button>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {/* Pack variable form — fill ALL vars before running entire pack */}
        {packVarForm && (
          <div className="mt-4 border border-[var(--primary)]/40 rounded-xl bg-[var(--card)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Fill variables to run pack</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {packVarForm.prompts.length} prompts will run in sequence
                </p>
              </div>
              <button onClick={() => setPackVarForm(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {packVarForm.vars.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <label className="text-xs font-mono text-[var(--primary)] w-32 flex-shrink-0">{`{${v}}`}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${v}…`}
                    value={packVarValues[v] ?? ''}
                    onChange={(e) => setPackVarValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') startPackRun(packVarForm.prompts, packVarValues);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)]"
                    autoFocus
                  />
                </div>
              ))}
            </div>
            {varGuardError && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{varGuardError}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={() => startPackRun(packVarForm.prompts, packVarValues)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Play size={13} />
                Run {packVarForm.prompts.length} prompts
              </button>
              <p className="text-xs text-[var(--muted-foreground)]">
                {agentMode
                  ? 'Leave blank — Agent will ask for missing values'
                  : 'All variables required (Agent off)'}
              </p>
            </div>
          </div>
        )}

        {/* Single-prompt variable form */}
        {variablePrompt && !packVarForm && (
          <div className="mt-4 border border-[var(--primary)]/40 rounded-xl bg-[var(--card)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wide">Fill variables</p>
              <button onClick={() => setVariablePrompt(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed line-clamp-2">{variablePrompt.text}</p>
            <div className="space-y-2">
              {variablePrompt.vars.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <label className="text-xs font-mono text-[var(--primary)] w-28 flex-shrink-0">{`{${v}}`}</label>
                  <input
                    type="text"
                    placeholder={`Enter ${v}…`}
                    value={variableValues[v] ?? ''}
                    onChange={(e) => setVariableValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVariableSend(); }}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:border-[var(--primary)]"
                    autoFocus
                  />
                </div>
              ))}
            </div>
            {varGuardError && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span>{varGuardError}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                onClick={handleVariableSend}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                <Play size={13} /> Run
              </button>
              <p className="text-xs text-[var(--muted-foreground)]">
                {agentMode
                  ? 'Leave blank — Agent will ask for missing values'
                  : 'All variables required (Agent off)'}
              </p>
            </div>
          </div>
        )}

        {/* Normal text input — hidden while forms active */}
        {!variablePrompt && !packVarForm && (
          <div className="mt-4 border border-[var(--border)] rounded-xl bg-[var(--card)] focus-within:border-[var(--primary)] transition-colors">
            {selectedPack && (
              <div className="flex items-center gap-2 px-3 pt-2">
                <span className="flex items-center gap-1.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-full">
                  <Package size={10} /> {selectedPack.title}
                </span>
                <button onClick={() => setSelectedPackId(null)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={12} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2 p-2">
              {session && (
                <div className="relative">
                  <button
                    onClick={() => setShowPackPicker((v) => !v)}
                    className="p-2 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                    title="Use a prompt pack"
                  >
                    <Package size={18} />
                  </button>
                  {showPackPicker && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
                      <p className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide border-b border-[var(--border)]">
                        Choose a pack
                      </p>
                      <div className="max-h-56 overflow-y-auto">
                        {allPacks.length === 0 && (
                          <p className="px-3 py-3 text-sm text-[var(--muted-foreground)]">No packs yet</p>
                        )}
                        {allPacks.map((pack) => (
                          <button
                            key={pack.id}
                            onClick={() => handleSelectPack(pack.id, pack.type)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--accent)] text-[var(--foreground)] transition-colors"
                          >
                            {'icon' in pack && pack.icon ? <span>{pack.icon}</span> : <Package size={14} className="text-[var(--primary)]" />}
                            <span className="truncate">{pack.title}</span>
                            <span className="ml-auto text-xs text-[var(--muted-foreground)]">{pack.promptCount}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {workspace && agentMode && <AttachmentBar />}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  agentMode && workspace
                    ? 'Ask the agent to read, edit, or run code…'
                    : 'Type a message… (Shift+Enter for new line)'
                }
                rows={1}
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none outline-none py-2 px-1"
              />
              <CopyButton getText={() => input} />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pack prompts sidebar */}
      {selectedPack && packPrompts.length > 0 && (
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          {/* Run Pack button */}
          <button
            onClick={handleRunPack}
            disabled={isLoading || isRunningPack}
            className="group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] hover:bg-[#1d4ed8] disabled:opacity-40 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-[1px]"
          >
            {isRunningPack ? (
              <><Loader2 size={14} className="animate-spin" /> Running {packProgress.current}/{packProgress.total}</>
            ) : (
              <><Play size={14} /> Run Pack ({packPrompts.length} prompts)</>
            )}
          </button>

          <p
            className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] px-1"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {selectedPack.title} · prompts
          </p>
          <div className="flex-1 overflow-y-auto space-y-2">
            {packPrompts.map((p, i) => {
              const vars = extractVariables(p.text);
              return (
                <button
                  key={i}
                  onClick={() => handlePromptClick(p.text)}
                  disabled={isLoading || isRunningPack}
                  className="w-full text-left p-3 rounded-lg border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 disabled:opacity-40 transition-colors group"
                >
                  {p.header && <p className="text-xs font-medium text-[var(--primary)] mb-1">{p.header}</p>}
                  <p className="text-xs text-[var(--muted-foreground)] line-clamp-3">{p.text}</p>
                  <p className="text-xs text-[var(--primary)] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {vars.length > 0 ? (
                      <><SkipForward size={9} /> fill &amp; run</>
                    ) : (
                      <><Play size={9} /> run</>
                    )}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <InfoModal
        open={showWhyOneChat}
        title="Why one chat?"
        secondaryLabel="Got it"
        onClose={() => setShowWhyOneChat(false)}
      >
        <p className="mb-2">
          One chat. Every model. <span className="text-[var(--foreground)]">Skill Chat</span> auto-routes
          each message to the cheapest capable model — fast 8B for short questions, balanced for chat,
          BYOK cloud for heavy work.
        </p>
        <p className="mb-2">
          You don't need a dozen separate conversations. Save your tokens, save your money. Past
          context is truncated automatically so old turns don't snowball costs.
        </p>
        <p className="mb-2">
          Repeating yourself? Hit the bookmark icon on any message and{' '}
          <span className="text-[var(--foreground)]">save it as a Skill</span>. Skills replay
          instantly with new variables — your workflow becomes a one-click prompt instead of a
          conversation you have to remember.
        </p>
      </InfoModal>

      <SaveAsPackModal
        open={saveAsPackText !== null}
        promptText={saveAsPackText ?? ''}
        onClose={() => setSaveAsPackText(null)}
      />
    </div>
  );
}
