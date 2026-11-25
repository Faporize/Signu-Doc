import { emailSchema, nameSchema } from "./schemas/common.ts";

// What a sender types into the Preview tab to see their own words in the
// signing page: who is signing, who it is from, and what it is called.
export type PreviewSettings = {
  /** Show the screen where the signer agrees to sign electronically. */
  consent: boolean;
  senderName: string;
  signerEmail: string;
  signerName: string;
  title: string;
};

export const DEFAULT_PREVIEW_SETTINGS = {
  consent: true,
  signerEmail: "jane.borrower@example.com",
  signerName: "Jane Borrower",
  title: "Sample document",
} as const;

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Reads the settings from a page's address, falling back to the defaults. */
export function readPreviewSettings(
  params: SearchParams,
  defaultSenderName: string,
): PreviewSettings {
  const signerName = nameSchema.safeParse(first(params.name));
  const signerEmail = emailSchema.safeParse(first(params.email));
  const senderName = nameSchema.safeParse(first(params.sender));
  const title = nameSchema.safeParse(first(params.title));

  return {
    consent: first(params.consent) !== "0",
    senderName: senderName.success ? senderName.data : defaultSenderName,
    signerEmail: signerEmail.success
      ? signerEmail.data
      : DEFAULT_PREVIEW_SETTINGS.signerEmail,
    signerName: signerName.success
      ? signerName.data
      : DEFAULT_PREVIEW_SETTINGS.signerName,
    title: title.success ? title.data : DEFAULT_PREVIEW_SETTINGS.title,
  };
}

/** The same settings, as the query string that carries them. */
export function previewSettingsQuery(settings: PreviewSettings): string {
  const params = new URLSearchParams({
    email: settings.signerEmail,
    name: settings.signerName,
    sender: settings.senderName,
    title: settings.title,
  });

  if (!settings.consent) {
    params.set("consent", "0");
  }

  return params.toString();
}
