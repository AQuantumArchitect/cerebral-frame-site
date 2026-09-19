/** Canonical host for the owner site. Broadcast is log.cerebralframe.com. */

export const APEX = "cerebralframe.com";
export const WWW = "www.cerebralframe.com";
export const LOG = "log.cerebralframe.com";

export function hostnameOf(host) {
  return String(host || "")
    .split(":")[0]
    .toLowerCase();
}

/** 301 www → apex. Return Location or null. */
export function apexRedirect(host, pathname = "/", search = "") {
  if (hostnameOf(host) !== WWW) return null;
  const path = pathname || "/";
  const q = search || "";
  return `https://${APEX}${path}${q}`;
}
