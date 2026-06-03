import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Package, X, Loader2, AlertCircle, Play, SkipForward, ExternalLink, Info, Sparkles, Settings as SettingsIcon, Brain, ThumbsUp, ThumbsDown, RefreshCw, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { open } from '@tauri-apps/plugin-shell';
import { useChatStore } from '../../stores/chatStore';
import { useSyncStore } from '../../stores/syncStore';
import { useAuthStore } from '../../stores/authStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAgentStore } from '../../stores/agentStore';
import { TIER_COLORS, TIER_LABELS, PROVIDER_LABELS, EFFORT_DISPLAY_LABELS } from '../../lib/classifier';
import { WorkspaceBar } from './WorkspaceBar';
import { LspStatusBar } from './LspStatusBar';
import { GitBar } from './GitBar';
import { AttachmentBar } from './AttachmentBar';
import { ToolBlock } from './ToolBlock';
import { CopyButton } from '../Common/CopyButton';
import { MarkdownText } from '../Common/MarkdownText';
import { LoadingTips } from './LoadingTips';
import { useRunStore } from '../../stores/runStore';
import { SaveAsPackModal } from './SaveAsPackModal';
import { Bookmark } from 'lucide-react';
import type { MessageBlock, ChatMessage } from '../../stores/chatStore';
import { getManagedModel, formatCreditRate } from '../../lib/managed-models';
import { RunTracePanel } from './RunTrace/RunTracePanel';
import { extractPackContext } from '../../lib/packExtractor';
import { refreshCreditBalance } from '../../lib/creditSync';
import { predictRouteWithConfidence } from '../../lib/classifierModel';
import { detectWriteFileIntent } from '../../lib/agentTools';
import { useConversationsStore } from '../../stores/conversationsStore';
import { getStoresFor } from '../../stores/registry';
import { getTelegramChatIdForConvo } from '../../lib/messenger/client';
import type { ChatState } from '../../stores/chatStore';

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

/**
 * Inline placeholder rendered inside an empty assistant bubble while
 * the orchestrator is still running. Reads current subtask progress
 * directly from `useRunStore` so the bubble fills with useful context
 * ("Running step 2 of 3 — Stock Analysis Eval") instead of staying
 * blank until the final answer lands.
 */
function OrchestratorPlaceholder() {
  const run = useRunStore((s) => s.run);
  const subtasks = useRunStore((s) => s.subtasks);
  const taskState = useRunStore((s) => s.taskState);
  const plannerInfo = useRunStore((s) => s.plannerInfo);
  const developerMode = useSettingsStore((s) => s.developerMode);
  const routeLabel = useChatStore((s) => s.pendingRouteLabel);

  const total = taskState?.plan?.subtasks.length ?? subtasks.length;
  const done = subtasks.filter((s) => s.status === 'done').length;
  const failed = subtasks.filter((s) => s.status === 'failed').length;
  const running = subtasks.find((s) => s.status === 'running');

  let label: React.ReactNode;
  if (!run || run.status === 'planning' || (total === 0 && !running)) {
    label = developerMode && plannerInfo?.label
      ? `Planning · ${plannerInfo.label}`
      : 'Planning…';
  } else if (running) {
    label = (
      <>
        Step {done + failed + 1} of {total} —{' '}
        <span className="text-[var(--foreground)]">{running.title}</span>
      </>
    );
  } else if (done < total) {
    label = `Step ${done + 1} of ${total} — preparing…`;
  } else {
    label = 'Synthesizing final answer…';
  }

  return (
    <div className="flex items-start gap-3 py-0.5 w-full">
      <Loader2
        size={14}
        className="animate-spin text-amber-500 mt-1 flex-shrink-0"
      />
      <div className="space-y-1.5 min-w-0 flex-1">
        {routeLabel && (
          <p className="text-[11px] font-mono text-amber-500/90">
            {routeLabel}
          </p>
        )}
        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
          {label}
        </p>
        <p className="text-[11px] text-[var(--muted-foreground)]/70">
          {developerMode
            ? 'Open the Run Trace panel for live model picks, reasoning effort, and per-step output.'
            : 'Open the Progress panel to see step-by-step status.'}
        </p>
        {/* Rotating tips — keeps the empty bubble useful while Skill
            Flow grinds through a multi-step pack. */}
        <LoadingTips />
      </div>
    </div>
  );
}

const EFFORT_CHIP_COLORS: Record<'low' | 'medium' | 'high', string> = {
  low: 'text-amber-500 bg-amber-500/10',
  medium: 'text-orange-500 bg-orange-500/10',
  high: 'text-red-500 bg-red-500/10',
};

/**
 * Single tier node in the empty-state routing graph. Renders an icon
 * disc + label + sublabel + model hint. `active` adds primary glow.
 */
interface TierNodeProps {
  label: string;
  sublabel: string;
  color: 'emerald' | 'primary' | 'amber';
  modelHint: string;
  active?: boolean;
}

function TierNode({ label, sublabel, color, active }: TierNodeProps) {
  const ringColors: Record<TierNodeProps['color'], string> = {
    emerald: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
    primary: 'bg-[var(--primary)]/15 text-[var(--primary)] ring-[var(--primary)]/40',
    amber: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  };

  return (
    <div className="relative z-10 flex flex-col items-center gap-2 min-w-0">
      <div
        className={`w-12 h-12 rounded-full ring-1 ring-inset flex items-center justify-center bg-[var(--card)] ${
          ringColors[color]
        } ${active ? 'shadow-[0_0_18px_-4px_currentColor] animate-pulse' : ''}`}
      >
        <span className="text-xs font-bold uppercase tracking-tight" style={{ fontFamily: 'var(--font-mono)' }}>
          {label.slice(0, 2)}
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[var(--foreground)] leading-tight">{label}</p>
        <p className="text-[11px] text-[var(--muted-foreground)] uppercase tracking-[0.14em] leading-tight mt-0.5"
          style={{ fontFamily: 'var(--font-mono)' }}>
          {sublabel}
        </p>
      </div>
    </div>
  );
}

const HEADER_STATUS_COLORS = {
  running: 'text-blue-500 bg-blue-500/10',
  done: 'text-emerald-500 bg-emerald-500/10',
  failed: 'text-red-500 bg-red-500/10',
};

interface SubtaskHeaderChipProps {
  block: Extract<MessageBlock, { kind: 'subtask_header' }>;
}

function SubtaskHeaderChip({ block }: SubtaskHeaderChipProps) {
  return (
    <div className="mt-3 mb-1 flex items-center gap-1.5 flex-wrap text-xs">
      <span className={`px-2 py-0.5 rounded-full font-medium font-mono ${HEADER_STATUS_COLORS[block.status]}`}>
        {block.status === 'running' ? 'running' : block.status === 'done' ? '✓ done' : '✗ failed'}
      </span>
      {block.tier && (
        <span className={`px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[block.tier]}`}>
          {TIER_LABELS[block.tier]}
        </span>
      )}
      {block.modelLabel && (
        <span className="text-[var(--muted-foreground)]">{block.modelLabel}</span>
      )}
      {block.effort && (
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${EFFORT_CHIP_COLORS[block.effort]}`}
          title={
            block.reasoningTokens
              ? `Reasoning effort · ${block.reasoningTokens} thinking tokens`
              : 'Reasoning effort'
          }
        >
          {EFFORT_DISPLAY_LABELS[block.effort]}
        </span>
      )}
      <span className="ml-auto text-[var(--muted-foreground)] font-medium">
        {block.title}
      </span>
      {block.error && (
        <span className="w-full text-red-500 mt-0.5">{block.error}</span>
      )}
    </div>
  );
}

// Tweak this to scale the empty-state Skill Flow Router card (1 = default).
// Uses CSS `zoom` so layout box shrinks too — kills scrollbar when card is
// taller than the available chat area.
const EMPTY_STATE_SCALE = 1;

export function SkillChatPage() {
  const { messages, isLoading, error, sendMessage, clearMessages, clearError, agentMode, setAgentMode, voteOnMessage } = useChatStore();
  const retryFromAssistant = useChatStore((s) => s.retryFromAssistant);
  const pendingRouteLabel = useChatStore((s) => s.pendingRouteLabel);
  const messageQueue = useChatStore((s) => s.messageQueue);
  const enqueueMessage = useChatStore((s) => s.enqueueMessage);
  const removeQueuedMessage = useChatStore((s) => s.removeQueuedMessage);
  const stopGeneration = useChatStore((s) => s.stopGeneration);
  const { cloudPacks, userPacks, loadedPacks, loadedUserPacks, fetchPackPrompts, fetchUserPackPrompts } = useSyncStore();
  const { session, openSignIn } = useAuthStore();
  const {
    billingTier, serverChatCount,
    managedModeEnabled, creditBalance,
    orchestratorEnabled, setOrchestratorEnabled,
    developerMode,
  } = useSettingsStore();
  const isManagedActive = managedModeEnabled && Boolean(session);
  // Skill Flow is now the master switch — keep agentMode in lockstep on
  // mount + whenever the toggle flips externally (e.g. settings page).
  // chatStore reads `settings.orchestratorEnabled` directly for routing,
  // so this mirror is purely cosmetic (UI conditionals that still read
  // agentMode). Safe to drop once those reads migrate to orchestrator.
  useEffect(() => {
    if (agentMode !== orchestratorEnabled) setAgentMode(orchestratorEnabled);
  }, [orchestratorEnabled, agentMode, setAgentMode]);
  // Reactive subscription so the Trace button shows/hides as runs come and go.
  const currentRun = useRunStore((s) => s.run);
  const [showRunTrace, setShowRunTrace] = useState(false);

  // Auto-open the Run Trace panel when a new orchestrator run starts, so
  // users without the manual toggle still see workflow progress live.
  // Closing the panel mid-run is respected — only re-opens when a fresh
  // run id appears.
  const lastAutoOpenedRun = useRef<string | null>(null);
  useEffect(() => {
    if (currentRun && currentRun.id !== lastAutoOpenedRun.current) {
      lastAutoOpenedRun.current = currentRun.id;
      const inFlight =
        currentRun.status !== 'done' &&
        currentRun.status !== 'failed' &&
        currentRun.status !== 'cancelled';
      if (inFlight) setShowRunTrace(true);
    }
  }, [currentRun?.id, currentRun?.status]);
  const totalCredits = creditBalance ? creditBalance.monthly + creditBalance.topup : 0;
  const { initWorkspace, workspace, attachments, clearAttachments } = useAgentStore();
  const isLimitReached = billingTier === 'free' && serverChatCount >= 3 && !agentMode;

  useEffect(() => {
    initWorkspace();
  }, [initWorkspace]);

  // Boot: load conversations from SQLite, lazy-create "Chat 1" if empty.
  // Loads only once per session — list updates flow through the store
  // afterwards. Failures fall back to the legacy in-memory single-thread
  // behavior so the UI keeps working even if the conversations table is
  // unreachable.
  const conversations = useConversationsStore((s) => s.conversations);
  const activeConvoId = useConversationsStore((s) => s.activeId);
  const loadConversations = useConversationsStore((s) => s.load);
  const createConversation = useConversationsStore((s) => s.create);
  const loadConversationMessages = useConversationsStore((s) => s.loadMessages);
  const conversationsBooted = useRef(false);

  useEffect(() => {
    if (conversationsBooted.current) return;
    conversationsBooted.current = true;
    void (async () => {
      await loadConversations();
      if (useConversationsStore.getState().conversations.length === 0) {
        try {
          await createConversation({ title: 'Chat 1' });
        } catch (err) {
          console.warn('[SkillChat] auto-create initial conversation failed', err);
        }
      }
    })();
  }, [loadConversations, createConversation]);

  // Per-convo cold load — Phase 2 of multi-conversation.
  // Each conversation has its own zustand instances (via factory registry),
  // so switching doesn't snapshot/restore — the prior convo's stores keep
  // running in the background. We only need to (a) cold-load messages from
  // SQLite the first time a convo becomes active this session, and (b)
  // hydrate its workspace from the conversation row.
  const hydratedConvos = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!activeConvoId) return;
    if (hydratedConvos.current.has(activeConvoId)) return;
    hydratedConvos.current.add(activeConvoId);

    // Hydrate workspace from the convo row into this convo's agentStore.
    const convo = useConversationsStore
      .getState()
      .conversations.find((c) => c.id === activeConvoId);
    if (convo?.workspace) {
      useAgentStore.getState().setWorkspace(convo.workspace);
    }
    if (convo?.autoAcceptEdits) {
      useAgentStore.getState().setAutoAcceptEdits(true);
    }
    // Hydrate selected pack from the convo row. setSelectedPackId
    // writes back through conversationsStore.patch, so guard against
    // an immediate re-write loop by comparing to the live value first.
    if (convo?.selectedPackId) {
      const syncState = useSyncStore.getState();
      if (syncState.selectedPackId !== convo.selectedPackId) {
        syncState.setSelectedPackId(convo.selectedPackId);
      }
    }

    // Cold-load messages from SQLite.
    void loadConversationMessages(activeConvoId).then((rows) => {
      // Only apply if user hasn't closed this convo in the meantime.
      const stillExists = useConversationsStore
        .getState()
        .conversations.some((c) => c.id === activeConvoId);
      if (!stillExists) return;
      const messages: ChatMessage[] = rows.map((r) => ({
        id: r.id,
        role: r.role,
        content: r.content,
        blocks: r.blocks_json ? JSON.parse(r.blocks_json) : undefined,
        modelId: r.model_id ?? undefined,
        tier: (r.tier ?? undefined) as never,
        effort: (r.effort ?? undefined) as never,
        packName: r.pack_name ?? undefined,
        attachments: r.attachments_json ? JSON.parse(r.attachments_json) : undefined,
        telemetryId: r.telemetry_id ?? undefined,
        userSignal: (r.user_signal ?? undefined) as never,
        createdAt: r.created_at,
      }));
      // Write into this specific convo's chatStore via registry to avoid
      // racing with another switch.
      const target = getStoresFor(activeConvoId).chat as unknown as {
        setState: (p: Partial<ChatState>) => void;
      };
      target.setState({ messages });
    });
  }, [activeConvoId, loadConversationMessages]);
  void conversations; // referenced via getState() above — keep dep cheap

  // Telegram-bound convos are created by the messenger client with a `📨 `
  // title prefix (see `dispatchToSkillChat` in lib/messenger/client.ts).
  // The chat_id ↔ convoId map is in-memory only across restarts; the
  // persisted title is the durable marker that this convo *was* Telegram-
  // bound at some point.
  const activeConvo = conversations.find((c) => c.id === activeConvoId);
  const isTelegramBound = activeConvo?.title?.startsWith('📨') ?? false;

  // Reactive subscription so the unlink banner appears/clears in real time
  // when the user toggles auth in Settings → Messengers.
  const telegramAuthorizedChats = useSettingsStore((s) => s.telegramAuthorizedChats);
  // Reverse-lookup the chat_id this convo is currently mapped to. Returns
  // undefined on cold app start before the first inbound message rebuilds
  // the map — in that case we default to the "linked" banner and only flip
  // to "unlinked" once we have positive evidence the auth dropped.
  const boundChatId = activeConvoId ? getTelegramChatIdForConvo(activeConvoId) : undefined;
  const isTelegramUnlinked =
    isTelegramBound &&
    boundChatId !== undefined &&
    !telegramAuthorizedChats.some((c) => c.chatId === boundChatId);

  const [input, setInput] = useState('');
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [showPackPicker, setShowPackPicker] = useState(false);
  const [varGuardError, setVarGuardError] = useState<string | null>(null);
  const [saveAsPackText, setSaveAsPackText] = useState<string | null>(null);

  // Single-prompt variable form
  const [variablePrompt, setVariablePrompt] = useState<{ text: string; vars: string[] } | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Pack runner — drives the orchestrator path. The whole pack runs as
  // ONE Run with subtasks chained via `depends_on`, so step N inherits
  // step N-1's output through shared TaskState. No more client-side
  // queue draining; the orchestrator's executor handles sequencing,
  // halt-on-error, and cancel.
  const [isRunningPack, setIsRunningPack] = useState(false);
  const [packProgress, setPackProgress] = useState({ current: 0, total: 0 });
  const [packVarForm, setPackVarForm] = useState<
    { vars: string[]; prompts: { text: string; header?: string }[] } | null
  >(null);
  const [packVarValues, setPackVarValues] = useState<Record<string, string>>({});
  // Free-text adjustments the user typed alongside the pack tag that
  // didn't map to a pack variable. Forwarded into runPack as
  // `extraInstructions` once the var form submits. Cleared on cancel
  // and after each successful pack run.
  const [pendingPackExtras, setPendingPackExtras] = useState<string | null>(null);
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);
  // SkillFlow gate prompt — when the LR route head says a typed prompt
  // is a multi-step `workflow` but the user has SkillFlow disabled,
  // we hold the input here and surface a modal instead of silently
  // running it single-shot. Cleared when the user picks an action.
  const [skillflowGatePrompt, setSkillflowGatePrompt] = useState<string | null>(null);

  // Pending-edit IDs that survived a Set Run with accepted === null.
  // Populated in the runPack finally and rendered as an "N edits
  // awaiting review" banner above the chat input so they aren't
  // silently abandoned. Auto-accept (the default for Set Runs) keeps
  // this empty in the common case; the banner only fires when the
  // user opted into ask-mode mid-run or pdf_generate stages a
  // fallback that wasn't auto-accepted.
  const [sweepEditIds, setSweepEditIds] = useState<string[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Drain the queued-message FIFO whenever the in-flight assistant turn
  // resolves. Pops one entry per transition so each message gets its
  // own complete `sendMessage` lifecycle (including orchestrator + Run
  // Trace updates). The user can still type further follow-ups while
  // earlier ones are running.
  useEffect(() => {
    if (isLoading) return;
    if (messageQueue.length === 0) return;
    const next = messageQueue[0];
    removeQueuedMessage(0);
    void sendMessage(next.text, next.packName, next.systemPrompt, next.attachments);
  }, [isLoading, messageQueue, removeQueuedMessage, sendMessage]);

  // Clear the upfront routing pill once the in-flight call resolves.
  // The per-message model chip carries the same info long-term once
  // the response materialises.
  useEffect(() => {
    if (!isLoading) {
      useChatStore.setState({ pendingRouteLabel: null });
    }
  }, [isLoading]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // Pack progress mirror — sync only `current` from runStore subtask
  // counts. `total` was set at startPackRun (= filled.length, i.e. the
  // pack's full prompt count) and must NOT be overwritten — runStore's
  // subtasks array grows incrementally as the orchestrator upserts each
  // subtask, so using its length as total would render "1/2" / "2/3"
  // mid-run for a 3-prompt pack. Pin total; let current rise.
  const runSubtasks = useRunStore((s) => s.subtasks);
  useEffect(() => {
    if (!isRunningPack) return;
    const done = runSubtasks.filter((s) => s.status === 'done').length;
    setPackProgress((prev) => ({ current: done, total: prev.total }));
  }, [isRunningPack, runSubtasks]);

  // Pack picker shows ONLY user-authored packs. `cloudPacks` ("saved-from-X"
  // buckets the extension fills with prompts the user captured while using
  // ChatGPT / Claude / Gemini / etc.) are flat prompt dumps, not curated
  // skill workflows — running them as Set Runs produces gibberish because
  // each "prompt" was just a single captured chat message. They remain
  // available elsewhere (Saved Packs view, Cloud Prompts view) but are
  // hidden from the Skill Chat picker + .skillset/ sync.
  const allPacks = userPacks.map((p) => ({ ...p, type: 'user' as const }));

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
    const fullPrompts = prompts.map((p) => ({ text: p.text, header: p.header }));
    if (allVars.size > 0) {
      setPackVarForm({ vars: Array.from(allVars), prompts: fullPrompts });
      setPackVarValues({});
    } else {
      startPackRun(fullPrompts, {});
    }
  };

  const runPack = useChatStore((s) => s.runPack);
  const resumeOrchestratorRun = useChatStore((s) => s.resumeOrchestratorRun);

  /**
   * Pack run — orchestrator path. Each pack prompt becomes a subtask
   * with `depends_on` chained to the previous, so step N inherits
   * step N-1's output via shared TaskState. Run Trace panel auto-opens
   * with one chip per step. Single Run row in SQLite spans the whole
   * pack (used to be one row per step under the old queue path).
   */
  const startPackRun = (
    prompts: { text: string; header?: string }[],
    values: Record<string, string>,
  ) => {
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
    const filled = prompts.map((p) => ({
      header: p.header,
      text: fillVariables(p.text, values),
    }));
    const extras = pendingPackExtras ?? undefined;
    setPackVarForm(null);
    setVariablePrompt(null);
    setPendingPackExtras(null);
    setPackProgress({ current: 0, total: filled.length });
    setIsRunningPack(true);
    void runPack(
      selectedPack?.title ?? 'Pack',
      filled,
      undefined,
      extras,
    ).finally(() => {
      setIsRunningPack(false);
      setPackProgress({ current: 0, total: 0 });
      // End-of-run pending-edits sweep. If any staged edits survived the
      // run with accepted === null (user manually disabled auto-accept,
      // a tool errored mid-flow, etc.), surface them as an Accept-all /
      // Reject-all banner instead of leaving them in the void.
      const pending = useAgentStore.getState().pendingEdits;
      const unresolved = Object.values(pending)
        .filter((e) => e.accepted === null)
        .map((e) => e.id);
      setSweepEditIds(unresolved);
    });
  };

  const cancelPackRun = () => {
    // Pack now runs as one orchestrator Run — cancelling fires the
    // shared AbortController which propagates into in-flight LLM calls
    // and marks the run row + remaining subtasks as cancelled.
    void useRunStore.getState().cancelRun();
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
    if (!text) return;

    // Auth gate — require sign-in before any chat interaction
    if (!session) {
      openSignIn();
      return;
    }

    // SkillFlow gate. The LR route head OR write-intent detector flags
    // a prompt that needs agent/orchestrator capabilities but the user
    // has SkillFlow disabled. Pause here, surface a modal asking them
    // to enable it (or run single-shot anyway). Pack runs and active
    // in-flight queues bypass the gate — those have explicit user
    // intent already.
    const packPromptsExist = getPackPrompts().length > 0;
    const settings = useSettingsStore.getState();
    if (
      !isLoading &&
      !selectedPack &&
      !packPromptsExist &&
      settings.managedModeEnabled &&
      !orchestratorEnabled
    ) {
      const lr = predictRouteWithConfidence(text);
      const writeIntent = detectWriteFileIntent(text);
      const workspaceMounted = Boolean(useAgentStore.getState().workspace);
      // Match chatStore's WORKFLOW_CONFIDENCE_FLOOR — if we wouldn't
      // auto-route to SkillFlow even with the toggle on, don't bug
      // the user about turning it on either. Saves the modal from
      // firing on borderline predictions like comparison prompts.
      const needsWorkflow = lr.route === 'workflow' && lr.confidence >= 0.7;
      // Agent route → single-agent tool loop. Workspace must be mounted
      // for the model to actually act on something; without it the
      // tools can't bind to a target dir and the gate is pointless.
      const needsAgent = lr.route === 'agent' && workspaceMounted;
      // Explicit "save as report.pdf" / "write to workspace" — same as
      // chatStore's tier-bump trigger. Always force the gate so the
      // user can opt into tools.
      const needsTools = writeIntent !== null && workspaceMounted;
      if (needsWorkflow || needsAgent || needsTools) {
        setSkillflowGatePrompt(text);
        return;
      }
    }

    setInput('');

    // While a previous turn is still running, queue the new prompt
    // instead of dropping it. The drain effect picks it up as soon as
    // the in-flight call resolves. Pack-tagged routing only applies
    // when the user can run synchronously — queued plain prompts
    // bypass the extractor (the pack tag may not even be selected by
    // the time the queue drains).
    if (isLoading) {
      const snapshot =
        attachments.length > 0 ? [...attachments] : undefined;
      enqueueMessage({
        text,
        packName: selectedPack?.title,
        systemPrompt: buildSystemPrompt(),
        attachments: snapshot,
      });
      if (snapshot) clearAttachments();
      return;
    }

    // Pack-tagged free-text routing: if a pack with prompts is selected
    // and the user typed something into the chat input, the typed text
    // is treated as run-time adjustments to the pack rather than a
    // standalone single-shot message. The Llama 8B extractor pulls any
    // pack variables out of the text; whatever doesn't map to a var
    // becomes `extraInstructions` (layered alongside `skillset.md`).
    const packPromptsList = getPackPrompts();
    if (selectedPack && packPromptsList.length > 0) {
      const allVars = new Set<string>();
      packPromptsList.forEach((p) =>
        extractVariables(p.text).forEach((v) => allVars.add(v)),
      );
      const varList = Array.from(allVars);
      const jwt =
        useAuthStore.getState().session?.session_token ?? '';
      const { values: extracted, extras } = await extractPackContext({
        jwt,
        vars: varList,
        prompt: text,
      });
      const fullPrompts = packPromptsList.map((p) => ({
        text: p.text,
        header: p.header,
      }));
      const missing = varList.filter((v) => !(extracted[v] ?? '').trim());
      if (missing.length === 0) {
        // All vars covered by the user's text (or no vars in the pack).
        // Run the pack directly with extras layered into TaskState.
        const filled = fullPrompts.map((p) => ({
          header: p.header,
          text: fillVariables(p.text, extracted),
        }));
        const snapshot =
          attachments.length > 0 ? [...attachments] : undefined;
        if (snapshot) clearAttachments();
        setPackProgress({ current: 0, total: filled.length });
        setIsRunningPack(true);
        void runPack(
          selectedPack.title ?? 'Pack',
          filled,
          snapshot,
          extras || undefined,
        ).finally(() => {
          setIsRunningPack(false);
          setPackProgress({ current: 0, total: 0 });
        });
        return;
      }
      // Some vars still unfilled → fall back to the var form, but
      // pre-populate the values we did extract so the user only fills
      // the gaps. The remaining `extras` text is preserved by stashing
      // it on the form state so submit can forward it to runPack.
      setPackVarForm({ vars: varList, prompts: fullPrompts });
      setPackVarValues(extracted);
      setPendingPackExtras(extras || null);
      return;
    }

    // Default path: no pack tag, or pack has no prompts → single-shot
    // chat / orchestrator depending on the LR route head.
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
        {isTelegramUnlinked ? (
          <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-md border border-red-500/40 bg-red-500/10 text-[11px] text-[var(--foreground)] leading-relaxed">
            <AlertCircle size={12} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-1">
              <p>
                <span className="font-medium text-red-500">Telegram link broken.</span>{' '}
                This chat is no longer paired with your Telegram bot. Send <code className="px-1 py-0.5 rounded bg-[var(--background)] text-[var(--foreground)]" style={{ fontFamily: 'var(--font-mono)' }}>/start</code> from Telegram to re-pair, then approve the chat in Settings → Messengers.
              </p>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('skillset:navigate', { detail: { page: 'settings', section: 'settings-messengers' } }))}
                className="inline-flex items-center gap-1 text-red-500 hover:text-red-400 underline"
              >
                Open Messenger settings
              </button>
            </div>
          </div>
        ) : isTelegramBound ? (
          <div className="flex items-start gap-2 mb-3 px-3 py-2 rounded-md border border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[11px] text-[var(--muted-foreground)] leading-relaxed">
            <Info size={12} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
            <span>
              Heads up: this chat is linked to a Telegram chat with your bot. Messages you type here stay in the desktop app — they will NOT appear in Telegram. Telegram only shows messages you send from Telegram and the bot's replies to them.
            </span>
          </div>
        ) : null}
        {/* Header */}
        <div className={`flex items-center justify-between ${messages.length === 0 ? 'mb-6' : 'mb-2'}`}>
          {messages.length === 0 ? (
            <div>
              <h2 className="text-[28px] font-medium tracking-[-0.02em] leading-none text-[var(--foreground)]">
                One chat. Every model.
              </h2>
              <p className="mt-2 text-[13px] text-[var(--muted-foreground)] max-w-[58ch]">
                Auto-routes each message to the cheapest capable model.
              </p>
            </div>
          ) : (
            <div />
          )}
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
            {isManagedActive && (
              <>
                {/* Change model → routes to Settings page where the
                    Fast / Balanced / Powerful picks live. */}
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('skillset:navigate', { detail: 'settings' }))}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-xs text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
                  title="Configure Fast / Balanced / Powerful picks"
                >
                  <SettingsIcon size={12} />
                  Change model
                </button>
                {/* Credit info tooltip → explains SkillFlow loan system */}
                <div className="relative group">
                  <button
                    type="button"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors cursor-help"
                    aria-label="Credit info"
                  >
                    <Info size={12} />
                  </button>
                  <div className="absolute right-0 bottom-full mb-3 w-[520px] p-4 rounded-lg bg-[var(--card)] border border-[var(--border)] shadow-lg text-xs text-[var(--foreground)] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    <p className="font-semibold mb-1.5 text-[var(--foreground)]">Notice your credits falling fast?</p>
                    <p className="text-[var(--muted-foreground)] leading-relaxed">
                      For Skill Flow, we take a loan to send to the agents. Any unused credits will be returned.
                    </p>
                  </div>
                </div>
                {/* Balance pill → opens dashboard top-up */}
                <button
                  type="button"
                  onClick={() => open('https://skillset.so/account').catch(console.error)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors"
                  title="Buy more credits"
                >
                  <Sparkles size={12} />
                  {totalCredits} credits
                </button>
                {/* Refresh balance from Convex. The header sync only
                    fires after a settled managed-proxy call, so users
                    who topped up out-of-band or got an admin grant
                    need this to pull the new total without sending a
                    throwaway message. */}
                <button
                  type="button"
                  disabled={isRefreshingCredits || !session?.user_id}
                  onClick={async () => {
                    if (!session?.user_id) return;
                    setIsRefreshingCredits(true);
                    await refreshCreditBalance(session.user_id);
                    // Brief visual delay so the spin finishes a tick
                    // even on a fast response.
                    setTimeout(() => setIsRefreshingCredits(false), 250);
                  }}
                  className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors disabled:opacity-50"
                  title="Refresh credit balance"
                >
                  <RefreshCw
                    size={12}
                    className={isRefreshingCredits ? 'animate-spin' : ''}
                  />
                </button>
              </>
            )}
            {isRunningPack && (
              // Single compact pill while a Set Run is in flight. The old
              // layout exposed three separate chips ("Running N/M", a
              // redundant "Skill Flow" badge, and a "Cancel" button) that
              // overflowed the header into the pack sidebar at three-column
              // widths. Collapsed into one amber pill with the Cancel as a
              // trailing icon; tooltip carries the Skill Flow context.
              <div
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                title="Set runs always use Skill Flow — set prompts are the predefined chain with shared memory between steps."
              >
                <Brain size={11} />
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {packProgress.current}/{packProgress.total}
                </span>
                <button
                  onClick={cancelPackRun}
                  className="flex items-center justify-center w-4 h-4 rounded-full text-red-500 hover:bg-red-500/15 transition-colors"
                  title="Cancel Set Run"
                  aria-label="Cancel Set Run"
                >
                  <X size={11} />
                </button>
              </div>
            )}
            {/* Skill Flow toggle is meaningless while a pack run is active
                — packs always use Skill Flow regardless of the toggle.
                Suppress it to recover header width for the trace toggle. */}
            {isManagedActive && !isRunningPack && (
              <button
                type="button"
                onClick={() => {
                  const next = !orchestratorEnabled;
                  setOrchestratorEnabled(next);
                  // Skill Flow now drives agent capabilities too. Mirror
                  // the toggle into agentMode so workspace prompts get
                  // tools when Skill Flow is on, single-shot when off.
                  setAgentMode(next);
                  if (!next) setShowRunTrace(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  orchestratorEnabled
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]'
                }`}
                title={
                  'Skill Flow: when on, multi-step CHAT messages auto-engage a planner that ' +
                  'decomposes your goal into subtasks and routes each to a different ' +
                  'managed model. Trivial / single-task prompts always go single-shot ' +
                  'regardless. Turn off to force every typed message through single-shot.\n\n' +
                  'Note: "Run Set" on a saved pack ALWAYS uses Skill Flow ' +
                  '(pack prompts are the predefined chain — shared memory across steps). ' +
                  'This toggle does not affect pack runs.'
                }
              >
                <Brain size={14} />
                Skill Flow
              </button>
            )}
            {orchestratorEnabled && (currentRun || showRunTrace) && (
              <button
                type="button"
                onClick={() => setShowRunTrace((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)] transition-colors"
                title={
                  developerMode
                    ? showRunTrace ? 'Hide Run Trace' : 'Show Run Trace'
                    : showRunTrace ? 'Hide Progress' : 'Show Progress'
                }
                aria-label={
                  developerMode
                    ? showRunTrace ? 'Hide Run Trace' : 'Show Run Trace'
                    : showRunTrace ? 'Hide Progress' : 'Show Progress'
                }
              >
                {showRunTrace ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                {/* Label hides at narrow widths (three-column layout) so
                    the icon alone communicates the action. */}
                <span className="hidden xl:inline">
                  {developerMode
                    ? showRunTrace ? 'Hide trace' : 'Show trace'
                    : showRunTrace ? 'Hide progress' : 'Show progress'}
                </span>
              </button>
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
        {/* `pt-10` reserves space above the first message for its
            floating toolbar (`absolute -top-7`). `overflow-y-auto`
            otherwise clips the copy / bookmark / thumbs icons on the
            topmost bubble — visible whenever the first prompt of a
            session sits alone (e.g. a sign-in error blocks the
            assistant reply). */}
        <div className={`flex-1 space-y-4 pr-1 min-h-0 ${messages.length === 0 ? 'overflow-hidden pt-0' : 'overflow-y-auto pt-10'}`}>
          {messages.length === 0 && !packVarForm && !variablePrompt && (
            <div className="flex h-full items-end justify-center pb-4">
              <div
                className="relative w-full max-w-[720px]"
                style={{ zoom: EMPTY_STATE_SCALE }}
              >
                <div
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                  style={{
                    boxShadow:
                      '0 30px 80px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
                  }}
                >
                  {/* Header strip — minimal status bar */}
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <Brain size={15} className="text-[var(--primary)]" />
                      <span
                        className="text-xs uppercase tracking-[0.18em] text-[var(--foreground)] font-medium"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        Skill Router
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="status-ping" />
                      <span
                        className="text-xs uppercase tracking-[0.14em] text-emerald-400/90"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Routing graph — 3 tier nodes with flowing dots */}
                  <div className="px-5 py-5">
                    <div className="flex items-center justify-between gap-2 relative max-w-[520px] mx-auto">
                      {/* Animated dot trail along the connecting line.
                          Bar inset on both sides so it floats between Fast
                          and stops before Powerful — feels less crowded.
                          Dot's `left` keyframe traverses this narrower span. */}
                      <div className="absolute top-[58%] left-[15%] right-[28%] -translate-y-1/2 h-px overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
                        <div
                          className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent animate-[routerDot_3s_linear_infinite]"
                        />
                      </div>

                      <TierNode
                        label="Fast"
                        sublabel="lookups"
                        color="emerald"
                        modelHint="Haiku · Llama"
                      />
                      <TierNode
                        label="Balanced"
                        sublabel="reasoning"
                        color="primary"
                        active
                        modelHint="Sonnet · GPT-5"
                      />
                      <TierNode
                        label="Powerful"
                        sublabel="hard tasks"
                        color="amber"
                        modelHint="Opus · GPT-5 Pro"
                      />
                    </div>

                    {/* Status line */}
                    <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-center text-xs">
                      <span
                        className="uppercase tracking-[0.14em] text-[var(--muted-foreground)]"
                        style={{ fontFamily: 'var(--font-mono)' }}
                      >
                        waiting for input
                      </span>
                    </div>
                  </div>

                  {/* Helpful prompts row */}
                  <div className="border-t border-[var(--border)] px-6 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-3 font-medium"
                      style={{ fontFamily: 'var(--font-mono)' }}>
                      Try
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Summarize this PDF',
                        'Build a landing page',
                        'Run my saved set',
                        'Refactor src/utils.ts',
                      ].map((tip) => (
                        <button
                          key={tip}
                          type="button"
                          onClick={() => {
                            setInput(tip);
                            // Focus textarea + place cursor at end so user can edit
                            requestAnimationFrame(() => {
                              const ta = textareaRef.current;
                              if (ta) {
                                ta.focus();
                                ta.setSelectionRange(tip.length, tip.length);
                              }
                            });
                          }}
                          className="px-3 py-1.5 rounded-md text-sm text-[var(--muted-foreground)] bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/40 hover:text-[var(--foreground)] hover:bg-[var(--primary)]/5 transition-colors cursor-pointer"
                        >
                          {tip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
                    className={`absolute -top-7 ${msg.role === 'user' ? 'right-0' : 'left-0'} opacity-50 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-[var(--background)]/90 backdrop-blur-sm rounded-md px-0.5 z-10`}
                  >
                    <CopyButton getText={copyText} size={11} title="Copy message" />
                    {msg.role === 'user' && session && (
                      <button
                        type="button"
                        onClick={() => setSaveAsPackText(msg.content)}
                        title="Save as Skill set"
                        className="p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
                      >
                        <Bookmark size={11} />
                      </button>
                    )}
                    {msg.role === 'assistant' && !isLoading && (() => {
                      // Retry surfaces only when something actually went
                      // wrong: explicit failure / cancel sentinel, fully
                      // empty bubble, or low-confidence run trace. Hidden
                      // on a happy answer the user could just edit / vote
                      // on — keeps the toolbar quiet.
                      const looksFailed =
                        (msg.content?.startsWith('_(run failed') ?? false) ||
                        (msg.content?.startsWith('_(cancelled') ?? false);
                      const looksEmpty =
                        !msg.content?.trim() &&
                        !(msg.blocks ?? []).some(
                          (b) => b.kind === 'text' && b.text.trim().length > 0,
                        );
                      // Pull the lowest confidence across this turn's
                      // subtasks (orchestrator runs only). Below the
                      // 0.55 threshold = the heuristic flagged the
                      // output, surface a retry option for the user.
                      const lowConfidence =
                        msg.role === 'assistant' &&
                        runSubtasks.length > 0 &&
                        runSubtasks.some(
                          (s) =>
                            typeof s.confidence === 'number' &&
                            s.confidence < 0.55,
                        );
                      if (!looksFailed && !looksEmpty && !lowConfidence) {
                        return null;
                      }
                      return (
                        <button
                          type="button"
                          onClick={() => void retryFromAssistant(msg.id)}
                          title={
                            looksFailed
                              ? 'Retry — re-run the user message that produced this turn'
                              : looksEmpty
                                ? 'Retry — bubble came back empty'
                                : 'Retry — confidence on at least one subtask was below 55%'
                          }
                          className="p-1.5 rounded-md text-amber-500 hover:bg-amber-500/10 transition-colors"
                        >
                          <RefreshCw size={11} />
                        </button>
                      );
                    })()}
                    {msg.role === 'assistant' && msg.telemetryId && (
                      <>
                        <button
                          type="button"
                          onClick={() => voteOnMessage(msg.id, 'thumbs_up')}
                          title="Good response — feeds the routing classifier retrain"
                          className={`p-1.5 rounded-md transition-colors ${
                            msg.userSignal === 'thumbs_up'
                              ? 'text-emerald-500 bg-emerald-500/10'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          <ThumbsUp size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => voteOnMessage(msg.id, 'thumbs_down')}
                          title="Wrong route — feeds the routing classifier retrain"
                          className={`p-1.5 rounded-md transition-colors ${
                            msg.userSignal === 'thumbs_down'
                              ? 'text-red-500 bg-red-500/10'
                              : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
                          }`}
                        >
                          <ThumbsDown size={11} />
                        </button>
                      </>
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
                  {msg.role === 'assistant' &&
                  !hasBlocks &&
                  !msg.content?.trim() &&
                  isLoading ? (
                    <OrchestratorPlaceholder />
                  ) : hasBlocks ? (
                    <div className="space-y-1">
                      {msg.blocks!.map((block, idx) => {
                        if (block.kind === 'text') {
                          // Assistant text → render as markdown so headings,
                          // lists, code blocks, hr, etc. show formatted.
                          // User text blocks (rare — only in agent flow
                          // assistant turns) keep plain pre-wrap.
                          return msg.role === 'assistant' ? (
                            <MarkdownText key={idx} content={block.text} />
                          ) : (
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
                        if (block.kind === 'subtask_header') {
                          return <SubtaskHeaderChip key={idx} block={block} />;
                        }
                        if (block.kind === 'planner_hint') {
                          return (
                            <p
                              key={idx}
                              className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)] mb-1"
                              style={{ fontFamily: 'var(--font-mono)' }}
                              title={
                                block.isFree
                                  ? 'Planner runs free on the inbuilt Skillset server. Subtasks below burn credits per the routed model.'
                                  : 'Planner is using your managed cheap selection because the inbuilt server was unavailable.'
                              }
                            >
                              <Brain size={9} className="inline-block mr-1 -mt-0.5 text-amber-500" />
                              Planned by {block.label}
                              {block.isFree ? '' : ' · fallback'}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <MarkdownText content={msg.content} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  )}
                  {msg.role === 'assistant' && msg.preset && (
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[msg.preset.tier]}`}>
                        {TIER_LABELS[msg.preset.tier]}
                      </span>
                      {developerMode && (
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {PROVIDER_LABELS[msg.preset.provider]} · {msg.preset.label}
                        </span>
                      )}
                    </div>
                  )}
                  {msg.role === 'assistant' && msg.modelId && !msg.preset && (() => {
                    const m = getManagedModel(msg.modelId);
                    const label = m?.label ?? msg.modelId;
                    // Per-call cost is variable (token-based); render a
                    // density hint in the user's native unit — credits —
                    // instead of upstream USD/M which most users can't
                    // map back to their balance.
                    const tierCost = m ? formatCreditRate(m) : null;
                    return (
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {msg.tier && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[msg.tier]}`}
                            title="LR classifier tier — picks which managed model serves the prompt"
                          >
                            {TIER_LABELS[msg.tier]}
                          </span>
                        )}
                        {developerMode && msg.effort && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EFFORT_CHIP_COLORS[msg.effort]}`}
                            title="Reasoning effort the model used (Light / Standard / Deep). Higher = more thinking tokens, higher cost."
                          >
                            {EFFORT_DISPLAY_LABELS[msg.effort]}
                          </span>
                        )}
                        {developerMode && (
                          <span className="text-[10px] text-[var(--muted-foreground)]">
                            {label}{tierCost ? ` · ${tierCost}` : ''}
                          </span>
                        )}
                        {developerMode && msg.orchestratorSkipped && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500"
                            title={
                              'Skill Flow is on, but Skillset auto-routed this turn to a single-shot ' +
                              'call to save credits. The orchestrator only engages when the route ' +
                              'classifier reports a multi-step workflow with high confidence ' +
                              '(≥ 70%). Single-shot Sonnet/Haiku handles compare / explain / ' +
                              'summarise prompts at a fraction of the cost.'
                            }
                          >
                            Auto-routed to single-shot
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}

          {(() => {
            if (!isLoading) return null;
            // Suppress the bottom loading bubble when the latest message
            // is an empty assistant placeholder — `OrchestratorPlaceholder`
            // already renders inside that bubble (live step count + Run
            // Trace pointer). Showing both = duplicate spinners.
            const last = messages[messages.length - 1];
            const placeholderActive =
              last?.role === 'assistant' &&
              !(last.blocks && last.blocks.length > 0) &&
              !last.content?.trim();
            if (placeholderActive) return null;
            return (
              <div className="flex justify-start">
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl rounded-bl-sm px-4 py-3 flex items-start gap-3 max-w-[80%]">
                  <Loader2 size={16} className="animate-spin text-[var(--muted-foreground)] mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-1.5 min-w-0">
                    {pendingRouteLabel && (
                      <span className="text-[11px] font-mono text-amber-500/90">
                        {pendingRouteLabel}
                      </span>
                    )}
                    {isRunningPack && packProgress.total > 0 && (
                      <span className="text-xs text-[var(--muted-foreground)]">
                        Prompt {packProgress.current}/{packProgress.total}…
                      </span>
                    )}
                    <LoadingTips />
                  </div>
                </div>
              </div>
            );
          })()}

          {error === '__SESSION_EXPIRED__' ? (
            <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Session expired</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Your sign-in token has expired. Sign in again to keep using managed chat.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { clearError(); openSignIn().catch(console.error); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                >
                  Sign in again
                </button>
                <button onClick={clearError} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Dismiss
                </button>
              </div>
            </div>
          ) : error === '__OUT_OF_CREDITS__' ? (
            <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Run paused — out of credits</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                The orchestrator stopped mid-run because your balance ran out.
                Top up below, then click Resume to pick up where the run left
                off — completed subtasks won't re-run.
              </p>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  onClick={() => open('https://skillset.so/account')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={13} />
                  Top up
                </button>
                <button
                  onClick={async () => {
                    if (!session?.user_id) return;
                    await refreshCreditBalance(session.user_id);
                    void resumeOrchestratorRun();
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/15 text-amber-500 text-sm hover:bg-amber-500/25 transition-colors"
                >
                  Resume run
                </button>
                <button onClick={clearError} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Dismiss
                </button>
              </div>
            </div>
          ) : error === '__INSUFFICIENT_CREDITS__' ? (
            <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Out of credits</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                Top up to keep using managed mode, or add your own provider key under Settings → Advanced.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => open('https://skillset.so/account')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={13} />
                  Buy credits
                </button>
                <button onClick={clearError} className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  Dismiss
                </button>
              </div>
            </div>
          ) : error === '__CHAT_LIMIT_REACHED__' || isLimitReached ? (
            <div className="p-4 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">Enjoying Skillset AI Chat?</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                You've used your 3 free conversations. Upgrade to Pro for unlimited AI chat, more prompt packs, and priority access.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => open('https://skillset.so/pricing')}
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
                <p className="text-sm font-semibold text-[var(--foreground)]">Fill variables to run set</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {packVarForm.prompts.length} prompts will run in sequence
                </p>
                {pendingPackExtras && (
                  <p className="text-[11px] text-[var(--primary)]/80 mt-1">
                    Your typed instructions will be applied:{' '}
                    <span className="text-[var(--foreground)]">
                      “{pendingPackExtras.length > 80
                        ? pendingPackExtras.slice(0, 80) + '…'
                        : pendingPackExtras}”
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setPackVarForm(null);
                  setPendingPackExtras(null);
                }}
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
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

        {/* Queued prompts — drained one-at-a-time as the in-flight
            assistant turn resolves. Each chip is removable so a user
            who changed their mind can drop a queued send. */}
        {!variablePrompt && !packVarForm && messageQueue.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--muted-foreground)] mr-1">
              Queued ({messageQueue.length}):
            </span>
            {messageQueue.map((q, i) => (
              <span
                key={i}
                className="flex items-center gap-1 max-w-[260px] px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[11px]"
                title={q.text}
              >
                <SkipForward size={10} />
                <span className="truncate">{q.text.slice(0, 60)}{q.text.length > 60 ? '…' : ''}</span>
                <button
                  onClick={() => removeQueuedMessage(i)}
                  className="text-amber-500 hover:text-amber-400"
                  aria-label="Remove from queue"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
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
                    title="Use a prompt set"
                  >
                    <Package size={18} />
                  </button>
                  {showPackPicker && (
                    <div className="absolute bottom-full mb-2 left-0 w-64 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg z-10 overflow-hidden">
                      <p className="px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide border-b border-[var(--border)]">
                        Choose a set
                      </p>
                      <div className="max-h-56 overflow-y-auto">
                        {allPacks.length === 0 && (
                          <p className="px-3 py-3 text-sm text-[var(--muted-foreground)]">No sets yet</p>
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
              {sweepEditIds.length > 0 && (
                <div className="mb-2 flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-xs">
                  <span className="text-amber-600 dark:text-amber-400">
                    {sweepEditIds.length} edit{sweepEditIds.length === 1 ? '' : 's'} awaiting review from the last Set Run.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const ids = [...sweepEditIds];
                        const store = useAgentStore.getState();
                        void Promise.all(ids.map((id) => store.acceptEdit(id)))
                          .finally(() => setSweepEditIds([]));
                      }}
                      className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                    >
                      Accept all
                    </button>
                    <button
                      onClick={() => {
                        const ids = [...sweepEditIds];
                        const store = useAgentStore.getState();
                        void Promise.all(ids.map((id) => store.rejectEdit(id)))
                          .finally(() => setSweepEditIds([]));
                      }}
                      className="px-2 py-1 rounded-md bg-red-500/20 border border-red-500/40 text-red-700 dark:text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      Reject all
                    </button>
                  </div>
                </div>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isLoading
                    ? 'Type to queue another prompt — runs after the current one'
                    : agentMode && workspace
                      ? 'Ask the agent to read, edit, or run code…'
                      : 'Type a message… (Shift+Enter for new line)'
                }
                rows={1}
                className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] resize-none outline-none py-2 px-1"
              />
              {isLoading ? (
                input.trim() ? (
                  // Busy + user typed something → primary action becomes
                  // "queue this prompt". Drain effect picks it up when
                  // the current turn finishes.
                  <button
                    onClick={handleSend}
                    className="p-2 rounded-lg bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-colors flex-shrink-0"
                    title="Queue this prompt — runs after the current one"
                  >
                    <SkipForward size={16} />
                  </button>
                ) : (
                  // Busy + nothing typed → primary action is Stop the
                  // in-flight generation (orchestrator AbortController).
                  <button
                    onClick={stopGeneration}
                    className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors flex-shrink-0"
                    title="Stop the current run"
                  >
                    <X size={16} />
                  </button>
                )
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="p-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pack prompts sidebar */}
      {selectedPack && packPrompts.length > 0 && (
        <div className="w-64 flex-shrink-0 flex flex-col gap-2">
          {/* Run Set button — always uses Skill Flow (sequential w/ shared memory) */}
          <button
            onClick={handleRunPack}
            disabled={isLoading || isRunningPack}
            title="Runs all prompts sequentially. Each step inherits prior outputs (Skill Flow) — applies even when the chat-level Skill Flow toggle is off."
            className="group flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[13px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_8px_24px_-12px_rgba(37,99,235,0.6)] hover:bg-[#1d4ed8] disabled:opacity-40 transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] active:translate-y-[1px]"
          >
            {isRunningPack ? (
              <><Loader2 size={14} className="animate-spin" /> Running {packProgress.current}/{packProgress.total}</>
            ) : (
              <><Play size={14} /> Run Set ({packPrompts.length} prompts)</>
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

      <RunTracePanel
        open={showRunTrace}
        onClose={() => setShowRunTrace(false)}
      />


      <SaveAsPackModal
        open={saveAsPackText !== null}
        promptText={saveAsPackText ?? ''}
        onClose={() => setSaveAsPackText(null)}
      />

      {/* SkillFlow gate — the LR route head flagged the typed prompt as
          multi-step but the user has SkillFlow off. Modal forces an
          explicit pick so the user understands which path runs. */}
      {skillflowGatePrompt !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSkillflowGatePrompt(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Brain size={18} className="text-amber-400" />
              <h3 className="text-base font-semibold text-[var(--foreground)]">
                Looks like a multi-step task
              </h3>
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              Skill Flow can break this prompt into subtasks, run independent
              ones in parallel, and route each to the right model. It's off
              right now — turn it on, or run as a single-shot anyway.
            </p>
            <div className="rounded-md bg-[var(--background)] border border-[var(--border)] px-3 py-2">
              <p className="text-[11px] text-[var(--muted-foreground)] line-clamp-3">
                {skillflowGatePrompt}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => {
                  const text = skillflowGatePrompt;
                  if (!text) return;
                  setOrchestratorEnabled(true);
                  setAgentMode(true);
                  setShowRunTrace(true);
                  setSkillflowGatePrompt(null);
                  setInput('');
                  // Run after the orchestratorEnabled commit lands —
                  // microtask boundary is enough since both stores are
                  // synchronous Zustand writes.
                  void Promise.resolve().then(() => {
                    void sendMessage(text, selectedPack?.title, buildSystemPrompt());
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/15 text-amber-500 text-sm hover:bg-amber-500/25 transition-colors"
              >
                <Brain size={13} />
                Turn on Skill Flow & run
              </button>
              <button
                onClick={() => {
                  const text = skillflowGatePrompt;
                  if (!text) return;
                  setSkillflowGatePrompt(null);
                  setInput('');
                  void sendMessage(text, selectedPack?.title, buildSystemPrompt());
                }}
                className="px-4 py-1.5 rounded-lg border border-[var(--border)] text-sm text-[var(--foreground)] hover:bg-[var(--accent)] transition-colors"
              >
                Run anyway (single-shot)
              </button>
              <button
                onClick={() => setSkillflowGatePrompt(null)}
                className="ml-auto text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
