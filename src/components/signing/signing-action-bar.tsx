"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { ShellButton } from "@/components/shared/form-shell";

type SigningActionBarProps = {
  /** Problems with what was entered, shown above the buttons. */
  alerts: readonly string[];
  canFinish: boolean;
  finishDisabled: boolean;
  /** Whether there is anything to be walked through at all. */
  hasSteps: boolean;
  isStarted: boolean;
  onFinish: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onStart: () => void;
  /** How many required fields are still unanswered. */
  remaining: number;
  /** Set once started: the step the signer is on. */
  progress: { current: number; label: string; total: number } | null;
  /** Page controls, for a document with more than one page. */
  pages: {
    active: number;
    count: number;
    onNext: () => void;
    onPrevious: () => void;
  } | null;
};

/**
 * The only controls a signer needs, fixed to the bottom of the screen: Start,
 * then Previous and Next to move between the places they have to sign or fill
 * in, and Finish once everything is done.
 */
export function SigningActionBar({
  alerts,
  canFinish,
  finishDisabled,
  hasSteps,
  isStarted,
  onFinish,
  onNext,
  onPrevious,
  onStart,
  pages,
  progress,
  remaining,
}: SigningActionBarProps) {
  // Finish takes the main place once nothing is left to do.
  const finishIsPrimary = canFinish || !hasSteps;
  const status =
    remaining > 0
      ? `${remaining} required remaining`
      : "All required fields complete";
  const caption = progress
    ? `${progress.current} of ${progress.total} · ${progress.label} · ${status}`
    : status;

  return (
    <>
      {/* On a computer the count of what is left sits at the top right. */}
      {remaining > 0 ? (
        <p className="pointer-events-none fixed right-5 top-[6.5rem] z-30 hidden items-center gap-2 rounded-lg border border-(--border-strong) bg-white/95 px-3 py-1.5 text-[0.8125rem] font-semibold text-(--secondary) shadow-sm md:flex">
          To go
          <span className="inline-flex min-w-6 justify-center rounded-md bg-(--accent) px-1.5 py-0.5 text-xs font-bold text-white">
            {remaining}
          </span>
        </p>
      ) : null}

      <div
        aria-label="Signing controls"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-(--border-strong) bg-[rgba(255,255,255,0.94)] pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md md:inset-x-auto md:bottom-6 md:left-1/2 md:w-max md:max-w-[calc(100vw-2rem)] md:-translate-x-1/2 md:rounded-2xl md:border-0 md:bg-[#2f3640] md:p-2 md:text-white md:shadow-[0_12px_40px_rgba(15,23,42,0.35)]"
        role="region"
      >
        <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2 px-4 pt-2.5 md:max-w-none md:flex-row md:items-center md:gap-3 md:p-0">
          {alerts.length > 0 ? (
            <div className="grid gap-1 md:basis-full" role="alert">
              {alerts.map((alert) => (
                <p
                  className="text-[0.8125rem] font-semibold leading-5 text-(--danger) md:text-[#ffb4b4]"
                  key={alert}
                >
                  {alert}
                </p>
              ))}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 md:contents">
            {hasSteps || remaining > 0 ? (
              <p
                aria-live="polite"
                className="min-w-0 flex-1 text-left text-[0.8125rem] font-semibold leading-5 text-(--secondary) md:order-2 md:max-w-72 md:flex-none md:text-white/80"
              >
                {caption}
              </p>
            ) : null}

            {pages ? (
              <div className="flex shrink-0 items-center gap-1.5 md:order-1 md:gap-2">
                <button
                  aria-label="Previous page"
                  className="btn-quiet size-9 px-0 pointer-coarse:size-10 md:bg-white/10! md:text-white! md:hover:bg-white/20!"
                  disabled={pages.active === 1}
                  onClick={pages.onPrevious}
                  type="button"
                >
                  <ChevronLeftIcon className="size-4" />
                </button>
                <p className="min-w-8 text-center text-[0.8125rem] font-bold text-(--secondary) md:min-w-0 md:text-white/80">
                  <span className="md:hidden">{`${pages.active}/${pages.count}`}</span>
                  <span className="hidden md:inline">{`Page ${pages.active} of ${pages.count}`}</span>
                </p>
                <button
                  aria-label="Next page"
                  className="btn-quiet size-9 px-0 pointer-coarse:size-10 md:bg-white/10! md:text-white! md:hover:bg-white/20!"
                  disabled={pages.active === pages.count}
                  onClick={pages.onNext}
                  type="button"
                >
                  <ChevronRightIcon className="size-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-stretch gap-2">
            {isStarted ? (
              <ShellButton
                className="min-h-12 w-12 shrink-0 px-0"
                onClick={onPrevious}
                variant="secondary"
              >
                <ChevronLeftIcon aria-hidden="true" className="size-5" />
                <span className="sr-only">Previous</span>
              </ShellButton>
            ) : null}

            {hasSteps ? (
              <ShellButton
                className="min-h-12 flex-1 md:min-w-28"
                onClick={isStarted ? onNext : onStart}
                variant={finishIsPrimary ? "secondary" : "primary"}
              >
                {isStarted ? "Next" : "Start"}
              </ShellButton>
            ) : null}

            <ShellButton
              className="min-h-12 flex-1 md:min-w-28"
              disabled={finishDisabled}
              onClick={onFinish}
              variant={finishIsPrimary ? "primary" : "secondary"}
            >
              Finish
            </ShellButton>
          </div>
        </div>
      </div>
    </>
  );
}
