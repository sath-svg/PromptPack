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
function getScoreColor(score: number): string {
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
 * Get background color (20% opacity of the main color)
 */
function getScoreBgColor(score: number): string {
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

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 min-w-[28px]',
    md: 'text-sm px-2 py-0.5 min-w-[36px]',
    lg: 'text-base px-2.5 py-1 min-w-[44px]',
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded font-semibold
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
      `}
      style={{
        backgroundColor: bgColor,
        color: color,
      }}
      title={`Evaluation score: ${score}/100`}
    >
      {score}
      {showLabel && <span className="ml-0.5 font-normal opacity-70">/100</span>}
    </Component>
  );
}

// Export the color utility for use in other components (like the modal)
export { getScoreColor, getScoreBgColor };
