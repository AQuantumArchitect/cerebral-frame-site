import { describe, expect, it } from "vitest";
import { generateSlots, zonedLocalToUtc, makeIcs, loadBookingConfig } from "../src/lib/booking.mjs";

const config = loadBookingConfig();

describe("booking slots", () => {
  it("loads Pacific 20-minute windows", () => {
    expect(config.timezone).toBe("America/Los_Angeles");
    expect(config.duration_minutes).toBe(20);
    expect(config.weekdays).toEqual([2, 3, 4]);
  });

  it("does not offer weekends", () => {
    const saturday = new Date("2026-09-19T17:00:00Z");
    const slots = generateSlots({ ...config, days_ahead: 2 }, saturday);
    expect(slots.every((s) => !s.label.startsWith("Sat") && !s.label.startsWith("Sun"))).toBe(true);
  });

  it("offers a Tuesday 9am Pacific slot", () => {
    const mondayNight = new Date("2026-09-21T07:00:00Z");
    const slots = generateSlots(config, mondayNight);
    const nine = zonedLocalToUtc("2026-09-22", "09:00", "America/Los_Angeles").toISOString();
    expect(slots.some((s) => s.start === nine)).toBe(true);
  });

  it("hides taken slots", () => {
    const now = new Date("2026-09-21T07:00:00Z");
    const nine = zonedLocalToUtc("2026-09-22", "09:00", "America/Los_Angeles").toISOString();
    const open = generateSlots(config, now);
    const taken = generateSlots(config, now, new Set([nine]));
    expect(open.some((s) => s.start === nine)).toBe(true);
    expect(taken.some((s) => s.start === nine)).toBe(false);
  });

  it("writes an ICS request", () => {
    const start = "2026-09-22T16:00:00.000Z";
    const ics = makeIcs({
      start,
      end: "2026-09-22T16:20:00.000Z",
      title: "Cerebral Frame — 20 minutes",
      description: "Visitor: Ada",
      organizer: "Somapptic@gmail.com",
      attendee: { name: "Ada", email: "ada@example.com" },
    });
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("mailto:Somapptic@gmail.com");
  });
});
