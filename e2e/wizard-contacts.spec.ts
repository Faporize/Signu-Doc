import { expect, test } from "@playwright/test";

import { signInAsAdministrator } from "./support/admin-session";
import { writeSamplePdf } from "./support/sample-pdf";

// Runs after signing-flow.spec.ts, which sets up the install and its
// administrator.

test("saved contacts fill signers and copy recipients, and one email can sign twice", async ({
  page,
}, testInfo) => {
  const suffix = `${String(Date.now())}${String(testInfo.retry)}`;
  const email = `family-${suffix}@example.test`;
  const copyEmail = `copy-${suffix}@example.test`;

  await signInAsAdministrator(page);

  // Two names on one address, and someone for copies, in the address book.
  await page.goto("/contacts");
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

  for (const [name, address] of [
    [`Alex Smith ${suffix}`, email],
    [`Sam Smith ${suffix}`, email],
    [`Casey Copy ${suffix}`, copyEmail],
  ] as const) {
    await page.getByRole("button", { name: "Add contact" }).click();
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Email").fill(address);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  }

  // The same name and address twice is refused.
  await page.getByRole("button", { name: "Add contact" }).click();
  await page.getByLabel("Name").fill(`alex  smith ${suffix}`);
  await page.getByLabel("Email").fill(email.toUpperCase());
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("alert")).toContainText("already saved");
  await page.getByRole("button", { name: "Cancel" }).click();

  // Search narrows the list.
  await page.getByLabel("Search contacts").fill(`casey copy ${suffix}`);
  await expect(page.getByText(`Alex Smith ${suffix}`)).toHaveCount(0);
  await expect(page.getByText(`Casey Copy ${suffix}`)).toBeVisible();

  // Start an envelope and fill the people from the list.
  const pdfPath = await writeSamplePdf(testInfo.outputPath("contacts.pdf"));

  await page.goto("/envelopes/new");
  await page.getByLabel("Envelope title").fill(`Contacts ${suffix}`);
  await page.getByLabel("Upload PDF").setInputFiles(pdfPath);
  await page.getByRole("button", { name: "Next ->" }).click();
  await expect(page).toHaveURL(/\/envelopes\/[^/]+\/signers$/);

  await page
    .getByRole("button", { name: "Choose signer 1 from your contacts" })
    .click();
  await page.getByRole("button", { name: `Alex Smith ${suffix}` }).click();
  await expect(page.getByLabel("Signer 1 name")).toHaveValue(
    `Alex Smith ${suffix}`,
  );
  await expect(page.getByLabel("Signer 1 email")).toHaveValue(email);

  await page.getByRole("button", { name: "+ Add another signer" }).click();
  await page
    .getByRole("button", { name: "Choose signer 2 from your contacts" })
    .click();
  await page.getByRole("button", { name: `Sam Smith ${suffix}` }).click();
  await expect(page.getByLabel("Signer 2 email")).toHaveValue(email);

  // No duplicate warning: the names differ.
  await expect(page.getByText("already listed")).toHaveCount(0);

  await page.getByRole("button", { name: "+ Add a copy recipient" }).click();
  await page
    .getByRole("button", { name: "Choose copy recipient 1 from your contacts" })
    .click();
  await page.getByRole("button", { name: `Casey Copy ${suffix}` }).click();
  await expect(page.getByLabel("Copy recipient 1 email")).toHaveValue(
    copyEmail,
  );

  // The same name and address twice is flagged.
  await page.getByLabel("Signer 2 name").fill(`alex smith ${suffix}`);
  await page.getByLabel("Signer 2 name").blur();
  await expect(page.getByText("already listed").first()).toBeVisible();
  await page.getByLabel("Signer 2 name").fill(`Sam Smith ${suffix}`);

  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page).toHaveURL(/\/envelopes\/[^/]+\/prepare$/);
});
