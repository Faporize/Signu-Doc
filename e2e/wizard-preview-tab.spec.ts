import { expect, test } from "@playwright/test";

import { signInAsAdministrator } from "./support/admin-session";

// Runs after signing-flow.spec.ts, which sets up the install and its
// administrator.

test("the Preview tab lets a sender try signing a sample document, and nothing is sent", async ({
  page,
}) => {
  await signInAsAdministrator(page);

  // The tab is in the top menu.
  await page.goto("/dashboard");
  await page
    .getByRole("link", { name: "Preview", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/preview$/);
  await expect(
    page.getByRole("heading", { name: "Preview", level: 1 }),
  ).toBeVisible();

  // Start from a sample with only a signature, so the walk-through is short.
  const saved = await page.request.put("/api/preview/fields", {
    data: {
      fields: [
        {
          height: 0.07,
          id: "sig",
          page: 1,
          required: true,
          signerId: "preview-signer",
          type: "signature",
          width: 0.3,
          x: 0.1,
          y: 0.5,
        },
      ],
    },
  });

  expect(saved.ok()).toBe(true);

  // A long name, typed in, comes out the other end.
  await page.reload();
  await page.getByLabel("Signer name").fill("Alexandra Montgomery-Wellington");
  await page.getByLabel("Document title").fill("Loan estimate");
  await page.getByRole("link", { name: "Preview signing" }).click();
  await expect(page).toHaveURL(/\/preview\/sign\?/);
  await expect(
    page.getByText("Preview: nothing here is saved or sent."),
  ).toBeVisible();

  // The agreement comes first, as for a client.
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Agree and continue" }).click();
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Apply signature" })
    .click();

  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await page.getByRole("button", { name: "Finish signing" }).click();

  await expect(page).toHaveURL(/\/preview\/done$/);
  await expect(page.getByText("Document signed")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to Preview" }),
  ).toBeVisible();

  // The sample document can be edited with the real editor.
  await page.goto("/preview/edit");
  await expect(
    page.getByRole("button", { name: "Preview signing →" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Rendered PDF page 1" }),
  ).toBeVisible();

  // And put back as it was.
  await page.goto("/preview");
  await page
    .getByRole("button", { name: "Put the sample fields back" })
    .click();
  await expect
    .poll(async () => {
      const response = await page.request.put("/api/preview/fields", {
        data: { fields: [] },
      });

      return response.ok();
    })
    .toBe(true);
  await page.request.delete("/api/preview/fields");
});

test("the Preview tab fits a phone screen", async ({ page }) => {
  await signInAsAdministrator(page);
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/preview");

  await expect(
    page.getByRole("link", { name: "Preview signing" }),
  ).toBeVisible();

  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );

  expect(overflow).toBeLessThanOrEqual(0);
});
