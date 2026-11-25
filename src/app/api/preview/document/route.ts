import { requireVerifiedSenderSession } from "@/lib/auth/route-session";
import { buildPreviewPdf } from "@/lib/preview-sample";

// The sample document, the same for everyone, made when asked for.
export async function GET(request: Request) {
  const sessionResult = await requireVerifiedSenderSession(request);

  if (sessionResult instanceof Response) {
    return sessionResult;
  }

  const body = (await buildPreviewPdf()).slice().buffer as ArrayBuffer;

  return new Response(body, {
    headers: {
      "cache-control": "private, no-store",
      "content-disposition": `${
        new URL(request.url).searchParams.get("download") === "1"
          ? "attachment"
          : "inline"
      }; filename="sample-document.pdf"`,
      "content-type": "application/pdf",
      "x-content-type-options": "nosniff",
    },
  });
}
