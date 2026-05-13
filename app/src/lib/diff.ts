// Tiny LCS-based line diff used by the agent's diff panel.
// Not optimized for huge files — bails out cleanly past LIMIT lines.

const LIMIT = 4000;

export type DiffLine =
  | { kind: 'context'; text: string; oldNo: number; newNo: number }
  | { kind: 'add'; text: string; newNo: number }
  | { kind: 'remove'; text: string; oldNo: number };

export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.split(/\r?\n/);
  const b = after.split(/\r?\n/);

  if (a.length > LIMIT || b.length > LIMIT) {
    // Fallback: replace whole file
    return [
      ...a.map((text, i) => ({ kind: 'remove' as const, text, oldNo: i + 1 })),
      ...b.map((text, i) => ({ kind: 'add' as const, text, newNo: i + 1 })),
    ];
  }

  // Build LCS table
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0, j = 0, oldNo = 1, newNo = 1;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      out.push({ kind: 'context', text: a[i], oldNo, newNo });
      i++; j++; oldNo++; newNo++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: 'remove', text: a[i], oldNo });
      i++; oldNo++;
    } else {
      out.push({ kind: 'add', text: b[j], newNo });
      j++; newNo++;
    }
  }
  while (i < m) { out.push({ kind: 'remove', text: a[i], oldNo }); i++; oldNo++; }
  while (j < n) { out.push({ kind: 'add', text: b[j], newNo }); j++; newNo++; }
  return out;
}

export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0, removed = 0;
  for (const l of lines) {
    if (l.kind === 'add') added++;
    else if (l.kind === 'remove') removed++;
  }
  return { added, removed };
}
