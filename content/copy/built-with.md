This page is for people who care how the shop is wired. If you just want help with the computers, go back home or call.

## Stack

Astro 5. Pages are documents. The scan tool is a small script on one page, not a sitewide app. Railway hosts it. No database is required for the public site.

Content is markdown and YAML. Changing an offer is a file, not a redesign.

## How “Where is the time going?” works

Five questions. A pure function in `src/lib/scan.ts` turns the answers into a paragraph, an annual-hours number, and a first offer. No model is called on the public page. The same result is in the query string, so it can be opened again on a call.

If the optional email endpoint is down, the page still computes locally.

## Tests

Unit tests cover the scan rules. Playwright covers the phone link, a scan path, and the print page.

## For agents

See `/llms.txt` for a short map, `/llms-full.txt` for the concatenated content files, and `.md` next to each HTML page (`/work.md`, `/about.md`).
