// All times are stored UTC and rendered in the item's venue_tz (brief §4).

// "YYYY-MM-DDTHH:mm" entered as venue-local time → UTC ISO string.
export function localToUtc(local: string, timeZone: string): string {
  const asUtc = new Date(`${local}:00Z`);
  const rendered = asUtc.toLocaleString("sv-SE", { timeZone });
  const renderedAsUtc = new Date(`${rendered.replace(" ", "T")}Z`);
  const offsetMs = renderedAsUtc.getTime() - asUtc.getTime();
  return new Date(asUtc.getTime() - offsetMs).toISOString();
}

export function formatTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

// "YYYY-MM-DD" for the current moment in a timezone (drives the Today view).
export function todayInTz(timeZone: string): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone });
}
