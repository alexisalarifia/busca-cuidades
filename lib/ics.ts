// Hand-rolled .ics per brief §2 (no library for ~40 lines). One VEVENT with a
// VALARM: default 45 minutes prior, 3 hours for flights (brief §6/§11).

export interface IcsEvent {
  uid: string;
  title: string;
  startUtc: string; // ISO
  endUtc?: string | null;
  location?: string | null;
  description?: string | null;
  isFlight?: boolean;
}

// UTC ISO → iCal basic form: 20260812T023000Z
function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

// Escape per RFC 5545 and fold lines at 75 octets.
function esc(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function fold(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 75));
  rest = rest.slice(75);
  while (rest.length > 74) {
    parts.push(" " + rest.slice(0, 74));
    rest = rest.slice(74);
  }
  if (rest.length) parts.push(" " + rest);
  return parts.join("\r\n");
}

export function buildIcs(events: IcsEvent[]): string {
  const now = toIcsUtc(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BuscaCiudades//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const e of events) {
    const end = e.endUtc ?? new Date(new Date(e.startUtc).getTime() + 3600_000).toISOString();
    const trigger = e.isFlight ? "-PT3H" : "-PT45M";
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}@buscaciudades`,
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsUtc(e.startUtc)}`,
      `DTEND:${toIcsUtc(end)}`,
      fold(`SUMMARY:${esc(e.title)}`)
    );
    if (e.location) lines.push(fold(`LOCATION:${esc(e.location)}`));
    if (e.description) lines.push(fold(`DESCRIPTION:${esc(e.description)}`));
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      fold(`DESCRIPTION:${esc(e.title)}`),
      `TRIGGER:${trigger}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
