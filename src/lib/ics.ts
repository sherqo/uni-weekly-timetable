import { DAY_ORDER, EVENTS, type TimetableEvent } from "../data/schedule";

// Reference week: Saturday 2026-09-19 .. Friday 2026-09-25.
// Each event recurs weekly with RRULE until end of Fall semester.
const REF_SATURDAY = new Date(Date.UTC(2026, 8, 19)); // month is 0-indexed
const UNTIL_STAMP = "20260115T215959Z";
export const TIMEZONE = "Africa/Cairo";

const DAY_OFFSET: Record<string, number> = {
  Saturday: 0,
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
};

function dateForEvent(ev: TimetableEvent): { start: Date; end: Date } {
  const base = new Date(REF_SATURDAY);
  base.setUTCDate(base.getUTCDate() + (DAY_OFFSET[ev.day] ?? 0));
  const [sh, sm] = ev.start.split(":").map(Number);
  const [eh, em] = ev.end.split(":").map(Number);
  const start = new Date(base);
  start.setUTCHours(sh, sm, 0, 0);
  const end = new Date(base);
  end.setUTCHours(eh, em, 0, 0);
  return { start, end };
}

// Format as local floating time in Africa/Cairo using the UTC wall-clock above.
// Egypt (Africa/Cairo) is UTC+2 in Sep-Jan (no DST since 2023 re-introduction is +3 in summer
// but Sep still +3? keep it simple: emit floating local time with TZID so calendar apps place it right).
// We compute Cairo wall clock = UTC + 3 for Sep, +2 after last Thu of Oct. To avoid complexity,
// emit TZID floating times derived from the wall clock hours directly.
function fmtLocal(d: Date, hours: string): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const compact = hours.replace(":", "");
  return `${y}${m}${day}T${compact}00`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildICS(): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "PRODID:-//uni-weekly-timetable//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Weekly Timetable",
    "X-WR-TIMEZONE:Africa/Cairo",
  ];
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";

  for (const ev of EVENTS) {
    const { start } = dateForEvent(ev);
    const summary = `${ev.code}: ${ev.title} — ${ev.type}`;
    const description = `${ev.code} ${ev.title} (${ev.type}) Room: ${ev.room}`;
    const location = ev.room;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@uni-timetable`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TIMEZONE}:${fmtLocal(start, ev.start)}`,
      `DTEND;TZID=${TIMEZONE}:${fmtLocal(start, ev.end)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${UNTIL_STAMP}`,
      `SUMMARY:${escapeICS(summary)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      `LOCATION:${escapeICS(location)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function icsDataUri(): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(buildICS())}`;
}

export function subscribeUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}/api/ics`;
}

export { DAY_ORDER, EVENTS };
