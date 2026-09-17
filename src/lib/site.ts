import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import { marked } from "marked";

const root = process.cwd();

export interface Offer {
  id: "audit" | "sprint" | "seat";
  owner_name: string;
  typical: string;
  blurb: string;
}

export interface NavItem {
  href: string;
  label: string;
}

export interface LinkItem {
  label: string;
  href: string;
  note?: string;
}

export interface LinkTree {
  heading: string;
  items: LinkItem[];
}

export interface Site {
  name: string;
  person: string;
  phone: string;
  phone_display: string;
  email: string;
  city: string;
  region: string;
  url: string;
  calendly: string;
  github: string;
  eyebrow: string;
  hero_h1: string;
  hero_lead: string;
  primary_cta: string;
  secondary_cta: string;
  tertiary_cta: string;
  magnetic: string;
  ai_once: string;
  offers: Offer[];
  nav: NavItem[];
}

export interface ScanOption {
  value: string;
  label: string;
}

export interface ScanQuestion {
  id: string;
  key: string;
  prompt: string;
  options: ScanOption[];
}

export interface ScanRules {
  title: string;
  intro: string;
  questions: ScanQuestion[];
  offers: Record<string, { owner_name: string; why: string }>;
}

export interface FridayNumber {
  label: string;
  value: string;
}

export interface FridaySample {
  title: string;
  caption: string;
  company: string;
  kind: string;
  week_of: string;
  numbers: FridayNumber[];
  slipped: string[];
  needs_decision: string[];
  already_handled: string[];
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

export function loadSite(): Site {
  return parseYaml(read("content/site.yaml")) as Site;
}

export function loadScanRules(): ScanRules {
  return parseYaml(read("content/scan-rules.yaml")) as ScanRules;
}

export function loadFriday(): FridaySample {
  return parseYaml(read("content/sample-friday.yaml")) as FridaySample;
}

export function loadLinks(): LinkTree {
  return parseYaml(read("content/links.yaml")) as LinkTree;
}

export function loadCopyRaw(name: string): string {
  return read(`content/copy/${name}.md`);
}

export function loadCopyHtml(name: string): string {
  return marked.parse(loadCopyRaw(name), { async: false }) as string;
}

export function allCopyMarkdown(): string {
  const dir = path.join(root, "content/copy");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
  return files
    .map((f) => `---\n# ${f}\n\n${fs.readFileSync(path.join(dir, f), "utf8").trim()}\n`)
    .join("\n");
}

export function telHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function builtAt(): string {
  return process.env.BUILD_TIME || new Date().toISOString();
}

export function commitSha(): string {
  return process.env.RAILWAY_GIT_COMMIT_SHA || process.env.COMMIT_SHA || "dev";
}
