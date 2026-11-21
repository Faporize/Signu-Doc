import assert from "node:assert/strict";
import { test } from "node:test";

import {
  sortInReadingOrder,
  startStep,
  stepAfter,
  stepBefore,
} from "./signing-guide.ts";

test("fields are walked page by page, top to bottom, then left to right", () => {
  const ordered = sortInReadingOrder([
    { id: "d", page: 2, x: 0.1, y: 0.1 },
    { id: "c", page: 1, x: 0.5, y: 0.6 },
    { id: "b", page: 1, x: 0.5, y: 0.2 },
    { id: "a", page: 1, x: 0.1, y: 0.2 },
  ]);

  assert.deepEqual(
    ordered.map((field) => field.id),
    ["a", "b", "c", "d"],
  );
});

test("sorting does not change the list it is given", () => {
  const fields = [
    { page: 2, x: 0, y: 0 },
    { page: 1, x: 0, y: 0 },
  ];

  sortInReadingOrder(fields);

  assert.equal(fields[0]!.page, 2);
});

test("Start goes to the first step with no answer", () => {
  assert.equal(startStep([true, true, false, false]), 2);
  assert.equal(startStep([false, true]), 0);
});

test("Start goes to the first step when everything is answered", () => {
  assert.equal(startStep([true, true, true]), 0);
  assert.equal(startStep([]), 0);
});

test("Next goes to the following step", () => {
  assert.equal(stepAfter(0, 4, []), 1);
  assert.equal(stepAfter(2, 4, [0]), 3);
});

test("Next from the last step goes back to what still blocks finishing", () => {
  assert.equal(stepAfter(3, 4, [1, 2]), 1);
});

test("Next from the last step stays put when nothing blocks finishing", () => {
  assert.equal(stepAfter(3, 4, []), null);
  assert.equal(stepAfter(0, 1, []), null);
});

test("Previous goes back one step and stops at the first", () => {
  assert.equal(stepBefore(3), 2);
  assert.equal(stepBefore(0), 0);
});
