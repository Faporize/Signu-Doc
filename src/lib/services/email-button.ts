import { type Branding } from "../branding.ts";
import { buildBrandPalette, DEFAULT_BRAND_PALETTE } from "../brand-color.ts";
import { escapeHtml } from "../utils/html.ts";

type EmailButtonInput = {
  branding: Branding;
  label: string;
  url: string;
};

/**
 * A call-to-action button for an HTML email, followed by the plain link for
 * mail programs that do not draw buttons.
 *
 * Email programs ignore most CSS, so the button is a table cell with its own
 * background color and an inline-styled link. It uses the install's accent
 * color (the palette darkens it until white text on it is readable), or the
 * default violet when the install has not chosen one.
 */
export function buildEmailButton({
  branding,
  label,
  url,
}: EmailButtonInput): string {
  const palette =
    (branding.brandColor ? buildBrandPalette(branding.brandColor) : null) ??
    DEFAULT_BRAND_PALETTE;
  // Only a web link becomes a button. Anything else leaves the plain link in
  // the text part of the message, which always has it.
  if (!/^https?:\/\//i.test(url)) {
    return "";
  }

  const href = escapeHtml(url);

  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">',
    "<tr>",
    `<td align="center" bgcolor="${palette.accent}" style="border-radius:8px;background-color:${palette.accent};">`,
    `<a href="${href}" target="_blank" rel="noopener noreferrer" `,
    "style=\"display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;",
    'font-size:16px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px;">',
    `${escapeHtml(label)}`,
    "</a>",
    "</td>",
    "</tr>",
    "</table>",
    '<p style="margin:0 0 16px;font-size:13px;color:#6b6b76;">',
    "If the button does not work, copy this link into your browser:<br />",
    `<a href="${href}" style="color:${palette.accentInk};word-break:break-all;">${href}</a>`,
    "</p>",
  ].join("");
}
