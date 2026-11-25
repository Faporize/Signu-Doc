import { type DbExecutor, getDb } from "./db/connection.ts";
import {
  buildDisclosureSections,
  CONSENT_STATEMENT,
  getDisclosureVersion,
  normalizeCustomDisclosure,
} from "./electronic-records-disclosure.ts";
import type { PreviewLayout } from "./preview-layout.ts";
import { PREVIEW_PAGES, PREVIEW_SIGNER_ID } from "./preview-sample.ts";
import type { PreviewSettings } from "./preview-settings.ts";
import {
  signingPayloadSchema,
  type SigningPayload,
} from "./schemas/signing.ts";
import { readStoredSettings, resolveSettings } from "./settings.ts";

/**
 * The signing page for the sample document, filled in like one for a real
 * signing link but pointing at the preview's own endpoints. The wording of
 * the disclosure is the install's own, so a change to it shows here too.
 */
export async function buildPreviewSigningPayload(input: {
  contactAddress: string;
  database?: DbExecutor;
  layout: PreviewLayout;
  settings: PreviewSettings;
}): Promise<SigningPayload> {
  const { layout, settings } = input;
  const stored = resolveSettings(
    await readStoredSettings(input.database ?? getDb()),
  );
  const customDisclosure = normalizeCustomDisclosure(stored.consentDisclosure);

  return signingPayloadSchema.parse({
    consentUrl: "/api/preview/consent",
    consentedAt: settings.consent ? null : Math.floor(Date.now() / 1000),
    currentSignerFields: layout.fields.map((field) => ({
      groupId: field.groupId,
      height: field.height,
      id: field.id,
      label: field.label,
      options: field.options,
      page: field.page,
      required: field.required,
      signerId: PREVIEW_SIGNER_ID,
      signerName: settings.signerName,
      type: field.type,
      width: field.width,
      x: field.x,
      y: field.y,
    })),
    declineUrl: "/api/preview/decline",
    disclosure: {
      sections: buildDisclosureSections(
        {
          contactAddress: stored.supportAddress ?? input.contactAddress,
          senderName: settings.senderName,
        },
        customDisclosure,
      ),
      statement: CONSENT_STATEMENT,
      version: getDisclosureVersion(customDisclosure),
    },
    documentUrl: "/api/preview/document",
    envelopeId: "preview",
    envelopeTitle: settings.title,
    fieldFitUrl: "/api/preview/fit",
    pageCount: PREVIEW_PAGES.length,
    pages: PREVIEW_PAGES,
    senderName: settings.senderName,
    signer: {
      email: settings.signerEmail,
      id: PREVIEW_SIGNER_ID,
      name: settings.signerName,
      order: 1,
    },
    state: "ready",
    submitUrl: "/api/preview/submit",
    visibleFields: [],
  });
}
