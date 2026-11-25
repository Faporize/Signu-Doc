import { NextResponse } from "next/server";

import { NO_STORE, previewSigningRoute } from "@/lib/preview-routes";

// A real signing checks that a typed answer fits its box. In a preview every
// answer is accepted; the box still shrinks the text to fit.
export const POST = previewSigningRoute(() =>
  NextResponse.json({ fits: true }, { headers: NO_STORE }),
);
