import type { APIRoute } from "astro";
import { loadCopyRaw, loadSite } from "./site";

export function markdownPage(name: string): APIRoute {
  return () => {
    const site = loadSite();
    const body = `# ${site.name}\n\n${loadCopyRaw(name).trim()}\n`;
    return new Response(body, {
      headers: { "Content-Type": "text/markdown; charset=utf-8" },
    });
  };
}
