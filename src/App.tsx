import { useEffect, useMemo, useState } from "react";
import {
  Bell,
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
  WifiOff,
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

const START_HOUR = 8;
const END_HOUR = 21; // exclusive
const HOUR_PX = 64;

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
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
  // JS: 0 Sun .. 6 Sat
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
  // recurring template link for a single upcoming occurrence (ref week Sep 2026)
  const dayOffset: Record<string, number> = {
    Saturday: 0, Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4, Thursday: 5, Friday: 6,
  };
  const ref = new Date(Date.UTC(2026, 8, 19));
  ref.setUTCDate(ref.getUTCDate() + (dayOffset[ev.day] ?? 0));
  const pad = (n: number) => String(n).padStart(2, "0");
  const d = `${ref.getUTCFullYear()}${pad(ref.getUTCMonth() + 1)}${pad(ref.getUTCDate())}`;
  const s = ev.start.replace(":", "") + "00";
  const e = ev.end.replace(":", "") + "00";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${ev.code}: ${ev.title} (${ev.type})`,
    dates: `${d}T${s}/${d}T${e}`,
    details: `${ev.code} ${ev.title} — ${ev.type} in ${ev.room}. Recurs weekly.`,
    location: ev.room,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function App() {
  const { dark, setDark } = useDarkMode();
  const [view, setView] = useState<ViewMode>("week");
  const [selectedDay, setSelectedDay] = useState<DayName>(todayName() ?? "Saturday");
  const [activeCourses, setActiveCourses] = useState<string[]>(() =>
    Object.keys(COURSE_COLORS)
  );
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
            `${e.code} ${e.title} ${e.room} ${e.type}`
              .toLowerCase()
              .includes(query.toLowerCase()))
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
    let busiest: DayName = "Saturday";
    let max = -1;
    for (const d of DAY_ORDER) {
      const n = byDay.get(d)?.length ?? 0;
      if (n > max) { max = n; busiest = d; }
    }
    return { hours, freeDays, busiest, count: filtered.length };
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
    // Prefer server endpoint (works after deploy); fallback to client-generated blob (works in preview)
    const blob = new Blob([buildICS()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timetable.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const gridHeight = hours.length * HOUR_PX;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow">
              <GraduationCap size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Weekly Timetable</h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Sat–Fri · Fall semester · Africa/Cairo
              </p>
            </div>
          </div>

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-full border border-zinc-200 bg-zinc-100 p-1 text-sm dark:border-zinc-800 dark:bg-zinc-900">
              <button
                onClick={() => setView("week")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
                  view === "week"
                    ? "bg-white shadow dark:bg-zinc-800"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <LayoutGrid size={15} /> <span className="hidden sm:inline">Weekly</span>
              </button>
              <button
                onClick={() => setView("day")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition ${
                  view === "day"
                    ? "bg-white shadow dark:bg-zinc-800"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <List size={15} /> <span className="hidden sm:inline">Daily</span>
              </button>
            </div>

            <button
              onClick={() => setDark(!dark)}
              title="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button
              onClick={copySubscribe}
              title="Copy ICS subscription URL"
              className="hidden items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm font-medium transition hover:bg-zinc-100 sm:flex dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              {copied ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
              {copied ? "Copied!" : "Copy feed"}
            </button>

            <button
              onClick={downloadICS}
              className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-indigo-500"
            >
              <Download size={15} /> .ics
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Search + stats */}
        <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex min-w-52 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
                <BookOpen size={16} className="text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search courses, rooms, types…"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <Bell size={15} />
                <span>
                  Next up:{" "}
                  <strong className="text-zinc-800 dark:text-zinc-100">
                    {(() => {
                      const t = todayName();
                      const list = t ? byDay.get(t) ?? [] : [];
                      return list.length > 0
                        ? `${t} · ${list.length} classes`
                        : "Enjoy a free day";
                    })()}
                  </strong>
                </span>
              </div>
            </div>

            {/* Legend / filters */}
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.keys(COURSE_COLORS).map((code) => {
                const active = activeCourses.includes(code);
                const c = COURSE_COLORS[code];
                return (
                  <button
                    key={code}
                    onClick={() => toggleCourse(code)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      active
                        ? "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
                        : "border-dashed border-zinc-300 opacity-50 dark:border-zinc-700"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                    {code}
                    {!active && <span className="text-zinc-400">(hidden)</span>}
                  </button>
                );
              })}
              {activeCourses.length !== Object.keys(COURSE_COLORS).length && (
                <button
                  onClick={() => setActiveCourses(Object.keys(COURSE_COLORS))}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-indigo-500 hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
            {[
              { icon: CalendarDays, label: "Classes / week", value: String(stats.count) },
              { icon: Clock, label: "Hours / week", value: `${stats.hours.toFixed(1)}h` },
              { icon: Coffee, label: "Free days", value: String(stats.freeDays.length) },
              { icon: WifiOff, label: "Busiest", value: stats.busiest.slice(0, 3), hideMobile: true },
            ].map((s, i) => (
              <div
                key={i}
                className={`rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${
                  s.hideMobile ? "hidden lg:block" : ""
                }`}
              >
                <s.icon size={16} className="text-indigo-500" />
                <div className="mt-1 text-xl font-bold">{s.value}</div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly grid view */}
        {view === "week" && (
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays size={16} className="text-indigo-500" />
                Weekly Calendar View
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  8 AM – 9 PM
                </span>
              </h2>
              <p className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                Hover any block for details ·{" "}
                <span className="text-amber-500">●</span> Tue / Wed / Fri are off
              </p>
            </div>

            <div className="nice-scroll overflow-x-auto">
              <div className="min-w-[860px]">
                {/* day headers */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-zinc-200 dark:border-zinc-800">
                  <div />
                  {DAY_ORDER.map((d) => {
                    const n = byDay.get(d)?.length ?? 0;
                    const isToday = todayName() === d;
                    const isFree = n === 0;
                    return (
                      <div key={d} className="px-2 py-3 text-center">
                        <div
                          className={`mx-auto w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                            isToday
                              ? "bg-indigo-600 text-white"
                              : isFree
                                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          }`}
                        >
                          {d.slice(0, 3)}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                          {isFree ? "Free" : `${n} class${n > 1 ? "es" : ""}`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* time grid */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)]">
                  {/* gutter */}
                  <div className="relative" style={{ height: gridHeight }}>
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute right-2 text-[11px] tabular-nums text-zinc-400"
                        style={{ top: (h - START_HOUR) * HOUR_PX - 8 }}
                      >
                        {h % 12 === 0 ? 12 : h % 12}
                        {h < 12 ? "a" : "p"}
                      </div>
                    ))}
                  </div>

                  {DAY_ORDER.map((d) => {
                    const list = byDay.get(d) ?? [];
                    return (
                      <div
                        key={d}
                        className={`relative border-l border-zinc-100 dark:border-zinc-800/80 ${
                          list.length === 0 ? "bg-zinc-50/60 dark:bg-zinc-950/40" : ""
                        }`}
                        style={{ height: gridHeight }}
                      >
                        {/* hour lines */}
                        {hours.map((h) => (
                          <div
                            key={h}
                            className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-800/60"
                            style={{ top: (h - START_HOUR) * HOUR_PX }}
                          />
                        ))}

                        {list.length === 0 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                            <Coffee size={18} className="text-zinc-300 dark:text-zinc-700" />
                            <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-600">
                              No classes
                            </span>
                            <span className="rounded border border-dashed border-zinc-300 px-2 py-0.5 text-[10px] text-zinc-400 dark:border-zinc-700 dark:text-zinc-600">
                              Off day
                            </span>
                          </div>
                        ) : (
                          list.map((ev) => {
                            const top = ((toMinutes(ev.start) - START_HOUR * 60) / 60) * HOUR_PX;
                            const hgt =
                              ((toMinutes(ev.end) - toMinutes(ev.start)) / 60) * HOUR_PX - 6;
                            const c = COURSE_COLORS[ev.code] ?? COURSE_COLORS.CSE383;
                            const Icon = typeIcon(ev.type);
                            return (
                              <div
                                key={ev.id}
                                className="group absolute inset-x-1.5"
                                style={{ top, height: Math.max(hgt, 52) }}
                              >
                                <div
                                  className={`flex h-full gap-1.5 overflow-hidden rounded-xl border p-2 text-left shadow-sm transition hover:shadow-md ${c.soft}`}
                                >
                                  <div className={`w-1 shrink-0 rounded-full ${c.bar}`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1">
                                      <span className="truncate text-xs font-bold">{ev.code}</span>
                                      <span
                                        className={`hidden rounded border px-1 text-[9px] font-semibold xl:inline ${c.badge}`}
                                      >
                                        {ev.type}
                                      </span>
                                    </div>
                                    <div className="truncate text-[11px] text-zinc-600 dark:text-zinc-300">
                                      {ev.title}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
                                      <Clock size={10} />
                                      {formatTime12h(ev.start)} – {formatTime12h(ev.end)}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400">
                                      <MapPin size={10} /> {ev.room}
                                    </div>
                                  </div>
                                </div>

                                {/* hover tooltip card */}
                                <div className="pointer-events-none absolute left-1/2 top-full z-20 hidden w-60 -translate-x-1/2 translate-y-2 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-xl group-hover:block dark:border-zinc-700 dark:bg-zinc-900">
                                  <div className="flex items-center gap-2">
                                    <span className={`rounded-md p-1.5 text-white ${c.bar}`}>
                                      <Icon size={14} />
                                    </span>
                                    <div>
                                      <div className="text-xs font-bold">
                                        {ev.code} · {ev.type}
                                      </div>
                                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        {ev.title}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 space-y-1 text-[11px] text-zinc-600 dark:text-zinc-300">
                                    <div className="flex items-center gap-1.5">
                                      <Clock size={12} /> {formatTime12h(ev.start)} –{" "}
                                      {formatTime12h(ev.end)} ({durationHours(ev.start, ev.end)}h)
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <MapPin size={12} /> Room / Group: {ev.room}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <CalendarDays size={12} /> Every {ev.day} · until Jan 15
                                    </div>
                                  </div>
                                  <a
                                    href={googleCalLink(ev)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="pointer-events-auto mt-2 flex items-center justify-center gap-1 rounded-lg bg-zinc-900 py-1.5 text-[11px] font-semibold text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
                                  >
                                    <CalendarPlus size={12} /> Add to Google
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Daily list view */}
        {view === "day" && (
          <section className="grid gap-4 lg:grid-cols-[220px_1fr]">
            <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {DAY_ORDER.map((d) => {
                const n = byDay.get(d)?.length ?? 0;
                const active = selectedDay === d;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`flex min-w-36 flex-1 items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                      active
                        ? "border-indigo-500 bg-indigo-600 text-white shadow"
                        : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="font-semibold">{d}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        active
                          ? "bg-white/20"
                          : n === 0
                            ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                            : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300"
                      }`}
                    >
                      {n === 0 ? "Free" : `${n}`}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold">
                {selectedDay}{" "}
                <span className="text-zinc-500 dark:text-zinc-400">
                  · {(byDay.get(selectedDay) ?? []).length} classes
                </span>
              </h2>
              <div className="mt-3 space-y-3">
                {(byDay.get(selectedDay) ?? []).length === 0 && (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
                    <Coffee size={18} /> Free day — no classes. Perfect for study or rest.
                  </div>
                )}
                {(byDay.get(selectedDay) ?? []).map((ev) => {
                  const c = COURSE_COLORS[ev.code] ?? COURSE_COLORS.CSE383;
                  const Icon = typeIcon(ev.type);
                  return (
                    <div
                      key={ev.id}
                      className={`flex gap-3 rounded-xl border p-3 transition ${c.soft}`}
                    >
                      <div className={`w-1 rounded-full ${c.bar}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold">{ev.code}</span>
                          <span className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${c.badge}`}>
                            {ev.type}
                          </span>
                          <span className="ms-auto flex items-center gap-1 text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                            <Clock size={12} /> {formatTime12h(ev.start)} – {formatTime12h(ev.end)}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-sm">
                          <Icon size={14} className={c.text} /> {ev.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {ev.room}
                          </span>
                          <span>{durationHours(ev.start, ev.end)}h duration</span>
                          <a
                            href={googleCalLink(ev)}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-indigo-500 hover:underline"
                          >
                            Add to Google →
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ICS subscribe section */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 via-indigo-600 to-cyan-600 p-5 text-white shadow dark:border-indigo-900">
            <h2 className="flex items-center gap-2 font-bold">
              <CalendarPlus size={18} /> Put this in your calendar
            </h2>
            <p className="mt-1 text-sm text-indigo-100">
              One subscription URL powers Google, Apple & Outlook. Events repeat weekly until Jan
              15. Subscribe once — timetable updates flow automatically.
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 p-2 pl-3 font-mono text-xs">
              <span className="truncate">{icsUrl}</span>
              <button
                onClick={copySubscribe}
                className="ms-auto flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 font-sans font-semibold text-indigo-700"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
              <button
                onClick={downloadICS}
                className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-indigo-700 hover:bg-indigo-50"
              >
                <Download size={15} /> Download .ics
              </button>
              <a
                href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icsUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-white/40 px-4 py-2 hover:bg-white/10"
              >
                <CalendarDays size={15} /> Google Calendar
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="text-sm font-bold">How to subscribe</h3>
            <ol className="mt-2 space-y-2 text-[13px] text-zinc-600 dark:text-zinc-300">
              <li>
                <strong>Google:</strong> Calendar → Other calendars ＋ → <em>From URL</em> → paste{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/api/ics</code>
              </li>
              <li>
                <strong>Apple:</strong> Calendar → File → <em>New Calendar Subscription</em> → paste
                URL
              </li>
              <li>
                <strong>Outlook:</strong> Add calendar → <em>Subscribe from web</em> → paste URL
              </li>
              <li className="flex items-center gap-1.5 border-t border-zinc-100 pt-2 text-xs dark:border-zinc-800">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                  GET /api/ics
                </span>
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono dark:bg-zinc-800">
                  GET /api/schedule
                </span>
                <span className="text-zinc-400">· CORS open · cached 1h</span>
              </li>
            </ol>
          </div>
        </section>

        <footer className="pb-8 pt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
          Built with React + Tailwind + Lucide · Weekly recurring ICS feed at{" "}
          <code>/api/ics</code> · Timezone Africa/Cairo
        </footer>
      </main>
    </div>
  );
}
