import assert from "node:assert/strict";
import { test } from "node:test";

import { type Branding } from "../branding.ts";
import { DEFAULT_BRAND_COLOR } from "../brand-color.ts";
import { buildEmailButton } from "./email-button.ts";
import { buildSigningInvitationEmail } from "./signing-invitation-email.ts";

const branding: Branding = {
  brandColor: null,
  contactUrl: null,
  hosted: false,
  logoUrl: null,
  organizationName: "Acme Corp",
  privacyUrl: null,
  productName: "Acme Corp",
  signupAvailable: true,
  supportAddress: null,
  termsUrl: null,
};

test("the button links to the signing page and uses the default color", () => {
  const html = buildEmailButton({
    branding,
    label: "Review and sign",
    url: "https://sign.acme.com/sign/abc123",
  });

  assert.match(html, /href="https:\/\/sign\.acme\.com\/sign\/abc123"/);
  assert.ok(html.includes(`bgcolor="${DEFAULT_BRAND_COLOR}"`));
  assert.ok(html.includes(">Review and sign</a>"));
});

test("the button follows the install's own color", () => {
  const html = buildEmailButton({
    branding: { ...branding, brandColor: "#1a73e8" },
    label: "Review and sign",
    url: "https://sign.acme.com/sign/abc123",
  });

  assert.ok(!html.includes(DEFAULT_BRAND_COLOR));
  assert.match(html, /bgcolor="#[0-9a-f]{6}"/);
});

test("a hostile link or label cannot break out of the markup", () => {
  const html = buildEmailButton({
    branding,
    label: '<script>alert("x")</script>',
    url: 'https://sign.acme.com/"><script>alert(1)</script>',
  });

  assert.ok(!html.includes("<script>"));
});

test("the invitation email has the button and still carries the plain link", () => {
  const message = buildSigningInvitationEmail({
    branding,
    envelopeTitle: "Loan agreement",
    senderName: "Deion",
    signerEmail: "jane@example.com",
    signerName: "Jane",
    signingUrl: "https://sign.acme.com/sign/abc123",
  });

  const html = message.htmlBody ?? "";

  assert.ok(html.includes(">Review and sign</a>"));
  assert.ok(html.includes("https://sign.acme.com/sign/abc123"));
  assert.ok(message.textBody.includes("https://sign.acme.com/sign/abc123"));
});
