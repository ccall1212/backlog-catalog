# Backlog Catalog desktop wrapper

This folder wraps `index.html` in an [Electron](https://www.electronjs.org/) shell so it can run
as a regular desktop app with its own icon and window, instead of a browser tab.

**This is entirely optional.** The app already works as a website and as an installable
Progressive Web App (see the main [README](../README.md)). Nothing here changes `index.html`
itself — this folder just points a desktop window at the same file. If you're not sure you
need this, read the "should you bother?" section near the bottom before installing anything.

## Prerequisite: Node.js (on a personal machine)

Building and running this requires [Node.js](https://nodejs.org/) (the LTS version) and the
`npm` command that comes with it.

Do this on a **personal machine**, not the work laptop. The work laptop's SentinelOne EDR
tends to flag or quarantine the files that `npm install` creates (lots of small files under
`node_modules`), which makes dev tooling like this more trouble than it's worth. On a personal
machine there's nothing to fight.

1. Go to [nodejs.org](https://nodejs.org/) and download the **LTS** installer for Windows.
2. Run the installer, accepting the defaults.
3. Open a new PowerShell window and confirm it worked:

   ```powershell
   node -v
   npm -v
   ```

   Both commands should print a version number.

## Set up this folder

Open a PowerShell window in this `electron` folder (or run `cd path\to\backlog-catalog\electron`
first), then install the dependencies:

```powershell
npm install
```

This downloads Electron and electron-builder into a new `node_modules` folder here. It only
needs to be done once (or again later if you delete `node_modules`).

## Run it

```powershell
npm start
```

This opens Backlog Catalog in its own window, loaded from the local `../index.html` file. No
internet connection is needed to open the app itself, though cover art lookups and Steam import
still need one, same as in a browser.

## Build an installer

```powershell
npm run dist
```

This produces a Windows installer (`.exe`) inside a new `dist` folder here. That file is what
you'd hand to someone else, or run yourself to install the app without needing Node or npm
again afterwards.

## Should you bother?

Honestly, probably not, unless you specifically want a taskbar icon and a real installer. A few
things worth knowing before you spend time on it:

- **The hosted app already installs like an app, for free.** Open
  [the GitHub Pages site](https://ccall1212.github.io/backlog-catalog/) in Edge or Chrome and
  use the browser's "Install" option (see the main README). You get the same standalone window
  and icon, with automatic updates, and none of the Node/npm setup above.
- **An unsigned `.exe` looks scary to other people.** Because this installer isn't signed with a
  paid code-signing certificate, Windows SmartScreen will warn anyone you share it with that the
  app is from an "unknown publisher," and they'll need to click through a warning to run it. For
  your own use that's a one-time click; for sharing with someone else it's a harder sell than a
  link to a website.
- **The real reasons to reach for Electron** would be things a browser tab genuinely can't do,
  like running a background/scheduled sync job even when the app isn't open, or reading and
  writing files on disk directly. This scaffold doesn't add either of those yet — it's just the
  same page in a desktop-shaped window.

## Data note: this copy has its own storage

The Electron window and your browser are two separate environments as far as the app is
concerned, so they each get their own private `localStorage`. Adding a game in the browser
version will **not** show up in the Electron version, or vice versa - they don't sync
automatically.

To move your library between them, use the app's own **Export JSON** button on one side and
**Import** on the other, the same way you'd move data between two different computers.
