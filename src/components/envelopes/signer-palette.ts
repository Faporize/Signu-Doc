export type SignerPalette = {
  color: string;
  /** The same hue, dark enough for text on its tint (4.5:1). */
  ink: string;
  tint: string;
};

export function getSignerPalette(index: number): SignerPalette {
  if (index === 0) {
    return {
      color: "var(--signer-1)",
      ink: "var(--signer-1-ink)",
      tint: "var(--signer-1-tint)",
    };
  }

  if (index === 1) {
    return {
      color: "var(--signer-2)",
      ink: "var(--signer-2-ink)",
      tint: "var(--signer-2-tint)",
    };
  }

  if (index === 2) {
    return {
      color: "var(--signer-3)",
      ink: "var(--signer-3-ink)",
      tint: "var(--signer-3-tint)",
    };
  }

  return {
    color: "var(--signer-4)",
    ink: "var(--signer-4-ink)",
    tint: "var(--signer-4-tint)",
  };
}

/** The text color for a signer's color token, for text on its tint. */
export function signerInk(color: string): string {
  return color.replace(/\)$/, "-ink)");
}
