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

## Offers (typical ranges, not quotes; the proposal is the quote)
- Consultation first: ${s.consultation.price}, ${s.consultation.length}, ${s.consultation.where}. Yields ${s.consultation.yields}.
${s.offers.map((o) => `- ${o.owner_name} (${o.id}): ${o.typical} · ${o.weeks} · ${o.start}`).join("\n")}
- Payment: ${s.payment_terms}

## Pages
- / Home
- /frame What a Frame is: a belief graph over the company's own ledger. Sections: a worked sample Frame; how the Map runs day by day; questions owners ask; a link to our own live Frame
- /work Offers: consultation first, then Map / Build / Hold; thirds; contract engineering through the same door
- /case Our own operation, live (the Frame of our own company, read live from the log; may read stale or dark)
- /about Luke Spooner and the outfit
- /talk Call, email, book, form
- /scan Where is the time going? (deterministic rules, no model)
- /sample Sample Frame (frame/1 document rendered; printable) plus the example Friday picture
- /built-with How the site is built
- /privacy /terms
- /card.vcf
- /llms-full.txt concatenated content
- /work.md /about.md /case.md and other pages as markdown

## Contact
${s.phone} · ${s.email} · ${s.github}
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
