import { describe, expect, it } from "vitest";
import { evaluateScan, parseScan, serializeScan, HOURS_MIDPOINT } from "../src/lib/scan";
import type { ScanAnswers } from "../src/lib/scan";

const base: ScanAnswers = {
  place: "shop",
  size: "6-15",
  pain: "numbers",
  hours: "6-10",
  owner: "owner",
};

describe("hours midpoint", () => {
  it("maps the locked buckets", () => {
    expect(HOURS_MIDPOINT["1-2"]).toBe(1.5);
    expect(HOURS_MIDPOINT["3-5"]).toBe(4);
    expect(HOURS_MIDPOINT["6-10"]).toBe(8);
    expect(HOURS_MIDPOINT["10+"]).toBe(12);
  });
});

describe("evaluateScan", () => {
  it("computes annual hours as midpoint * 50", () => {
    expect(evaluateScan(base).annualHours).toBe(400);
    expect(evaluateScan({ ...base, hours: "1-2" }).annualHours).toBe(75);
  });

  it("recommends sprint when annual hours >= 400", () => {
    expect(evaluateScan({ ...base, owner: "whoever", hours: "10+" }).recommend).toBe("sprint");
  });

  it("recommends sprint when the owner does it and size is at least 6-15", () => {
    expect(evaluateScan({ ...base, hours: "3-5", owner: "owner", size: "6-15" }).recommend).toBe("sprint");
  });

  it("recommends audit when they are not sure", () => {
    const result = evaluateScan({
      place: "office",
      size: "1-5",
      pain: "unsure",
      hours: "3-5",
      owner: "whoever",
    });
    expect(result.recommend).toBe("audit");
  });

  it("recommends audit for 50+ when hours are low and owner is not doing it", () => {
    const result = evaluateScan({
      place: "warehouse",
      size: "50+",
      pain: "email",
      hours: "1-2",
      owner: "office-manager",
    });
    expect(result.recommend).toBe("audit");
  });

  it("mentions seat as step two when pain is clear and hours are 6-10+", () => {
    expect(evaluateScan(base).mentionSeat).toBe(true);
    expect(evaluateScan({ ...base, hours: "3-5" }).mentionSeat).toBe(false);
  });

  it("writes second-person copy without jargon", () => {
    const text = evaluateScan(base).paragraph.toLowerCase();
    expect(text).toContain("shop");
    expect(text).not.toContain("diagnostic");
    expect(text).not.toContain("rag");
    expect(text).not.toContain("wizard");
  });
});

describe("query string", () => {
  it("round-trips answers", () => {
    const qs = serializeScan(base);
    expect(qs).toContain("a=shop");
    expect(parseScan(qs)).toEqual(base);
    expect(parseScan(`?${qs}`)).toEqual(base);
  });

  it("rejects incomplete queries", () => {
    expect(parseScan("a=shop&s=6-15")).toBeNull();
    expect(parseScan("a=factory&s=6-15&p=numbers&h=6-10&o=owner")).toBeNull();
  });
});
