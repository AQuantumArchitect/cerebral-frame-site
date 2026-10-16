// /case — the one other page allowed a script. It reads one public URL
// (the log's frame/1 document) once, with no credentials, and draws it
// in the same grammar FrameView uses. No model, no tracking, no storage.
// The renderer may reshape a node; it may never promote one.

type State = "current" | "stale" | "dark";

interface RawNode {
  id?: string;
  label?: string;
  name?: string;
  value?: unknown;
  unit?: string;
  state?: string;
  age_s?: number | null;
  stale_after_s?: number;
  source?: string;
  note?: string;
  observed_at?: string;
  as_of?: string;
}

interface RawDoc {
  frame?: RawDoc;
  subject?: string;
  as_of?: string;
  stale_after_s?: number;
  law?: string;
  producer?: { name?: string; kind?: string };
  nodes?: RawNode[] | Record<string, RawNode>;
  edges?: { from: string; to: string; rel?: string }[];
}

const STATES: readonly State[] = ["current", "stale", "dark"];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function age(s: number | null): string {
  if (s === null || !Number.isFinite(s)) return "—";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 48 * 3600) return `${Math.round(s / 3600)}h`;
  const d = s / 86400;
  return Number.isInteger(d) ? `${d}d` : `${d.toFixed(1)}d`;
}

const money = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function show(value: unknown, unit?: string): string {
  if (value === null || value === undefined) return "DARK";
  if (typeof value === "number") {
    if (unit === "USD") return `$${money.format(value)}`;
    return unit ? `${money.format(value)} ${unit}` : money.format(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function nodeAge(n: RawNode, asOf: Date): number | null {
  if (typeof n.age_s === "number") return n.age_s;
  const stamp = n.observed_at ?? n.as_of;
  if (stamp) {
    const t = new Date(stamp).getTime();
    if (Number.isFinite(t)) return Math.max(0, Math.round((asOf.getTime() - t) / 1000));
  }
  return null;
}

// Reshape, never promote: a producer's stale or dark stands; a producer's
// current is demoted if its own age says otherwise.
function stateOf(n: RawNode, ageS: number | null, threshold: number): State {
  const given = STATES.includes(n.state as State) ? (n.state as State) : undefined;
  if (n.value === null || n.value === undefined) return "dark";
  if (given === "dark" || given === "stale") return given;
  if (ageS !== null && ageS > threshold) return "stale";
  return given ?? (ageS === null ? "stale" : "current");
}

export interface RenderConfig {
  subject: string;
  kicker: string;
  ago: string;
  reportLabel: string;
  reportNone: string;
  stalePrefix: string;
}

// The honesty badge: when the machine last reported, and how long ago.
// Derived from the document's as_of, falling back to the freshest node age
// when as_of is missing. Past seven days it is prefixed "stale — ".
// It is never hidden.
export const REPORT_STALE_S = 7 * 86400;

export function reportLine(
  asOf: Date | null,
  ages: (number | null)[],
  cfg: Pick<RenderConfig, "reportLabel" | "reportNone" | "stalePrefix" | "ago">,
  now = Date.now(),
): { text: string; stale: boolean } {
  let since: number | null = null;
  let when = "—";
  if (asOf && Number.isFinite(asOf.getTime())) {
    since = Math.max(0, Math.round((now - asOf.getTime()) / 1000));
    when = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(asOf);
  } else {
    const known = ages.filter((a): a is number => typeof a === "number" && Number.isFinite(a));
    if (known.length > 0) since = Math.min(...known);
  }
  if (since === null) return { text: `${cfg.reportLabel}: ${cfg.reportNone}`, stale: false };
  const stale = since > REPORT_STALE_S;
  const prefix = stale ? cfg.stalePrefix : "";
  return { text: `${prefix}${cfg.reportLabel}: ${when} (${age(since)} ${cfg.ago})`, stale };
}

export function render(raw: RawDoc, cfg: RenderConfig): HTMLElement {
  const doc = raw.frame ?? raw;
  const asOf = doc.as_of ? new Date(doc.as_of) : null;
  const asOfOk = asOf !== null && Number.isFinite(asOf.getTime());
  const threshold = typeof doc.stale_after_s === "number" ? doc.stale_after_s : 3 * 86400;
  const list: RawNode[] = Array.isArray(doc.nodes)
    ? doc.nodes
    : doc.nodes && typeof doc.nodes === "object"
      ? Object.entries(doc.nodes).map(([id, n]) => ({ id, ...n }))
      : [];

  const rows = list.map((n) => {
    const a = asOfOk ? nodeAge(n, asOf as Date) : typeof n.age_s === "number" ? n.age_s : null;
    const state = stateOf(n, a, typeof n.stale_after_s === "number" ? n.stale_after_s : threshold);
    return { n, a, state };
  });

  const counts = { current: 0, stale: 0, dark: 0 };
  for (const r of rows) counts[r.state] += 1;

  const section = el("section", "frame-view");
  section.setAttribute("aria-label", `Frame of ${doc.subject ?? cfg.subject}`);

  const report = reportLine(asOfOk ? (asOf as Date) : null, rows.map((r) => r.a), cfg);
  const badge = el("p", report.stale ? "frame-report is-stale" : "frame-report", report.text);
  badge.setAttribute("data-case-report", "");
  section.append(badge);

  const head = el("header", "frame-head");
  const left = el("div");
  left.append(el("p", "frame-kicker", doc.producer?.kind ? `${doc.producer.kind} · ${cfg.kicker}` : cfg.kicker));
  left.append(el("p", "frame-subject", doc.subject ?? cfg.subject));
  if (asOfOk) {
    const fmt = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(asOf as Date);
    const since = Math.max(0, Math.round((Date.now() - (asOf as Date).getTime()) / 1000));
    left.append(el("p", "frame-asof", `as of ${fmt} · ${age(since)} ${cfg.ago}`));
  } else {
    left.append(el("p", "frame-asof", "as of —"));
  }
  head.append(left);

  const c = el("p", "frame-counts");
  c.append(el("span", "s-current", `${counts.current} current`));
  c.append(document.createTextNode(" · "));
  c.append(el("span", "s-stale", `${counts.stale} stale`));
  c.append(document.createTextNode(" · "));
  c.append(el("span", "s-dark", `${counts.dark} dark`));
  head.append(c);
  section.append(head);

  const grid = el("ul", "frame-grid");
  for (const { n, a, state } of rows) {
    const li = el("li", `tile is-${state}`);
    const top = el("div", "tile-top");
    top.append(el("span", "tile-label", n.label ?? n.name ?? n.id ?? "—"));
    top.append(el("span", `badge badge-${state}`, state));
    li.append(top);
    const dark = n.value === null || n.value === undefined;
    li.append(el("strong", dark ? "tile-value dark" : "tile-value", show(n.value, n.unit)));
    li.append(el("p", "tile-age", dark ? "age —" : `age ${age(a)}`));
    if (n.source) li.append(el("p", "tile-source", n.source));
    if (n.note) li.append(el("p", "tile-note", n.note));
    grid.append(li);
  }
  section.append(grid);

  if (Array.isArray(doc.edges) && doc.edges.length > 0) {
    const labelOf = (id: string) => list.find((n) => n.id === id)?.label ?? id;
    const edges = el("ul", "frame-edges");
    for (const e of doc.edges) {
      const li = el("li");
      li.append(el("span", undefined, labelOf(e.from)));
      li.append(el("span", "rel", `${e.rel ?? "feeds"} →`));
      li.append(el("span", undefined, labelOf(e.to)));
      edges.append(li);
    }
    section.append(edges);
  }

  if (doc.law) section.append(el("p", "frame-law", doc.law));
  return section;
}

const root = document.getElementById("case-frame");
if (root && root.dataset.src) {
  const cfg: RenderConfig = {
    subject: root.dataset.subject ?? "",
    kicker: root.dataset.kicker ?? "",
    ago: root.dataset.ago ?? "ago",
    reportLabel: root.dataset.reportLabel ?? "Last machine report",
    reportNone: root.dataset.reportNone ?? "none received yet",
    stalePrefix: root.dataset.stalePrefix ?? "stale — ",
  };
  const status = root.querySelector<HTMLElement>("[data-case-status]");
  if (status) status.textContent = root.dataset.reading ?? "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  fetch(root.dataset.src, { mode: "cors", credentials: "omit", cache: "no-store", signal: controller.signal })
    .then((res) => {
      if (!res.ok) throw new Error(String(res.status));
      return res.json() as Promise<RawDoc>;
    })
    .then((doc) => {
      const view = render(doc, cfg);
      root.replaceChildren(view);
    })
    .catch(() => {
      // Dark, not an error page: the static block below stays as it is.
      if (status) status.textContent = "";
    })
    .finally(() => clearTimeout(timer));
}
