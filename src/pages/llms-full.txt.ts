import type { APIRoute } from "astro";
import { allCopyMarkdown, loadSite } from "../lib/site";
import fs from "node:fs";
import path from "node:path";

export const GET: APIRoute = () => {
  const site = loadSite();
  const siteYaml = fs.readFileSync(path.join(process.cwd(), "content/site.yaml"), "utf8");
  const scan = fs.readFileSync(path.join(process.cwd(), "content/scan-rules.yaml"), "utf8");
  const sample = fs.readFileSync(path.join(process.cwd(), "content/sample-friday.yaml"), "utf8");
  const links = fs.readFileSync(path.join(process.cwd(), "content/links.yaml"), "utf8");
  const booking = fs.readFileSync(path.join(process.cwd(), "content/booking.yaml"), "utf8");
  const body = `# Cerebral Frame — full content

URL: ${site.url}
Phone: ${site.phone}
Email: ${site.email}

## content/site.yaml
${siteYaml}

## content/scan-rules.yaml
${scan}

## content/sample-friday.yaml
${sample}

## content/links.yaml
${links}

## content/booking.yaml
${booking}

## copy
${allCopyMarkdown()}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
