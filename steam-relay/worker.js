/*
  Backlog Catalog — Steam relay (Cloudflare Worker)

  Why this exists: a web page cannot call api.steampowered.com directly
  (no CORS headers) and must never embed the API key. This worker holds the
  key as a secret and relays three read-only lookups.

  Endpoints:
    /resolve?vanity=<name>                 -> { steamid }
    /owned?steamid=<id64>                  -> { count, games:[{appid,name,playtime_forever}] }
    /achievements?steamid=<id64>&appid=<n> -> { achieved, total }   (0/0 = none or private)

  Setup: add a Secret named STEAM_KEY (Settings -> Variables & Secrets).
*/

// Exact-match allowlist of request Origins (full "https://host" strings, no
// path/trailing slash). Deliberately does NOT include 'null': that origin is
// also sent by any sandboxed <iframe> or data: page an attacker controls, so
// allowing it would turn this relay into an open proxy for anyone's Steam
// lookups against your STEAM_KEY quota. Consequence: the local file:// copy
// of the app can't use "Import from Steam" (it gets no CORS clearance) — use
// "Paste from Steam" there instead, which needs no relay at all.
const ALLOWED = new Set([
  'https://ccall1212.github.io', // the live app
]);

export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || 'null';
    const h = {
      'Access-Control-Allow-Origin': ALLOWED.has(origin) ? origin : 'https://ccall1212.github.io',
      'Vary': 'Origin',
      'Content-Type': 'application/json',
    };
    if (req.method === 'OPTIONS')
      return new Response(null, { headers: { ...h, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405, h);

    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');
    try {
      if (path === '/resolve') {
        const v = (url.searchParams.get('vanity') || '').trim();
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(v)) return json({ error: 'bad vanity' }, 400, h);
        const d = await steam(env, 'ISteamUser/ResolveVanityURL/v1', { vanityurl: v });
        const ok = d && d.response && d.response.success === 1;
        return json(ok ? { steamid: d.response.steamid } : { error: 'profile not found' }, 200, h, 3600);
      }
      if (path === '/owned') {
        const s = sid(url);
        if (!s) return json({ error: 'bad steamid' }, 400, h);
        const d = await steam(env, 'IPlayerService/GetOwnedGames/v1', { steamid: s, include_appinfo: 1, include_played_free_games: 1 });
        const g = (d && d.response && d.response.games) || [];
        return json({ count: g.length, games: g.map(x => ({ appid: x.appid, name: x.name, playtime_forever: x.playtime_forever || 0 })) }, 200, h, 300);
      }
      if (path === '/achievements') {
        const s = sid(url), a = url.searchParams.get('appid');
        if (!s || !/^\d{1,10}$/.test(a || '')) return json({ error: 'bad params' }, 400, h);
        const q = new URLSearchParams({ key: env.STEAM_KEY, steamid: s, appid: a });
        let r;
        try {
          r = await fetch('https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?' + q, { cf: { cacheTtl: 60 } });
        } catch (e) {
          return json({ error: 'steam request failed' }, 502, h);
        }
        // Steam answers exactly HTTP 400 for a game with no achievement schema —
        // that, and only that, is treated as "no achievements". Anything else
        // failing (outages, rate limits, malformed body) surfaces as a real
        // error instead of being cached for an hour as a false "0 achieved".
        if (r.status === 400) return json({ achieved: 0, total: 0 }, 200, h, 3600);
        if (!r.ok) return json({ error: 'steam ' + r.status }, 502, h);
        const d = await r.json().catch(() => null);
        const ps = d && d.playerstats;
        if (!ps || ps.success === false || !Array.isArray(ps.achievements)) return json({ achieved: 0, total: 0 }, 200, h, 3600);
        return json({ achieved: ps.achievements.filter(x => x.achieved === 1).length, total: ps.achievements.length }, 200, h, 3600);
      }
      return json({ error: 'unknown endpoint' }, 404, h);
    } catch (e) {
      return json({ error: 'steam request failed' }, 502, h);
    }
  },
};

function sid(url) {
  const s = (url.searchParams.get('steamid') || '').trim();
  return /^\d{17}$/.test(s) ? s : null;
}
function json(o, status, h, ttl) {
  const hh = { ...h };
  if (ttl) hh['Cache-Control'] = 'public, max-age=' + ttl;
  return new Response(JSON.stringify(o), { status, headers: hh });
}
async function steam(env, method, params) {
  const q = new URLSearchParams({ key: env.STEAM_KEY, ...params });
  const r = await fetch('https://api.steampowered.com/' + method + '/?' + q, { cf: { cacheTtl: 60 } });
  if (!r.ok) throw new Error('steam ' + r.status);
  return r.json();
}
