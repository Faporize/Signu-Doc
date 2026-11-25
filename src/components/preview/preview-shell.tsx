"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FieldShell, ShellButton } from "@/components/shared/form-shell";
import { PageHeader } from "@/components/shared/page-header";
import {
  type PreviewSettings,
  previewSettingsQuery,
} from "@/lib/preview-settings";

type PreviewShellProps = {
  settings: PreviewSettings;
};

/**
 * The Preview tab: type in who is signing and who it is from, then edit the
 * fields on a sample document or try signing it, on this device, as a client
 * would. Nothing is saved to a real document or sent.
 */
export function PreviewShell({ settings: initial }: PreviewShellProps) {
  const router = useRouter();
  const [settings, setSettings] = useState(initial);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const query = previewSettingsQuery(settings);

  function set<K extends keyof PreviewSettings>(
    key: K,
    value: PreviewSettings[K],
  ) {
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function resetFields() {
    if (isResetting) {
      return;
    }

    setResetError(null);
    setIsResetting(true);

    try {
      const response = await fetch("/api/preview/fields", { method: "DELETE" });

      if (!response.ok) {
        setResetError("Unable to put the sample fields back.");
        return;
      }

      router.refresh();
    } catch {
      setResetError("Unable to put the sample fields back.");
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        description="See what your clients see when they sign, on a sample document. Nothing here is saved to a real document or sent to anyone."
        title="Preview"
      />

      <section
        className="panel space-y-6 p-5 sm:p-7"
        data-animate="enter"
        data-animate-delay="1"
      >
        <div className="space-y-1">
          <h2 className="text-lg font-extrabold text-(--fg)">Who is signing</h2>
          <p className="text-sm leading-6 text-(--secondary)">
            These fill in the name, the signature and the agreement text, so you
            can see how a long or short name looks.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldShell
            autoComplete="off"
            label="Signer name"
            maxLength={120}
            onChange={(event) => set("signerName", event.target.value)}
            readOnly={false}
            value={settings.signerName}
          />
          <FieldShell
            autoComplete="off"
            ignorePasswordManagers
            label="Signer email"
            onChange={(event) => set("signerEmail", event.target.value)}
            readOnly={false}
            type="email"
            value={settings.signerEmail}
          />
          <FieldShell
            autoComplete="off"
            label="From (sender name)"
            maxLength={120}
            onChange={(event) => set("senderName", event.target.value)}
            readOnly={false}
            value={settings.senderName}
          />
          <FieldShell
            autoComplete="off"
            label="Document title"
            maxLength={120}
            onChange={(event) => set("title", event.target.value)}
            readOnly={false}
            value={settings.title}
          />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-(--secondary)">
          <input
            checked={settings.consent}
            className="size-4 shrink-0 cursor-pointer accent-(--accent)"
            onChange={(event) => set("consent", event.target.checked)}
            type="checkbox"
          />
          Show the agreement screen first
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ShellButton href={`/preview/sign?${query}`}>
            Preview signing
          </ShellButton>
          <ShellButton href={`/preview/edit?${query}`} variant="secondary">
            Edit the sample fields
          </ShellButton>
          <ShellButton
            loading={isResetting}
            onClick={() => void resetFields()}
            variant="ghost"
          >
            Put the sample fields back
          </ShellButton>
        </div>

        {resetError ? (
          <div className="notice notice-danger" role="alert">
            <p>{resetError}</p>
          </div>
        ) : null}

        <p className="text-sm leading-6 text-(--tertiary)">
          Open this page on your phone to see the phone version, and on a
          computer to see the computer version. The fields you place are kept,
          so after each update you can come back and try signing again.
        </p>
      </section>
    </div>
  );
}
