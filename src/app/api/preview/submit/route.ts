import { NextResponse } from "next/server";

import { NO_STORE, previewSigningRoute } from "@/lib/preview-routes";

// Finishing a preview records nothing and sends nothing.
export const POST = previewSigningRoute(() =>
  NextResponse.json(
    {
      envelopeId: "preview",
      redirectPath: "/preview/done",
      submittedAt: Math.floor(Date.now() / 1000),
    },
    { headers: NO_STORE },
  ),
);
