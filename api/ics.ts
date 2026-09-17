// Vercel Serverless Function — ICS calendar feed
// GET /api/ics  -> text/calendar (subscribe this URL in Google/Apple/Outlook)
// GET /api/ics?download=1 -> forces file download
// GET /api/ics?reminder=30 -> reminder N minutes before (default 15, range 1–120)
// Every event carries a VALARM so calendar apps notify before class.

import type { VercelRequest, VercelResponse } from "@vercel/node";

type ClassType = "Lecture" | "Tutorial" | "Lab";
interface TimetableEvent {
  id: string;
  day: string;
  start: string;
  end: string;
  code: string;
  title: string;
  type: ClassType;
  room: string;
}

const EVENTS: TimetableEvent[] = [
  { id: "sat-cse383-lec", day: "Saturday", start: "10:00", end: "12:00", code: "CSE383", title: "Computer Graphics", type: "Lecture", room: "9xx" },
  { id: "sat-cse383-lab", day: "Saturday", start: "12:00", end: "14:00", code: "CSE383", title: "Computer Graphics", type: "Lab", room: "Cisco Lab" },
  { id: "sat-cse336-lec", day: "Saturday", start: "18:30", end: "20:30", code: "CSE336", title: "Software Design Patterns", type: "Lecture", room: "9xx" },
  { id: "sun-cse461-lec", day: "Sunday", start: "08:00", end: "10:00", code: "CSE461", title: "Cryptography and Security", type: "Lecture", room: "9xxA" },
  { id: "mon-cse421-lec", day: "Monday", start: "10:00", end: "12:00", code: "CSE421", title: "High-Performance Computing", type: "Lecture", room: "9xxA" },
  { id: "mon-asu-ethics-lec", day: "Monday", start: "14:30", end: "16:30", code: "ASUx47", title: "Professional Ethics", type: "Lecture", room: "914A" },
  { id: "mon-asu-ethics-tut", day: "Monday", start: "16:30", end: "17:30", code: "ASUx47", title: "Professional Ethics", type: "Tutorial", room: "912" },
  { id: "thu-cse444-tut", day: "Thursday", start: "08:00", end: "10:00", code: "CSE444", title: "Parallel and Distributed Algorithms", type: "Tutorial", room: "9xx" },
  { id: "thu-cse444-lec", day: "Thursday", start: "12:30", end: "14:30", code: "CSE444", title: "Parallel and Distributed Algorithms (UG2023)", type: "Lecture", room: "9xxA" },
];

const DAY_OFFSET: Record<string, number> = {
  Saturday: 0, Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6,
};
const TIMEZONE = "Africa/Cairo";
const UNTIL_STAMP = "20260115T215959Z";

function fmtLocal(y: number, m: number, d: number, hm: string): string {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}${mm}${dd}T${hm.replace(":", "")}00`;
}
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildICS(minutes: number): string {
  // Reference Saturday 2026-09-19
  const refY = 2026, refM = 9, refD = 19;
  const refDate = new Date(Date.UTC(refY, refM - 1, refD));
  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//uni-weekly-timetable//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Weekly Timetable",
    "X-WR-TIMEZONE:Africa/Cairo",
  ];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  for (const ev of EVENTS) {
    const off = DAY_OFFSET[ev.day] ?? 0;
    const dt = new Date(refDate);
    dt.setUTCDate(dt.getUTCDate() + off);
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth() + 1;
    const d = dt.getUTCDate();
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.id}@uni-timetable`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TIMEZONE}:${fmtLocal(y, m, d, ev.start)}`,
      `DTEND;TZID=${TIMEZONE}:${fmtLocal(y, m, d, ev.end)}`,
      `RRULE:FREQ=WEEKLY;UNTIL=${UNTIL_STAMP}`,
      `SUMMARY:${esc(`${ev.code}: ${ev.title} — ${ev.type}`)}`,
      `DESCRIPTION:${esc(`${ev.code} ${ev.title} (${ev.type}) Room: ${ev.room}`)}`,
      `LOCATION:${esc(ev.room)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "BEGIN:VALARM",
      `TRIGGER:-PT${minutes}M`,
      "ACTION:DISPLAY",
      `DESCRIPTION:${esc(`Reminder: ${ev.code} ${ev.type} starts in ${minutes} minutes`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Reminder lead time in minutes, default 15. Override with ?reminder=30 (1–120).
  const raw = req.query.reminder ?? req.query.alarm;
  let minutes = parseInt(Array.isArray(raw) ? raw[0] : String(raw ?? "15"), 10);
  if (!Number.isFinite(minutes)) minutes = 15;
  minutes = Math.min(120, Math.max(1, minutes));
  const ics = buildICS(minutes);
  const download = req.query.download !== undefined;
  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, max-age=3600");
  if (download) res.setHeader("Content-Disposition", 'attachment; filename="timetable.ics"');
  res.status(200).send(ics);
}
