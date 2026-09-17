# Cerebral Frame site — agent notes

This file is the friction killer. The full plan lives in the originating
build doc; if that doc and this file disagree, the build doc wins. If this
file and Broadcast disagree, this file wins.

## What this is

Owner-facing site for Cerebral Frame. Two words always. Never “Cerebral”
alone. Never “Brain Frame.” Never a Broadcast console skin.

Primary visitor: owner of a small brick-and-mortar company (often 50+,
phone-first, not technical). Secondary: a technical buyer who wants proof
we ship.

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
- Locked facts you may state: Luke Spooner · Camarillo, CA · (805) 236-8182 ·
  physicist by training · years in Southern California manufacturing and
  technical sales · work in person in Ventura County or by video.
- Contact email for v1: `Somapptic@gmail.com` (temporary; `luke@cerebralframe.com` later).
- Homepage may mention AI once, late, in owner language. Do not lead with
  “AI automation engineer.” Do not use “Fractional CTO” as H1.

## Banned

Broadcast console UI, Strand Theory, quantum titles, moonshot finance,
memetic-weapons copy, hover-only nav, cookie walls, chat widgets, autoplay,
stock handshakes, neuron logos, “Cerebral” alone, “Brain Frame.”

Do not scrape resumes. Do not scrape Broadcast UI components.

## Scan (`/scan`)

Name: “Where is the time going?” — not diagnostic, intake agent, RAG, or wizard.
Logic is a pure function in `src/lib/scan.ts`. No model call on the public page.
Query-string restore: `/scan?a=shop&s=6-15&p=numbers&h=6-10&o=owner`.
If `POST /api/scan` is down, the page still computes locally.

## Deploy

Own Railway project `cerebral-frame`, isolated from Broadcast.

```
PUBLIC_SITE_URL=https://cerebralframe.com
PUBLIC_PHONE=+18052368182
PUBLIC_EMAIL=Somapptic@gmail.com
FORM_TO=Somapptic@gmail.com
CALENDLY_URL=
```

If `calendly` is empty, Talk hides the embed. Do not ship a broken iframe.

Custom domain needs CNAME + TXT. Canonical `https://cerebralframe.com`.

## Acceptance (short)

- Header phone is a `tel:` link, visible at 390×844, survives 200% zoom.
- `/scan` with JS produces a result; without JS, noscript + Talk links.
- `/sample` prints. `/card.vcf` downloads. `/llms.txt` and `/work.md` 200.
- Form ≤ 5 fields; success repeats the phone number.
- Footer has `How this site is built` → `/built-with`. Not in the header.
- No banned words in rendered HTML.
