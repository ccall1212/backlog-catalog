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

1. Bump the version in **one** place: the `<meta name="app-version">` tag in
   `app_template.html`. The build syncs the `APP_VERSION` constant and the
   service worker cache name from it automatically.
2. Run the build.
3. Add an entry to `CHANGELOG.md`.
4. Commit with a [Conventional Commits](https://www.conventionalcommits.org/)
   message — `feat:` new user-facing behavior, `fix:` bug fixes, `docs:`,
   `ci:`, `build:`, `chore:` as appropriate, e.g.
   `feat: pick-for-me pool chooser (v1.17.0)`.
5. Tag the release (`git tag -a vX.Y.Z -m "summary"`) and push with
   `--follow-tags`. The Pages workflow deploys in about a minute; installed
   apps pick the new version up on their next open (sometimes one extra
   reload).

Verify what's actually live:

```
https://raw.githubusercontent.com/ccall1212/backlog-catalog/main/index.html
```

and check the `app-version` meta tag.
