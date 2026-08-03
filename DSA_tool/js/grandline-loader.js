/* Grand Line episodes — on-demand loading, one file per arc.
 *
 * The Top Interview 150 is a lot of writing, and shipping all of it to anyone
 * who opens a single episode would be rude on a phone. So each arc lives in its
 * own file under data/grandline/, and only the tiny index (id, title, number,
 * difficulty, arc) is loaded up front — enough to render every listing and every
 * Dojo menu. The arc file is fetched the moment you actually open one of its
 * episodes, and merged straight into window.EPISODES, so everything downstream
 * (episode-engine, the Dojo's quiz lookup) sees one uniform world.
 *
 * Consumed by episode.html, episodes.html and dojo.html.
 */
(function (root) {
  'use strict';

  var BASE = 'data/grandline/';
  var loading = {};   // group -> [callbacks], while its <script> is in flight
  var loaded = {};    // group -> true
  var failed = {};    // group -> Error; an arc file that is not written yet

  function index() { return root.GRANDLINE_INDEX || {}; }

  function entry(id) { return index()[id] || null; }

  /* Every episode id in the index, in roadmap order. */
  function ids() {
    var ix = index();
    return Object.keys(ix).sort(function (a, b) { return ix[a].ep - ix[b].ep; });
  }

  function have(id) {
    return !!(root.EPISODES && root.EPISODES[id]);
  }

  /* One <script> per URL, ever, however many callers ask for it. Everything
     on-demand in this course goes through here: arc files, and the two data
     files the Dojo only needs once a fight actually starts. */
  function script(url, key, cb) {
    if (loaded[key]) { cb(null); return; }
    /* A file that 404s is one nobody has written yet — remember that rather
       than re-requesting it on every click. */
    if (failed[key]) { cb(failed[key]); return; }
    if (loading[key]) { loading[key].push(cb); return; }
    loading[key] = [cb];

    var s = document.createElement('script');
    s.src = url;
    s.onload = function () {
      loaded[key] = true;
      var waiting = loading[key]; delete loading[key];
      waiting.forEach(function (fn) { fn(null); });
    };
    s.onerror = function () {
      failed[key] = new Error('could not load: ' + url);
      var waiting = loading[key]; delete loading[key];
      waiting.forEach(function (fn) { fn(failed[key]); });
    };
    document.head.appendChild(s);
  }

  function load(group, cb) {
    script(BASE + group + '.js', group, cb);
  }

  /* The 35 problems with no arc file keep their scene and their quiz in two
     generated files. Together they are ~160 KB of prose that most visits never
     touch, so nothing loads them until a fight needs one. */
  function loadLegacy(cb) {
    var left = 2, err = null;
    function done(e) { err = err || e; if (--left === 0) cb(err); }
    script('data/dojo-scenes.js', '@scenes', done);
    script('data/legacy-quizzes.js', '@quizzes', done);
  }

  /* ensure(id, cb) — hand back the full episode, fetching its arc if needed. */
  function ensure(id, cb) {
    if (have(id)) { cb(null, root.EPISODES[id]); return; }
    var e = entry(id);
    if (!e) { cb(new Error('unknown episode: ' + id)); return; }
    load(e.g, function (err) {
      if (err) { cb(err); return; }
      var ep = root.EPISODES && root.EPISODES[id];
      cb(ep ? null : new Error('arc loaded but episode missing: ' + id), ep);
    });
  }

  /* Load every arc — used by the validator and by anything that genuinely needs
     the whole set. Not used on a normal page view. */
  function loadAll(cb) {
    var groups = {};
    var ix = index();
    Object.keys(ix).forEach(function (id) { groups[ix[id].g] = true; });
    var names = Object.keys(groups), left = names.length;
    if (!left) { cb(null); return; }
    names.forEach(function (g) {
      load(g, function () { if (--left === 0) cb(null); });
    });
  }

  root.GrandLine = {
    index: index, entry: entry, ids: ids,
    ensure: ensure, load: load, loadAll: loadAll, loadLegacy: loadLegacy,
    isLoaded: function (g) { return !!loaded[g]; }
  };
}(typeof window !== 'undefined' ? window : this));
