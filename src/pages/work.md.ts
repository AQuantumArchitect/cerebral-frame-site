import type { APIRoute } from "astro";
import { loadCopyRaw, loadSite } from "../lib/site";

// /work.md composes the Offers page from content/: the opening copy,
// the consultation and offers from site.yaml, payment terms, and the
// contract-engineering paragraph.
export const GET: APIRoute = () => {
  const site = loadSite();
  const c = site.consultation;
  const L = site.labels;
  const offers = site.offers
    .map(
      (o) =>
        `## ${o.owner_name}\n\n${L.for}: ${o.for}\n\n${o.blurb}\n\n` +
        `- ${L.weeks}: ${o.weeks}\n- ${L.what_you_get}: ${o.deliverables}\n- ${L.typical}: ${o.typical}\n- ${L.start}: ${o.start}`,
    )
    .join("\n\n");
  const body =
    `# ${site.name}\n\n${loadCopyRaw("work").trim()}\n\n` +
    `## ${L.start_here}\n\n${c.price} · ${c.length} · ${c.where}\n\n` +
    `${L.what_happens}: ${c.happens}\n\n${L.what_you_get}: ${c.gets}\n\n${c.book_via}\n\n` +
    `${offers}\n\n## ${L.paying}\n\n${site.payment_terms}\n\n${site.pricing_note}\n\n` +
    `${loadCopyRaw("work-after").trim()}\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
};
