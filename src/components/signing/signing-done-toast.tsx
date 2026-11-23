"use client";

import { useEffect, useState } from "react";

/**
 * A short confirmation that appears when signing has just finished, then
 * leaves by itself. The page behind it says the same in full.
 */
export function SigningDoneToast({ message = "Document signed" }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 6000);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-6 z-40 flex justify-center motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:inset-x-auto sm:right-6"
      role="status"
    >
      <p className="flex items-center gap-4 rounded-lg bg-[#323a45] py-3.5 pl-6 pr-3.5 text-base font-medium text-white shadow-[0_12px_40px_rgba(15,23,42,0.35)]">
        {message}
        <span
          aria-hidden="true"
          className="inline-flex size-10 items-center justify-center rounded-full bg-[#4dba87]"
        >
          <svg
            className="size-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M5 12.5L10 17.5L19 7.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
          </svg>
        </span>
      </p>
    </div>
  );
}
