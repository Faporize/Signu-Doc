import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_PREVIEW_SETTINGS,
  previewSettingsQuery,
  readPreviewSettings,
} from "./preview-settings.ts";

test("with nothing in the address, the preview uses its sample signer and the sender's name", () => {
  const settings = readPreviewSettings({}, "Deion Au");

  assert.equal(settings.signerName, DEFAULT_PREVIEW_SETTINGS.signerName);
  assert.equal(settings.signerEmail, DEFAULT_PREVIEW_SETTINGS.signerEmail);
  assert.equal(settings.senderName, "Deion Au");
  assert.equal(settings.title, DEFAULT_PREVIEW_SETTINGS.title);
  assert.equal(settings.consent, true);
});

test("what is typed in comes back through the address", () => {
  const typed = {
    consent: false,
    senderName: "Saxton Mortgage",
    signerEmail: "pat@example.com",
    signerName: "Pat O'Brien-Smith",
    title: "Loan estimate & disclosures",
  };
  const params = Object.fromEntries(
    new URLSearchParams(previewSettingsQuery(typed)),
  );

  assert.deepEqual(readPreviewSettings(params, "Someone else"), typed);
});

test("a bad email or an empty name falls back instead of breaking the page", () => {
  const settings = readPreviewSettings(
    { email: "not an email", name: "   ", title: "x".repeat(500) },
    "Deion Au",
  );

  assert.equal(settings.signerEmail, DEFAULT_PREVIEW_SETTINGS.signerEmail);
  assert.equal(settings.signerName, DEFAULT_PREVIEW_SETTINGS.signerName);
  assert.equal(settings.title, DEFAULT_PREVIEW_SETTINGS.title);
});

test("only the first value of a repeated parameter counts", () => {
  assert.equal(
    readPreviewSettings({ name: ["Ann", "Bob"] }, "Deion Au").signerName,
    "Ann",
  );
});
