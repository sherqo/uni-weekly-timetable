# Weekly Timetable

Modern, responsive, dark-mode friendly university weekly timetable.

- **Weekly Calendar View** (Sat–Fri, 8 AM – 9 PM grid) + **Daily List View**
- Color-coded courses, hover detail cards, course filters, search
- Dark-mode toggle, fully responsive
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
Events repeat weekly (`RRULE:FREQ=WEEKLY;UNTIL=20260115`) in `Africa/Cairo`.
