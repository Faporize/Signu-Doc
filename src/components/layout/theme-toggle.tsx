"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

function readTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributeFilter: ["data-theme"],
    attributes: true,
  });

  return () => observer.disconnect();
}

/** Switches between the light and dark theme and remembers the choice. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");
  const next: Theme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className={`btn-quiet size-10 shrink-0 px-0 ${className}`}
      onClick={() => {
        document.documentElement.dataset.theme = next;

        try {
          localStorage.setItem("theme", next);
        } catch {
          // Private mode: the choice just lasts until the page closes.
        }
      }}
    >
      {theme === "dark" ? (
        <Sun
          className="size-4"
          absoluteStrokeWidth
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="size-4"
          absoluteStrokeWidth
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
