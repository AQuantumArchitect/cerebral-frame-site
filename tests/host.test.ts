import { describe, expect, it } from "vitest";
import { apexRedirect, hostnameOf, APEX, WWW, LOG } from "../src/lib/host.mjs";

describe("www to apex", () => {
  it("redirects www to https apex, keeps path and query", () => {
    expect(apexRedirect(WWW, "/talk", "?sent=1")).toBe(`https://${APEX}/talk?sent=1`);
  });

  it("does not redirect apex, railway host, or the log host", () => {
    expect(apexRedirect(APEX, "/")).toBeNull();
    expect(apexRedirect("cerebral-frame-site-production.up.railway.app", "/")).toBeNull();
    expect(apexRedirect(LOG, "/")).toBeNull();
  });

  it("strips a port from Host", () => {
    expect(hostnameOf("www.cerebralframe.com:443")).toBe(WWW);
    expect(apexRedirect("www.cerebralframe.com:443", "/about")).toBe(`https://${APEX}/about`);
  });
});
