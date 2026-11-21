import assert from "node:assert/strict";
import { test } from "node:test";

import { formatLocalSigningDate } from "./local-signing-date.ts";
import {
  chooseSignatureDateLayout,
  splitSignatureBox,
} from "./signature-date-layout.ts";

test("the date is the signer's own day, not the day in UTC", () => {
  // 9 pm on 21 November in California (UTC-8, so an offset of +480 minutes)
  // is 5 am on 22 November in UTC.
  const submittedAt = Date.UTC(2026, 10, 22, 5, 0, 0) / 1000;

  assert.equal(formatLocalSigningDate(submittedAt, 480), "November 21, 2026");
  assert.equal(formatLocalSigningDate(submittedAt, 0), "November 22, 2026");
});

test("a signer ahead of UTC gets their later day", () => {
  // 1 am on 22 November in Tokyo (UTC+9, offset -540) is 4 pm on the 21st in UTC.
  const submittedAt = Date.UTC(2026, 10, 21, 16, 0, 0) / 1000;

  assert.equal(formatLocalSigningDate(submittedAt, -540), "November 22, 2026");
});

test("no time zone is written next to the date", () => {
  const label = formatLocalSigningDate(1_800_000_000, 300);

  assert.doesNotMatch(label, /UTC|GMT|EST|PST|CST|MST|[+-]\d{2}:?\d{2}/);
});

test("a box with room puts the date underneath, however wide it is", () => {
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 55, widthPt: 147 }),
    "below",
  );
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 40, widthPt: 100 }),
    "below",
  );
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 40, widthPt: 350 }),
    "below",
  );
});

test("a box too short or too narrow for both gets no date", () => {
  assert.equal(chooseSignatureDateLayout({ heightPt: 24, widthPt: 300 }), null);
  assert.equal(chooseSignatureDateLayout({ heightPt: 40, widthPt: 40 }), null);
  assert.equal(chooseSignatureDateLayout({ heightPt: 0, widthPt: 0 }), null);
});

test("the date's part sits under the signature's part and they fill the box", () => {
  const box = { height: 50, width: 150, x: 10, y: 100 };
  const { date, signature } = splitSignatureBox(box);

  assert.equal(date.y, 100);
  assert.equal(signature.y, date.y + date.height);
  assert.equal(signature.height + date.height, box.height);
  assert.equal(signature.width, box.width);
  assert.equal(date.width, box.width);
});
