"use client";

import {
  type CSSProperties,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import { FitText } from "@/components/shared/fit-text";
import { ShellButton } from "@/components/shared/form-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// A phone-sized touch screen. A field on the document is only 15 to 30 pixels
// tall there, too small to hit, and a text box that narrow shows only the last
// few letters of what was typed.
const TOUCH_ENTRY_QUERY = "(pointer: coarse) and (max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(TOUCH_ENTRY_QUERY);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}

/** True on a phone-sized touch screen, where fields are filled in a sheet. */
export function useTouchEntry(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(TOUCH_ENTRY_QUERY).matches,
    () => false,
  );
}

type TouchFieldEntryProps = {
  /** The box's own look: its border and background colors. */
  boxClassName: string;
  /** Set when the answer is not acceptable; shown above the Done button. */
  error?: string | null;
  fieldId: string;
  frame: CSSProperties;
  kind: "dropdown" | "number" | "text";
  label: string;
  onChange: (value: string) => void;
  /** Called when the signer taps Done, so the guided flow can move on. */
  onConfirm?: () => void;
  /** Called once a guided step has opened the sheet. */
  onOpened?: () => void;
  /** Opens the sheet whenever this is set to a new number (a guided step). */
  openSignal?: number;
  options?: string[];
  placeholder: string;
  required?: boolean;
  value: string;
};

/**
 * A field on the document that opens a full-size entry sheet when tapped. The
 * box keeps its place and its shape; only the typing moves into the sheet.
 */
export function TouchFieldEntry({
  boxClassName,
  error = null,
  fieldId,
  frame,
  kind,
  label,
  onChange,
  onConfirm,
  onOpened,
  openSignal = 0,
  options = [],
  placeholder,
  required = false,
  value,
}: TouchFieldEntryProps) {
  const [open, setOpen] = useState(false);
  const [handledSignal, setHandledSignal] = useState(0);
  const shown = value.trim();

  // A new signal opens the sheet. It is read while drawing, not in an effect,
  // so the sheet is already open when this field first shows.
  if (openSignal > handledSignal) {
    setHandledSignal(openSignal);
    setOpen(true);
  }

  useEffect(() => {
    if (openSignal > 0) {
      onOpened?.();
    }
    // Only a new signal counts, not a new callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSignal]);

  function confirm() {
    setOpen(false);
    onConfirm?.();
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        aria-label={`${label}: ${shown || "empty"}`}
        className={`absolute z-2 overflow-hidden rounded-[0.375rem] border-2 text-left ${boxClassName}`}
        data-signing-field="true"
        id={`signing-field-${fieldId}`}
        onClick={() => setOpen(true)}
        style={frame}
        type="button"
      >
        <FitText
          align="start"
          className={shown ? "text-(--fg)" : "text-(--placeholder)"}
          paddingX={8}
          text={shown || placeholder}
        />
      </button>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] max-w-[600px] overflow-y-auto"
          showCloseButton={false}
        >
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              confirm();
            }}
          >
            <DialogHeader className="space-y-2">
              <DialogTitle>{label}</DialogTitle>
              <DialogDescription>
                {kind === "dropdown"
                  ? "Pick an answer from the list."
                  : kind === "number"
                    ? "Enter a number."
                    : "Type your answer."}
              </DialogDescription>
            </DialogHeader>

            {kind === "dropdown" ? (
              <select
                aria-label={label}
                className="field-input"
                onChange={(event) => onChange(event.target.value)}
                value={value}
              >
                <option value="">{required ? "Choose one" : "No answer"}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                aria-invalid={error ? true : undefined}
                aria-label={label}
                autoComplete="off"
                autoFocus
                className="field-input"
                inputMode={kind === "number" ? "decimal" : undefined}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                value={value}
              />
            )}

            {error ? (
              <p className="text-sm font-medium text-(--danger)" role="alert">
                {error}
              </p>
            ) : null}

            <ShellButton type="submit">Done</ShellButton>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
