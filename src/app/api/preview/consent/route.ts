import { NextResponse } from "next/server";

import { NO_STORE, previewSigningRoute } from "@/lib/preview-routes";

// Agreeing to the disclosure in a preview is not recorded anywhere.
export const POST = previewSigningRoute(() =>
  NextResponse.json(
    { consentedAt: Math.floor(Date.now() / 1000) },
    { headers: NO_STORE },
  ),
);
