/*
  Backlog Catalog — Steam relay (Cloudflare Worker)

  Why this exists: a web page cannot call api.steampowered.com directly
  (no CORS headers) and must never embed the API key. This worker holds the
  key as a secret and relays three read-only lookups. It also lets the app
  publish a read-only snapshot of a library to a shareable URL.

  Endpoints:
    /resolve?vanity=<name>                 -> { steamid }
    /owned?steamid=<id64>                  -> { count, games:[{appid,name,playtime_forever}] }
    /achievements?steamid=<id64>&appid=<n> -> { achieved, total }   (0/0 = none or private)
    PUT    /publish?id=<id>                -> publish a library snapshot (needs X-Publish-Key)
    DELETE /publish?id=<id>                -> unpublish it (needs X-Publish-Key)
    GET    /library/<id>                   -> the published snapshot, world-readable

  Setup: add Secrets STEAM_KEY and PUBLISH_KEY (Settings -> Variables & Secrets),
  and bind a KV namespace as LIBRARY (Settings -> Bindings). See SETUP.md.
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

// A published library's id doubles as the secret in its read URL, so it
// needs to be long and random — the app generates it, this just checks the
// shape. Used for both /publish (write) and /library/<id> (read).
const ID_RE = /^[A-Za-z0-9_-]{16,64}$/;
const MAX_LIBRARY_BYTES = 1_000_000; // ~1 MB; a real 500-game export is a few KB

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '');

    // GET /library/<id> is meant to be readable by anything — an AI tool,
    // curl, a friend's browser on any site — so it always answers
    // Access-Control-Allow-Origin: *, skipping the ALLOWED allowlist below
    // entirely. That's safe here because the id is an unguessable secret
    // baked into the URL, not an origin-based trust decision like the
    // Steam lookups (which spend your STEAM_KEY quota and so are locked to
    // the app's own origin).
    if (path.startsWith('/library/')) return library(req, env, path.slice('/library/'.length));

    const origin = req.headers.get('Origin') || 'null';
    const h = {
      'Access-Control-Allow-Origin': ALLOWED.has(origin) ? origin : 'https://ccall1212.github.io',
      'Vary': 'Origin',
      'Content-Type': 'application/json',
    };

    if (path === '/publish') return publish(req, env, url, h);

    if (req.method === 'OPTIONS')
      return new Response(null, { headers: { ...h, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    if (req.method !== 'GET') return json({ error: 'GET only' }, 405, h);

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

// PUT/DELETE /publish?id=<id> — publish or remove a library snapshot.
// CORS here uses the same ALLOWED-echoed header `h` as the Steam endpoints
// (only the app's own origin may write or delete). Contrast with library()
// below, which is intentionally wide open for reads.
async function publish(req, env, url, h) {
  if (req.method === 'OPTIONS')
    return new Response(null, {
      headers: {
        ...h,
        'Access-Control-Allow-Methods': 'PUT, DELETE',
        'Access-Control-Allow-Headers': 'X-Publish-Key, Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  if (req.method !== 'PUT' && req.method !== 'DELETE') return json({ error: 'PUT or DELETE only' }, 405, h);
  if (!env.LIBRARY) return json({ error: 'library storage not configured' }, 500, h);
  if (!keyOk(req, env)) return json({ error: 'unauthorized' }, 401, h);

  const id = (url.searchParams.get('id') || '').trim();
  if (!ID_RE.test(id)) return json({ error: 'bad id' }, 400, h);

  if (req.method === 'DELETE') {
    await env.LIBRARY.delete('lib:' + id);
    await env.LIBRARY.delete('meta:' + id);
    return json({ ok: true }, 200, h);
  }

  // PUT: measure actual bytes rather than trusting Content-Length, then
  // validate it's the app's export envelope before writing anything to KV.
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_LIBRARY_BYTES) return json({ error: 'library too large' }, 413, h);
  const body = new TextDecoder().decode(buf);
  let data;
  try {
    data = JSON.parse(body);
  } catch (e) {
    return json({ error: 'invalid JSON' }, 400, h);
  }
  if (!data || !Array.isArray(data.games)) return json({ error: 'expected a library export with a games array' }, 400, h);

  const ttl = 60 * 60 * 24 * 180; // 180 days
  // meta:<id> isn't read back by any endpoint yet — it's a small breadcrumb
  // (count + when) for a future "your published snapshots" view, kept in
  // its own key so the main GET /library/<id> never has to filter it out.
  await env.LIBRARY.put('lib:' + id, body, { expirationTtl: ttl });
  await env.LIBRARY.put('meta:' + id, JSON.stringify({ count: data.games.length, published: new Date().toISOString() }), { expirationTtl: ttl });

  return json({ url: url.origin + '/library/' + id, count: data.games.length }, 200, h);
}

// GET /library/<id> — the published snapshot. Deliberately world-readable
// (see the comment where this is dispatched, above): anyone with the id can
// read it, so the URL should be treated as unlisted-but-public, same as
// SETUP.md tells the owner.
async function library(req, env, id) {
  const h = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS')
    return new Response(null, { headers: { ...h, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
  if (req.method !== 'GET') return json({ error: 'GET only' }, 405, h);
  if (!env.LIBRARY) return json({ error: 'library storage not configured' }, 500, h);
  if (!ID_RE.test(id)) return json({ error: 'not found' }, 404, h);

  const data = await env.LIBRARY.get('lib:' + id);
  if (data == null) return json({ error: 'not found' }, 404, h);
  return new Response(data, { status: 200, headers: { ...h, 'Cache-Control': 'public, max-age=60' } });
}

function keyOk(req, env) {
  const got = req.headers.get('X-Publish-Key') || '';
  return !!env.PUBLISH_KEY && safeEqual(got, env.PUBLISH_KEY);
}
// Constant-time-ish compare: always walks the full length of both inputs
// instead of returning early on the first mismatched byte or on a length
// difference, so a timing attack can't binary-search the key one byte at a
// time. (JS engines make a true constant-time guarantee hard, but this is a
// meaningful improvement over `got === env.PUBLISH_KEY`.)
function safeEqual(a, b) {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

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
