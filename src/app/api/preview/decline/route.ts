import { NextResponse } from "next/server";

import { NO_STORE, previewSigningRoute } from "@/lib/preview-routes";

// Declining in a preview notifies no one.
export const POST = previewSigningRoute(() =>
  NextResponse.json(
    {
      declinedAt: Math.floor(Date.now() / 1000),
      envelopeId: "preview",
      state: "declined",
    },
    { headers: NO_STORE },
  ),
);
