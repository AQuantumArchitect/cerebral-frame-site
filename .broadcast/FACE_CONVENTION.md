# The face convention — how a project tells The Broadcast what is true

The Broadcast is the central place where Luke and his agents read the **current state** of every
project and the **bearing** it is steering toward. Those two layers have different authors and
different speeds, so they live in different files:

| layer | file | author | speed | grade |
|---|---|---|---|---|
| **Bearing** — what this ship is for, what is real, where it goes next | `public/data/nodes.json` in the-broadcast (`whatItIs`, `whatsReal`, `nextBearing`, `longBearing`) | Luke, by hand | slow | stated |
| **Face** — what is true in the repo right now | `.broadcast/face.json` in the project's own repo, default branch | the agents working in that repo | fast | observation about itself (η 0.25 toward anyone else) |
| **Notes** — anything worth saying that is not a number | `.broadcast/notes/YYYY-MM-DD-<slug>.md` in the repo; or `inbox/` in the-broadcast for projects with no repo | agents | as it happens | claim 0.25 |

The Broadcast reads faces, draws the gap between face and bearing, and stamps every value with
its age. **Adapters never promote**: a face moves no status word, mints no money, and can only be
rendered, aged, and compared. Status moves by referee or by Luke.

## `.broadcast/face.json`

A face is a `frame/1` document (see `docs/FRAME_SCHEMA.md`) whose `subject` is the node id on
the Broadcast and whose `producer.kind` is `face`. Keep it small: five to nine nodes.

```json
{
  "schema": "frame/1",
  "subject": "umwelt",
  "as_of": "2026-10-16T20:00:00Z",
  "stale_after_s": 604800,
  "law": "a value nobody measured is null and renders dark, never zero",
  "producer": {"name": "umwelt", "kind": "face", "actor": "fable-51"},
  "nodes": [
    {"id": "status", "label": "Status word", "value": "IN BUILD", "state": "current", "age_s": 0,
     "source": "the-broadcast casting", "note": "only Luke or a referee moves this"},
    {"id": "last_proof", "label": "Last proof that ran", "value": "proofs/frame_export.py", "state": "current", "age_s": 0,
     "source": "proofs/receipts/frame_export.json"},
    {"id": "last_sentence", "label": "What the last proof said", "value": "19 dark → 18 current after one synthetic day; field hash unchanged",
     "state": "current", "age_s": 0, "source": "proofs/receipts/frame_export.json"},
    {"id": "open_dams", "label": "Things only Luke can do", "value": 2, "unit": "dams", "state": "current", "age_s": 0,
     "source": "open PRs awaiting merge"},
    {"id": "earning_usd", "label": "Earned", "value": null, "state": "dark", "age_s": null,
     "source": "never measured here"},
    {"id": "bearing_now", "label": "What the agents are steering toward this week", "value": "S3 boots the hive as an Umwelt world",
     "state": "current", "age_s": 0, "source": "AGENTS.md"}
  ]
}
```

### Rules

1. **Ages are relative to `as_of`.** Write `age_s: 0` for a thing you just checked. The Broadcast
   adds `(now − as_of)` at serve time, so a face that nobody has touched for three weeks shows
   three weeks old on every node. That is the point.
2. **Null is honest.** If you do not know a value, write `null` and `state: "dark"`. Never write 0
   for a thing you did not count.
3. **No secrets, no wet.** No tokens, mail bodies, house sensor streams, ρ, or runway numbers.
   Faces are public-shaped even in private repos.
4. **Recommended nodes** (use these ids where they apply so faces compare across ships):
   `status`, `last_proof`, `last_sentence`, `open_dams`, `earning_usd`, `customer_use`,
   `live_url`, `bearing_now`. Add project-specific nodes freely.
5. **One face per repo, on the default branch.** Update it in the same commit as the work it
   describes, or in a trailing commit by the agent that did the work. A face that lies is worse
   than a stale face; a stale face is visibly stale.
6. **`status` is a mirror, not a lever.** Copy the casting's status word into the face so the gap
   is visible; changing it in the face changes nothing on the Broadcast.

## Notes

`.broadcast/notes/2026-10-16-first-sentence.md`: a few paragraphs, dated in the filename, with a
one-line front matter `claim: 0.25` and `actor:`. The Broadcast lists the most recent note per
ship on its card. Projects without a repo put the same file under `inbox/<project>/` in
the-broadcast via PR; the ledger treats it as a proposed claim.

## How the Broadcast reads it

The fleet instrument (`fleet.js`) already reads each repo's public record hourly. It also fetches
`.broadcast/face.json` from the default branch. Public repos need nothing. Private repos appear
when `GITHUB_TOKEN` (read-only, contents scope) is set on the Broadcast's Railway service — that
is a Luke dam — or when the repo's own CI POSTs the face to `/api/ingest` under `faces.<subject>`.

On a card: the face renders as a compact Frame under **What is true now (face)** with the age of
the face, above the hand-written **What is real (stated)** block. The **Bearings** screen lists
every ship: face age · face `bearing_now` · casting `nextBearing`, so the gap is one table.
