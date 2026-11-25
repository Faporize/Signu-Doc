import { NextResponse } from "next/server";

import { requireVerifiedSenderSession } from "@/lib/auth/route-session";
import { getDb } from "@/lib/db/connection";
import {
  PreviewLayoutError,
  resetPreviewLayout,
  savePreviewLayout,
} from "@/lib/preview-layout";
import { logRouteError } from "@/lib/security/logging";
import { getClientIpAddress, getRequestPathname } from "@/lib/security/request";

/** Saves the fields placed on the sample document. */
export async function PUT(request: Request) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  const session = sessionResult;
  const body = (await request.json().catch(() => null)) as unknown;

  try {
    const layout = await savePreviewLayout(session.user.id, body, getDb());

    return NextResponse.json(
      {
        fields: layout.fields,
        fieldsRevision: layout.revision,
        redirectPath: "/preview/sign",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof PreviewLayoutError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logRouteError(error, {
      category: "preview_layout_failure",
      ipAddress: getClientIpAddress(request.headers),
      message: "Unexpected failure while saving the sample document.",
      path: getRequestPathname(request),
      userId: session.user.id,
    });

    return NextResponse.json(
      { error: "Unable to save the sample document." },
      { status: 500 },
    );
  }
}

/** Puts the default fields back. */
export async function DELETE(request: Request) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  await resetPreviewLayout(sessionResult.user.id, getDb());

  return NextResponse.json({ reset: true }, { status: 200 });
}
