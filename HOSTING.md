# cerebralframe.com

Live box until DNS verifies: https://cerebral-frame-site-production.up.railway.app/

Intended public face:

| Host | Service | Railway project |
|---|---|---|
| `cerebralframe.com` | owner site | `cerebral-frame` / `cerebral-frame-site` |
| `www.cerebralframe.com` | 301 → apex (app + DNS) | same |
| `log.cerebralframe.com` | The Broadcast | `the-broadcast` / `the-broadcast` |

Do not merge git repos. Do not copy Broadcast into this Node process
(`/data` is video notes here, ingest history there). Do not pull
Terrarium, LikeLocal, Probate, or AttentionShield into this project.

Railway already has the apex and www custom domains. They 404 with
`x-railway-fallback` until ownership TXT is public. Certificate status:
validating ownership.

## Namecheap (Luke sits)

Delete parking page, URL redirect, and leftover A records on `@` and `www`.
No trailing dots unless Namecheap adds them.

| Type | Host | Value |
|---|---|---|
| CNAME | `@` | `zznbo46q.up.railway.app` |
| CNAME | `www` | `9ha99cqq.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=d341b07056d17c50bc122fa1d7fa37e79dc16d790b1fe3261c34ce7af5db8410` |
| TXT | `_railway-verify.www` | `railway-verify=cd4538d1df841d123b48967adbccd8f172f4c35d2b8437162cf02e30229fb918` |
| CNAME | `log` | `a47y93xr.up.railway.app` |
| TXT | `_railway-verify.log` | `railway-verify=f378ffb20a3d7e8881bb230992eb7dce55c10992066139b987ab7b891766f315` |

www CNAME is already propagated. Apex still has no CNAME (`currentValue` empty).
Both TXT rows were missing as of 2026-09-19.

After TXT is public: `railway domain certificate retry cerebralframe.com`
and the same for `www`. Then `curl -I https://cerebralframe.com/` is 200,
not a cert name mismatch.

## Volume

Site volume `cerebral-frame-site-volume` is attached at `/data` (bookings
+ private video notes). Broadcast already has its own `/data` on the
other project — leave it there. Do not copy ingest history onto this
volume.

## Mail

`FORM_FROM` stays `noreply@storbid.app` until `cerebralframe.com` is
verified on the same Resend team. Call and mailto work without that.

## Flip the About door

`content/links.yaml` keeps the Railway Broadcast URL until
`https://log.cerebralframe.com/healthz` returns 200. Then point the
door at `https://log.cerebralframe.com/`. Do not invent LIVE before that.
