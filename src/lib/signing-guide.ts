// The order a signer is walked through the fields they have to answer, and
// where Start, Next and Previous take them. Pure, so it can be tested.

export type StepField = {
  page: number;
  x: number;
  y: number;
};

/** Fields in the order a person reads the document: page by page, top to bottom, left to right. */
export function sortInReadingOrder<T extends StepField>(
  fields: readonly T[],
): T[] {
  return [...fields].sort(
    (first, second) =>
      first.page - second.page || first.y - second.y || first.x - second.x,
  );
}

/**
 * Where Start goes: the first step that has no answer yet, or the first step
 * when everything is already answered.
 */
export function startStep(answered: readonly boolean[]): number {
  const index = answered.findIndex((isAnswered) => !isAnswered);

  return index === -1 ? 0 : index;
}

/**
 * Where Next goes from the current step: the one after it. From the last
 * step it goes back to the first step that still blocks finishing, or stays
 * (null) when nothing is left.
 */
export function stepAfter(
  current: number,
  total: number,
  blockedSteps: readonly number[],
): number | null {
  if (current < total - 1) {
    return current + 1;
  }

  return blockedSteps.length > 0 ? blockedSteps[0]! : null;
}

/** Where Previous goes from the current step: the one before it, never before the first. */
export function stepBefore(current: number): number {
  return Math.max(0, current - 1);
}
