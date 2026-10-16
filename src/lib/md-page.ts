import type { APIRoute } from "astro";
import { loadCopyRaw, loadSite } from "./site";

export function markdownPage(...names: string[]): APIRoute {
  return () => {
    const site = loadSite();
    const parts = names.map((n) => loadCopyRaw(n).trim());
    const body = `# ${site.name}\n\n${parts.join("\n\n")}\n`;
    return new Response(body, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  };
}
