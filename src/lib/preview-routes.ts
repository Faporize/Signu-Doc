import { requireVerifiedSenderSession } from "./auth/route-session.ts";

// The signing page of the Preview tab talks to these instead of a signing
// link's own endpoints. They check the sender is signed in, answer as a real
// signing would, and keep or send nothing.

type Handler = (request: Request) => Response | Promise<Response>;

export function previewSigningRoute(handler: Handler) {
  return async function POST(request: Request) {
    const sessionResult = await requireVerifiedSenderSession(request);

    if (sessionResult instanceof Response) {
      return sessionResult;
    }

    return handler(request);
  };
}

export const NO_STORE = { "cache-control": "private, no-store" };
