# Steam relay — one-time setup (~6 minutes, all in the browser)

The app's **Import from Steam** button needs a tiny relay because web pages
can't call Steam's API directly. You deploy it once on Cloudflare's free tier
and never touch it again.

> ⚠️ The Steam API key is a secret. It goes in exactly ONE place (step 3).
> Never paste it into chat, a file, or the app.

> **Before you start:** the Steam account you register the key on must have
> spent $5+ on Steam at some point — that's Steam's own requirement, not
> ours. If you're not sure, try step 1 first; it'll tell you right away.

## 1. Get a Steam API key (1 min)
1. Go to https://steamcommunity.com/dev/apikey (signed in to Steam).
2. Domain name: `ccall1212.github.io` (it isn't enforced, anything works).
3. Register → copy the key somewhere temporary like a password manager.

## 2. Create the Worker (3 min)
1. Sign up / sign in (free): https://dash.cloudflare.com
2. Left sidebar → **Workers & Pages** → **Create** → **Create Worker**.
3. Name it `backlog-catalog` → **Deploy** (deploys a hello-world first).
4. Click **Edit code**, delete everything, paste the full contents of
   `worker.js` from this folder → **Deploy**.

## 3. Add the key as a secret (1 min)
1. Back on the worker's page → **Settings** → **Variables & Secrets** → **Add**.
2. Type: **Secret** · Name: `STEAM_KEY` · Value: your API key → Save.
3. ⚠️ **Saving the secret only creates a new *version* — it does not go live
   on its own.** Open the **Deployments** tab: if the version serving 100% of
   traffic isn't the newest one (the row labelled *"Add secret: STEAM_KEY"* in
   Version History), click the **•••** menu on that newest row and **deploy /
   promote** it. Until you do, the worker runs the old code with no key and
   every request returns `{"error":"steam request failed"}`.

## 4. Wire the app (30 sec)
Copy the worker URL shown on its overview page, e.g.
`https://backlog-catalog.<your-subdomain>.workers.dev` — the URL itself is safe
to share. Give it to Claude to bake into the app (it goes in the
`STEAM_PROXY` constant in `build/app_template.html`), or set it locally in
DevTools: `localStorage.setItem('gamesLibrary.v1.steamRelay','<url>')`.

## 5. Steam privacy (for anyone being imported)
Steam profile → **Edit Profile → Privacy Settings**:
- **My profile**: Public
- **Game details**: Public
Otherwise Steam returns an empty library / no achievements.

## Sanity test
Open `https://backlog-catalog.<you>.workers.dev/resolve?vanity=SpartanCall`
in a browser — you should get JSON with a `steamid`. Then, **on the live
site** (`https://ccall1212.github.io/backlog-catalog/`), the app's
**Import → Import from Steam** should work end to end.

## Notes
- Free tier allows 100,000 requests/day; a full import of a 500-game library
  uses a few hundred, and results are cached (owned 5 min, achievements 1 h).
- The worker only answers requests from origins listed in `ALLOWED` at the
  top of `worker.js` — by default just the live app
  (`https://ccall1212.github.io`). It deliberately does **not** allow the
  local file:// copy (that origin, literally the string `'null'`, is also
  what any attacker-controlled webpage sends, so allowing it would let
  strangers burn your API quota through your worker). That means **Import
  from Steam only works on the live site** — the local copy shows a message
  pointing you to **Paste from Steam** instead, which needs no relay at all.
- Fork users: `ALLOWED` is a `Set` of exact origin strings — the scheme +
  host only, no path and no trailing slash, e.g. `'https://myapp.com'` (not
  `'myapp.com'` or `'https://myapp.com/'`). Replace the existing entry with
  your own GitHub Pages (or other) origin and redeploy.
