This page is for people who care how the shop is wired. If you just want help with the computers, go back home or call.

## Stack

Astro 5. Pages are documents. The scan tool is a small script on one page, not a sitewide app. Railway hosts it. No database is required for the public site.

Content is markdown and YAML. Changing an offer is a file, not a redesign. Booking is our own slot list plus an .ics email, not Calendly. A phone can leave a 20-second video on /talk.

## How “Where is the time going?” works

Five questions. A pure function in `src/lib/scan.ts` turns the answers into a paragraph, an annual-hours number, and a first offer. No model is called on the public page. The same result is in the query string, so it can be opened again on a call.

If the optional email endpoint is down, the page still computes locally.

## The Frame on this site

`/frame`, `/sample`, and the home page render `content/sample-frame.json`, a `frame/1` document, through one static component (`src/components/FrameView.astro`). No script runs in the browser. Each node's state is written by the producer and can be re-derived from its age against the threshold: a `null` value is dark, an age inside the window is current, past it is stale. The renderer may reshape; it may never promote.

## Vocabulary

The same three states wear three names across the places they appear.

| frame/1 | The log's pulse | Cerebral Frame copy |
|---|---|---|
| current — age within the threshold | LIVE | current |
| stale — age past the threshold | STALE / DOWN | stale |
| dark — never measured, or absent | DARK | dark |

## Tests

Unit tests cover the scan rules. Playwright covers the phone link, a scan path, and the print page.

## For agents

See `/llms.txt` for a short map, `/llms-full.txt` for the concatenated content files, and `.md` next to each HTML page (`/work.md`, `/about.md`).
