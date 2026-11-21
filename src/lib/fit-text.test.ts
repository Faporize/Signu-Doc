import assert from "node:assert/strict";
import { test } from "node:test";

import { fitFontSize } from "./fit-text.ts";

test("short text in a wide box is limited by the box height", () => {
  // 100 px wide text at 100 px, so 10 px wide at 10 px; the box is roomy.
  const size = fitFontSize({
    boxHeight: 30,
    boxWidth: 300,
    widthAt100: 100,
  });

  assert.equal(size, 19.2); // 30 * 0.64
});

test("long text shrinks until it fits the width", () => {
  // The text is 1,000 px wide at 100 px, so it is 100 px wide at 10 px.
  const size = fitFontSize({
    boxHeight: 40,
    boxWidth: 108,
    widthAt100: 1000,
  });

  assert.equal(size, 10); // (108 - 8) / 1000 * 100
});

test("the text always fits its box when the size is not at the floor", () => {
  for (const widthAt100 of [180, 640, 1500]) {
    const boxWidth = 120;
    const paddingX = 4;
    const size = fitFontSize({
      boxHeight: 60,
      boxWidth,
      paddingX,
      widthAt100,
    });
    const drawnWidth = (widthAt100 * size) / 100;

    assert.ok(drawnWidth <= boxWidth - paddingX * 2 + 0.5, String(widthAt100));
  }
});

test("a typed signature is allowed more of the box height than an answer", () => {
  const answer = fitFontSize({ boxHeight: 50, boxWidth: 500, widthAt100: 200 });
  const signature = fitFontSize({
    boxHeight: 50,
    boxWidth: 500,
    heightRatio: 0.9,
    widthAt100: 200,
  });

  assert.ok(signature > answer);
});

test("it never goes below the smallest size or above the largest", () => {
  assert.equal(
    fitFontSize({ boxHeight: 40, boxWidth: 30, widthAt100: 5000, minPx: 7 }),
    7,
  );
  assert.equal(
    fitFontSize({ boxHeight: 900, boxWidth: 9000, widthAt100: 50, maxPx: 40 }),
    40,
  );
});

test("a box with no size yet, or empty text, gives the smallest size", () => {
  assert.equal(fitFontSize({ boxHeight: 0, boxWidth: 0, widthAt100: 100 }), 6);
  assert.equal(fitFontSize({ boxHeight: 20, boxWidth: 100, widthAt100: 0 }), 6);
});
