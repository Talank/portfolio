/* Service worker for the DSA course (registered by js/app.js on every page).

   Strategy: stale-while-revalidate for every same-origin GET. The first
   visit fills the cache; afterwards every page, script, deck, and narration
   clip is served instantly from disk while a background fetch refreshes the
   cached copy — so an edit deployed to GitHub Pages shows up on the next
   reload after it, and the whole course keeps working offline.

   Media elements request audio with Range headers. We always fetch and cache
   the full file under a range-less key, then slice the requested window out
   ourselves (Safari insists on a real 206 for its bytes=0-1 probe). */

const CACHE = 'dsa-tool-v1';

// schedule.js assigns to window.SCHEDULE; alias window so it loads in the
// worker too — it is the single source of truth for deck ids. If it ever
// fails here the worker still runs; only the precache list shrinks.
self.window = self;
try { importScripts('data/schedule.js'); } catch (e) { /* precache shell only */ }

// The app shell + every presentation deck (~1.5MB, fetched in the background
// at install). Narration audio is deliberately NOT precached (100MB+); it is
// cached clip-by-clip as slides play / warm up.
const PRECACHE = [
  'index.html', 'presentation.html', 'episodes.html', 'episode.html',
  'pattern.html', 'mock-interview.html', 'cheat-sheet.html', 'pythonic-idioms.html',
  'css/style.css', '../shared/auth-ui.css',
  '../shared/supabase-client.js', '../shared/auth-ui.js',
  'js/app.js', 'js/visuals.js', 'js/presentation-engine.js', 'js/episode-engine.js',
  'js/audio-engine.js', 'js/voice-engine.js', 'js/story-anim-engine.js',
  'js/viz-engine.js', 'js/graph-viz-engine.js', 'js/quiz-engine.js', 'js/pattern-loader.js',
  'data/schedule.js', 'data/characters.js', 'data/episodes.js', 'data/story-anims.js',
  'data/nepali/audio/manifest.js', 'data/english/audio/manifest.js', 'data/episodes/audio/manifest.js',
].concat(
  (self.SCHEDULE || []).map((m) => 'data/nepali/' + m.id + '.js'),
  (self.SCHEDULE || []).map((m) => 'data/english/' + m.id + '.js'),
  (self.SCHEDULE || []).filter((m) => m.type === 'pattern').map((m) => 'data/patterns/' + m.id + '.js')
);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      // add() one-by-one so a single 404 can't abort the whole precache
      Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function sliceForRange(request, response) {
  const m = /bytes=(\d+)-(\d+)?/.exec(request.headers.get('range') || '');
  if (!m) return response;
  const body = await response.arrayBuffer();
  const start = Number(m[1]);
  const end = m[2] ? Math.min(Number(m[2]), body.byteLength - 1) : body.byteLength - 1;
  if (start >= body.byteLength) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${body.byteLength}` },
    });
  }
  return new Response(body.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || '',
      'Content-Range': `bytes ${start}-${end}/${body.byteLength}`,
      'Content-Length': String(end - start + 1),
    },
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Key pages by pathname only: presentation.html?id=X is the same document
    // as the precached presentation.html. Other assets keep their full URL.
    // Audio keys are also range-less: one full body per URL.
    const isDoc = req.mode === 'navigate' || req.destination === 'document';
    const key = new Request(isDoc ? url.origin + url.pathname : url.href);
    const cached = await cache.match(key);
    const refresh = fetch(key).then((res) => {
      if (res && res.ok) cache.put(key, res.clone());
      return res;
    }).catch(() => undefined);
    const res = cached || await refresh;
    if (!res) return Response.error();
    return req.headers.get('range') ? sliceForRange(req, res.clone()) : res.clone();
  })());
});
