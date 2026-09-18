# Weekly Timetable

Simple, mobile-friendly university weekly timetable.

- **Week board** (Google Calendar-style scrollable time grid, Sat–Fri with real dates) + **Daily agenda**
- Color-coded courses, break lengths between classes, filters, search
- Dark-mode toggle, phones open on the daily agenda by default
- **ICS calendar feed**: `GET /api/ics` — subscribe in Google / Apple / Outlook
- **JSON feed**: `GET /api/schedule`

## Stack

React 19 + Vite 6 + Tailwind CSS v4 + Lucide icons. Bun for package management.

## Run

```bash
bun install
bun run dev
bun run build
```

## Calendar subscription

Production URL (after deploy):

```
https://<your-domain>/api/ics
```

- Google Calendar → Other calendars + → From URL → paste `/api/ics`
- Apple Calendar → File → New Calendar Subscription → paste URL
- Outlook → Add calendar → Subscribe from web → paste URL

`GET /api/ics?download=1` forces a file download (`timetable.ics`).
Events repeat weekly (`RRULE:FREQ=WEEKLY;UNTIL=20260115`) in `Africa/Cairo`,
each with a `VALARM` reminder 15 minutes before start
(customize with `?reminder=30`, range 1–120 minutes).
