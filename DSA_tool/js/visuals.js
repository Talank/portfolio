/* Animated concept sketches for the presentation slides.

   Every slide of every deck gets a colourful, animated SVG that sketches its
   idea, so no slide is text-only. Scenes are keyed by (deckId, slideIndex); the
   deck data stays untouched (visuals are additive and shared across both
   narration languages). The engine calls window.getSlideVisual(deckId, idx)
   while rendering a slide and drops the SVG above the bullets. Colours use the
   site's CSS custom properties, so they track the theme. Animations restart each
   time a slide is (re)rendered.

   Layout per deck: slides 0/1/3 (when / story / code) show the pattern's main
   animated scene; slide 2 (mnemonic) and slide 4 (pitfalls) show colourful
   themed motifs. */

(function () {
  'use strict';

  const DEFS = `
    <filter id="sk" x="-6%" y="-6%" width="112%" height="112%">
      <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="4" result="n">
        <animate attributeName="seed" values="4;8;2;6;4" dur="1.7s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2"/>
    </filter>
    <marker id="skarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10" fill="none" stroke="context-stroke" stroke-width="1.8"/>
    </marker>`;

  const BASE = `
    .ink{filter:url(#sk)}
    .ln{fill:none;stroke:var(--text,#dbe7ea);stroke-width:2.3;stroke-linecap:round;stroke-linejoin:round}
    .lbl{fill:var(--text-dim,#9fb2bb);font:600 12px system-ui,sans-serif}
    .em{fill:var(--accent,#4fd1c5);font:700 13px system-ui,sans-serif}
    .big{font:700 15px system-ui,sans-serif}
    text{font-family:system-ui,sans-serif}
    .steal{stroke:var(--accent,#4fd1c5)} .spur{stroke:var(--accent-2,#b794f4)} .sgrn{stroke:var(--good,#7ee787)}
    .sorg{stroke:#f0a35e} .sred{stroke:var(--danger,#ff6b6b)} .sblu{stroke:#58a6ff} .spnk{stroke:#ff7eb6} .syel{stroke:#f2cc60}
    @keyframes fin{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
    @keyframes draw{to{stroke-dashoffset:0}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  // vibrant palette (fill values)
  const C = ['var(--accent,#4fd1c5)', 'var(--accent-2,#b794f4)', 'var(--good,#7ee787)', '#f0a35e',
    '#58a6ff', '#ff7eb6', '#f2cc60', 'var(--danger,#ff6b6b)'];

  function svg(vb, style, body) {
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img">`
      + `<defs>${DEFS}</defs><style>${BASE}${style}</style>${body}</svg>`;
  }
  const T = (x, y, s, cls = 'lbl', a = 'start') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}">${s}</text>`;
  function box(x, y, w, h, fill, label, lc = 'big', tf = '#08222a') {
    return `<g class="ink"><rect class="ln" x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${fill}" fill-opacity="0.92"/>`
      + (label != null ? `<text class="${lc}" x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" fill="${tf}">${label}</text>` : '') + `</g>`;
  }
  const node = (x, y, r, label, fill) =>
    `<g class="ink"><circle class="ln" cx="${x}" cy="${y}" r="${r}" fill="${fill}" fill-opacity="0.92"/>`
    + (label != null ? `<text class="big" x="${x}" y="${y + 5}" text-anchor="middle" fill="#08222a">${label}</text>` : '') + `</g>`;
  const edge = (x1, y1, x2, y2, cls = 'ln') => `<line class="${cls} ink" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;

  /* ============================= main scenes ============================= */

  const sc_ladder = () => svg('0 0 440 200',
    `@keyframes tr{to{opacity:1}}`,
    `${edge(44, 176, 410, 176)}${edge(44, 176, 44, 24)}
     ${T(24, 30, 'work', 'lbl')}${T(392, 194, 'n →', 'lbl')}
     <path id="q1" class="ln sgrn" d="M44 150 H400"/>
     <path id="q2" class="ln steal" d="M44 158 Q140 120 400 108"/>
     <path id="q3" class="ln sblu" d="M44 168 L400 44"/>
     <path id="q4" class="ln sred" d="M44 172 Q250 168 320 96 T400 26"/>
     ${['q1', 'q2', 'q3', 'q4'].map((p, i) => `<circle r="5" fill="${['var(--good)', 'var(--accent)', '#58a6ff', 'var(--danger)'][i]}"><animateMotion dur="${4 - i * 0.3}s" repeatCount="indefinite"><mpath href="#${p}"/></animateMotion></circle>`).join('')}
     ${T(406, 150, 'O(1)', 'em', 'end').replace('class="em"', 'class="em" fill="var(--good)"')}
     ${T(408, 46, 'O(n)', 'em', 'end').replace('class="em"', 'class="em" fill="#58a6ff"')}
     ${T(410, 24, 'O(n²)', 'em', 'end').replace('class="em"', 'class="em" fill="var(--danger)"')}
     ${T(120, 20, 'as n doubles, how much more work?', 'lbl')}`);

  const sc_bridge = () => {
    const planks = [];
    for (let i = 0; i < 5; i++) planks.push(`<rect class="ink ln" x="${122 + i * 17}" y="96" width="15" height="9" rx="2" fill="var(--accent)" style="animation:bp 5s ${i * 0.28}s infinite"/>`);
    for (let i = 0; i < 5; i++) planks.push(`<rect class="ink ln" x="${303 - i * 17}" y="96" width="15" height="9" rx="2" fill="var(--good)" style="animation:bp 5s ${i * 0.28}s infinite"/>`);
    const fig = (x, s) => `<g class="ln ink" stroke="${s}"><circle cx="${x}" cy="122" r="6"/><path d="M${x} 128 V142 M${x} 132 l-7 5 M${x} 132 l7 5 M${x} 142 l-6 8 M${x} 142 l6 8"/></g>`;
    return svg('0 0 440 175',
      `@keyframes bp{0%{opacity:0;transform:translateY(-9px)}12%{opacity:1;transform:none}82%{opacity:1}96%,100%{opacity:0}}
       @keyframes spark{0%,58%{opacity:0;transform:scale(.4)}72%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}`,
      `<path class="ln sorg ink" d="M0 150 Q40 143 80 150 T160 150 T240 150 T320 150 T440 150" opacity="0.7"/>
       <rect class="ln ink" x="0" y="150" width="120" height="25" rx="3" fill="#0b1622"/>
       <rect class="ln ink" x="320" y="150" width="120" height="25" rx="3" fill="#0b1622"/>
       ${planks.join('')}
       <g transform="translate(212 92)" style="transform-origin:212px 100px;animation:spark 5s 1.3s infinite"><path class="ln steal" d="M0 -9 V9 M-9 0 H9 M-6 -6 L6 6 M6 -6 L-6 6"/></g>
       ${fig(55, 'var(--accent)')}${fig(85, 'var(--accent)')}${fig(355, 'var(--good)')}${fig(385, 'var(--good)')}
       ${T(20, 26, 'Dig from both ends…', 'lbl')}${T(150, 26, '…meet in the middle → O(n)', 'em')}`);
  };

  const sc_twoptr = () => {
    const vals = [1, 3, 5, 7, 9, 11], x0 = 60, w = 52;
    const cells = vals.map((v, i) => box(x0 + i * w, 66, w - 6, 46, C[i % C.length], v)).join('');
    const span = (vals.length - 1) * w;
    return svg('0 0 440 175',
      `@keyframes goR{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(${2 * w}px)}}
       @keyframes goL{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(-${2 * w}px)}}`,
      `${cells}
       <g style="animation:goR 6s infinite"><path class="ln sgrn ink" d="M${x0 + (w - 6) / 2} 128 V116" marker-end="url(#skarr)"/>${T(x0 + (w - 6) / 2, 146, 'L', 'em', 'middle').replace('class="em"', 'class="em" fill="var(--good)"')}</g>
       <g style="animation:goL 6s infinite"><path class="ln sorg ink" d="M${x0 + span + (w - 6) / 2} 128 V116" marker-end="url(#skarr)"/>${T(x0 + span + (w - 6) / 2, 146, 'R', 'em', 'middle').replace('class="em"', 'class="em" fill="#f0a35e"')}</g>
       ${T(20, 28, 'sum too small → L steps up', 'lbl')}${T(20, 46, 'sum too big → R steps down', 'lbl')}`);
  };

  const sc_window = () => {
    const n = 8, x0 = 40, w = 46;
    const cells = Array.from({ length: n }, (_, i) => box(x0 + i * w, 70, w - 6, 44, C[i % C.length], '')).join('');
    return svg('0 0 440 165',
      `@keyframes slideWin{0%{x:${x0 - 3}px;width:${w * 2}px}30%{x:${x0 - 3}px;width:${w * 3}px}
        55%{x:${x0 + w * 2 - 3}px;width:${w * 2}px}80%{x:${x0 + w * 4 - 3}px;width:${w * 3}px}100%{x:${x0 + w * 6 - 3}px;width:${w * 2}px}}`,
      `${cells}
       <rect x="${x0 - 3}" y="64" width="${w * 2}" height="56" rx="7" fill="var(--accent,#4fd1c5)" opacity="0.18" stroke="var(--accent)" stroke-width="2.5" style="animation:slideWin 6s infinite"/>
       ${T(20, 30, 'grow on the right →', 'lbl')}${T(200, 30, 'shrink from the left when it breaks', 'em')}
       ${T(20, 152, 'each element enters once, leaves once → O(n)', 'lbl')}`);
  };

  const sc_loop = () => {
    const cx = 150, cy = 92, r = 60, path = `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy}`;
    return svg('0 0 440 190', '',
      `<path id="loop" class="ln spur ink" d="${path}"/>${edge(40, cy, cx - r, cy)}
       <circle r="8" fill="var(--good)"><animateMotion dur="8s" repeatCount="indefinite" rotate="auto"><mpath href="#loop"/></animateMotion></circle>
       <circle r="8" fill="#f0a35e"><animateMotion dur="4s" repeatCount="indefinite" rotate="auto"><mpath href="#loop"/></animateMotion></circle>
       ${T(250, 66, '🐢 slow: 1 step', 'em').replace('class="em"', 'class="em" fill="var(--good)"')}
       ${T(250, 90, '🐇 fast: 2 steps', 'lbl').replace('class="lbl"', 'class="lbl" fill="#f0a35e"')}
       ${T(250, 126, 'on a loop, they', 'big').replace('class="big"', 'class="big" fill="var(--accent)"')}
       ${T(250, 148, 'must meet 🎯', 'big').replace('class="big"', 'class="big" fill="var(--accent)"')}`);
  };

  const sc_halving = () => {
    const items = ['F', 'F', 'F', 'F', 'T', 'T', 'T'], x0 = 70, w = 44;
    const cells = items.map((t, i) => box(x0 + i * w, 70, w - 6, 44, t === 'T' ? 'var(--good)' : 'var(--danger)', t)).join('');
    return svg('0 0 440 165',
      `@keyframes lo{0%{transform:translateX(0)}100%{transform:translateX(${4 * w}px)}}
       @keyframes hi{0%{transform:translateX(${6 * w}px)}100%{transform:translateX(${4 * w}px)}}`,
      `${cells}
       <g style="animation:lo 5s ease-in-out infinite alternate"><path class="ln steal ink" d="M${x0 + (w - 6) / 2} 128 V118" marker-end="url(#skarr)"/>${T(x0 + (w - 6) / 2, 146, 'lo', 'em', 'middle')}</g>
       <g style="animation:hi 5s ease-in-out infinite alternate"><path class="ln spur ink" d="M${x0 + 6 * w + (w - 6) / 2} 128 V118" marker-end="url(#skarr)"/>${T(x0 + 6 * w + (w - 6) / 2, 146, 'hi', 'em', 'middle').replace('var(--accent', 'var(--accent-2')}</g>
       ${T(20, 30, 'look at the middle, throw away half', 'lbl')}${T(250, 30, '→ first T', 'em')}`);
  };

  const sc_merge = () => svg('0 0 440 160',
    `@keyframes bA{0%,40%{opacity:1}60%,100%{opacity:0}}@keyframes bM{0%,45%{opacity:0}62%,100%{opacity:1}}`,
    `${edge(30, 120, 410, 120)}${[80, 150, 220, 290, 360].map(x => edge(x, 116, x, 124)).join('')}
     <rect class="ink" x="70" y="52" width="140" height="20" rx="10" fill="var(--accent)" opacity="0.9" style="animation:bA 5s infinite"/>
     <rect class="ink" x="150" y="80" width="150" height="20" rx="10" fill="var(--accent-2)" opacity="0.9" style="animation:bA 5s infinite"/>
     <rect class="ink" x="70" y="66" width="230" height="22" rx="11" fill="var(--good)" opacity="0.95" style="animation:bM 5s infinite"/>
     ${T(20, 28, 'overlapping ranges…', 'lbl')}${T(210, 28, '…merge into one', 'em')}
     ${T(20, 150, 'sort by start, then sweep once', 'lbl')}`);

  const sc_pop = () => {
    const bars = [[70, 60], [110, 92], [150, 40], [190, 74]];
    const els = bars.map(([x, h], i) => {
      const pop = h < 80;
      return `<rect class="ink ln" x="${x}" y="${130 - h}" width="30" height="${h}" rx="3" fill="${pop ? '#8fa3ad' : 'var(--accent)'}" ${pop ? `style="animation:pop 5s ${1 + i * 0.15}s infinite"` : ''}/>`;
    }).join('');
    return svg('0 0 440 165',
      `@keyframes pop{0%,18%{opacity:1;transform:translateY(0)}34%,100%{opacity:0;transform:translateY(-42px)}}
       @keyframes arrive{0%{transform:translateX(150px)}22%,100%{transform:translateX(0)}}`,
      `${edge(55, 130, 245, 130)}${els}
       <g style="animation:arrive 5s infinite"><rect class="ink ln" x="230" y="18" width="30" height="112" rx="3" fill="var(--good)"/><path class="ln sgrn ink" d="M245 8 V16" marker-end="url(#skarr)"/></g>
       ${T(270, 60, 'taller arrives →', 'lbl')}${T(270, 82, 'pop the shorter', 'em')}${T(270, 106, 'hand them their', 'lbl')}${T(270, 122, 'answer', 'lbl')}`);
  };

  const sc_flip = () => {
    const xs = [60, 150, 240, 330], y = 92;
    const nodes = xs.map((x, i) => node(x, y, 20, 'ABCD'[i], C[i % C.length])).join('');
    const arrows = xs.slice(0, 3).map((x, i) => `<g style="animation:flip 5s ${0.6 + i * 0.5}s infinite;transform-box:fill-box;transform-origin:center"><path class="ln spur ink" d="M${x + 22} ${y} H${xs[i + 1] - 22}" marker-end="url(#skarr)"/></g>`).join('');
    return svg('0 0 440 160',
      `@keyframes flip{0%,25%{transform:scaleX(1)}45%,100%{transform:scaleX(-1)}}`,
      `${nodes}${arrows}${T(20, 30, 'grab next, flip the arrow, step forward', 'lbl')}${T(20, 142, 'reverse in place → O(1) space', 'em')}`);
  };

  const sc_hash = () => {
    const vals = [2, 7, 11, 15], x0 = 50, w = 66;
    const cells = vals.map((v, i) => box(x0 + i * w, 74, w - 8, 46, C[i % C.length], v)).join('');
    const cx0 = x0 + (w - 8) / 2, cx1 = x0 + w + (w - 8) / 2;
    return svg('0 0 440 165',
      `@keyframes arc{0%{stroke-dashoffset:180}45%{stroke-dashoffset:0}100%{stroke-dashoffset:0}}
       @keyframes glow{0%,40%{opacity:.3}60%,100%{opacity:1}}`,
      `${cells}
       <path class="ln sgrn ink" d="M${cx0} 70 Q${(cx0 + cx1) / 2} 24 ${cx1} 70" stroke-dasharray="180" style="animation:arc 4s infinite"/>
       <g style="animation:glow 4s infinite">${T((cx0 + cx1) / 2, 20, '2 + 7 = 9 ✓', 'em', 'middle').replace('class="em"', 'class="em" fill="var(--good)"')}</g>
       ${T(20, 150, 'ask what you need (target − x), then hang on the board', 'lbl')}`);
  };

  const sc_prefix = () => {
    const ms = [[60, 0], [130, 3], [200, 7], [270, 10], [340, 15]];
    const stones = ms.map(([x, v], i) => `${node(x, 118, 15, v, C[i % C.length])}`).join('');
    return svg('0 0 440 165',
      `@keyframes br{0%,30%{opacity:0}50%,100%{opacity:1}}`,
      `${edge(40, 140, 410, 140)}${stones}
       <g style="animation:br 4s infinite">
         <path class="ln sorg ink" d="M130 96 V80 H340 V96" marker-start="url(#skarr)" marker-end="url(#skarr)"/>
         ${T(235, 72, '15 − 3 = 12  (range sum)', 'em', 'middle').replace('class="em"', 'class="em" fill="#f0a35e"')}
       </g>
       ${T(20, 30, 'keep the running total…', 'lbl')}${T(20, 158, 'any range = difference of two milestones', 'lbl')}`);
  };

  const sc_queue = () => {
    const w = 46, y = 74;
    const items = [0, 1, 2, 3].map(i => box(120 + i * (w + 8), y, w, 40, C[i % C.length], 'ABCD'[i])).join('');
    return svg('0 0 440 160',
      `@keyframes flow{0%{transform:translateX(0)}100%{transform:translateX(-${w + 8}px)}}`,
      `<g style="animation:flow 2.4s linear infinite">${items}${box(120 + 4 * (w + 8), y, w, 40, C[4 % C.length], 'E')}</g>
       <rect x="105" y="66" width="250" height="56" rx="8" class="ln" fill="none"/>
       <path class="ln sgrn ink" d="M395 94 H360" marker-end="url(#skarr)"/>${T(400, 98, 'in', 'em').replace('var(--accent', 'var(--good')}
       <path class="ln sorg ink" d="M100 94 H70" marker-end="url(#skarr)"/>${T(30, 98, 'out', 'em').replace('var(--accent', '#f0a35e;--x:0')}
       ${T(20, 30, 'first in, first out (FIFO)', 'lbl')}${T(150, 150, 'the temple queue', 'lbl')}`);
  };

  const sc_tree = () => {
    const N = { r: [220, 40], a: [150, 100], b: [290, 100], c: [110, 158], d: [190, 158], e: [250, 158], f: [330, 158] };
    const E = [['r', 'a'], ['r', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['b', 'f']];
    const edges = E.map(([u, v]) => edge(N[u][0], N[u][1], N[v][0], N[v][1])).join('');
    const lvl = { r: 0, a: 1, b: 1, c: 2, d: 2, e: 2, f: 2 };
    const nodes = Object.entries(N).map(([k, [x, y]]) =>
      `<g style="animation:glow${lvl[k]} 3s infinite">${node(x, y, 17, '', C[lvl[k] * 2 % C.length])}</g>`).join('');
    return svg('0 0 440 190',
      `@keyframes glow0{0%,100%{opacity:.5}8%,20%{opacity:1}}
       @keyframes glow1{0%,100%{opacity:.5}30%,42%{opacity:1}}
       @keyframes glow2{0%,100%{opacity:.5}55%,72%{opacity:1}}`,
      `${edges}${nodes}${T(300, 40, 'BFS: level', 'em')}${T(300, 60, 'by level ↓', 'em')}${T(20, 184, 'DFS dives deep · BFS floats wide', 'lbl')}`);
  };

  const sc_bst = () => {
    const N = { n8: [220, 42, 8], n3: [150, 104, 3], n10: [290, 104, 10], n1: [110, 162, 1], n6: [190, 162, 6], n14: [330, 162, 14] };
    const E = [['n8', 'n3'], ['n8', 'n10'], ['n3', 'n1'], ['n3', 'n6'], ['n10', 'n14']];
    const edges = E.map(([u, v]) => edge(N[u][0], N[u][1], N[v][0], N[v][1])).join('');
    const nodes = Object.values(N).map(([x, y, v]) => node(x, y, 18, v, v === 6 ? 'var(--good)' : 'var(--accent)')).join('');
    return svg('0 0 440 195',
      '', `<path id="bp" class="ln" style="visibility:hidden" d="M220 42 L150 104 L190 162"/>
       ${edges}${nodes}
       <circle r="9" fill="#f2cc60"><animateMotion dur="4s" repeatCount="indefinite" keyPoints="0;0;0.5;1;1" keyTimes="0;0.1;0.45;0.8;1" calcMode="linear"><mpath href="#bp"/></animateMotion></circle>
       ${T(300, 150, 'search 6:', 'em')}${T(300, 170, '6<8 → left', 'lbl')}${T(300, 186, '6>3 → right', 'lbl')}`);
  };

  const sc_heap = () => {
    const N = { t: [220, 46, 2], a: [168, 108, 4], b: [272, 108, 5], c: [138, 166, 8], d: [198, 166, 9], e: [302, 166, 7] };
    const E = [['t', 'a'], ['t', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e']];
    const edges = E.map(([u, v]) => edge(N[u][0], N[u][1], N[v][0], N[v][1])).join('');
    const nodes = Object.entries(N).map(([k, [x, y, v]]) =>
      k === 't' ? `<g style="animation:pulse 2.2s infinite;transform-origin:${x}px ${y}px">${node(x, y, 19, v, 'var(--good)')}</g>` : node(x, y, 17, v, C[2 + (v % 4)])).join('');
    return svg('0 0 440 195', '',
      `${edges}${nodes}
       ${T(300, 60, 'min on top', 'em').replace('class="em"', 'class="em" fill="var(--good)"')}
       ${T(300, 84, 'peek = O(1)', 'lbl')}${T(300, 108, 'push/pop', 'lbl')}${T(300, 124, '= O(log n)', 'lbl')}
       ${T(20, 188, 'keep only K — the weakest waits at the door', 'lbl')}`);
  };

  const sc_back = () => {
    const N = { r: [220, 36], a: [150, 100], b: [290, 100], c: [110, 162], d: [190, 162], e: [250, 162], f: [330, 162] };
    const E = [['r', 'a'], ['r', 'b'], ['a', 'c'], ['a', 'd'], ['b', 'e'], ['b', 'f']];
    const edges = E.map(([u, v]) => edge(N[u][0], N[u][1], N[v][0], N[v][1])).join('');
    const nodes = Object.values(N).map(([x, y]) => node(x, y, 13, '', 'var(--accent-2)')).join('');
    return svg('0 0 440 195',
      `@keyframes xf{0%,30%{opacity:0}40%,60%{opacity:1}70%,100%{opacity:0}}
       @keyframes vf{0%,72%{opacity:0}85%,100%{opacity:1}}`,
      `<path id="tk" class="ln" style="visibility:hidden" d="M220 36 L150 100 L110 162 L150 100 L190 162"/>
       ${edges}${nodes}
       <circle r="8" fill="#f2cc60"><animateMotion dur="5s" repeatCount="indefinite"><mpath href="#tk"/></animateMotion></circle>
       <text x="110" y="167" text-anchor="middle" class="big" fill="var(--danger)" style="animation:xf 5s infinite">✗</text>
       <text x="190" y="167" text-anchor="middle" class="big" fill="var(--good)" style="animation:vf 5s infinite">✓</text>
       ${T(20, 28, 'choose → explore →', 'lbl')}${T(20, 186, 'stuck? un-choose and back up', 'em')}`);
  };

  const sc_graph = () => {
    const N = { a: [80, 100, 0], b: [180, 50, 1], c: [180, 150, 1], d: [290, 90, 2], e: [360, 150, 3] };
    const E = [['a', 'b'], ['a', 'c'], ['b', 'd'], ['c', 'd'], ['d', 'e']];
    const edges = E.map(([u, v]) => edge(N[u][0], N[u][1], N[v][0], N[v][1])).join('');
    const nodes = Object.values(N).map(([x, y, l]) =>
      `<g style="animation:w${l} 3.5s infinite">${node(x, y, 16, '', C[l % C.length])}</g>`).join('');
    return svg('0 0 440 190',
      `@keyframes w0{0%,100%{opacity:.45}5%{opacity:1}}@keyframes w1{0%,100%{opacity:.45}25%{opacity:1}}
       @keyframes w2{0%,100%{opacity:.45}45%{opacity:1}}@keyframes w3{0%,100%{opacity:.45}65%{opacity:1}}`,
      `${edges}${nodes}${T(60, 90, 'start', 'lbl')}${T(20, 184, 'BFS spreads outward, level by level — mark visited first', 'lbl')}`);
  };

  const sc_dp = () => {
    const vals = [1, 1, 2, 3, 5, 8], x0 = 50, w = 60;
    const cells = vals.map((v, i) => `<g style="animation:fin 4s ${i * 0.5}s infinite">${box(x0 + i * w, 80, w - 10, 44, C[i % C.length], v)}</g>`).join('');
    const arrows = vals.map((_, i) => i < 2 ? '' : `<path class="ln spur ink" d="M${x0 + (i - 1) * w + (w - 10) / 2} 76 Q${x0 + i * w} 56 ${x0 + i * w + (w - 10) / 2} 76" style="animation:fin 4s ${i * 0.5}s infinite" marker-end="url(#skarr)"/>`).join('');
    return svg('0 0 440 165', '',
      `${arrows}${cells}${T(20, 30, '📓 each cell = sum of the previous two', 'lbl')}${T(20, 152, 'write it once, never recompute', 'em')}`);
  };

  const sc_greedy = () => {
    const bars = [[60, 150, 1], [130, 240, 0], [200, 300, 1], [330, 400, 1]];
    const rows = bars.map(([x1, x2, pick], i) => {
      const y = 50 + i * 26, col = pick ? 'var(--good)' : '#8fa3ad';
      return `<rect class="ink ln" x="${x1}" y="${y}" width="${x2 - x1}" height="18" rx="9" fill="${col}" opacity="0.92"/>`
        + `<text x="${x2 + 12}" y="${y + 14}" class="big" fill="${pick ? 'var(--good)' : 'var(--danger)'}" style="animation:fin 4s ${0.4 + i * 0.4}s infinite">${pick ? '✓' : '✗'}</text>`;
    }).join('');
    return svg('0 0 440 175', '',
      `${edge(40, 158, 420, 158)}${rows}${T(20, 28, 'sort by end time, then grab non-overlapping', 'lbl')}${T(20, 170, 'greedy — but prove it first', 'em')}`);
  };

  const sc_bit = () => {
    const A = [1, 0, 1, 1, 0, 1], B = [1, 1, 0, 1, 1, 0], x0 = 70, w = 44;
    const bit = (b, x, y, animCls) => `<g ${animCls}><rect class="ln ink" x="${x}" y="${y}" width="34" height="30" rx="5" fill="${b ? '#f2cc60' : '#0b1622'}"/><text x="${x + 17}" y="${y + 20}" text-anchor="middle" class="big" fill="${b ? '#08222a' : '#5a6b73'}">${b}</text></g>`;
    const rowA = A.map((b, i) => bit(b, x0 + i * w, 40)).join('');
    const rowB = B.map((b, i) => bit(b, x0 + i * w, 78)).join('');
    const rowX = A.map((b, i) => bit(b ^ B[i], x0 + i * w, 120, `style="animation:fin 4s ${0.3 + i * 0.25}s infinite"`)).join('');
    return svg('0 0 440 175', '',
      `${rowA}${rowB}${rowX}
       ${T(x0 - 14, 60, 'a', 'em', 'end')}${T(x0 - 14, 98, 'b', 'em', 'end')}${T(x0 - 14, 140, '⊕', 'em', 'end')}
       ${T(20, 28, 'XOR = are the two switches different?', 'lbl')}${T(20, 170, 'same → off (0) · different → on (1)', 'lbl')}`);
  };

  const sc_trie = () => {
    const N = { r: [220, 30, ''], c: [220, 78, 'c'], a: [220, 126, 'a'], t: [180, 176, 't'], rr: [262, 176, 'r'] };
    const E = [['r', 'c'], ['c', 'a'], ['a', 't'], ['a', 'rr']];
    const edges = E.map(([u, v], i) => `<path class="ln ${v === 'rr' ? 'sorg' : v === 't' ? 'spnk' : 'steal'} ink" d="M${N[u][0]} ${N[u][1] + (u === 'r' ? 0 : 14)} L${N[v][0]} ${N[v][1] - 14}" stroke-dasharray="70" stroke-dashoffset="70" style="animation:draw 3s ${i * 0.5}s infinite alternate"/>`).join('');
    const nodes = Object.values(N).map(([x, y, l]) => node(x, y, 15, l, l === 't' ? '#ff7eb6' : l === 'r' && x === 262 ? '#f0a35e' : 'var(--accent)')).join('');
    return svg('0 0 440 200', '',
      `${edges}${nodes}${T(300, 120, 'cat', 'em').replace('var(--accent', '#ff7eb6;--x:0')}${T(300, 176, 'car', 'em').replace('var(--accent', '#f0a35e;--x:0')}
       ${T(20, 30, 'same start,', 'lbl')}${T(20, 46, 'same path', 'lbl')}${T(20, 194, 'branch only where words differ', 'lbl')}`);
  };

  /* ============================= motifs ============================= */

  const motifMnemonic = (c) => svg('0 0 440 150',
    `@keyframes bulb{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
     @keyframes spk{0%,100%{opacity:.2;transform:scale(.6)}50%{opacity:1;transform:scale(1)}}`,
    `<rect x="12" y="12" width="416" height="126" rx="14" fill="${c}" fill-opacity="0.08" class="ln" stroke="${c}"/>
     <g style="transform-origin:120px 75px;animation:bulb 1.8s infinite"><text x="120" y="96" text-anchor="middle" style="font-size:56px">💡</text></g>
     ${[[70, 45], [180, 40], [160, 110], [66, 108], [200, 78]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="4" fill="${c}" style="transform-origin:${x}px ${y}px;animation:spk 1.6s ${i * 0.25}s infinite"/>`).join('')}
     ${T(240, 70, 'a phrase to', 'big').replace('class="big"', `class="big" fill="${c}"`)}
     ${T(240, 94, 'remember it by', 'big').replace('class="big"', `class="big" fill="${c}"`)}`);

  const motifPitfall = (c) => svg('0 0 440 150',
    `@keyframes shake{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}}
     @keyframes dash{to{stroke-dashoffset:-40}}`,
    `<rect x="12" y="12" width="416" height="126" rx="14" fill="var(--danger,#ff6b6b)" fill-opacity="0.07" class="ln" stroke="var(--danger)"/>
     <g style="transform-origin:110px 78px;animation:shake 0.9s infinite"><text x="110" y="98" text-anchor="middle" style="font-size:54px">⚠️</text></g>
     <ellipse cx="300" cy="104" rx="86" ry="20" fill="none" stroke="var(--danger)" stroke-width="2.4" stroke-dasharray="8 6" style="animation:dash 1.2s linear infinite"/>
     <text x="300" y="66" text-anchor="middle" class="big" fill="var(--danger)">the traps</text>
     <text x="300" y="90" text-anchor="middle" class="lbl" fill="var(--danger)">watch out here</text>`);

  /* ============================= wiring ============================= */

  const MAIN = {
    'warmup': sc_ladder, 'two-pointers': sc_twoptr, 'sliding-window': sc_window,
    'fast-slow-pointers': sc_loop, 'merge-intervals': sc_merge, 'binary-search': sc_halving,
    'hashing-patterns': sc_hash, 'prefix-sum': sc_prefix, 'linked-list-reversal': sc_flip,
    'monotonic-stack': sc_pop, 'queue-deque': sc_queue, 'tree-dfs-bfs': sc_tree,
    'binary-search-trees': sc_bst, 'heaps-top-k': sc_heap, 'backtracking': sc_back,
    'graphs-bfs-dfs-topo-union': sc_graph, 'dynamic-programming': sc_dp, 'greedy': sc_greedy,
    'bit-manipulation': sc_bit, 'trie': sc_trie,
  };

  const V = {};
  Object.keys(MAIN).forEach((id, i) => {
    const c = C[i % C.length], main = MAIN[id];
    V[id] = { 0: main, 1: main, 2: () => motifMnemonic(c), 3: main, 4: () => motifPitfall(c) };
  });
  V['two-pointers'][0] = sc_bridge;   // the literal bridge on the "when to reach" slide

  window.SLIDE_VISUALS = V;
  window.getSlideVisual = function (deckId, idx) {
    try {
      const d = V[deckId];
      const fn = d && d[idx];
      return fn ? fn() : '';
    } catch (e) { return ''; }
  };
})();
