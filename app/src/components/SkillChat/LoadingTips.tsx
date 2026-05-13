/**
 * Rotating tips shown next to the loading spinner. Surfaces lesser-known
 * Skillset features so users discover them while a model is thinking
 * instead of staring at a blank spinner.
 *
 * Each tip cycles every ~5s with a light fade. Order is randomized on
 * mount so a user who chats often doesn't see the same first tip every
 * time.
 */

import { useEffect, useMemo, useState } from 'react';
import { Lightbulb } from 'lucide-react';

const TIPS: Array<{ feature: string; body: string }> = [
  {
    feature: 'Save as Skill',
    body: 'Hover any message and click the bookmark icon to save its prompt as a reusable Skill pack — replay it later with new variables.',
  },
  {
    feature: 'Skill Control',
    body: 'Pro & Studio plans get version history on Skills. Up to 10 snapshots per pack — roll back to any prior version from Skill Control.',
  },
  {
    feature: 'Draft tab',
    body: 'Iterate on a long prompt in the Draft tab before saving. Free workspace, no clutter, full editor.',
  },
  {
    feature: 'Skill Flow',
    body: 'Toggle the Brain icon to let multi-step goals auto-decompose into subtasks. Each subtask gets routed to whichever managed model fits — fast tier for lookups, balanced for prose, powerful for the hard parts.',
  },
  {
    feature: 'Run Trace',
    body: 'When Skill Flow engages, the right panel shows the live plan, per-subtask model + reasoning effort, and shared task memory.',
  },
  {
    feature: 'Variable templates',
    body: 'Wrap reusable bits in `{curly_braces}` and Skillset prompts you for values before each run. Last-used values auto-fill.',
  },
  {
    feature: 'Pack runner',
    body: 'Pick a saved pack and hit "Run Set" to execute every prompt sequentially with Skill Flow — each step inherits prior step\'s output. Perfect for multi-step research or content workflows.',
  },
  {
    feature: 'Your keys + Managed',
    body: 'Add your own Anthropic / OpenAI / Google keys for unlimited use, or stay on Managed mode for a single credit pool across all available models.',
  },
  {
    feature: 'Reasoning routing',
    body: 'The router auto-picks reasoning effort (low / medium / high) for each subtask. Easy questions stay cheap; proofs spend thinking tokens only when needed.',
  },
  {
    feature: 'Workspace mode',
    body: 'Pick a workspace folder and turn on Agent mode to let the model read, edit, and run code in your project — with diff review on every change.',
  },
  {
    feature: 'Pack import / export',
    body: 'Pack files (`.pmtpk`) are encrypted, portable, and shareable. Drop one into Import to instantly add a community Skill set.',
  },
  {
    feature: 'Skill export → Claude',
    body: 'Export any Skill as a `.skill` markdown file compatible with Claude.ai\'s skills format. Bring your Skillset workflow to other tools.',
  },

  // ── Token-reduction tips — help users stretch credits further ─────
  {
    feature: 'Save tokens · be specific',
    body: 'Tell the model exactly how long an answer to write ("3 bullet points", "150 words"). Vague asks get verbose answers — and verbose answers cost output tokens.',
  },
  {
    feature: 'Save tokens · use {variables}',
    body: 'Wrap context once in {curly_braces}. Skillset fills it on each run so you stop re-pasting the same project description into every prompt.',
  },
  {
    feature: 'Save tokens · point at files',
    body: 'With a workspace connected, ask "summarize src/utils.ts" instead of pasting code. The agent reads the file directly — same answer, ~10× fewer input tokens.',
  },
  {
    feature: 'Save tokens · stay on Light',
    body: 'Reasoning effort scales output 1×/1.3×/2×/4× for Light/Standard/Deep. Quick rewrites and lookups don\'t need Deep — let the LR router pick.',
  },
  {
    feature: 'Save tokens · clear chat often',
    body: 'Long chats stuff every previous turn back into the next call. Hit Clear when the conversation drifts to a new topic — drops the rolling history bill.',
  },
];

export function LoadingTips() {
  // Randomize on mount so the user doesn't see the same first tip each
  // time they hit a model. Stable for the duration of the spin.
  const order = useMemo(() => {
    const idx = TIPS.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }, []);

  const [pos, setPos] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      // Hold the empty state briefly so the fade reads as a transition
      // rather than a hard swap.
      setTimeout(() => {
        setPos((p) => (p + 1) % order.length);
        setVisible(true);
      }, 200);
    }, 5500);
    return () => clearInterval(interval);
  }, [order.length]);

  const tip = TIPS[order[pos]];

  return (
    <div className="flex items-start gap-2 max-w-[42ch]">
      <Lightbulb
        size={14}
        className="text-amber-500 mt-0.5 flex-shrink-0"
      />
      <div
        className={`text-xs leading-relaxed transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <span className="font-medium text-[var(--foreground)]">
          {tip.feature}:
        </span>{' '}
        <span className="text-[var(--muted-foreground)]">{tip.body}</span>
      </div>
    </div>
  );
}
