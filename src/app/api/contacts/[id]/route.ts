import { NextResponse } from "next/server";

import { requireVerifiedSenderSession } from "@/lib/auth/route-session";
import { ContactError, deleteContact, updateContact } from "@/lib/contacts";
import { getDb } from "@/lib/db/connection";
import { logRouteError } from "@/lib/security/logging";
import { getClientIpAddress, getRequestPathname } from "@/lib/security/request";

type ContactRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function handle(
  request: Request,
  context: ContactRouteContext,
  run: (userId: string, id: string, body: unknown) => Promise<Response>,
) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  const session = sessionResult;
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as unknown;

  try {
    return await run(session.user.id, id, body);
  } catch (error) {
    if (error instanceof ContactError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logRouteError(error, {
      category: "contact_change_failure",
      ipAddress: getClientIpAddress(request.headers),
      message: "Unexpected failure while changing a contact.",
      path: getRequestPathname(request),
      userId: session.user.id,
    });

    return NextResponse.json(
      { error: "Unable to change this contact." },
      { status: 500 },
    );
  }
}

export function PATCH(request: Request, context: ContactRouteContext) {
  return handle(request, context, async (userId, id, body) => {
    const contact = await updateContact(userId, id, body, getDb());

    return NextResponse.json({ contact }, { status: 200 });
  });
}

export function DELETE(request: Request, context: ContactRouteContext) {
  return handle(request, context, async (userId, id) => {
    await deleteContact(userId, id, getDb());

    return NextResponse.json({ deletedContactId: id }, { status: 200 });
  });
}
