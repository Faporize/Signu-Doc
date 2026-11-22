import { NextResponse } from "next/server";

import { requireVerifiedSenderSession } from "@/lib/auth/route-session";
import { ContactError, createContact, rememberContacts } from "@/lib/contacts";
import { getDb } from "@/lib/db/connection";
import { logRouteError } from "@/lib/security/logging";
import { getClientIpAddress, getRequestPathname } from "@/lib/security/request";

/**
 * Saves one contact, or with `{ contacts: [...] }` remembers several people
 * at once (the ones just used on an envelope), skipping any already saved.
 */
export async function POST(request: Request) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  const session = sessionResult;
  const body = (await request.json().catch(() => null)) as unknown;

  try {
    if (
      body &&
      typeof body === "object" &&
      "contacts" in body &&
      Array.isArray((body as { contacts: unknown }).contacts)
    ) {
      const result = await rememberContacts(session.user.id, body, getDb());

      return NextResponse.json(result, { status: 200 });
    }

    const contact = await createContact(session.user.id, body, getDb());

    return NextResponse.json({ contact }, { status: 201 });
  } catch (error) {
    if (error instanceof ContactError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    logRouteError(error, {
      category: "contact_save_failure",
      ipAddress: getClientIpAddress(request.headers),
      message: "Unexpected failure while saving a contact.",
      path: getRequestPathname(request),
      userId: session.user.id,
    });

    return NextResponse.json(
      { error: "Unable to save this contact." },
      { status: 500 },
    );
  }
}
