// Where the date goes inside a signature box. A signature is stamped with the
// day it was signed, so the sender need not place a separate date field:
// beside the signature in a wide box, underneath it otherwise, and left out
// when the box is too small to hold both. The signed PDF and the signing
// page use the same rules, so the preview matches the document.

export type SignatureDateLayout = "below" | "beside";

export type SignatureBox = {
  height: number;
  width: number;
  x: number;
  /** The bottom edge, as in a PDF page: y grows upward. */
  y: number;
};

/** The share of a box's height given to a date underneath the signature. */
export const SIGNATURE_DATE_BELOW_SHARE = 0.28;
/** The share of a box's width given to a date beside the signature. */
export const SIGNATURE_DATE_BESIDE_SHARE = 0.34;

/** How the date sits in a box of this size in points, or null for no room. */
export function chooseSignatureDateLayout(size: {
  heightPt: number;
  widthPt: number;
}): SignatureDateLayout | null {
  const { heightPt, widthPt } = size;

  if (!(heightPt > 0) || !(widthPt > 0)) {
    return null;
  }

  if (widthPt >= 110 && widthPt / heightPt >= 4.5) {
    return "beside";
  }

  if (heightPt >= 20 && widthPt >= 50) {
    return "below";
  }

  return null;
}

/** The signature's part of the box and the date's part, side by side or stacked. */
export function splitSignatureBox(
  box: SignatureBox,
  layout: SignatureDateLayout,
): { date: SignatureBox; signature: SignatureBox } {
  if (layout === "beside") {
    const dateWidth = box.width * SIGNATURE_DATE_BESIDE_SHARE;

    return {
      date: {
        height: box.height,
        width: dateWidth,
        x: box.x + box.width - dateWidth,
        y: box.y,
      },
      signature: { ...box, width: box.width - dateWidth },
    };
  }

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
