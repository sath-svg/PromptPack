import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  // Function returning the text to copy. Lazy so callers can read fresh
  // input values without forcing re-renders on every keystroke.
  getText: () => string;
  className?: string;
  size?: number;
  title?: string;
}

export function CopyButton({ getText, className, size = 14, title = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = getText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore — clipboard may be unavailable in some webviews
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied' : title}
      className={`p-1.5 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--foreground)] transition-colors ${className ?? ''}`}
    >
      {copied ? <Check size={size} className="text-emerald-500" /> : <Copy size={size} />}
    </button>
  );
}
