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

  function load(group, cb) {
    if (loaded[group]) { cb(null); return; }
    /* An arc that 404s is an arc nobody has written yet — remember that rather
       than re-requesting it on every click. */
    if (failed[group]) { cb(failed[group]); return; }
    if (loading[group]) { loading[group].push(cb); return; }
    loading[group] = [cb];

    var s = document.createElement('script');
    s.src = BASE + group + '.js';
    s.onload = function () {
      loaded[group] = true;
      var waiting = loading[group]; delete loading[group];
      waiting.forEach(function (fn) { fn(null); });
    };
    s.onerror = function () {
      failed[group] = new Error('could not load arc: ' + group);
      var waiting = loading[group]; delete loading[group];
      waiting.forEach(function (fn) { fn(failed[group]); });
    };
    document.head.appendChild(s);
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
    ensure: ensure, load: load, loadAll: loadAll,
    isLoaded: function (g) { return !!loaded[g]; }
  };
}(typeof window !== 'undefined' ? window : this));
