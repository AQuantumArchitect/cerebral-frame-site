# Cerebral Frame site

Owner-facing site for Cerebral Frame. Two words always. Not a Broadcast console.

## Install, dev, build

```bash
nvm use           # Node 22, or any >= 20
npm install
npm run dev       # http://localhost:4321
npm test          # scan rules
npm run build
npm start         # serves dist/ on $PORT (default 3000)
npm run test:e2e  # playwright against the built server
```

Content lives in `content/`. Components do not contain sentences. Scan logic is `src/lib/scan.ts`.

## Deploy

Railway project `cerebral-frame` serves this site. The Broadcast is a
second service on the same company domain (`log.cerebralframe.com`),
not a console skin of these pages. See `HOSTING.md`.

```bash
railway up --detach -m "ship site"
```

Env: `PUBLIC_SITE_URL`, `PUBLIC_PHONE`, `PUBLIC_EMAIL`, `FORM_TO`, optional `CALENDLY_URL`, `RESEND_API_KEY`, and `FORM_FROM` (verified Resend domain; currently `noreply@storbid.app` until cerebralframe.com is on the same account).

Canonical domain: `https://cerebralframe.com` (CNAME + TXT at the DNS host). Until DNS is attached, use the Railway URL.

## Domain

Apex `cerebralframe.com`, `www` 301 to apex. Log `log.cerebralframe.com`.
Phone in the header is the product. Custom host 404s until Namecheap TXT
ownership rows are public — Railway URL is the live box until then.
