"use client";

import { toast } from "sonner";

interface ReportOptions {
  source: string;
}

interface ClassifiedWebError {
  title: string;
  description: string;
  details: string;
}

function classify(err: unknown, ctx: ReportOptions): ClassifiedWebError {
  if (err instanceof TypeError) {
    return {
      title: "Can't reach Skillset",
      description: "Check your connection and try again.",
      details: `[Skillset error]\nsource: ${ctx.source}\nname: ${err.name}\nmessage: ${err.message}\nwhen: ${new Date().toISOString()}`,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    title: "Something went wrong",
    description: message || "An unexpected error occurred.",
    details: `[Skillset error]\nsource: ${ctx.source}\nmessage: ${message}\nwhen: ${new Date().toISOString()}${err instanceof Error && err.stack ? `\nstack:\n${err.stack}` : ""}`,
  };
}

export function reportError(err: unknown, opts: ReportOptions) {
  const classified = classify(err, opts);
  toast.error(classified.title, {
    description: classified.description,
    action: {
      label: "Copy details",
      onClick: () => {
        navigator.clipboard.writeText(classified.details).catch(() => { /* ignore */ });
      },
    },
    duration: 8000,
  });
}

export function reportInfo(title: string, description: string) {
  toast(title, { description });
}
