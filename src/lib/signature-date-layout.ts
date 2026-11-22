// Where the date goes inside a signature box. A signature is stamped with the
// day it was signed, so the sender need not place a separate date field. The
// date sits underneath the signature, inside the signature's own box, at any
// size of box: both texts shrink to fit instead of the date being dropped.
// The signed PDF and the signing page use the same rules, so the preview
// matches the document.

export type SignatureDateLayout = "below";

export type SignatureBox = {
  height: number;
  width: number;
  x: number;
  /** The bottom edge, as in a PDF page: y grows upward. */
  y: number;
};

/** The share of a box's height given to the date underneath the signature. */
export const SIGNATURE_DATE_BELOW_SHARE = 0.3;

/**
 * Whether a box has a date underneath. Every box does, whatever its size: the
 * date is drawn in whatever part of the box is left for it, at a size that
 * fits. Only a box with no area at all (a corrupt field) has none.
 */
export function chooseSignatureDateLayout(size: {
  heightPt: number;
  widthPt: number;
}): SignatureDateLayout | null {
  const { heightPt, widthPt } = size;

  return Number.isFinite(heightPt) &&
    Number.isFinite(widthPt) &&
    heightPt > 0 &&
    widthPt > 0
    ? "below"
    : null;
}

/** The signature's part of the box and the date's part, under it. */
export function splitSignatureBox(box: SignatureBox): {
  date: SignatureBox;
  signature: SignatureBox;
} {
  const dateHeight = box.height * SIGNATURE_DATE_BELOW_SHARE;

  return {
    date: { height: dateHeight, width: box.width, x: box.x, y: box.y },
    signature: {
      ...box,
      height: box.height - dateHeight,
      y: box.y + dateHeight,
    },
  };
}
