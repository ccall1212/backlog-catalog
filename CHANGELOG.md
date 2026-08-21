# Changelog

All notable changes to Backlog Catalog are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [Semantic Versioning](https://semver.org/).

## [1.18.1] - 2026-08-20
### Fixed
- Export JSON no longer omits every game's rating. `stripId` had excluded a
  field called `rating` since it was a legacy name; v1.12.0 made `rating` the
  live field, so backups taken between then and now contain no ratings.
  Re-export any backup made before this version.
- CSV export columns realigned: the header still listed the removed Want to
  Play / Final Rating pair and two separate 100% columns (13 headers against
  11 values), shifting every column after "Want to 100%?".

## [1.18.0] - 2026-08-20
### Added
- Add a genre tag straight from the list: a `+` on each row's tag line opens a
  small picker (existing tags, the built-in genres, or a new one). Tags
  already on that game are omitted; Escape cancels.

## [1.17.1] - 2026-08-20
### Changed
- App script now runs in strict mode.
- Build script is the single source of version truth: bump the
  `app-version` meta tag once and the `APP_VERSION` constant and service
  worker cache name are synced automatically at build time.
- Repo hygiene: MIT license, this changelog, `.editorconfig`, README badges,
  and an explicit GitHub Actions deployment for Pages (replaces the
  branch-based builder that repeatedly stalled without error).

## [1.17.0] - 2026-08-20
### Added
- "Pick for me" opens a chooser: pick from the current page, Playing Now,
  Not Finished, Want to 100%, or all games — with an optional tag filter and
  live counts per pool. An impossible combination reports itself instead of
  silently doing nothing.

## [1.16.0] - 2026-08-20
### Added
- Every stat on the Stats page is clickable and jumps to the games it counts;
  platform rows jump to that platform's games. (Average rating is
  intentionally not clickable.)
- Playing Now (started, not finished) as a proper sidebar view with a count.
- "Pick for me": random unfinished game, weighted by rating.
- Phones: app version shown in the tip bar; the menu reveals counts, version,
  and backup age.

## [1.15.0] - 2026-08-20
### Changed
- Phone layout rebuilt: top bar is menu + title + Add; nav, theme, and toolbar
  fold behind the menu button; games render as labelled cards with no
  horizontal scrolling. First game visible at ~71px from the top (previously
  ~1500px).
### Fixed
- Removed leftover v1.5.0 mobile rules that forced the page 740px wide.

## [1.14.0] - 2026-08-20
### Changed
- First mobile layout pass: single-row scrollable nav pills, compact header,
  gridded toolbar. (Superseded by 1.15.0.)

## [1.13.0] - 2026-08-20
### Removed
- Steam import no longer checks achievements or auto-marks 100% — the
  per-game checks proved unreliable and slow. Import now adds the library and
  marks Started from playtime in a single request; 100% is a manual field.

## [1.12.0] - 2026-08-20
### Changed
- One `rating` field (1-10, no longer gated on having played) replaces
  Want to Play + Final Rating; existing data migrates preferring the
  post-play verdict.
- One tri-state 100% field (blank / Want / Yes) replaces
  Want to 100% + 100% Complete; the Backlog "Want to 100%" view is unchanged.

## [1.11.0] - [1.11.3] - 2026-08-20
### Added
- Import from Steam via a small Cloudflare Worker relay (deploy-once, key
  stored as a secret) and a zero-setup "Paste from Steam" alternative. Both
  merge non-destructively: they only add games, add the PC platform, and
  upgrade blank/No statuses.
### Fixed
- Review findings before release: N/A values survive imports; stale in-flight
  fetches can no longer overwrite a newer preview; preview counts match what
  Apply does; the relay's CORS allowlist no longer accepts the null origin;
  Steam outages aren't cached as "0 achievements".

## [1.10.0] - [1.10.1] - 2026-08-20
### Changed
- Multiplayer is a three-state field: none / Multiplayer + Story /
  Multiplayer only. Only "Multiplayer only" locks the status columns.

## [1.9.0] - 2026-08-20
### Changed
- Table slimmed from 11 to 9 columns: Want-to-100% became a title icon, both
  ratings share one displayed column, multiplayer moved toward tags.

## [1.8.0] - 2026-08-20
### Fixed
- Add/Edit form rows are uniformly spaced; Multiplayer is a labelled field.
### Added
- Table column separators and theme-aware row striping.

## [1.7.0] - [1.7.1] - 2026-08-20
### Added
- Installable PWA: web manifest, icons, and an offline-capable service worker
  with stale-while-revalidate updates.
### Fixed
- Sticky table header regression introduced by the mobile scroll container.

## [1.6.0] - 2026-08-20
### Added
- Five theme presets (Midnight, Light, Forest, Crimson, Slate), per-group
  accent colors, and automatic tag colors.

## [1.5.0] - 2026-08-20
### Added
- Mobile support: tap-to-edit, reorder buttons on touch, iOS viewport fixes.

## [1.4.0] - 2026-08-20
### Fixed
- Five audited issues: import format migration, silent merge-on-rename,
  stored XSS via imported ids, inline editor erasing nuanced values, and
  un-starting being reverted on reload.

## [1.3.0] - 2026-08-13
### Added
- Bulk-tag a whole group from its bracket.

## [1.2.0] - 2026-08-13
### Added
- Inline editing: double-click any cell.

## [1.1.0] - 2026-08-13
### Added
- First published version: sidebar navigation, groups with drag ordering,
  genre tags, JSON/CSV export, import, backup-age reminder, versioning.
