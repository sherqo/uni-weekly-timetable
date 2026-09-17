import type { VercelRequest, VercelResponse } from "@vercel/node";

const EVENTS = [
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

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(200).json({ count: EVENTS.length, timezone: "Africa/Cairo", ics: "/api/ics", events: EVENTS });
}
