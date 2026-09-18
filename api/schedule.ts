import type { VercelRequest, VercelResponse } from "@vercel/node";

const EVENTS = [
  { id: "sat-cse383-lec", day: "Saturday", start: "08:00", end: "09:50", code: "CSE383", title: "Computer Graphics", type: "Lecture", room: "944" },
  { id: "sat-cse383-tut", day: "Saturday", start: "10:00", end: "11:50", code: "CSE383", title: "Computer Graphics", type: "Tutorial", room: "Computer Cisco Lab" },
  { id: "sat-cse421-tut", day: "Saturday", start: "16:30", end: "17:20", code: "CSE421", title: "High-Performance Computing", type: "Tutorial", room: "922" },
  { id: "sat-cse441-lec", day: "Saturday", start: "18:30", end: "19:20", code: "CSE441", title: "Design Patterns", type: "Lecture", room: "944A" },
  { id: "sun-cse461-lec", day: "Sunday", start: "08:00", end: "09:50", code: "CSE461", title: "Cryptography and Security", type: "Lecture", room: "914A" },
  { id: "mon-cse421-lec", day: "Monday", start: "10:00", end: "11:50", code: "CSE421", title: "High-Performance Computing", type: "Lecture", room: "914A" },
  { id: "mon-asu-ethics-lec", day: "Monday", start: "14:30", end: "15:20", code: "ASUx47", title: "Professional Ethics", type: "Lecture", room: "912" },
  { id: "mon-asu-ethics-tut", day: "Monday", start: "16:30", end: "17:20", code: "ASUx47", title: "Professional Ethics", type: "Tutorial", room: "912" },
  { id: "thu-cse444-tut", day: "Thursday", start: "08:00", end: "09:50", code: "CSE444", title: "Parallel and Distributed Algorithms", type: "Tutorial", room: "944" },
  { id: "thu-cse444-lec", day: "Thursday", start: "12:30", end: "14:20", code: "CSE444", title: "Parallel and Distributed Algorithms", type: "Lecture", room: "944" },
];

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ count: EVENTS.length, timezone: "Africa/Cairo", ics: "/api/ics", events: EVENTS });
}
