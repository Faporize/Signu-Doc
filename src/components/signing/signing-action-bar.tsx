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
}: SigningActionBarProps) {
  // Finish takes the main place once nothing is left to do.
  const finishIsPrimary = canFinish || !hasSteps;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-(--border-strong) bg-[rgba(255,255,255,0.94)] pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[720px] flex-col gap-2 px-4 pt-3">
        {alerts.length > 0 ? (
          <div className="grid gap-1" role="alert">
            {alerts.map((alert) => (
              <p
                className="text-[0.8125rem] font-semibold leading-5 text-(--danger)"
                key={alert}
              >
                {alert}
              </p>
            ))}
          </div>
        ) : null}

        {pages ? (
          <div className="flex items-center justify-center gap-2">
            <button
              aria-label="Previous page"
              className="btn-quiet size-9 px-0"
              disabled={pages.active === 1}
              onClick={pages.onPrevious}
              type="button"
            >
              <ChevronLeftIcon className="size-4" />
            </button>
            <p className="min-w-[6.5rem] text-center text-[0.8125rem] font-bold text-(--secondary)">
              {`Page ${pages.active} of ${pages.count}`}
            </p>
            <button
              aria-label="Next page"
              className="btn-quiet size-9 px-0"
              disabled={pages.active === pages.count}
              onClick={pages.onNext}
              type="button"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>
        ) : null}

        {progress ? (
          <p
            aria-live="polite"
            className="text-center text-[0.8125rem] font-semibold text-(--secondary)"
          >
            {`${progress.current} of ${progress.total} · ${progress.label}`}
          </p>
        ) : null}

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
              className="min-h-12 flex-1"
              onClick={isStarted ? onNext : onStart}
              variant={finishIsPrimary ? "secondary" : "primary"}
            >
              {isStarted ? "Next" : "Start"}
            </ShellButton>
          ) : null}

          <ShellButton
            className="min-h-12 flex-1"
            disabled={finishDisabled}
            onClick={onFinish}
            variant={finishIsPrimary ? "primary" : "secondary"}
          >
            Finish
          </ShellButton>
        </div>
      </div>
    </div>
  );
}
