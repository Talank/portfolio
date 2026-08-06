/* Moominvalley, grown from a seed.
 *
 * The nine regions are not drawn tile by tile anywhere. Each one is described
 * in data/adventure/story.js as a handful of facts — base ground, some water
 * rectangles, a few trodden paths, the buildings, and how thickly to scatter
 * trees — and this file turns that into an actual grid every time the page
 * loads. Same seed, same valley, forever; a drawn 46x30 map would be a
 * kilobyte of art that still looked like a grid.
 *
 * The one thing generated maps get wrong is stranding you: a scatter of trees
 * lands across the only gap and a keeper is unreachable, and nothing throws.
 * So generation always ends with a flood fill from where you stand, and
 * anything important that the fill did not reach gets a path carved to it.
 * That check is cheap and it is the difference between a map you can trust and
 * one you have to test by hand nine times.
 *
 * Exposes window.MoominMap.build(region) -> a grid the engine can walk on.
 */
(function (root) {
  'use strict';

  var T = {
    GRASS: 0, STONE: 1, SAND: 2, SNOW: 3, PATH: 4,
    WATER: 5, TREE: 6, ROCK: 7, FLOWER: 8, MUSHROOM: 9,
    BRIDGE: 10, BLOCK: 11, TALLGRASS: 12, ICE: 13,
  };
  var SOLID = {};
  SOLID[T.WATER] = SOLID[T.TREE] = SOLID[T.ROCK] = SOLID[T.BLOCK] = true;

  var BASE = { grass: T.GRASS, stone: T.STONE, sand: T.SAND, snow: T.SNOW };

  /* Footprints, in tiles. Everything here blocks; the drawing is done by
     adventure-art from the prop list, so the grid only has to say "no". */
  var FOOTPRINT = {
    house: [5, 4], mill: [4, 4], lighthouse: [3, 5], palace: [5, 4],
    ship: [5, 4], tower: [3, 4], shed: [3, 2], cellar: [3, 2],
    cave: [3, 2], stall: [3, 2], tent: [3, 2], well: [1, 1],
    sign: [1, 1], boat: [2, 2], fire: [0, 0],
  };

  /* mulberry32 — small, fast, and good enough that two regions with different
     seeds look nothing like each other. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function build(region) {
    var w = region.w, h = region.h;
    var base = BASE[region.base] !== undefined ? BASE[region.base] : T.GRASS;
    var tiles = new Uint8Array(w * h);
    var rand = rng(region.seed);
    var i, x, y;

    for (i = 0; i < tiles.length; i++) tiles[i] = base;

    function at(x, y) { return tiles[y * w + x]; }
    function set(x, y, t) {
      if (x >= 0 && y >= 0 && x < w && y < h) tiles[y * w + x] = t;
    }

    (region.water || []).forEach(function (r) {
      for (y = r.y; y < r.y + r.h; y++) {
        for (x = r.x; x < r.x + r.w; x++) set(x, y, T.WATER);
      }
    });

    /* Ice is water you can stand on, which is the entire difference between
       the Winter Valley and everywhere else, and the reason the Groke can sit
       where the pond used to be. */
    (region.ice || []).forEach(function (r) {
      for (y = r.y; y < r.y + r.h; y++) {
        for (x = r.x; x < r.x + r.w; x++) set(x, y, T.ICE);
      }
    });

    /* Paths are polylines walked one tile at a time and smeared two wide, so
       corners round themselves off instead of needing corner pieces. */
    (region.paths || []).forEach(function (line) {
      for (i = 0; i < line.length - 1; i++) {
        var ax = line[i][0], ay = line[i][1];
        var bx = line[i + 1][0], by = line[i + 1][1];
        var steps = Math.abs(bx - ax) + Math.abs(by - ay);
        for (var s = 0; s <= steps; s++) {
          var px = ax + Math.round((bx - ax) * s / (steps || 1));
          var py = ay + Math.round((by - ay) * s / (steps || 1));
          set(px, py, T.PATH);
          set(px + 1, py, T.PATH);
        }
      }
    });

    var props = [];
    (region.props || []).forEach(function (p) {
      var fp = FOOTPRINT[p.t] || [2, 2];
      var pw = p.w || fp[0], ph = p.h || fp[1];
      props.push({ t: p.t, x: p.x, y: p.y, w: pw, h: ph, text: p.text });
      /* Bridges and jetties are the point of being walkable. */
      var fill = (p.t === 'bridge' || p.t === 'jetty') ? T.BRIDGE
               : (p.t === 'fire') ? null : T.BLOCK;
      if (fill === null) return;
      for (y = p.y; y < p.y + ph; y++) {
        for (x = p.x; x < p.x + pw; x++) set(x, y, fill);
      }
    });

    /* Keep a clearing round everything you have to be able to reach, so the
       scatter cannot bury a keeper before the carver has even run. */
    var clear = {};
    function keepClear(cx, cy, r) {
      for (y = cy - r; y <= cy + r; y++) {
        for (x = cx - r; x <= cx + r; x++) clear[x + ',' + y] = true;
      }
    }
    keepClear(region.spawn[0], region.spawn[1], 2);
    region.npcs.forEach(function (n) { keepClear(n.x, n.y, 2); });
    region.exits.forEach(function (e) { keepClear(e.x, e.y, 2); });
    props.forEach(function (p) {
      keepClear(p.x + (p.w >> 1), p.y + p.h, 1);
    });

    var sc = region.scatter || {};
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        var t = at(x, y);
        if (t !== base) continue;
        if (clear[x + ',' + y]) continue;
        var r = rand();
        if (r < (sc.tree || 0)) set(x, y, T.TREE);
        else if (r < (sc.tree || 0) + (sc.rock || 0)) set(x, y, T.ROCK);
        else if (r < (sc.tree || 0) + (sc.rock || 0) + (sc.flower || 0)) set(x, y, T.FLOWER);
        else if (r < (sc.tree || 0) + (sc.rock || 0) + (sc.flower || 0) + (sc.mushroom || 0)) set(x, y, T.MUSHROOM);
        else if (r > 0.93 && base === T.GRASS) set(x, y, T.TALLGRASS);
      }
    }

    function walkable(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      return !SOLID[at(x, y)];
    }

    /* --- prove you can get everywhere that matters ---------------------- */
    function reachable(from) {
      var seen = new Uint8Array(w * h);
      var q = [from[1] * w + from[0]];
      seen[q[0]] = 1;
      while (q.length) {
        var c = q.pop(), cx = c % w, cy = (c / w) | 0;
        var n = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
        for (i = 0; i < 4; i++) {
          var nx = n[i][0], ny = n[i][1];
          if (!walkable(nx, ny)) continue;
          var k = ny * w + nx;
          if (seen[k]) continue;
          seen[k] = 1; q.push(k);
        }
      }
      return seen;
    }

    /* An L of path from a reachable tile to the stranded one. Straight lines
       through a forest look deliberate, which is a happy accident. */
    function carve(seen, tx, ty) {
      var best = -1, bx = 0, by = 0;
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          if (!seen[y * w + x]) continue;
          var d = Math.abs(x - tx) + Math.abs(y - ty);
          if (best < 0 || d < best) { best = d; bx = x; by = y; }
        }
      }
      var step = bx < tx ? 1 : -1;
      for (x = bx; x !== tx + step; x += step) if (at(x, by) !== T.WATER) set(x, by, T.PATH);
      step = by < ty ? 1 : -1;
      for (y = by; y !== ty + step; y += step) if (at(tx, y) !== T.WATER) set(tx, y, T.PATH);
    }

    var targets = region.npcs.map(function (n) { return [n.x, n.y]; })
      .concat(region.exits.map(function (e) { return [e.x, e.y]; }));
    var spawn = region.spawn;
    if (!walkable(spawn[0], spawn[1])) set(spawn[0], spawn[1], T.PATH);

    var carved = 0;
    for (var pass = 0; pass < targets.length + 1; pass++) {
      var seen = reachable(spawn);
      var bad = null;
      for (i = 0; i < targets.length; i++) {
        var t2 = targets[i];
        if (!walkable(t2[0], t2[1])) set(t2[0], t2[1], T.PATH);
        if (!seen[t2[1] * w + t2[0]]) { bad = t2; break; }
      }
      if (!bad) break;
      carve(seen, bad[0], bad[1]);
      carved++;
    }

    /* Shells are the reason to walk into a corner of the map that has no
       keeper in it. They do nothing at all, which is the point. */
    var shells = [];
    var tries = 0;
    var reach = reachable(spawn);
    while (shells.length < 5 && tries++ < 400) {
      x = (rand() * w) | 0; y = (rand() * h) | 0;
      if (!reach[y * w + x]) continue;
      if (Math.abs(x - spawn[0]) + Math.abs(y - spawn[1]) < 8) continue;
      var near = shells.some(function (s) {
        return Math.abs(s.x - x) + Math.abs(s.y - y) < 7;
      });
      if (near) continue;
      shells.push({ x: x, y: y });
    }

    return {
      w: w, h: h, tiles: tiles, props: props, shells: shells,
      /* What is under the trees and rocks — so a pine in the Winter Valley
         stands in snow rather than on a patch of summer grass. */
      baseTile: base,
      carved: carved,
      at: at,
      solid: function (x, y) {
        if (x < 0 || y < 0 || x >= w || y >= h) return true;
        return !!SOLID[tiles[y * w + x]];
      },
    };
  }

  root.MoominMap = { build: build, T: T };
})(window);
