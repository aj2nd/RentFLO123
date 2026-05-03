import { Fragment } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export interface ProgressStep {
  label: string;
  done: boolean;
  href?: string;
}

export function SetupProgress({ steps }: { steps: ProgressStep[] }) {
  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  const activeIdx = steps.findIndex(s => !s.done);

  return (
    <div
      className="mb-6 bg-zinc-950 border border-white/[0.06] p-4 sm:p-5"
      data-testid="setup-progress"
    >
      <p className="text-[9px] font-bold uppercase tracking-[3px] text-zinc-600 mb-4">
        Getting Started &mdash; {steps.filter(s => s.done).length}/{steps.length} complete
      </p>

      <div className="flex items-start">
        {steps.map((step, i) => {
          const isDone = step.done;
          const isActive = i === activeIdx;

          return (
            <Fragment key={step.label}>
              {/* Step */}
              <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                {/* Indicator circle */}
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border-2 flex-shrink-0 transition-colors duration-300 ${
                    isDone
                      ? "border-[#6FFFE9] bg-[#6FFFE9]/10"
                      : isActive
                      ? "border-white bg-white/[0.05]"
                      : "border-zinc-800 bg-transparent"
                  }`}
                >
                  {isDone ? (
                    <Check size={13} className="text-[#6FFFE9]" strokeWidth={3} />
                  ) : (
                    <span
                      className={`text-[11px] font-bold leading-none ${
                        isActive ? "text-white" : "text-zinc-700"
                      }`}
                    >
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Label — clickable if this is the active step with a href */}
                {isActive && step.href ? (
                  <Link href={step.href}>
                    <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-center leading-tight block text-[#6FFFE9] px-1">
                      {step.label}
                    </span>
                  </Link>
                ) : (
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-center leading-tight block px-1 ${
                      isDone
                        ? "text-zinc-600"
                        : isActive
                        ? "text-white"
                        : "text-zinc-700"
                    }`}
                  >
                    {step.label}
                  </span>
                )}

                {/* Status tag */}
                <span
                  className={`text-[8px] font-bold uppercase tracking-[2px] ${
                    isDone
                      ? "text-[#6FFFE9]/40"
                      : isActive
                      ? "text-white/40 animate-pulse"
                      : "text-zinc-800"
                  }`}
                >
                  {isDone ? "Done" : isActive ? "Next" : "Pending"}
                </span>
              </div>

              {/* Arrow connector */}
              {i < steps.length - 1 && (
                <div className="flex items-start pt-3 sm:pt-3.5 px-1 sm:px-2 flex-shrink-0">
                  <ArrowRight
                    size={13}
                    className={isDone ? "text-[#6FFFE9]/30" : "text-zinc-800"}
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
