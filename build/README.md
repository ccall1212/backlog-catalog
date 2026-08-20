# Build

The published app (`../index.html`) is **generated**, not edited directly.

## Source of truth

| File | What it is |
|---|---|
| `app_template.html` | The real source — the whole app, with a `/*__SEED__*/` marker inside `const SEED = [...]` |
| `build.ps1` | Fills that marker in and writes the outputs |

Edit `app_template.html`, run the build, commit the result.

## Running it

From the repo root, in PowerShell:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File build\build.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File build\build.ps1 -SkipSeed   # starter only
```

(`pwsh` works too if you have PowerShell 7; this repo is built with Windows PowerShell 5.1.)

Outputs:

1. **`../index.html`** — the *starter*: empty library, its own localStorage key
   (`backlogCatalog.starter.v1`). This is the only file GitHub Pages serves, and it
   contains **no personal data**.
2. **A personal copy** in `~/Downloads` — same app, pre-seeded from a spreadsheet.
   Skipped automatically if the spreadsheet isn't there.

The separate storage key matters: Chromium shares one localStorage bucket across *all*
`file://` pages, so without it, opening the starter locally would read and overwrite the
personal library.

No dependencies — the spreadsheet is read directly as zip + XML (no Excel, no Python).

## Releasing

1. Bump the version in **two** places in `app_template.html`
   (`<meta name="app-version">` and `const APP_VERSION`) **and** the `CACHE`
   name at the top of `../sw.js` (so installed PWAs drop their old cache).
2. Run the build.
3. Commit `index.html` (plus the template and `sw.js`) with a real message,
   e.g. `v1.8.0 - short summary`.
4. Push. GitHub Pages redeploys in about a minute; installed apps pick the new
   version up on their next open (sometimes one extra reload).

Verify what's actually live:

```
https://raw.githubusercontent.com/ccall1212/backlog-catalog/main/index.html
```

and check the `app-version` meta tag.
