/**
 * The calendar date on the signer's own clock when they signed, such as
 * "November 21, 2026". The signer's device reports how far its clock is from
 * UTC (as Date.getTimezoneOffset does: minutes to add to local time to get
 * UTC), so someone signing at 9 pm in California gets that day, not the next
 * day in UTC. No time zone is written next to it.
 */
export function formatLocalSigningDate(
  submittedAt: number,
  timezoneOffsetMinutes: number,
): string {
  const localDateTime = new Date(
    submittedAt * 1000 - timezoneOffsetMinutes * 60 * 1000,
  );

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(localDateTime);
}

/** The widest offsets a device can report: UTC-14:00 to UTC+14:00, in minutes. */
const MAX_OFFSET_MINUTES = 14 * 60;

/**
 * The same day, or null when the moment or the offset cannot give a real one.
 * The signed PDF uses this, so a value that was stored in an odd shape can
 * only leave a signature without its date, never stop the document being made.
 */
export function formatLocalSigningDateSafely(
  submittedAt: unknown,
  timezoneOffsetMinutes: unknown,
): string | null {
  if (
    typeof submittedAt !== "number" ||
    !Number.isFinite(submittedAt) ||
    typeof timezoneOffsetMinutes !== "number" ||
    !Number.isInteger(timezoneOffsetMinutes) ||
    Math.abs(timezoneOffsetMinutes) > MAX_OFFSET_MINUTES
  ) {
    return null;
  }

  try {
    return formatLocalSigningDate(submittedAt, timezoneOffsetMinutes);
  } catch {
    return null;
  }
}
