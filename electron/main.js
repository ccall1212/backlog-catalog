// Electron main process for the Backlog Catalog desktop wrapper.
// The app itself is a single static HTML file with no server and no Node
// dependency, so this file only needs to open a window and behave like a
// normal desktop app around it.

const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    // Matches the app's own --bg color so the window doesn't flash white
    // while index.html is still loading.
    backgroundColor: '#0f1420',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
      // No preload script: the page is plain HTML/CSS/JS with no need to
      // talk to Node or the OS, so there is nothing to bridge.
    }
  });

  // Load the copy of index.html that lives next to this folder, not the
  // hosted GitHub Pages version, so the app works fully offline and always
  // matches whatever is checked out locally.
  win.loadFile(path.join(__dirname, '..', 'index.html'));

  // The app calls out to en.wikipedia.org, cdn.cloudflare.steamstatic.com,
  // and a Cloudflare Worker for Steam import. Electron allows outgoing
  // requests by default, so no extra configuration is needed here - just
  // avoid adding a CSP or session policy that would block them.

  // Any link that tries to open a new window (target="_blank", window.open,
  // etc.) should open in the user's normal browser instead of a second
  // Electron window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
