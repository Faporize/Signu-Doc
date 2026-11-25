import { PrepareLiveShell } from "@/components/envelopes/prepare-live-shell";
import { getAuthSession } from "@/lib/auth/server";
import { getDb } from "@/lib/db/connection";
import type { PrepareEnvelopeData } from "@/lib/envelopes";
import { readPreviewLayout } from "@/lib/preview-layout";
import { PREVIEW_PAGES, PREVIEW_SIGNER_ID } from "@/lib/preview-sample";
import {
  previewSettingsQuery,
  readPreviewSettings,
} from "@/lib/preview-settings";

type PreviewEditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// The sample document, where a sender places fields to see how they look and
// work when a client signs. It is the same editor as for a real document.
export default async function PreviewEditPage({
  searchParams,
}: PreviewEditPageProps) {
  const session = await getAuthSession();
  const defaultSender =
    session?.user.name?.trim() || session?.user.email || "Sender";
  const settings = readPreviewSettings(await searchParams, defaultSender);
  let record: PrepareEnvelopeData | undefined;
  let initialState: "error" | undefined;

  try {
    const layout = session
      ? await readPreviewLayout(session.user.id, getDb())
      : null;

    if (layout) {
      record = {
        envelopeId: "preview",
        fields: layout.fields.map((field) => ({
          ...field,
          createdAt: 0,
          updatedAt: 0,
        })),
        fieldsRevision: layout.revision,
        pageCount: PREVIEW_PAGES.length,
        pages: PREVIEW_PAGES,
        pdfUrl: "/api/preview/document",
        signers: [
          {
            email: settings.signerEmail,
            id: PREVIEW_SIGNER_ID,
            name: settings.signerName,
            order: 1,
            step: 1,
          },
        ],
        status: "draft",
        title: "Sample document",
      };
    }
  } catch {
    initialState = "error";
  }

  const query = previewSettingsQuery(settings);

  return (
    <PrepareLiveShell
      envelopeId="preview"
      initialState={initialState}
      preview={{
        backHref: `/preview?${query}`,
        backLabel: "Preview",
        fieldsUrl: "/api/preview/fields",
        nextHref: `/preview/sign?${query}`,
        stepLabel: "Preview editor",
      }}
      record={record}
    />
  );
}
