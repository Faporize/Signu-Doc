import Link from "next/link";

import { SigningShell } from "@/components/signing/signing-shell";
import { getAuthSession } from "@/lib/auth/server";
import { getDb } from "@/lib/db/connection";
import { readPreviewLayout } from "@/lib/preview-layout";
import {
  previewSettingsQuery,
  readPreviewSettings,
} from "@/lib/preview-settings";
import { buildPreviewSigningPayload } from "@/lib/preview-signing";

type PreviewSignPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// What a client sees when they open a signing link, built from the sample
// document and the sender's own fields. Signing it records and sends nothing.
export default async function PreviewSignPage({
  searchParams,
}: PreviewSignPageProps) {
  const session = await getAuthSession();
  const defaultSender =
    session?.user.name?.trim() || session?.user.email || "Sender";
  const settings = readPreviewSettings(await searchParams, defaultSender);
  const query = previewSettingsQuery(settings);
  const database = getDb();
  const layout = session
    ? await readPreviewLayout(session.user.id, database)
    : null;
  const record =
    session && layout
      ? await buildPreviewSigningPayload({
          contactAddress: session.user.email,
          database,
          layout,
          settings,
        })
      : null;

  return (
    <>
      <div
        aria-label="Preview notice"
        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-(--accent) px-4 py-2 text-[0.8125rem] font-semibold text-(--on-accent)"
        role="region"
      >
        <p>Preview: nothing here is saved or sent.</p>
        <p className="flex gap-4">
          <Link
            className="inline-flex min-h-8 items-center underline underline-offset-2"
            href={`/preview/edit?${query}`}
          >
            Edit fields
          </Link>
          <Link
            className="inline-flex min-h-8 items-center underline underline-offset-2"
            href={`/preview?${query}`}
          >
            Settings
          </Link>
        </p>
      </div>
      <SigningShell
        initialState={record ? undefined : "error"}
        record={record ?? undefined}
        token="preview"
      />
    </>
  );
}
