import { useState } from 'react';
import {
  Palette,
  Pen,
  Sun,
  Layers,
  LayoutGrid,
  Sparkles,
  Edit3,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Wand2,
  Star,
  Lightbulb,
} from 'lucide-react';
import type { StyleCharacteristics, SkillPrompt } from '../../lib/styleAnalyzer';

interface StyleBreakdownProps {
  characteristics: StyleCharacteristics;
  prompts: SkillPrompt[];
  activePromptId: string;
  editing: boolean;
  onToggleEditing: () => void;
  onUpdateCharacteristics: (next: StyleCharacteristics) => void;
  onUpdatePrompts: (prompts: SkillPrompt[]) => void;
  onSetActivePrompt: (id: string) => void;
}

/**
 * Visual breakdown of extracted style with FULL editing support.
 * - Color palette: hex chips with color picker on click + add/remove
 * - All dimension cards (line, shading, texture, composition): inline edit
 * - Signature elements: editable chips with add/remove
 * - Negative prompt: textarea
 * - Generation prompt: editable textarea
 */
export function StyleBreakdown({
  characteristics,
  prompts,
  activePromptId,
  editing,
  onToggleEditing,
  onUpdateCharacteristics,
  onUpdatePrompts,
  onSetActivePrompt,
}: StyleBreakdownProps) {
  const [expandedPromptId, setExpandedPromptId] = useState<string | null>(activePromptId);

  // Prompt set helpers
  const updatePrompt = (id: string, updates: Partial<SkillPrompt>) => {
    onUpdatePrompts(prompts.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };
  const addCustomPrompt = () => {
    const newId = `custom-${Date.now()}`;
    onUpdatePrompts([
      ...prompts,
      {
        id: newId,
        label: 'Custom Prompt',
        purpose: 'Describe what this prompt is for',
        icon: '🎯',
        template: '{subject}, ',
        negativePrompt: '',
      },
    ]);
    setExpandedPromptId(newId);
  };
  const removePrompt = (id: string) => {
    const next = prompts.filter((p) => p.id !== id);
    onUpdatePrompts(next);
    // If removed the active one, fall back to first remaining
    if (id === activePromptId && next.length > 0) {
      onSetActivePrompt(next[0].id);
    }
  };

  // Helper to update a nested field on characteristics.
  // Accepts an updater function (mutates clone) for compound updates so
  // callers don't run into stale-state issues from sequential updateField calls.
  const updateField = (path: string[], value: any) => {
    updateBatch((draft) => {
      let cursor: any = draft;
      for (let i = 0; i < path.length - 1; i++) {
        cursor = cursor[path[i]];
      }
      cursor[path[path.length - 1]] = value;
    });
  };

  const updateBatch = (mutator: (draft: any) => void) => {
    const next = JSON.parse(JSON.stringify(characteristics));
    mutator(next);
    onUpdateCharacteristics(next);
  };

  // Color palette helpers — use batch update to avoid stale-state bug
  const updateHex = (idx: number, hex: string) => {
    updateBatch((d) => {
      const arr = [...(d.colorPalette?.hexCodes || [])];
      arr[idx] = hex;
      d.colorPalette.hexCodes = arr;
      d.colorPalette.count = arr.length;
    });
  };
  const addHex = () => {
    updateBatch((d) => {
      const arr = [...(d.colorPalette?.hexCodes || []), '#888888'];
      d.colorPalette.hexCodes = arr;
      d.colorPalette.count = arr.length;
    });
  };
  const removeHex = (idx: number) => {
    updateBatch((d) => {
      const arr = (d.colorPalette?.hexCodes || []).filter((_: string, i: number) => i !== idx);
      d.colorPalette.hexCodes = arr;
      d.colorPalette.count = arr.length;
    });
  };

  // Signature element helpers
  const updateSignature = (idx: number, value: string) => {
    updateBatch((d) => {
      const arr = [...(d.signatureElements || [])];
      arr[idx] = value;
      d.signatureElements = arr;
    });
  };
  const addSignature = () => {
    updateBatch((d) => {
      d.signatureElements = [...(d.signatureElements || []), 'New signature element'];
    });
  };
  const removeSignature = (idx: number) => {
    updateBatch((d) => {
      d.signatureElements = (d.signatureElements || []).filter((_: string, i: number) => i !== idx);
    });
  };

  const [showTips, setShowTips] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-[var(--foreground)]">Extracted Art Style</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTips((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors"
          >
            <Lightbulb size={12} />
            Tips
          </button>
          <button
            onClick={onToggleEditing}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
              editing
                ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)]'
            }`}
          >
            {editing ? <Check size={12} /> : <Edit3 size={12} />}
            {editing ? 'Done Editing' : 'Edit Style'}
          </button>
        </div>
      </div>

      {/* Tips panel */}
      {showTips && (
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-amber-500" />
            <h4 className="font-medium text-sm text-[var(--foreground)]">How to Edit Your Preset</h4>
          </div>
          <ul className="space-y-2 text-xs text-[var(--muted-foreground)] leading-relaxed">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">①</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Color Palette:</span> Click any swatch to open a color picker. Add/remove colors with + and trash icons. Use measurable hex codes (e.g. <code className="font-mono">#FFB6C1</code>) — vague descriptors hurt mimicry.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">②</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Line Work:</span> Use point measurements ("1-2pt clean uniform") not "thin/thick". Specify edge type: sharp / soft / textured.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">③</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Shading:</span> Name the technique — cel-shading, cross-hatch, soft gradient, flat. Specify light direction (top-left soft fill / bottom-up dramatic).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">④</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Signature Elements:</span> The MOST important field. Be specific — "large round eyes with star highlights" beats "cute eyes". Add 4-6 unique recurring quirks.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⑤</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Skillset Prompts:</span> ★ marks the active prompt for preview generation. Each prompt MUST contain {'{subject}'} placeholder. Add custom prompts for niche use (logo style, comic panel, sticker, etc).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⑥</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Faster path:</span> Generate 3 previews → use the feedback box ("colors too saturated, lines too thick") → AI auto-edits the relevant fields. Costs ~8 credits, no manual editing needed.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⑦</span>
              <span>
                <span className="text-[var(--foreground)] font-medium">Negative prompts:</span> Tell the AI what your style is NOT. "realistic, harsh, muted" helps it avoid drift toward generic styles.
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Color Palette */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-[var(--muted-foreground)]" />
            <h4 className="font-medium text-sm text-[var(--foreground)]">Color Palette</h4>
          </div>
          {editing && (
            <button
              onClick={addHex}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            >
              <Plus size={10} /> Add Color
            </button>
          )}
        </div>

        {characteristics.colorPalette?.hexCodes && characteristics.colorPalette.hexCodes.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {characteristics.colorPalette.hexCodes.map((hex, idx) => (
              <div key={idx} className="flex items-center gap-1.5 group">
                <div className="relative">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => updateHex(idx, e.target.value)}
                    disabled={!editing}
                    className={`w-8 h-8 rounded-md border border-[var(--border)] shadow-sm overflow-hidden ${
                      editing ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={editing ? 'Click to change color' : hex}
                  />
                </div>
                {editing ? (
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => updateHex(idx, e.target.value)}
                    className="w-20 px-1.5 py-0.5 text-[10px] font-mono uppercase border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded"
                  />
                ) : (
                  <span className="text-[10px] font-mono text-[var(--muted-foreground)] uppercase">
                    {hex}
                  </span>
                )}
                {editing && (
                  <button
                    onClick={() => removeHex(idx)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <EditableRow
            label="Temperature"
            value={characteristics.colorPalette?.temperature}
            editing={editing}
            onChange={(v) => updateField(['colorPalette', 'temperature'], v)}
          />
          <EditableRow
            label="Dominant"
            value={characteristics.colorPalette?.dominant}
            editing={editing}
            onChange={(v) => updateField(['colorPalette', 'dominant'], v)}
          />
          <EditableRow
            label="Accents"
            value={(characteristics.colorPalette?.accents || []).join(', ')}
            editing={editing}
            fullWidth
            onChange={(v) =>
              updateField(['colorPalette', 'accents'], v.split(',').map((s) => s.trim()).filter(Boolean))
            }
          />
        </div>
      </div>

      {/* Line Work + Shading + Texture + Composition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <DimensionCard
          icon={<Pen size={14} />}
          title="Line Work"
          editing={editing}
          rows={[
            ['Thickness', characteristics.lineWork?.thickness, ['lineWork', 'thickness']],
            ['Edges', characteristics.lineWork?.edges, ['lineWork', 'edges']],
            ['Consistency', characteristics.lineWork?.consistency, ['lineWork', 'consistency']],
          ]}
          onUpdate={updateField}
        />
        <DimensionCard
          icon={<Sun size={14} />}
          title="Shading"
          editing={editing}
          rows={[
            ['Technique', characteristics.shading?.technique, ['shading', 'technique']],
            ['Light Direction', characteristics.shading?.lightDirection, ['shading', 'lightDirection']],
            ['Intensity', characteristics.shading?.intensity, ['shading', 'intensity']],
          ]}
          onUpdate={updateField}
        />
        <DimensionCard
          icon={<Layers size={14} />}
          title="Texture & Surface"
          editing={editing}
          rows={[
            ['Medium', characteristics.texture?.medium, ['texture', 'medium']],
            ['Scale', characteristics.texture?.scale, ['texture', 'scale']],
            ['Density', characteristics.texture?.density, ['texture', 'density']],
          ]}
          onUpdate={updateField}
        />
        <DimensionCard
          icon={<LayoutGrid size={14} />}
          title="Composition"
          editing={editing}
          rows={[
            ['Framing', characteristics.composition?.framing, ['composition', 'framing']],
            ['Perspective', characteristics.composition?.perspective, ['composition', 'perspective']],
          ]}
          onUpdate={updateField}
        />
      </div>

      {/* Signature Elements */}
      <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--muted-foreground)]" />
            <h4 className="font-medium text-sm text-[var(--foreground)]">Signature Elements</h4>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              — what makes this style unique
            </span>
          </div>
          {editing && (
            <button
              onClick={addSignature}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            >
              <Plus size={10} /> Add
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(characteristics.signatureElements || []).map((el, idx) => (
            <div key={idx} className="group flex items-center gap-1">
              {editing ? (
                <>
                  <input
                    type="text"
                    value={el}
                    onChange={(e) => updateSignature(idx, e.target.value)}
                    className="px-2.5 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] min-w-[150px]"
                  />
                  <button
                    onClick={() => removeSignature(idx)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30">
                  {el}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Prompt Set — the SKILLSET (collection of style-locked prompts for different gen surfaces) */}
      <div className="p-4 rounded-lg border border-[var(--primary)]/30 bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wand2 size={16} className="text-[var(--primary)]" />
            <h4 className="font-medium text-sm text-[var(--foreground)]">
              Skillset Prompts
            </h4>
            <span className="text-[10px] text-[var(--muted-foreground)]">
              — {prompts.length} prompt{prompts.length !== 1 ? 's' : ''}
              {prompts.length > 0 ? ', click ★ to use for preview' : ''}
            </span>
          </div>
          {editing && (
            <button
              onClick={addCustomPrompt}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20"
            >
              <Plus size={10} /> Add Custom
            </button>
          )}
        </div>

        {/* Empty state — show recovery action */}
        {prompts.length === 0 && (
          <div className="p-4 rounded-md border border-dashed border-[var(--border)] bg-[var(--background)] text-center space-y-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              No prompts generated. The style analysis returned no prompt templates.
              You can build a default 5-prompt skillset from the extracted style data, or re-analyze.
            </p>
            <button
              onClick={() => {
                // Synthesize default 5 prompts from current characteristics
                const synthesized = synthesizeFromCharacteristics(characteristics);
                onUpdatePrompts(synthesized);
                if (synthesized.length > 0) {
                  onSetActivePrompt(synthesized[0].id);
                }
              }}
              className="px-3 py-1.5 rounded-md text-xs bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90 inline-flex items-center gap-1.5"
            >
              <Wand2 size={12} />
              Build Default Prompts (no credits)
            </button>
          </div>
        )}

        <div className="space-y-2">
          {prompts.map((p) => {
            const isActive = p.id === activePromptId;
            const isExpanded = expandedPromptId === p.id;
            return (
              <div
                key={p.id}
                className={`rounded-lg border transition-colors ${
                  isActive
                    ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                    : 'border-[var(--border)] bg-[var(--background)]'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 px-3 py-2">
                  <button
                    onClick={() => onSetActivePrompt(p.id)}
                    className={`p-1 rounded transition-colors ${
                      isActive
                        ? 'text-yellow-500'
                        : 'text-[var(--muted-foreground)] hover:text-yellow-500'
                    }`}
                    title={isActive ? 'Active prompt for preview generation' : 'Set as active prompt'}
                  >
                    <Star size={14} fill={isActive ? 'currentColor' : 'none'} />
                  </button>
                  <span className="text-base">{p.icon}</span>
                  {editing ? (
                    <input
                      type="text"
                      value={p.label}
                      onChange={(e) => updatePrompt(p.id, { label: e.target.value })}
                      className="flex-1 px-2 py-0.5 text-sm font-medium border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-[var(--foreground)]">
                      {p.label}
                    </span>
                  )}
                  {editing && p.id.startsWith('custom-') && (
                    <button
                      onClick={() => removePrompt(p.id)}
                      className="p-1 text-red-500 hover:text-red-600"
                      title="Delete custom prompt"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <button
                    onClick={() => setExpandedPromptId(isExpanded ? null : p.id)}
                    className="p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                </div>

                {/* Purpose tag */}
                <div className="px-3 pb-2">
                  {editing ? (
                    <input
                      type="text"
                      value={p.purpose}
                      onChange={(e) => updatePrompt(p.id, { purpose: e.target.value })}
                      className="w-full px-2 py-0.5 text-[10px] italic border border-[var(--border)] bg-[var(--input)] text-[var(--muted-foreground)] rounded"
                    />
                  ) : (
                    <p className="text-[10px] italic text-[var(--muted-foreground)]">
                      {p.purpose}
                    </p>
                  )}
                </div>

                {/* Expanded: template + negative */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] px-3 py-2 space-y-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        Template (uses {'{subject}'} placeholder)
                      </label>
                      {editing ? (
                        <textarea
                          value={p.template}
                          onChange={(e) => updatePrompt(p.id, { template: e.target.value })}
                          className="mt-1 w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] text-xs font-mono h-32 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      ) : (
                        <pre className="mt-1 text-xs font-mono text-[var(--muted-foreground)] whitespace-pre-wrap break-words bg-[var(--muted)]/20 p-2 rounded">
                          {p.template}
                        </pre>
                      )}
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                        Negative (Avoid)
                      </label>
                      {editing ? (
                        <textarea
                          value={p.negativePrompt}
                          onChange={(e) => updatePrompt(p.id, { negativePrompt: e.target.value })}
                          className="mt-1 w-full px-2 py-1.5 rounded border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] text-xs h-12 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        />
                      ) : (
                        <p className="mt-1 text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/20 p-2 rounded">
                          {p.negativePrompt || '—'}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface EditableRowProps {
  label: string;
  value: string | undefined;
  editing: boolean;
  fullWidth?: boolean;
  onChange: (value: string) => void;
}

function EditableRow({ label, value, editing, fullWidth, onChange }: EditableRowProps) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <span className="text-[var(--muted-foreground)]">{label}:</span>{' '}
      {editing ? (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="ml-1 px-1.5 py-0.5 text-xs border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded w-[calc(100%-60px)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
        />
      ) : (
        <span className="text-[var(--foreground)]">{value || '—'}</span>
      )}
    </div>
  );
}

interface DimensionCardProps {
  icon: React.ReactNode;
  title: string;
  editing: boolean;
  rows: Array<[string, string | undefined, string[]]>; // [label, value, fieldPath]
  onUpdate: (path: string[], value: any) => void;
}

function DimensionCard({ icon, title, editing, rows, onUpdate }: DimensionCardProps) {
  return (
    <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[var(--muted-foreground)]">{icon}</span>
        <h4 className="font-medium text-xs text-[var(--foreground)]">{title}</h4>
      </div>
      <div className="space-y-1.5 text-xs">
        {rows.map(([label, value, path]) => (
          <div key={label}>
            <span className="text-[var(--muted-foreground)]">{label}:</span>{' '}
            {editing ? (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => onUpdate(path, e.target.value)}
                className="mt-0.5 w-full px-1.5 py-0.5 text-xs border border-[var(--border)] bg-[var(--input)] text-[var(--foreground)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              />
            ) : (
              <span className="text-[var(--foreground)]">{value || '—'}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Build default 5-prompt skillset from extracted style characteristics.
 * Used as recovery when API didn't return prompts[].
 */
function synthesizeFromCharacteristics(c: StyleCharacteristics): SkillPrompt[] {
  const palette = c.colorPalette;
  const hex = (palette?.hexCodes || []).slice(0, 6).join(', ');
  const sig = (c.signatureElements || []).join('; ');

  const base = [
    c.lineWork ? `${c.lineWork.thickness} line work, ${c.lineWork.edges} edges` : '',
    palette ? `${palette.temperature} palette dominant ${palette.dominant}${hex ? ` (${hex})` : ''}, accents: ${(palette.accents || []).join(', ')}` : '',
    c.shading ? `${c.shading.technique}, light ${c.shading.lightDirection}, ${c.shading.intensity}` : '',
    c.texture ? `${c.texture.medium}, ${c.texture.scale} (${c.texture.density})` : '',
    c.composition ? `${c.composition.framing}, ${c.composition.perspective}` : '',
  ]
    .filter(Boolean)
    .join('; ');

  const sigSuffix = sig ? ` Signature: ${sig}.` : '';
  const baseTemplate = `{subject}, drawn in this style: ${base}.${sigSuffix}`;
  const baseNeg = 'realistic, photorealistic, dark, gritty, harsh shadows, muted colors, low quality, blurry';

  return [
    {
      id: 'image',
      label: 'Image Generation',
      icon: '🖼️',
      purpose: 'Use with DALL-E, Gemini, Midjourney, Stable Diffusion for static images',
      template: baseTemplate,
      negativePrompt: baseNeg,
    },
    {
      id: 'video',
      label: 'Video Generation',
      icon: '🎬',
      purpose: 'Use with Sora, Runway, Veo, Kling for animated clips',
      template: `${baseTemplate} Animated with smooth fluid motion, frame-consistent line weight and palette.`,
      negativePrompt: `${baseNeg}, static, frozen, choppy motion, flickering`,
    },
    {
      id: 'character',
      label: 'Character/Portrait Prompt',
      icon: '👤',
      purpose: 'Generate figures, faces, character designs in this style',
      template: `{subject}, character portrait in this style: ${base}.${sigSuffix} Emphasize face and anatomy details.`,
      negativePrompt: `${baseNeg}, deformed, extra limbs, wrong proportions, blurred face`,
    },
    {
      id: 'setting',
      label: 'Setting/Background Prompt',
      icon: '🏞️',
      purpose: 'Generate environments, scenes, backgrounds without focal characters',
      template: `{subject}, environment scene in this style: ${base}. Focus on composition, lighting, depth, environmental texture. No character figures.`,
      negativePrompt: `${baseNeg}, people, faces, characters, figures`,
    },
    {
      id: 'mood',
      label: 'Mood/Atmosphere Prompt',
      icon: '✨',
      purpose: 'Apply tonal/lighting overlay — pair with content generated separately',
      template: `{subject}, atmospheric overlay matching this style — emphasize palette, lighting tone, emotional atmosphere. ${palette ? `Palette: ${palette.temperature} ${palette.dominant}${hex ? ` (${hex})` : ''}.` : ''} ${c.shading ? `Lighting: ${c.shading.lightDirection}, ${c.shading.intensity}.` : ''}`,
      negativePrompt: `${baseNeg}, harsh contrast, neon, oversaturated`,
    },
  ];
}
