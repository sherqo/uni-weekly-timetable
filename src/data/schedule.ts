export type ClassType = "Lecture" | "Tutorial" | "Lab";

export interface TimetableEvent {
  id: string;
  day: DayName;
  start: string; // "10:00" 24h
  end: string; // "12:00" 24h
  code: string;
  title: string;
  type: ClassType;
  room: string;
}

export type DayName =
  | "Saturday"
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export const DAY_ORDER: DayName[] = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
];

export const EVENTS: TimetableEvent[] = [
  {
    id: "sat-cse383-lec",
    day: "Saturday",
    start: "08:00",
    end: "09:50",
    code: "CSE383",
    title: "Computer Graphics",
    type: "Lecture",
    room: "944",
  },
  {
    id: "sat-cse383-tut",
    day: "Saturday",
    start: "10:00",
    end: "11:50",
    code: "CSE383",
    title: "Computer Graphics",
    type: "Tutorial",
    room: "Computer Cisco Lab",
  },
  {
    id: "sat-cse421-tut",
    day: "Saturday",
    start: "16:30",
    end: "17:20",
    code: "CSE421",
    title: "High-Performance Computing",
    type: "Tutorial",
    room: "922",
  },
  {
    id: "sat-cse441-lec",
    day: "Saturday",
    start: "18:30",
    end: "19:20",
    code: "CSE441",
    title: "Design Patterns",
    type: "Lecture",
    room: "944A",
  },
  {
    id: "sun-cse461-lec",
    day: "Sunday",
    start: "08:00",
    end: "09:50",
    code: "CSE461",
    title: "Cryptography and Security",
    type: "Lecture",
    room: "914A",
  },
  {
    id: "mon-cse421-lec",
    day: "Monday",
    start: "10:00",
    end: "11:50",
    code: "CSE421",
    title: "High-Performance Computing",
    type: "Lecture",
    room: "914A",
  },
  {
    id: "mon-asu-ethics-lec",
    day: "Monday",
    start: "14:30",
    end: "15:20",
    code: "ASUx47",
    title: "Professional Ethics",
    type: "Lecture",
    room: "912",
  },
  {
    id: "mon-asu-ethics-tut",
    day: "Monday",
    start: "16:30",
    end: "17:20",
    code: "ASUx47",
    title: "Professional Ethics",
    type: "Tutorial",
    room: "912",
  },
  {
    id: "thu-cse444-tut",
    day: "Thursday",
    start: "08:00",
    end: "09:50",
    code: "CSE444",
    title: "Parallel and Distributed Algorithms",
    type: "Tutorial",
    room: "944",
  },
  {
    id: "thu-cse444-lec",
    day: "Thursday",
    start: "12:30",
    end: "14:20",
    code: "CSE444",
    title: "Parallel and Distributed Algorithms",
    type: "Lecture",
    room: "944",
  },
];

export interface CourseMeta {
  code: string;
  title: string;
  // tailwind-safe color tokens used in App via lookup
  accent: string;
  hoursPerWeek: number;
}

export const COURSE_COLORS: Record<string, { badge: string; bar: string; soft: string; text: string; dot: string }> = {
  CSE383: {
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    bar: "bg-blue-500",
    soft: "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30",
    text: "text-blue-300",
    dot: "bg-blue-400",
  },
  CSE441: {
    badge: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    bar: "bg-violet-500",
    soft: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30",
    text: "text-violet-300",
    dot: "bg-violet-400",
  },
  CSE461: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    bar: "bg-emerald-500",
    soft: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  CSE421: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    bar: "bg-rose-500",
    soft: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30",
    text: "text-rose-300",
    dot: "bg-rose-400",
  },
  ASUx47: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    bar: "bg-amber-500",
    soft: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  CSE444: {
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    bar: "bg-cyan-500",
    soft: "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30",
    text: "text-cyan-300",
    dot: "bg-cyan-400",
  },
};

export function durationHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh + em / 60 - (sh + sm / 60);
}
