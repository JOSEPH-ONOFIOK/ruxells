Written for: anyone picking this repo up, including future you.

# RUXXELLS

A free-mint pixel-art PFP drop. The site is a 3D map of six floating rooms,
with an X-gated allowlist behind it.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 ·
react-three-fiber / three · framer-motion · react-icons

## The site

`/` is a descent. Six rooms are stacked on one vertical track behind the page,
and scrolling lowers you past them; each room's caption is an ordinary block
in the document flow beside it.

An earlier version orbited the six rooms as floating tiles you clicked. It
looked good and tested badly: people had to work out that the tiles were
clickable and that the camera could be steered before anything happened. The
3D here is decoration over a document instead of an interface to learn, so
the scrollbar, keyboard, trackpad and screen readers all work untouched.

| Piece | File | What it does |
| --- | --- | --- |
| World | [World.tsx](src/components/world/World.tsx) | The page, the fixed canvas, and the section per room |
| Shaft | [Shaft.tsx](src/components/world/Shaft.tsx) | The stack of rooms and the scroll-driven slide |

WebGL can't render on the server, so the whole world is behind a
`ssr: false` dynamic import in [WorldStage.tsx](src/components/WorldStage.tsx).

### The artwork

Each room is an animated sprite sheet with its background cut away, built from
the source GIFs by [cut-tiles.py](scripts/cut-tiles.py):

```bash
python3 scripts/cut-tiles.py    # needs Pillow
```

It flood-fills the background inward from the borders — a plain colour key
would punch holes through the artwork, because the sky colours also appear
inside the rooms — then keeps only the largest remaining island to drop
splatter that floats unattached, and packs every third frame into one
`8 x 5` sheet with a `.json` sidecar naming the grid.

That is 69MB of GIF down to about 300KB per room. The originals live in
`assets-source/` and are **not** committed; the generated sheets in
`public/sectors/` are. Re-run the script if the source art changes.

The tiles are stepped with UV offsets rather than played as video: one texture
upload, no decoder, no autoplay permission, and it loops seamlessly.

### Quality

Phones get a different build of the scene, chosen once per mount in
[use-quality.ts](src/components/world/use-quality.ts) from pointer type and
core count rather than screen width — a narrow desktop window has a real GPU
behind it, a large tablet may not.

| | full | lite |
| --- | --- | --- |
| Rooms | 40-frame sheet | one 192px still |
| Texture VRAM | ~60MB | ~0.8MB |
| Download | 14MB | 344KB |
| Pixel ratio | up to 2 | 1 |
| Antialiasing | on | off |

The VRAM figure is what actually matters: six 2048x1280 sheets decode to more
than a mid-range phone hands a browser tab, and the symptom is a permanently
janky camera rather than a slow load. Reduced-motion also selects lite.

## The allowlist

`/clearance` is the door. The flow is: connect X → clear four channels →
submit a wallet → get a clearance code.

**Connect X** is OAuth 2.0 with PKCE ([x-oauth.ts](src/lib/x-oauth.ts)). The
callback exchanges the code, reads `/2/users/me`, and stores *only* the
identity in an HMAC-signed, httpOnly cookie
([x-session.ts](src/lib/x-session.ts)) — the access token is never persisted.
The handle on a submission comes from that session, never from the request
body, so nobody can claim an account they don't control.

### What is and isn't verified

The quote channel is the gate, because it is the one step X lets us check
without a paid API tier. The post is read back through the syndication
endpoint ([x-verify.ts](src/lib/x-verify.ts)) and checked for real authorship
and the required phrase; the channels after it stay sealed and submit stays
disabled until it passes. Pasting someone else's post URL with your own handle
in the path fails, because the author comes from X's response rather than the
URL.

Follows, likes and reposts cannot be read on the free tier, so those three are
attestations — but they can't be used to skip the enforced one. Every
submission stores the verified X user id, so the sheet can be audited after
the fact.

## Storage

Submissions go to a Google Apps Script web app when
`GOOGLE_SHEETS_WEBAPP_URL` is set. The local `data/allowlist.json` fallback is
development only: a serverless filesystem is read-only, so anything written
there in production is lost with the instance.

## Running it

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill it in. Everything is optional for
a local run — with no X credentials the connect step is skipped and the handle
you type is taken at face value.

| Variable | Needed for |
| --- | --- |
| `X_CLIENT_ID` / `X_CLIENT_SECRET` | The connect-X step. App permissions **Read**, type **Web App** |
| `SESSION_SECRET` | Signing the session cookie. 32+ random chars, **required in production** |
| `GOOGLE_SHEETS_WEBAPP_URL` | Durable storage. **Required in production** |
| `NEXT_PUBLIC_SITE_URL` | Only on a non-Vercel host; Vercel infers it |

Register both callbacks on the X app:
`https://<your-domain>/api/x/callback` and
`http://localhost:3000/api/x/callback`. X compares them byte for byte.

## Before launch

- [ ] Set `X_ACCOUNT` and `ACCEPTED_POST_IDS` in [quests.ts](src/lib/quests.ts)
      — both are placeholders. Without the post ids the gate can only require
      a quote of the account, not of that specific post.
- [ ] Set `DROP.closesAt` in [sectors.ts](src/lib/sectors.ts) to the real
      closing time. Every countdown reads from it and flips to closed on its
      own.
- [ ] Deploy a **new** Apps Script for this drop rather than reusing another
      project's — the counter and duplicate checks are per-sheet.
- [ ] Delete any test rows so the counter starts at 0.
