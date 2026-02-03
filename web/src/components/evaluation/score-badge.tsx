"use client";

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

/**
 * Get the color for a score using gradient shades:
 * - 70-100: Green (100=darkest, 70=lightest)
 * - 40-69: Orange gradient
 * - 0-39: Red (0=darkest, 39=lightest)
 */
export function getScoreColor(score: number): string {
  if (score >= 70) {
    // Green gradient: 70=light green (hsl 120, 50%, 45%), 100=dark green (hsl 120, 80%, 30%)
    const intensity = (score - 70) / 30; // 0 to 1
    const saturation = 50 + intensity * 30; // 50% to 80%
    const lightness = 45 - intensity * 15; // 45% to 30%
    return `hsl(120, ${saturation}%, ${lightness}%)`;
  } else if (score >= 40) {
    // Orange gradient: 40=yellow-orange (hsl 45), 69=orange (hsl 30)
    const intensity = (score - 40) / 29; // 0 to 1
    const hue = 45 - intensity * 15; // 45 to 30
    return `hsl(${hue}, 85%, 50%)`;
  } else {
    // Red gradient: 0=dark red (hsl 0, 70%, 35%), 39=light red (hsl 0, 70%, 50%)
    const intensity = score / 39; // 0 to 1
    const lightness = 35 + intensity * 15; // 35% to 50%
    return `hsl(0, 70%, ${lightness}%)`;
  }
}

/**
 * Get background color (15% opacity of the main color)
 */
export function getScoreBgColor(score: number): string {
  if (score >= 70) {
    const intensity = (score - 70) / 30;
    const saturation = 50 + intensity * 30;
    const lightness = 45 - intensity * 15;
    return `hsla(120, ${saturation}%, ${lightness}%, 0.15)`;
  } else if (score >= 40) {
    const intensity = (score - 40) / 29;
    const hue = 45 - intensity * 15;
    return `hsla(${hue}, 85%, 50%, 0.15)`;
  } else {
    const intensity = score / 39;
    const lightness = 35 + intensity * 15;
    return `hsla(0, 70%, ${lightness}%, 0.15)`;
  }
}

export function ScoreBadge({ score, size = 'md', showLabel = false, onClick }: ScoreBadgeProps) {
  const color = getScoreColor(score);
  const bgColor = getScoreBgColor(score);

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { fontSize: '0.75rem', padding: '0.125rem 0.375rem', minWidth: '28px' },
    md: { fontSize: '0.875rem', padding: '0.25rem 0.5rem', minWidth: '36px' },
    lg: { fontSize: '1rem', padding: '0.375rem 0.625rem', minWidth: '44px' },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    fontWeight: 600,
    backgroundColor: bgColor,
    color: color,
    cursor: onClick ? 'pointer' : 'default',
    transition: 'opacity 0.15s',
    ...sizeStyles[size],
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        style={baseStyle}
        title={`Evaluation score: ${score}/100`}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {score}
        {showLabel && <span style={{ marginLeft: '2px', fontWeight: 'normal', opacity: 0.7 }}>/100</span>}
      </button>
    );
  }

  return (
    <span style={baseStyle} title={`Evaluation score: ${score}/100`}>
      {score}
      {showLabel && <span style={{ marginLeft: '2px', fontWeight: 'normal', opacity: 0.7 }}>/100</span>}
    </span>
  );
}
