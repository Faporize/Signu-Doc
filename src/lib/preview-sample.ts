import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import type { FieldPlacement } from "./schemas/field.ts";

// The sample document behind the Preview tab. It is made on request, so it
// is never stored, and a sender places fields on it like on any document.

/** The one signer of the sample document. */
export const PREVIEW_SIGNER_ID = "preview-signer";

export const PREVIEW_PAGE_SIZE = { heightPt: 792, widthPt: 612 } as const;

export const PREVIEW_PAGES = [1, 2].map((pageNumber) => ({
  heightPt: PREVIEW_PAGE_SIZE.heightPt,
  pageNumber,
  widthPt: PREVIEW_PAGE_SIZE.widthPt,
}));

type SampleField = Omit<FieldPlacement, "id" | "signerId"> & { id: string };

/** A little of everything, so a first visit shows what each field looks like. */
export const DEFAULT_PREVIEW_FIELDS: readonly SampleField[] = [
  {
    height: 0.04,
    id: "field-1",
    page: 1,
    required: true,
    type: "name",
    width: 0.4,
    x: 0.08,
    y: 0.21,
  },
  {
    height: 0.075,
    id: "field-2",
    page: 1,
    required: true,
    type: "text",
    width: 0.84,
    x: 0.08,
    y: 0.32,
  },
  {
    height: 0.045,
    id: "field-3",
    page: 1,
    required: true,
    type: "number",
    width: 0.22,
    x: 0.08,
    y: 0.44,
  },
  {
    height: 0.045,
    id: "field-4",
    options: ["30-year fixed", "15-year fixed", "Adjustable rate"],
    page: 1,
    required: true,
    type: "dropdown",
    width: 0.34,
    x: 0.56,
    y: 0.44,
  },
  {
    height: 0.025,
    id: "field-5",
    page: 1,
    required: true,
    type: "checkbox",
    width: 0.035,
    x: 0.08,
    y: 0.55,
  },
  {
    groupId: "contact",
    height: 0.025,
    id: "field-6",
    page: 1,
    required: true,
    type: "radio",
    width: 0.035,
    x: 0.08,
    y: 0.62,
  },
  {
    groupId: "contact",
    height: 0.025,
    id: "field-7",
    page: 1,
    required: true,
    type: "radio",
    width: 0.035,
    x: 0.56,
    y: 0.62,
  },
  {
    height: 0.055,
    id: "field-8",
    page: 1,
    required: true,
    type: "initials",
    width: 0.14,
    x: 0.08,
    y: 0.72,
  },
  {
    height: 0.07,
    id: "field-9",
    page: 2,
    required: true,
    type: "signature",
    width: 0.3,
    x: 0.08,
    y: 0.5,
  },
];

const BODY =
  "This sample document stands in for a real one. Place any field on it, then choose Preview signing to see exactly what a client sees on a phone or a computer. Nothing here is saved to a real document or sent to anyone.";

function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";

  for (const word of text.split(" ")) {
    if (`${line} ${word}`.trim().length > max) {
      lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }

  return line ? [...lines, line] : lines;
}

/** Two letter-size pages with some text and captions where fields usually go. */
export async function buildPreviewPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const muted = rgb(0.4, 0.4, 0.46);
  const { heightPt, widthPt } = PREVIEW_PAGE_SIZE;
  const page1 = pdf.addPage([widthPt, heightPt]);
  const page2 = pdf.addPage([widthPt, heightPt]);

  page1.drawText("Sample document", {
    color: rgb(0.1, 0.1, 0.18),
    font: bold,
    size: 20,
    x: 50,
    y: heightPt - 60,
  });
  wrap(BODY, 92).forEach((line, index) => {
    page1.drawText(line, {
      color: muted,
      font,
      size: 9.5,
      x: 50,
      y: heightPt - 84 - index * 13,
    });
  });

  // A caption sits just above where each default field goes.
  const captions: Array<[string, number, number]> = [
    ["Full name", 0.08, 0.21],
    ["Notes", 0.08, 0.32],
    ["Loan amount", 0.08, 0.44],
    ["Loan type", 0.56, 0.44],
    ["I received the disclosures", 0.13, 0.55],
    ["Contact me by email", 0.13, 0.62],
    ["Contact me by phone", 0.61, 0.62],
    ["Initial here", 0.08, 0.72],
  ];

  for (const [text, x, y] of captions) {
    page1.drawText(text, {
      color: muted,
      font,
      size: 8.5,
      x: x * widthPt,
      y: heightPt - (y - 0.012) * heightPt,
    });
  }

  page2.drawText("Signature page", {
    color: rgb(0.1, 0.1, 0.18),
    font: bold,
    size: 20,
    x: 50,
    y: heightPt - 60,
  });
  wrap(
    "By signing below, the borrower confirms that they have reviewed this sample document.",
    92,
  ).forEach((line, index) => {
    page2.drawText(line, {
      color: muted,
      font,
      size: 9.5,
      x: 50,
      y: heightPt - 84 - index * 13,
    });
  });
  page2.drawText("Borrower signature", {
    color: muted,
    font,
    size: 8.5,
    x: 0.08 * widthPt,
    y: heightPt - 0.488 * heightPt,
  });

  return pdf.save();
}
