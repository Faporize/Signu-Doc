import assert from "node:assert/strict";
import { test } from "node:test";

import {
  formatLocalSigningDate,
  formatLocalSigningDateSafely,
  formatLocalSigningTimestamp,
  formatLocalSigningTimestampSafely,
} from "./local-signing-date.ts";
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

test("a small box still carries the date, which shrinks to fit", () => {
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 24, widthPt: 300 }),
    "below",
  );
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 40, widthPt: 40 }),
    "below",
  );
  assert.equal(
    chooseSignatureDateLayout({ heightPt: 6, widthPt: 20 }),
    "below",
  );
});

test("only a box with no area, or a broken one, has no date", () => {
  assert.equal(chooseSignatureDateLayout({ heightPt: 0, widthPt: 0 }), null);
  assert.equal(chooseSignatureDateLayout({ heightPt: 40, widthPt: 0 }), null);
  assert.equal(
    chooseSignatureDateLayout({ heightPt: Number.NaN, widthPt: 90 }),
    null,
  );
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

test("the safe date matches the plain one for a real clock", () => {
  assert.equal(
    formatLocalSigningDateSafely(1_800_000_000, 480),
    formatLocalSigningDate(1_800_000_000, 480),
  );
});

test("an odd stored value leaves out the date instead of throwing", () => {
  for (const [moment, offset] of [
    [1_800_000_000, undefined],
    [1_800_000_000, null],
    [1_800_000_000, "480"],
    [1_800_000_000, Number.NaN],
    [1_800_000_000, 481.5],
    [1_800_000_000, 5000],
    [1_800_000_000, 1e12],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [1e20, 0],
    [undefined, 0],
  ] as const) {
    assert.equal(
      formatLocalSigningDateSafely(moment, offset),
      null,
      `${String(moment)} / ${String(offset)}`,
    );
  }
});

test("the stamp under a signature is the signer's own day and time, with no zone", () => {
  // 7:58:20 am on 15 January in UTC is the evening of the 14th in California.
  const moment = 1_799_999_900;

  assert.equal(formatLocalSigningTimestamp(moment, 480), "1/14/27 11:58:20 PM");
  assert.equal(formatLocalSigningTimestamp(moment, 0), "1/15/27 7:58:20 AM");
  assert.doesNotMatch(
    formatLocalSigningTimestamp(moment, 480),
    /UTC|GMT|EST|PST|CST|MST|,/,
  );
  assert.equal(
    formatLocalSigningTimestampSafely(moment, 480),
    "1/14/27 11:58:20 PM",
  );
  assert.equal(formatLocalSigningTimestampSafely(moment, 1e12), null);
  assert.equal(formatLocalSigningTimestampSafely(moment, undefined), null);
});
