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
