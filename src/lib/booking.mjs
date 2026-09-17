import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

export function loadBookingConfig(root = process.cwd()) {
  return parseYaml(fs.readFileSync(path.join(root, "content/booking.yaml"), "utf8"));
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function ymdInZone(date, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function isoWeekdayInZone(date, timeZone) {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return { Sun: 7, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd];
}

/** Interpret a wall-clock time in `timeZone` as a UTC Date. */
export function zonedLocalToUtc(ymd, hm, timeZone) {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = hm.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const map = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
  const hour = map.hour === "24" ? 0 : Number(map.hour);
  const asZone = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second),
  );
  return new Date(guess.getTime() - (asZone - guess.getTime()));
}

function addMinutes(hm, minutes) {
  const [h, m] = hm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function hmToMinutes(hm) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function labelSlot(start, timeZone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(start));
}

export function generateSlots(config, now = new Date(), taken = new Set()) {
  const slots = [];
  const duration = config.duration_minutes;
  for (let i = 0; i < config.days_ahead; i++) {
    const day = new Date(now.getTime() + i * 86400000);
    const ymd = ymdInZone(day, config.timezone);
    if (!config.weekdays.includes(isoWeekdayInZone(zonedLocalToUtc(ymd, "12:00", config.timezone), config.timezone))) {
      continue;
    }
    for (const win of config.windows) {
      let cursor = win.start;
      while (hmToMinutes(cursor) + duration <= hmToMinutes(win.end)) {
        const start = zonedLocalToUtc(ymd, cursor, config.timezone);
        const end = new Date(start.getTime() + duration * 60000);
        if (start.getTime() > now.getTime() + 30 * 60000) {
          const iso = start.toISOString();
          if (!taken.has(iso)) {
            slots.push({ start: iso, end: end.toISOString(), label: labelSlot(iso, config.timezone) });
          }
        }
        cursor = addMinutes(cursor, duration);
      }
    }
  }
  return slots;
}

export function slotIsOffered(config, startIso, now = new Date()) {
  return generateSlots(config, now).some((s) => s.start === startIso);
}

function icsUtc(d) {
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function makeIcs({ start, end, title, description, organizer, attendee }) {
  const uid = `${new Date(start).getTime()}@cerebralframe.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cerebral Frame//Talk//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtc(new Date())}`,
    `DTSTART:${icsUtc(start)}`,
    `DTEND:${icsUtc(end)}`,
    `SUMMARY:${icsEscape(title)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `ORGANIZER;CN=Cerebral Frame:mailto:${organizer}`,
    attendee ? `ATTENDEE;CN=${icsEscape(attendee.name || "Visitor")}:mailto:${attendee.email}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n") + "\r\n";
}

export function googleTemplateUrl({ start, end, title, details }) {
  const dates = `${icsUtc(start)}/${icsUtc(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
