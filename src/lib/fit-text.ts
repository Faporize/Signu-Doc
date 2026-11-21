// The size a line of text should be drawn at to fill its box without being cut
// off. The finished PDF does the same in pdf-finalize.ts; this is the version
// for the signing page, so what a signer sees matches what is stamped.

export type FitFontSizeInput = {
  /** The width of the whole text when drawn at 100 pixels. */
  widthAt100: number;
  boxWidth: number;
  boxHeight: number;
  /** Room kept free on each side of the text, in pixels. */
  paddingX?: number;
  /**
   * The largest size as a share of the box height. A typed answer uses 0.64
   * and a typed signature 0.9, as the finished PDF does.
   */
  heightRatio?: number;
  /** The smallest size ever returned: below it text is cut off, not shrunk. */
  minPx?: number;
  maxPx?: number;
};

/**
 * The largest font size, in pixels, at which the text fits the box's width
 * and stays within its share of the box's height. Short text in a roomy box
 * comes out larger and long text smaller.
 */
export function fitFontSize({
  boxHeight,
  boxWidth,
  heightRatio = 0.64,
  maxPx = 96,
  minPx = 6,
  paddingX = 4,
  widthAt100,
}: FitFontSizeInput): number {
  const availableWidth = boxWidth - paddingX * 2;

  if (!(widthAt100 > 0) || !(availableWidth > 0) || !(boxHeight > 0)) {
    return minPx;
  }

  const byWidth = (availableWidth / widthAt100) * 100;
  const byHeight = boxHeight * heightRatio;
  const size = Math.min(byWidth, byHeight, maxPx);

  return Math.round(Math.max(size, minPx) * 10) / 10;
}
