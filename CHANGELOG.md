# Changelog

All notable changes to Backlog Catalog are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/); versions follow [Semantic Versioning](https://semver.org/).

## [1.24.0] - 2026-08-27
### Added
- The missing-cover-art banner can now filter the view down to just the
  games without art (Show them / Show all, in both grid and list), and can
  be dismissed with an X - it stays quiet until more games are missing
  than when it was dismissed. Cover tools remain in Settings either way.

### Fixed
- Dialogs no longer close when a text-selection drag is released outside
  them. A click's target is the common ancestor of the mouse-down and
  mouse-up, so releasing a selection over the backdrop counted as clicking
  it; a backdrop click now closes a dialog only if the press started there
  too. Applied to all nine dialogs.
- Clicking empty space in the edit dialog no longer edits the game. A
  label forwards clicks to its first labelable descendant, and buttons
  qualify - so clicking the word "Tags", a hint, or the padding removed the
  first tag, toggled the first platform, or set Finished to Yes. The
  forwarding is now cancelled when the label's control is a button, while
  labels wrapping an input or select still focus it as normal.

## [1.23.0] - 2026-08-21
### Changed
- A Settings area lives bottom-left in the sidebar (the desktop-app
  pattern): theme, Import, both exports, and cover art management moved
  there. The ... toolbar menu is gone; + Create group returns to the
  toolbar.
- Grid view shows a small banner when games are missing cover art, with a
  Find covers button right where the gaps are visible.

## [1.22.0] - 2026-08-21
### Changed
- De-clunking pass, from reviewer feedback that the app felt busy:
  the toolbar shrinks from twelve controls to search, Filter, Grid,
  Pick for me, and Add - filters fold into a panel (the button lights up
  when any filter is active) and rarer actions move to a ... menu.
- Finished / Started / Replayable are tap toggles (Yes / No / N/A) instead
  of fields you type Yes into; tapping the same value clears it.
- Browser alert() popups replaced with a quiet toast in the corner.
- The Cover image URL field left the Add/Edit dialog - covers are managed
  from the right-click menu and the type-ahead.

## [1.21.0] - 2026-08-21
### Added
- Type-ahead when naming a game: start typing in the Game field and
  suggestions appear with cover thumbnails. Picking one fills in the
  correctly-spelled title and its cover in a single step. Arrow keys and
  Enter work; Escape closes the list without closing the dialog.

## [1.20.0] - 2026-08-21
### Added
- Playtime from Steam is now kept: hours show under each game in the list,
  and the previous reading is retained so "played since last sync" is
  answerable.
- Optional sync-on-open: remember a Steam profile and re-sync at most once
  a day when the app opens. Failures are silent so a bad sync never blocks
  getting to the library.
- Choose cover from list: right-click a game to see every image Wikipedia
  returned and pick the right one. A deliberate choice is kept through
  re-lookups and bulk clears.
- Publish a read-only snapshot of the library to a URL (Cloudflare Worker +
  KV). Point an AI agent at it, or share it with a friend. Unlisted rather
  than private, and revocable. Needs one-time setup, see steam-relay/SETUP.md.
- electron/: an optional desktop wrapper scaffold. Not built or required -
  the hosted PWA installs with none of the hassle.

## [1.19.2] - 2026-08-21
### Fixed
- Every game ended up with the same cover art. The service worker matched
  cached responses with `ignoreSearch`, which drops the query string - and
  every Wikipedia API call shares one path (`/w/api.php`), differing only in
  its query. The first lookup's response was therefore replayed for every
  game after it. The worker now ignores cross-origin requests entirely and
  only caches this site's own files.

## [1.19.1] - 2026-08-21
### Fixed
- Bumped the version so the service worker cache name changes. v1.19.0 was
  rebuilt several times while the cover matcher was being corrected, all under
  the same version, so a browser that cached an early build kept serving it.

## [1.19.0] - 2026-08-21
### Added
- Cover art. Steam-imported games use their store art directly from the app
  id; everything else is looked up on Wikipedia; anything unmatched falls
  back to an initials tile. Thumbnails appear in the list view and full box
  art in the new grid view.
- Grid view toggle, with groups shown as folder tiles that open on click.
- First-run welcome screen offering Steam import, paste, add a game, or a
  sample library, instead of an empty table.
- Right-click any game for quick actions: edit, look up cover again, set a
  cover URL, clear the cover, delete.
- Cover art dialog showing where every cover came from, with bulk clear
  options that preserve Steam art and hand-set covers.
### Changed
- App-like styling: rounded cards, lift on hover, press feedback, frosted
  toolbar.

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
