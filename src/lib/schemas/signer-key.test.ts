import assert from "node:assert/strict";
import { test } from "node:test";

import {
  duplicateSignerEmailMessage,
  signerKey,
  signerListSchema,
} from "./signer.ts";

test("one email address can be listed twice under different names", () => {
  const parsed = signerListSchema.safeParse([
    { email: "family@example.com", name: "Alex Smith" },
    { email: "Family@Example.com", name: "Sam Smith" },
  ]);

  assert.equal(parsed.success, true);
});

test("the same name and email twice is still refused, whatever the case or spacing", () => {
  const parsed = signerListSchema.safeParse([
    { email: "family@example.com", name: "Alex Smith" },
    { email: "FAMILY@example.com", name: "  alex   SMITH " },
  ]);

  assert.equal(parsed.success, false);
  assert.equal(parsed.error?.issues[0]?.message, duplicateSignerEmailMessage);
  assert.deepEqual(parsed.error?.issues[0]?.path, [1, "email"]);
});

test("signerKey ignores case and extra spaces", () => {
  assert.equal(
    signerKey({ email: " A@b.co ", name: "Jo  Doe" }),
    signerKey({ email: "a@B.co", name: "jo doe" }),
  );
  assert.notEqual(
    signerKey({ email: "a@b.co", name: "Jo" }),
    signerKey({ email: "a@b.co", name: "Joe" }),
  );
});
