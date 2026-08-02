/* Pencil-drawn stick fighters, generated rather than stored.
 *
 * Everything here is drawn from primitives at runtime: no images, no traced
 * artwork, nothing copied from any show. A fighter is a spec — a face, a hair
 * shape, a hat, a colour and a power — and this turns that spec into SVG. The
 * whole cast therefore costs zero bytes on the wire, which is the same reason
 * the ambience bed moved into the browser.
 *
 * Two things make it read as hand-drawn rather than as clip art:
 *
 *   1. Every stroke is perturbed by a seeded PRNG, so lines wobble slightly and
 *      never sit perfectly straight, and strokes are doubled at low opacity the
 *      way a pencil line gets gone over twice.
 *   2. The figure is drawn three times with three different seeds and the three
 *      copies are cycled at ~8fps ("boiling line"), which is the trick hand-drawn
 *      animation uses to make a held pose feel alive. It costs one extra SMIL
 *      animation and no script at all.
 *
 * Powers are original visual metaphors — a stretched limb, three spinning
 * blades, a storm cloud, sprouting arms — not reproductions of any specific
 * artwork. They exist to make an algorithm's *behaviour* legible: the rubber
 * arm reaches past everything between (a hash jump), the blades cut three ways
 * at once (divide and conquer), the storm strikes the tallest thing (a heap).
 */
(function (root) {
  'use strict';

  /* ---- seeded randomness, so a fighter looks the same every render ---- */
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s ^= s << 13; s >>>= 0;
      s ^= s >> 17;
      s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  /* A wobbling line. Straight strokes are the thing that most makes a drawing
     look machine-made, so every segment gets a small perpendicular offset and
     the midpoint drifts. `amp` is in user units — 1.5 is a confident pencil,
     3 is a sketch. */
  function line(x1, y1, x2, y2, amp, r) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const off = (r() - 0.5) * 2 * amp;
    return 'M' + f(x1 + (r() - 0.5) * amp) + ' ' + f(y1 + (r() - 0.5) * amp) +
           ' Q' + f(mx + nx * off) + ' ' + f(my + ny * off) +
           ' ' + f(x2 + (r() - 0.5) * amp) + ' ' + f(y2 + (r() - 0.5) * amp);
  }

  function f(n) { return Math.round(n * 10) / 10; }

  /* A wobbling circle, as four arcs with drifting radii. */
  function circle(cx, cy, rad, amp, r) {
    let d = '';
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const rr = rad + (r() - 0.5) * amp * 1.6;
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
    d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (let i = 1; i <= 8; i++) {
      const p = pts[i % 8], q = pts[(i + 1) % 8];
      d += ' Q' + f(p[0]) + ' ' + f(p[1]) + ' ' +
           f((p[0] + q[0]) / 2) + ' ' + f((p[1] + q[1]) / 2);
    }
    return d + 'Z';
  }

  /* A stroke, drawn twice: a confident pass and a lighter second pass slightly
     offset, which is what makes it look like graphite rather than vector. */
  function stroke(d, col, w, op) {
    return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' +
      w + '" stroke-linecap="round" stroke-linejoin="round" opacity="' +
      (op == null ? 1 : op) + '"/>';
  }

  /* ---- faces -------------------------------------------------------------
     Each is a small generator over the head box so any face can sit on any
     body. Deliberately crude: two marks and a mouth carry an astonishing
     amount of character, and crude drawings are far less uncanny than
     detailed ones when they move. */
  const EYES = {
    dot: (r, a) => stroke(line(-7, -3, -6, -3, a, r), '#1a1a1a', 3.4) +
                   stroke(line(6, -3, 7, -3, a, r), '#1a1a1a', 3.4),
    wide: (r, a) => stroke(circle(-6.5, -3, 3.4, a * 0.6, r), '#1a1a1a', 1.7) +
                    stroke(circle(6.5, -3, 3.4, a * 0.6, r), '#1a1a1a', 1.7) +
                    stroke(line(-6.5, -2, -6, -2, a, r), '#1a1a1a', 3) +
                    stroke(line(6, -2, 6.5, -2, a, r), '#1a1a1a', 3),
    angry: (r, a) => stroke(line(-10, -7, -3, -4, a, r), '#1a1a1a', 2) +
                     stroke(line(10, -7, 3, -4, a, r), '#1a1a1a', 2) +
                     stroke(line(-7.5, -2, -6.5, -2, a, r), '#1a1a1a', 3.4) +
                     stroke(line(6.5, -2, 7.5, -2, a, r), '#1a1a1a', 3.4),
    closed: (r, a) => stroke('M-10 -3 Q-6.5 -7 -3 -3', '#1a1a1a', 2) +
                      stroke('M3 -3 Q6.5 -7 10 -3', '#1a1a1a', 2),
    star: (r, a) => stroke(line(-9, -6, -4, 0, a, r), '#1a1a1a', 2) +
                    stroke(line(-4, -6, -9, 0, a, r), '#1a1a1a', 2) +
                    stroke(line(4, -6, 9, 0, a, r), '#1a1a1a', 2) +
                    stroke(line(9, -6, 4, 0, a, r), '#1a1a1a', 2),
    shade: (r, a) => stroke(line(-12, -5, 12, -5, a, r), '#1a1a1a', 5) +
                     stroke(line(-12, -8, -11, -2, a, r), '#1a1a1a', 2) +
                     stroke(line(12, -8, 11, -2, a, r), '#1a1a1a', 2),
    hollow: (r, a) => stroke(circle(-6.5, -3, 4, a * 0.5, r), '#1a1a1a', 2) +
                      stroke(circle(6.5, -3, 4, a * 0.5, r), '#1a1a1a', 2)
  };

  const MOUTHS = {
    grin: (r, a) => stroke('M-9 5 Q0 14 9 5', '#1a1a1a', 2.2),
    bigGrin: (r, a) => stroke('M-11 4 Q0 17 11 4 Q0 9 -11 4Z', '#1a1a1a', 2.2),
    flat: (r, a) => stroke(line(-6, 7, 6, 7, a, r), '#1a1a1a', 2.2),
    smirk: (r, a) => stroke('M-7 7 Q1 11 8 4', '#1a1a1a', 2.2),
    open: (r, a) => stroke(circle(0, 7, 4.5, a * 0.6, r), '#1a1a1a', 2.2),
    fang: (r, a) => stroke('M-9 4 Q0 13 9 4', '#1a1a1a', 2.2) +
                    stroke(line(-4, 6, -3, 10, a, r), '#1a1a1a', 2) +
                    stroke(line(4, 6, 3, 10, a, r), '#1a1a1a', 2),
    frown: (r, a) => stroke('M-8 10 Q0 3 8 10', '#1a1a1a', 2.2)
  };

  /* Hair and headgear, drawn over the skull outline. */
  const HAIR = {
    none: () => '',
    scruff: (r, a) => stroke('M-17 -10 Q-12 -22 -4 -17 Q0 -24 6 -18 Q13 -22 17 -10',
                             '#1a1a1a', 2),
    long: (r, a) => stroke('M-18 -6 Q-20 -24 0 -25 Q20 -24 18 -6', '#1a1a1a', 2) +
                    stroke('M-18 -4 Q-22 14 -16 24', '#1a1a1a', 2) +
                    stroke('M18 -4 Q22 14 16 24', '#1a1a1a', 2),
    spiky: (r, a) => stroke('M-17 -9 L-13 -22 L-8 -12 L-3 -25 L2 -12 L8 -23 L12 -11 L17 -19 L17 -8',
                            '#1a1a1a', 2),
    bob: (r, a) => stroke('M-18 -2 Q-20 -24 0 -24 Q20 -24 18 -2 L14 -2 Q16 -18 0 -18 Q-16 -18 -14 -2Z',
                          '#1a1a1a', 2),
    afro: (r, a) => stroke(circle(0, -14, 20, a * 1.4, r), '#1a1a1a', 2.4),
    bald: () => ''
  };

  const HATS = {
    none: () => '',
    straw: (r, a, col) =>
      stroke('M-26 -12 Q0 -6 26 -12', col || '#d9a441', 3) +
      stroke('M-15 -13 Q0 -32 15 -13', col || '#d9a441', 3) +
      stroke(line(-15, -16, 15, -16, a, r), '#c0392b', 3),
    bandana: (r, a, col) =>
      stroke('M-18 -12 Q0 -20 18 -12', col || '#1a1a1a', 3.5) +
      stroke('M16 -13 L26 -8 M16 -13 L24 -18', col || '#1a1a1a', 2),
    cap: (r, a, col) =>
      stroke('M-18 -12 Q0 -28 18 -12 Z', col || '#1a1a1a', 2.6) +
      stroke(line(-18, -12, -30, -9, a, r), col || '#1a1a1a', 2.6),
    tophat: (r, a, col) =>
      stroke(line(-22, -14, 22, -14, a, r), col || '#1a1a1a', 2.6) +
      stroke('M-13 -14 L-13 -34 L13 -34 L13 -14', col || '#1a1a1a', 2.6),
    horns: (r, a, col) =>
      stroke('M-14 -14 Q-20 -30 -8 -24', col || '#1a1a1a', 2.6) +
      stroke('M14 -14 Q20 -30 8 -24', col || '#1a1a1a', 2.6)
  };

  /* ---- powers ------------------------------------------------------------
     Each returns SVG drawn over the fighter, animated with SMIL so it runs
     without script. These are visual metaphors for what an algorithm DOES —
     that is the whole point of putting them in a DSA course. */
  const POWERS = {
    // Reaches past everything in between: a hash jump, O(1) lookup.
    rubber: (c) => '<g opacity="0.95">' +
      '<path d="M18 4 Q60 -6 104 8" fill="none" stroke="' + c + '" stroke-width="5" stroke-linecap="round">' +
      '<animate attributeName="d" dur="1.4s" repeatCount="indefinite" ' +
      'values="M18 4 Q40 0 46 4;M18 4 Q60 -10 104 8;M18 4 Q40 0 46 4"/></path>' +
      '<circle cx="104" cy="8" r="7" fill="none" stroke="' + c + '" stroke-width="4">' +
      '<animate attributeName="cx" dur="1.4s" repeatCount="indefinite" values="46;104;46"/>' +
      '</circle></g>',

    // Cuts three ways at once: divide and conquer.
    blades: (c) => '<g stroke="' + c + '" stroke-width="3.5" fill="none" stroke-linecap="round">' +
      '<path d="M14 -6 L74 -34"/><path d="M14 2 L78 2"/><path d="M14 10 L74 38"/>' +
      '<animateTransform attributeName="transform" type="rotate" ' +
      'values="-6 14 2;6 14 2;-6 14 2" dur="0.7s" repeatCount="indefinite"/></g>',

    // Strikes the tallest thing in range: a heap, a max query.
    storm: (c) => '<g>' +
      '<path d="M-38 -52 q10 -12 24 -4 q14 -10 24 4 q12 -2 10 10 l-70 0 q-2 -12 12 -10Z" ' +
      'fill="none" stroke="' + c + '" stroke-width="3"/>' +
      '<path d="M-8 -40 L-20 -14 L-6 -16 L-16 8" fill="none" stroke="#f6ad55" stroke-width="3.5" stroke-linecap="round">' +
      '<animate attributeName="opacity" values="0;1;0;0;1;0" dur="1.6s" repeatCount="indefinite"/></path></g>',

    // Sprouts extra hands wherever it needs them: many pointers at once.
    sprout: (c) => '<g stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round">' +
      '<path d="M-40 26 l0 -16 M-46 14 l6 -6 l6 6"><animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite"/></path>' +
      '<path d="M44 30 l0 -16 M38 18 l6 -6 l6 6"><animate attributeName="opacity" values="0;0;1;1;0" dur="2s" repeatCount="indefinite"/></path>' +
      '<path d="M6 -46 l0 -14 M0 -58 l6 -6 l6 6"><animate attributeName="opacity" values="0;0;0;1;1;0" dur="2s" repeatCount="indefinite"/></path></g>',

    // Burns through in one pass: a linear scan that consumes as it goes.
    flame: (c) => '<g fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round">' +
      '<path d="M20 24 q10 -16 2 -26 q16 10 12 26"><animate attributeName="d" dur="0.6s" repeatCount="indefinite" ' +
      'values="M20 24 q10 -16 2 -26 q16 10 12 26;M20 24 q12 -20 6 -30 q14 14 8 30;M20 24 q10 -16 2 -26 q16 10 12 26"/></path>' +
      '<path d="M34 26 q8 -12 2 -20 q12 8 8 20" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="0.5s" repeatCount="indefinite"/></path></g>',

    // Freezes the whole range at once: a prefix sum, precomputed and still.
    ice: (c) => '<g stroke="' + c + '" stroke-width="2.6" fill="none" stroke-linecap="round">' +
      '<path d="M40 -20 l0 40 M20 0 l40 0 M26 -14 l28 28 M54 -14 l-28 28">' +
      '<animateTransform attributeName="transform" type="rotate" values="0 40 0;120 40 0" dur="6s" repeatCount="indefinite"/></path>' +
      '<animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite"/></g>',

    // Marks a region and works only inside it: a window, a subarray.
    room: (c) => '<g>' +
      '<circle cx="10" cy="0" r="54" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-dasharray="6 7" opacity="0.85">' +
      '<animateTransform attributeName="transform" type="rotate" values="0 10 0;360 10 0" dur="9s" repeatCount="indefinite"/></circle>' +
      '<circle cx="10" cy="0" r="54" fill="' + c + '" opacity="0.07"/></g>',

    // Shatters the structure into pieces: partition, quickselect.
    quake: (c) => '<g stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round">' +
      '<path d="M24 -30 l12 16 l-8 6 l14 18"><animate attributeName="opacity" values="0;1;0.2;1;0" dur="1.2s" repeatCount="indefinite"/></path>' +
      '<path d="M-30 -34 l-10 14 l8 6 l-12 16" opacity="0.7"><animate attributeName="opacity" values="0.2;1;0;1;0.2" dur="1.2s" repeatCount="indefinite"/></path></g>',

    // Swallows everything it touches and gives nothing back: a visited set.
    void: (c) => '<g>' +
      '<circle cx="10" cy="0" r="30" fill="#0a0e14" stroke="' + c + '" stroke-width="3"/>' +
      '<circle cx="10" cy="0" r="20" fill="none" stroke="' + c + '" stroke-width="2" opacity="0.6">' +
      '<animate attributeName="r" values="6;30;6" dur="2.2s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="0.9;0;0.9" dur="2.2s" repeatCount="indefinite"/></circle></g>',

    // Fires one exact shot from far away: binary search.
    shot: (c) => '<g stroke="' + c + '" stroke-width="3" fill="none" stroke-linecap="round">' +
      '<path d="M16 0 L92 0"><animate attributeName="stroke-dasharray" values="0 80;80 0" dur="0.9s" repeatCount="indefinite"/></path>' +
      '<circle cx="92" cy="0" r="9"/><path d="M83 0 L101 0 M92 -9 L92 9"/></g>',

    // Notes that carry across the whole board: a traversal that visits all.
    song: (c) => '<g stroke="' + c + '" stroke-width="2.6" fill="none">' +
      '<path d="M30 -30 l0 -18 l12 -3 l0 18"/><circle cx="27" cy="-30" r="4"/><circle cx="39" cy="-33" r="4"/>' +
      '<animateTransform attributeName="transform" type="translate" values="0 0;16 -14;34 -6;52 -22" dur="3s" repeatCount="indefinite"/>' +
      '<animate attributeName="opacity" values="1;1;0.4;0" dur="3s" repeatCount="indefinite"/></g>',

    none: () => ''
  };

  /* ---- the figure -------------------------------------------------------- */

  /* One pass of the whole fighter at a given seed. Called three times with
     three seeds to produce the boiling-line cycle. */
  function figure(spec, seed, pose) {
    const r = rng(seed);
    const a = spec.amp == null ? 1.6 : spec.amp;
    const ink = spec.ink || '#1a1a1a';
    const w = spec.weight || 3;
    let s = '';

    // Lean and limb angles come from the pose, so the same fighter can idle,
    // wind up, strike, or reel without a second drawing.
    const p = pose || {};
    const lean = p.lean || 0;
    const armR = p.armR == null ? 40 : p.armR;    // degrees from vertical
    const armL = p.armL == null ? -40 : p.armL;
    const legSpread = p.legs == null ? 26 : p.legs;

    s += '<g transform="rotate(' + lean + ' 0 40)">';

    // head
    s += stroke(circle(0, 0, 18, a, r), ink, w);
    // face
    s += (EYES[spec.eyes] || EYES.dot)(r, a);
    s += (MOUTHS[spec.mouth] || MOUTHS.grin)(r, a);
    if (spec.scar) s += stroke(line(-11, -12, -5, 2, a, r), ink, 2);
    s += (HAIR[spec.hair] || HAIR.none)(r, a);
    s += (HATS[spec.hat] || HATS.none)(r, a, spec.hatColor);

    // spine
    s += stroke(line(0, 18, 0, 62, a, r), ink, w);

    // arms, from the shoulders
    const rad = (d) => (d * Math.PI) / 180;
    const ax = 0, ay = 28, alen = 30;
    s += stroke(line(ax, ay, ax + Math.sin(rad(armR)) * alen, ay + Math.cos(rad(armR)) * alen, a, r), ink, w);
    s += stroke(line(ax, ay, ax + Math.sin(rad(armL)) * alen, ay + Math.cos(rad(armL)) * alen, a, r), ink, w);

    // legs
    s += stroke(line(0, 62, -legSpread, 96, a, r), ink, w);
    s += stroke(line(0, 62, legSpread, 96, a, r), ink, w);

    s += '</g>';
    return s;
  }

  /* Build a complete fighter as an <svg> string.
     opts: { w, h, facing (1 | -1), pose, power (bool), scale } */
  function draw(spec, opts) {
    opts = opts || {};
    const W = opts.w || 200, H = opts.h || 220;
    const facing = opts.facing === -1 ? -1 : 1;
    const scale = opts.scale || 1;
    const uid = 'sm' + Math.floor(Math.random() * 1e9);

    // three seeds -> three drawings -> cycled at 8fps for the boiling line
    let frames = '';
    const base = spec.seed || hash(spec.name || 'fighter');
    for (let i = 0; i < 3; i++) {
      const vals = ['0', '0', '0'];
      vals[i] = '1';
      frames +=
        '<g opacity="' + (i === 0 ? 1 : 0) + '">' +
        figure(spec, base + i * 7919, opts.pose) +
        (opts.still ? '' :
          '<animate attributeName="opacity" values="' + vals.join(';') +
          '" keyTimes="0;0.3333;0.6667" calcMode="discrete" dur="0.36s" ' +
          'repeatCount="indefinite"/>') +
        '</g>';
    }

    const power = opts.power === false ? '' :
      (POWERS[spec.power] || POWERS.none)(spec.color || '#4fd1c5');

    return '<svg class="sm" viewBox="' + (-W / 2) + ' -60 ' + W + ' ' + H +
      '" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" ' +
      'role="img" aria-label="' + esc(spec.name || 'fighter') + '">' +
      '<g id="' + uid + '" transform="scale(' + (facing * scale) + ' ' + scale + ')">' +
      power + frames +
      '</g></svg>';
  }

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Poses the fight engine switches between. Kept here so the drawing code
     owns the vocabulary and the game only names it. */
  const POSES = {
    idle:   { lean: 0,  armR: 46,  armL: -44, legs: 26 },
    ready:  { lean: -4, armR: 28,  armL: -70, legs: 30 },
    windup: { lean: -12, armR: 12, armL: -105, legs: 34 },
    strike: { lean: 14, armR: 92,  armL: -20, legs: 36 },
    block:  { lean: -6, armR: -30, armL: -40, legs: 22 },
    hurt:   { lean: -20, armR: 70, armL: -80, legs: 18 },
    down:   { lean: -68, armR: 80, armL: -90, legs: 8 },
    win:    { lean: 0,  armR: 150, armL: -150, legs: 24 }
  };

  root.Stickman = {
    draw: draw,
    poses: POSES,
    eyes: Object.keys(EYES),
    mouths: Object.keys(MOUTHS),
    hair: Object.keys(HAIR),
    hats: Object.keys(HATS),
    powers: Object.keys(POWERS)
  };
}(typeof window !== 'undefined' ? window : this));
