import type { APIRoute } from "astro";
import { loadSite } from "../lib/site";

export const GET: APIRoute = () => {
  const s = loadSite();
  const body = `# Cerebral Frame

> ${s.magnetic}

Site: ${s.url}
Phone: ${s.phone_display}
Email: ${s.email}
Place: ${s.city} · ${s.region}
Person: ${s.person}

## Who it is for
Owners and operators of small and mid-size companies who want the computer work built properly and a live model of the business — a Frame — that marks every number current, stale, or dark.

## Offers (typical ranges, not quotes)
${s.offers.map((o) => `- ${o.owner_name} (${o.id}): ${o.typical}`).join("\n")}

## Pages
- / Home
- /frame What a Frame is: a belief graph over the company's own ledger
- /work Offers: Map, Build, Hold
- /about Luke Spooner and the outfit
- /talk Call, email, book, form
- /scan Where is the time going? (deterministic rules, no model)
- /sample Example Friday picture
- /built-with How the site is built
- /privacy /terms
- /card.vcf
- /llms-full.txt concatenated content
- /work.md /about.md and other pages as markdown

## Contact
${s.phone} · ${s.email} · ${s.github}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
