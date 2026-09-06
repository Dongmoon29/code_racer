import { useState } from "react";
import { Check, Code2, Copy } from "lucide-react";
import CodeEditor from "../../CodeEditor";

interface SolutionPanelProps {
  code: string;
  language: "python" | "javascript" | "go";
}

export function SolutionPanel({ code, language }: SolutionPanelProps) {
  const [copied, setCopied] = useState(false);

  const copySolution = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--gray-6)] bg-[var(--color-panel)]/70 shadow-2xl backdrop-blur">
      <header className="flex h-14 items-center justify-between border-b border-[var(--gray-6)] px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text)]">
              Winning solution
            </div>
            <div className="text-[11px] text-[var(--gray-10)]">
              Read-only submission
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-[var(--gray-6)] bg-[var(--gray-3)] px-3 py-1 text-xs capitalize text-[var(--gray-11)] sm:inline-flex">
            {language}
          </span>
          <button
            type="button"
            onClick={copySolution}
            aria-label={copied ? "Solution copied" : "Copy solution"}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-[var(--gray-6)] text-[var(--gray-11)] transition hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-400"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>
      <div className="h-[420px] sm:h-[500px] lg:h-[clamp(460px,calc(100vh-26rem),590px)]">
        <CodeEditor value={code} readOnly language={language} />
      </div>
    </section>
  );
}
