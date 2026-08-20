# 🎮 Backlog Catalog

A single-file web app for tracking the video games you own, the ones you're playing, and the mountain of ones you keep meaning to finish.

**▶️ [Open the app](https://ccall1212.github.io/backlog-catalog/)** — no install, no account, works offline.

---

## What it does

- **Track every game** across PC, Xbox, PlayStation, Nintendo (or any platform you add). One game can live on several platforms at once.
- **One-click status** — mark a game *Finished* or *Started/Played* straight from the list.
- **Two ratings, because they mean different things:**
  - **Want to Play** — how much you're looking forward to it (for stuff you haven't played)
  - **Final Rating** — what you actually thought (unlocks once you've started it)
  - Anything above 7 gets highlighted so standouts pop.
- **Backlog views** — jump to *Not Finished*, *Finished*, or *Want to 100%* from the sidebar, with live counts.
- **Groups** — bundle a series together (Halo, Mass Effect, whatever). Grouped games get bracketed in the list and can be dragged into the order you want.
- **Genre tags** — label games RPG / FPS / RTS / etc. and filter by them when you're in the mood for something specific.
- **Multiplayer-only flag** — for games with no campaign to finish, so they don't clutter your backlog.
- **Stats** — totals, what you're playing now, completion counts, and averages per platform.
- **Edit in place** — double-click any cell to change it. No dialogs unless you want them.

## Your data stays yours

Everything saves **in your own browser**, on your own device. Nothing is uploaded, there's no server, no account, and no tracking. If you and a friend both open the link, you each get your own private library.

⚠️ **The flip side:** because it lives in your browser, clearing your browsing data will erase it. Click **Export JSON** now and then to save a backup file — the sidebar shows how long it's been since your last one and nags you (gently) after two weeks. **Import** restores it, on this device or any other.

**Export CSV** is also there if you'd rather poke at your library in Excel.

## Install it as an app

The site is a Progressive Web App — you can install it so it gets its own icon and
window and works fully offline:

- **Desktop (Edge/Chrome):** open the link, then click the install icon in the
  address bar (or menu → *Apps → Install Backlog Catalog*).
- **Android:** open the link in Chrome → menu → **Add to Home screen** / **Install app**.
- **iPhone/iPad:** open the link in Safari → Share → **Add to Home Screen**.

Updates arrive automatically: after a new release, the app picks it up the next
time you open it (it may take one extra reload).

## Using it on another device

There's no automatic sync. To move your library: **Export JSON** on one device → open the app on the other → **Import**.

## Running it yourself

Download `index.html` and open it in any browser. That's the whole app — one file, no dependencies, no build step. Fork it and make it your own if you like.

## Version

Current: **v1.11.0** — see the sidebar footer for the version you're running.

<sub>Built with Claude Code.</sub>
