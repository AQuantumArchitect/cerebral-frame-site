# Cerebral Frame site — agent notes

This file is the friction killer. The full plan lives in the originating
build doc; if that doc and this file disagree, the build doc wins. If this
file and Broadcast disagree on the owner site, this file wins.
Broadcast is hosted on the same company domain (`log.cerebralframe.com`).
That is not a console skin of this site.

## What this is

Owner-facing site for Cerebral Frame. Two words always. Never “Cerebral”
alone. Never “Brain Frame.” Never a Broadcast console skin.

Primary visitor: owner or operator of a small or mid-size company, anywhere,
who wants the computer work built properly. Secondary: a technical buyer who
wants proof we ship. Positioning (Luke, 2026-10-14): a small, fast
engineering outfit — code, automation, and **Frames** (belief graphs of one
company over its own ledger) as the primary offer. Confident, not folksy.
The word "mercenary" describes the voice; it does not appear in copy.

## Commands

```bash
nvm use 22          # or any Node >= 20
npm install
npm run dev         # http://localhost:4321
npm test            # vitest: scan rules
npm run test:e2e    # playwright
npm run build
npm start           # serves dist/ on $PORT (default 3000)
```

## Design tokens

```
--paper:     #F6F1E8
--ink:       #1C1916
--ink-soft:  #4A453F
--rule:      #D4CBBC
--accent:    #8C4A1F
--card:      #FFFCF7
--focus:     #1C1916
--ok:        #215E3B
--warn:      #8A5A12
```

Light paper is the default. Frame mark = 2px rectangle, not a brain.
Type: Source Sans 3 body, Source Serif 4 wordmark. Self-hosted woff2 only.
Tap targets ≥ 48px. Focus rings 3px ink. Motion: 200ms fades max;
respect `prefers-reduced-motion`.

## Copy rules

- All sentences live in `content/`. Components do not contain sentences.
- If `content/facts.md` is absent, do not invent employers or metrics.
- Locked facts you may state: Luke Spooner · (805) 236-8182 · physicist by
  training · years in manufacturing and technical sales · remote by default,
  on site when it matters. Camarillo / Ventura County are true but no longer
  lead: not on the card, not in the hero. Legal pages may keep jurisdiction.
- The Frame: one noun, capitalized, always "a Frame" / "the Frame". Its three
  states are current / stale / dark — never show a zero for an unmeasured thing.
  No client Frame has shipped yet; say so where the offer is described.
- Offers are Map / Build / Hold. Same names on /work, /scan, and the card.
  Each offer has `for`, `weeks`, `start`, `blurb`, and `deliverables` in
  `site.yaml`, rendered as full sections on /work and composed into `/work.md`.
- Locked (Luke, 2026-10-16): every engagement starts with a **$400 half-day
  consultation, in person when we can** (`consultation:` in `site.yaml`). It
  yields a written proposal with deliverables, a price from the ranges, and
  the three payment points. Payment is **in thirds**: signing, delivery,
  acceptance (`payment_terms:`). Prices are typical ranges; the proposal is
  the quote. Contract engineering ("hire Luke") goes through the same door:
  consultation → proposal → Build or Hold; day rates are quoted in the
  proposal, never on the site. /scan's first step names the consultation
  (`first_step:` in `scan-rules.yaml`). `terms.md` repeats the thirds in
  legal prose; keep the two in step.
- Frame copy lives in two files: `content/copy/frame.md` (opening, ends with
  the "A Frame, worked" heading) and `content/copy/frame-after.md` (the
  paragraph after the rendered Frame, the day-by-day Map, owners' questions,
  the live link). `frame.astro` renders md → FrameView → md. `/frame.md`
  concatenates both.
- Contact email for v1: `Somapptic@gmail.com` (temporary; `luke@cerebralframe.com` later).
- Homepage may mention AI once, late, in owner language. Do not lead with
  “AI automation engineer.” Do not use “Fractional CTO” as H1.

## Banned

Broadcast console UI, Strand Theory, quantum titles, moonshot finance,
memetic-weapons copy, hover-only nav, cookie walls, chat widgets, autoplay,
stock handshakes, neuron logos, “Cerebral” alone, “Brain Frame.”

Do not scrape resumes. Do not scrape Broadcast UI components.

## FrameView

`content/sample-frame.json` is a `frame/1` document (schema: subject, as_of,
stale_after_s, producer, nodes[] with value/state/age_s/source/note, edges[]).
A `null` value is dark; age within the threshold is current; past it is stale.
`state` is written by the producer and must re-derive from age — check it when
you edit the file. `src/components/FrameView.astro` renders any such document
statically (no JS; its CSS is global in `src/styles/frame.css` so /case can
share it): `doc`, optional `compact` (five tiles, no sources),
optional `heading` (h1 / h2 / p). Used on `/` (compact), `/frame`, `/sample`.
Loader: `loadSampleFrame()` in `src/lib/site.ts`.

## Case (`/case`)

"Our own operation, live." The second and last page allowed a script
(`src/scripts/case.ts`): a read-only `fetch` of one public URL, the log's
`frame/1` document (`case.source` in `site.yaml`), drawn with the shared
Frame grammar in `src/styles/frame.css`. No model, no tracking, no cookies,
no storage, no credentials. The renderer may reshape a node and never
promote one: a producer's stale or dark stands; a producer's current is
demoted when its own age is past the threshold. If the fetch fails or JS is
off, the static block stays — dark, not an error — with a plain link to the
log's Engine page. `server.js` CSP `connect-src` allows the two log hosts.
Nav: not in it; linked from /frame, the home caption, the footer, and
`llms.txt`. Nav's last item is the log itself (`external: true` opens a
new tab).

## Scan (`/scan`)

Name: “Where is the time going?” — not diagnostic, intake agent, RAG, or wizard.
Logic is a pure function in `src/lib/scan.ts`. No model call on the public page.
Query-string restore: `/scan?a=shop&s=6-15&p=numbers&h=6-10&o=owner`.
If `POST /api/scan` is down, the page still computes locally.

## Deploy

Railway project `cerebral-frame` is the owner site. The Broadcast stays
its own Railway service (volume + ingest token) and takes
`log.cerebralframe.com`. Do not merge git repos. Do not merge Terrarium
or AttentionShield into this project. Do not mint a fourth live object.

```
PUBLIC_SITE_URL=https://cerebralframe.com
PUBLIC_PHONE=+18052368182
PUBLIC_EMAIL=Somapptic@gmail.com
FORM_TO=Somapptic@gmail.com
CALENDLY_URL=
```

If `calendly` is empty, Talk hides the embed. Do not ship a broken iframe.

Booking is self-built: `content/booking.yaml` + `src/lib/booking.mjs` + `POST /api/book`.
It emails an .ics to FORM_TO (Somapptic butler inbox). Add events to the
Google calendar named `Cerebral Frame Butler`, overlaid on the main calendar.
Do not add Calendly.

Video notes: phone `capture="user"` file input → `POST /api/note`. Private token URL.
Do not use Telegram/Signal/Gchat for public visitors.

About page link tree lives in `content/links.yaml`.

Custom domain needs CNAME + TXT. Canonical `https://cerebralframe.com`.

## Acceptance (short)

- Header phone is a `tel:` link, visible at 390×844, survives 200% zoom.
- `/scan` with JS produces a result; without JS, noscript + Talk links.
- `/sample` prints. `/card.vcf` downloads. `/llms.txt` and `/work.md` 200.
- Form ≤ 5 fields; success repeats the phone number.
- Footer has `How this site is built` → `/built-with`. Not in the header.
- No banned words in rendered HTML.
