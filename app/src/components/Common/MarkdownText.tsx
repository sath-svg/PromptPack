/**
 * Renders LLM-generated markdown with sensible chat-bubble styling.
 * Used for assistant messages so headings / lists / code blocks read as
 * formatted prose instead of a raw string with `## title` artifacts.
 *
 * GitHub-Flavored Markdown is enabled via `remark-gfm` so tables, task
 * lists, autolinks, and strikethrough work the same way they do on
 * GitHub / Notion / OpenAI ChatGPT.
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

export function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div
      className={`markdown-body text-sm leading-relaxed text-[var(--foreground)] ${className ?? ''}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings — chat bubbles are narrow, so keep the size hierarchy
          // tight. Top-level h1/h2 styled the same so the LLM's choice of
          // "##" vs "#" doesn't blow out the bubble.
          h1: ({ children }) => (
            <h1 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold mt-3 mb-1.5 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold mt-2.5 mb-1 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-medium mt-2 mb-1 first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 first:mt-0 last:mb-0 whitespace-pre-wrap">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-1.5 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-1.5 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          // Inline code — small mono pill against the bubble bg.
          code: ({ className, children, ...rest }) => {
            const isBlock = /language-/.test(className ?? '');
            if (isBlock) {
              return (
                <code
                  className={`block px-3 py-2 rounded-md bg-[var(--background)]/60 border border-[var(--border)] font-mono text-[12px] overflow-x-auto ${className ?? ''}`}
                  {...rest}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="px-1 py-0.5 rounded bg-[var(--background)]/60 font-mono text-[12px]"
                {...rest}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 first:mt-0 last:mb-0">{children}</pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[var(--border)] pl-3 my-1.5 text-[var(--muted-foreground)]">
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr className="my-3 border-0 border-t border-[var(--border)]" />
          ),
          // GFM tables — narrow bubble fits, so allow horizontal scroll.
          table: ({ children }) => (
            <div className="my-2 overflow-x-auto">
              <table className="text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-[var(--border)] px-2 py-1 font-medium text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[var(--border)] px-2 py-1 align-top">
              {children}
            </td>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
