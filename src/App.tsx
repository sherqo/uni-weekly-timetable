import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  Coffee,
  Copy,
  Download,
  FlaskConical,
  GraduationCap,
  LayoutGrid,
  List,
  MapPin,
  Moon,
  Presentation,
  Sun,
  Users,
} from "lucide-react";
import {
  COURSE_COLORS,
  DAY_ORDER,
  EVENTS,
  durationHours,
  formatTime12h,
  type DayName,
  type TimetableEvent,
} from "./data/schedule";
import { buildICS } from "./lib/ics";

type ViewMode = "week" | "day";

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function formatGap(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m break`;
  if (m === 0) return `${h}h break`;
  return `${h}h ${m}m break`;
}

function typeIcon(type: TimetableEvent["type"]) {
  if (type === "Lab") return FlaskConical;
  if (type === "Tutorial") return Users;
  return Presentation;
}

function useDarkMode() {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("tt-theme");
    if (saved) return saved === "dark";
    return true;
  });
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("tt-theme", dark ? "dark" : "light");
  }, [dark]);
  return { dark, setDark };
}

function todayName(): DayName | null {
  const map: Record<number, DayName> = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };
  return map[new Date().getDay()] ?? null;
}

function googleCalLink(ev: TimetableEvent): string {
  const dayOffset: Record<string, number> = {
    Saturday: 0, Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6,
  };
  const ref = new Date(Date.UTC(2026, 8, 19));
  ref.setUTCDate(ref.getUTCDate() + (dayOffset[ev.day] ?? 0));
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = `${ref.getUTCFullYear()}${pad(ref.getUTCMonth() + 1)}${pad(ref.getUTCDate())}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${ev.code}: ${ev.title} (${ev.type})`,
    dates: `${d}T${ev.start.replace(":", "")}00/${d}T${ev.end.replace(":", "")}00`,
    details: `${ev.code} ${ev.title} — ${ev.type} in ${ev.room}. Recurs weekly.`,
    location: ev.room,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function EventCard({ ev }: { ev: TimetableEvent }) {
  const c = COURSE_COLORS[ev.code] ?? COURSE_COLORS.CSE383;
  const Icon = typeIcon(ev.type);
  return (
    <div className={`flex gap-2.5 rounded-xl border p-3 ${c.soft}`}>
      <div className={`w-1 shrink-0 rounded-full ${c.bar}`} />
      <div className="min-w-0 flex-1">
        <div
          className={`mb-2 flex items-center justify-center gap-1.5 rounded-lg border py-1.5 text-sm font-bold tabular-nums ${c.badge}`}
        >
          <Clock size={14} className="shrink-0" />
          {formatTime12h(ev.start)}
          <span aria-hidden="true">→</span>
          {formatTime12h(ev.end)}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm font-bold">{ev.code}</span>
          <span className={`rounded border px-1.5 py-px text-[10px] font-semibold ${c.badge}`}>
            {ev.type}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
          <Icon size={13} className={`shrink-0 ${c.text}`} />
          <span className="truncate">{ev.title}</span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <MapPin size={12} /> {ev.room}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px]">
          <span className="text-zinc-400 dark:text-zinc-500">
            {durationHours(ev.start, ev.end).toFixed(1).replace(/\.0$/, "")}h
          </span>
          <a
            href={googleCalLink(ev)}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-indigo-500 hover:underline"
          >
            + Google
          </a>
        </div>
      </div>
    </div>
  );
}

function DayColumn({ day, events, highlight }: { day: DayName; events: TimetableEvent[]; highlight: boolean }) {
  return (
    <section
      className={`rounded-2xl border p-3 ${
        highlight
          ? "border-indigo-500/60 bg-indigo-50/50 dark:bg-indigo-500/5"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <header className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-sm font-bold">{day}</h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            events.length === 0
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
          }`}
        >
          {events.length === 0 ? "Free" : `${events.length}`}
        </span>
      </header>
      <div className="space-y-2">
        {events.length === 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 p-3 text-[13px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-500">
            <Coffee size={15} /> No classes
          </div>
        )}
        {events.map((ev, i) => (
          <div key={ev.id}>
            {i > 0 && (
              <div className="mb-2 flex items-center gap-2 px-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                {formatGap(toMinutes(ev.start) - toMinutes(events[i - 1].end))}
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}
            <EventCard ev={ev} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const { dark, setDark } = useDarkMode();
  // Phones open on the daily agenda, desktops on the week board
  const [view, setView] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 1024 ? "day" : "week"
  );
  const [selectedDay, setSelectedDay] = useState<DayName>(todayName() ?? "Saturday");
  const [activeCourses, setActiveCourses] = useState<string[]>(() => Object.keys(COURSE_COLORS));
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  const icsUrl = useMemo(() => {
    if (typeof window === "undefined") return "/api/ics";
    return `${window.location.origin}/api/ics`;
  }, []);

  const filtered = useMemo(
    () =>
      EVENTS.filter(
        (e) =>
          activeCourses.includes(e.code) &&
          (query.trim() === "" ||
            `${e.code} ${e.title} ${e.room} ${e.type}`.toLowerCase().includes(query.toLowerCase()))
      ),
    [activeCourses, query]
  );

  const byDay = useMemo(() => {
    const m = new Map<DayName, TimetableEvent[]>();
    for (const d of DAY_ORDER) m.set(d, []);
    for (const e of filtered) m.get(e.day)?.push(e);
    for (const d of DAY_ORDER) m.get(d)?.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
    return m;
  }, [filtered]);

  const stats = useMemo(() => {
    const hours = filtered.reduce((s, e) => s + durationHours(e.start, e.end), 0);
    const freeDays = DAY_ORDER.filter((d) => (byDay.get(d)?.length ?? 0) === 0);
    return { hours, freeDays, count: filtered.length };
  }, [filtered, byDay]);

  const toggleCourse = (code: string) =>
    setActiveCourses((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  const copySubscribe = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const downloadICS = () => {
    const blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const today = todayName();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/85 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white">
            <GraduationCap size={20} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight">Weekly Timetable</h1>
            <p className="hidden text-[11px] text-zinc-500 sm:block dark:text-zinc-400">
              Sat–Fri · Africa/Cairo
            </p>
          </div>

          <div className="ms-auto flex items-center gap-1.5">
            <div className="flex rounded-full border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() => setView("week")}
                aria-label="Weekly view"
                className={`rounded-full p-2 transition ${
                  view === "week" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-400"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setView("day")}
                aria-label="Daily view"
                className={`rounded-full p-2 transition ${
                  view === "day" ? "bg-white shadow dark:bg-zinc-700" : "text-zinc-400"
                }`}
              >
                <List size={16} />
              </button>
            </div>
            <button
              onClick={() => setDark(!dark)}
              aria-label="Toggle dark mode"
              className="rounded-full border border-zinc-200 p-2.5 transition hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800"
            >
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={downloadICS}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-indigo-500"
            >
              <Download size={15} />
              <span className="hidden sm:inline">.ics</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-4">
        {/* Search + filters */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
          <BookOpen size={16} className="shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses, rooms…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(COURSE_COLORS).map((code) => {
            const active = activeCourses.includes(code);
            const c = COURSE_COLORS[code];
            return (
              <button
                key={code}
                onClick={() => toggleCourse(code)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  active
                    ? "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                    : "border-dashed border-zinc-300 opacity-45 dark:border-zinc-700"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {code}
              </button>
            );
          })}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Classes", value: String(stats.count) },
            { label: "Hours / week", value: `${stats.hours.toFixed(1).replace(/\.0$/, "")}h` },
            { label: "Free days", value: `${stats.freeDays.length} · ${stats.freeDays.map((d) => d.slice(0, 3)).join(" ")}` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="truncate text-base font-bold">{s.value}</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Week board: stacks on phones, columns on desktop */}
        {view === "week" && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {DAY_ORDER.map((d) => (
              <DayColumn key={d} day={d} events={byDay.get(d) ?? []} highlight={today === d} />
            ))}
          </div>
        )}

        {/* Daily agenda */}
        {view === "day" && (
          <div className="space-y-3">
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
              {DAY_ORDER.map((d) => {
                const n = byDay.get(d)?.length ?? 0;
                const active = selectedDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`flex shrink-0 flex-col items-center rounded-xl border px-4 py-2 transition ${
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                    }`}
                  >
                    <span className="text-[13px] font-bold">{d.slice(0, 3)}</span>
                    <span className={`text-[10px] ${active ? "text-indigo-100" : "text-zinc-400"}`}>
                      {n === 0 ? "Free" : `${n} ${n === 1 ? "class" : "classes"}`}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {(byDay.get(selectedDay) ?? []).length === 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
                  <Coffee size={17} /> Free day — no classes.
                </div>
              )}
              {(byDay.get(selectedDay) ?? []).map((ev, i, arr) => (
                <div key={ev.id}>
                  {i > 0 && (
                    <div className="mb-2 flex items-center gap-2 text-[11px] text-zinc-400 dark:text-zinc-500">
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                      {formatGap(toMinutes(ev.start) - toMinutes(arr[i - 1].end))}
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>
                  )}
                  <EventCard ev={ev} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar subscription */}
        <section className="rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-600 p-4 text-white">
          <h2 className="flex items-center gap-2 text-[15px] font-bold">
            <CalendarPlus size={17} /> Add to your calendar
          </h2>
          <p className="mt-0.5 text-[13px] text-indigo-100">
            Weekly repeats until Jan 15 · 15-min reminder on every class
          </p>
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-black/25 py-1.5 pl-3 pr-1.5 font-mono text-xs">
            <span className="truncate">{icsUrl}</span>
            <button
              onClick={copySubscribe}
              className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 font-sans text-xs font-semibold text-indigo-700"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2 text-[13px] font-semibold">
            <button
              onClick={downloadICS}
              className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-indigo-700"
            >
              <Download size={14} /> Download .ics
            </button>
            <a
              href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-2"
            >
              <CalendarDays size={14} /> Google Calendar
            </a>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-indigo-100">
            Google: Calendars ＋ → From URL · Apple: File → New Calendar Subscription · Outlook:
            Add calendar → Subscribe from web
          </p>
        </section>

        <footer className="pb-6 pt-1 text-center text-[11px] text-zinc-400 dark:text-zinc-600">
          React + Tailwind + Lucide · Feed at <code>/api/ics</code> · Africa/Cairo
        </footer>
      </main>
    </div>
  );
}
