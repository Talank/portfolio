/* Animated concept sketches for the presentation slides.

   Each entry is a self-contained animated SVG (hand-drawn look via a subtle
   turbulence "boil" filter) that sketches the slide's anecdote/concept. Keyed by
   (deckId, slideIndex) so the deck data stays untouched — visuals are purely
   additive and shared across both narration languages. The engine calls
   window.getSlideVisual(deckId, idx) while rendering a slide and drops the SVG
   above the bullets. Colours use the site's CSS custom properties, so they track
   the theme automatically. Animations restart every time a slide is (re)rendered.

   This is a growing library: slides without an entry simply show no visual. */

(function () {
  'use strict';

  // Shared defs (sketch filter + arrowhead) and base styles, inlined per SVG so
  // each scene is standalone and its animation restarts on injection.
  const DEFS = `
    <filter id="sk" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="4" result="n">
        <animate attributeName="seed" values="4;7;2;5;4" dur="1.6s" calcMode="discrete" repeatCount="indefinite"/>
      </feTurbulence>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/>
    </filter>
    <marker id="skarr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10" fill="none" stroke="context-stroke" stroke-width="1.8"/>
    </marker>`;

  const BASE = `
    .ink{filter:url(#sk)}
    .ln{fill:none;stroke:var(--text,#dbe7ea);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
    .ac{stroke:var(--accent,#4fd1c5)} .a2{stroke:var(--accent-2,#b794f4)}
    .gd{stroke:var(--good,#7ee787)} .dg{stroke:var(--danger,#ff6b6b)} .wm{stroke:var(--accent-2,#f0a35e)}
    .fac{fill:var(--accent,#4fd1c5)} .fgd{fill:var(--good,#7ee787)} .fwm{fill:#f0a35e} .fdg{fill:var(--danger,#ff6b6b)}
    .lbl{fill:var(--text-dim,#8fa3ad);font:600 12px system-ui,sans-serif}
    .em{fill:var(--accent,#4fd1c5);font:700 13px system-ui,sans-serif}
    text{font-family:system-ui,sans-serif}
    @media (prefers-reduced-motion:reduce){*{animation:none!important}}`;

  function svg(vb, style, body) {
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img">`
      + `<defs>${DEFS}</defs><style>${BASE}${style}</style>${body}</svg>`;
  }

  const V = {};

  /* ---- two-pointers[0]: build the bridge from both ends, meet in the middle ---- */
  V['two-pointers'] = {};
  V['two-pointers'][0] = () => {
    const planks = [];
    for (let i = 0; i < 5; i++) {                    // left team builds rightward
      planks.push(`<rect class="ink fac" x="${122 + i * 17}" y="96" width="15" height="9" rx="2" style="animation:bp 5s ${i * 0.28}s infinite"/>`);
    }
    for (let i = 0; i < 5; i++) {                    // right team builds leftward
      planks.push(`<rect class="ink fgd" x="${303 - i * 17}" y="96" width="15" height="9" rx="2" style="animation:bp 5s ${i * 0.28}s infinite"/>`);
    }
    const figure = (x, cls) => `<g class="ln ${cls} ink"><circle cx="${x}" cy="122" r="6"/><path d="M${x} 128 V142 M${x} 132 l-7 5 M${x} 132 l7 5 M${x} 142 l-6 8 M${x} 142 l6 8"/></g>`;
    return svg('0 0 440 180',
      `@keyframes bp{0%{opacity:0;transform:translateY(-9px)}12%{opacity:1;transform:none}82%{opacity:1}96%,100%{opacity:0}}
       @keyframes spark{0%,60%{opacity:0;transform:scale(.4)}72%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.3)}}`,
      `<path class="ln wm ink" d="M0 150 Q40 143 80 150 T160 150 T240 150 T320 150 T440 150" opacity="0.7"/>
       <rect class="ln ink" x="0" y="150" width="120" height="26" rx="3" fill="var(--code-bg,#0b1622)"/>
       <rect class="ln ink" x="320" y="150" width="120" height="26" rx="3" fill="var(--code-bg,#0b1622)"/>
       ${planks.join('')}
       <g transform="translate(212 92)" style="transform-origin:212px 100px;animation:spark 5s 1.3s infinite"><path class="ln ac" d="M0 -9 V9 M-9 0 H9 M-6 -6 L6 6 M6 -6 L-6 6"/></g>
       ${figure(55, 'fac')}${figure(85, 'fac')}${figure(355, 'gd')}${figure(385, 'gd')}
       <text class="lbl" x="20" y="26">Dig from both ends…</text>
       <text class="em" x="150" y="26">…meet in the middle → O(n)</text>`);
  };

  /* ---- two-pointers[1]: converging pointers on a sorted array ---- */
  V['two-pointers'][1] = () => {
    const vals = [1, 3, 5, 7, 9, 11], x0 = 60, w = 52;
    const cells = vals.map((v, i) =>
      `<g class="ln ink"><rect x="${x0 + i * w}" y="66" width="${w - 6}" height="46" rx="4"/><text class="em" x="${x0 + i * w + (w - 6) / 2}" y="95" text-anchor="middle">${v}</text></g>`
    ).join('');
    const span = (vals.length - 1) * w;
    return svg('0 0 440 175',
      `@keyframes goR{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(${2 * w}px)}}
       @keyframes goL{0%,100%{transform:translateX(0)}45%,55%{transform:translateX(-${2 * w}px)}}`,
      `${cells}
       <g style="animation:goR 6s infinite"><path class="ln gd ink" d="M${x0 + (w - 6) / 2} 128 V116" marker-end="url(#skarr)"/><text class="lbl fgd" x="${x0 + (w - 6) / 2}" y="146" text-anchor="middle" style="fill:var(--good)">L</text></g>
       <g style="animation:goL 6s infinite"><path class="ln wm ink" d="M${x0 + span + (w - 6) / 2} 128 V116" marker-end="url(#skarr)"/><text class="lbl" x="${x0 + span + (w - 6) / 2}" y="146" text-anchor="middle" style="fill:#f0a35e">R</text></g>
       <text class="lbl" x="20" y="30">sum too small → L steps up</text>
       <text class="lbl" x="20" y="48">sum too big → R steps down</text>`);
  };

  /* ---- sliding-window[0]: a window growing/shrinking as it slides right ---- */
  V['sliding-window'] = {};
  V['sliding-window'][0] = () => {
    const n = 8, x0 = 40, w = 46;
    const cells = Array.from({ length: n }, (_, i) =>
      `<rect class="ln ink" x="${x0 + i * w}" y="70" width="${w - 6}" height="44" rx="4"/>`).join('');
    return svg('0 0 440 165',
      `@keyframes slideWin{
         0%{x:${x0 - 3}px;width:${w * 2}px} 30%{x:${x0 - 3}px;width:${w * 3}px}
         55%{x:${x0 + w * 2 - 3}px;width:${w * 2}px} 80%{x:${x0 + w * 4 - 3}px;width:${w * 3}px}
         100%{x:${x0 + w * 6 - 3}px;width:${w * 2}px}}`,
      `${cells}
       <rect x="${x0 - 3}" y="64" width="${w * 2}" height="56" rx="7" fill="var(--accent,#4fd1c5)" opacity="0.16" stroke="var(--accent)" stroke-width="2.4" style="animation:slideWin 6s infinite"/>
       <text class="lbl" x="20" y="30">grow on the right →</text>
       <text class="em" x="200" y="30">shrink from the left when it breaks</text>
       <text class="lbl" x="20" y="150">each element enters once, leaves once → O(n)</text>`);
  };

  /* ---- fast-slow-pointers[1]: tortoise & hare on a loop, hare catches up ---- */
  V['fast-slow-pointers'] = {};
  V['fast-slow-pointers'][1] = () => {
    const cx = 150, cy = 92, r = 62;
    const path = `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy}`;
    return svg('0 0 440 190', '',
      `<path id="loop" class="ln ink" d="${path}"/>
       <path class="ln ink" d="M40 ${cy} H${cx - r}"/>
       <circle class="fgd ink" r="7"><animateMotion dur="8s" repeatCount="indefinite" rotate="auto"><mpath href="#loop"/></animateMotion></circle>
       <circle class="fwm ink" r="7"><animateMotion dur="4s" repeatCount="indefinite" rotate="auto"><mpath href="#loop"/></animateMotion></circle>
       <text class="lbl fgd" x="${cx - 4}" y="${cy + 4}" style="fill:var(--good)">🐢</text>
       <text class="em" x="250" y="70">slow: 1 step</text>
       <text class="lbl" x="250" y="92" style="fill:#f0a35e">fast: 2 steps</text>
       <text class="em" x="250" y="128">on a loop, they</text>
       <text class="em" x="250" y="146">must meet 🎯</text>`);
  };

  /* ---- binary-search[1]: F F F T T T, boundary bracket converging ---- */
  V['binary-search'] = {};
  V['binary-search'][1] = () => {
    const items = ['F', 'F', 'F', 'F', 'T', 'T', 'T'], x0 = 70, w = 44;
    const cells = items.map((t, i) =>
      `<g class="ln ink"><rect x="${x0 + i * w}" y="70" width="${w - 6}" height="44" rx="4" class="${t === 'T' ? 'gd' : 'dg'}"/><text class="${t === 'T' ? 'fgd' : 'fdg'}" x="${x0 + i * w + (w - 6) / 2}" y="98" text-anchor="middle" style="font:700 13px system-ui">${t}</text></g>`
    ).join('');
    return svg('0 0 440 165',
      `@keyframes lo{0%{transform:translateX(0)}100%{transform:translateX(${4 * w}px)}}
       @keyframes hi{0%{transform:translateX(${6 * w}px)}100%{transform:translateX(${4 * w}px)}}
       @keyframes mid{0%,100%{opacity:.35}50%{opacity:1}}`,
      `${cells}
       <g style="animation:lo 5s ease-in-out infinite alternate"><path class="ln ac ink" d="M${x0 + (w - 6) / 2} 128 V118" marker-end="url(#skarr)"/><text class="em" x="${x0 + (w - 6) / 2}" y="146" text-anchor="middle">lo</text></g>
       <g style="animation:hi 5s ease-in-out infinite alternate"><path class="ln a2 ink" d="M${x0 + 6 * w + (w - 6) / 2} 128 V118" marker-end="url(#skarr)"/><text class="lbl" x="${x0 + 6 * w + (w - 6) / 2}" y="146" text-anchor="middle" style="fill:var(--accent-2)">hi</text></g>
       <text class="lbl" x="20" y="30">look at the middle, throw away half</text>
       <text class="em" x="230" y="30">→ find the first T</text>`);
  };

  /* ---- merge-intervals[1]: two overlapping bars merge into one ---- */
  V['merge-intervals'] = {};
  V['merge-intervals'][1] = () => {
    return svg('0 0 440 160',
      `@keyframes barA{0%,40%{opacity:1}60%,100%{opacity:0}}
       @keyframes barB{0%,40%{opacity:1}60%,100%{opacity:0}}
       @keyframes barM{0%,45%{opacity:0}62%,100%{opacity:1}}`,
      `<line class="ln ink" x1="30" y1="120" x2="410" y2="120" opacity="0.5"/>
       ${[80, 150, 220, 290, 360].map(x => `<line class="ln ink" x1="${x}" y1="116" x2="${x}" y2="124" opacity="0.5"/>`).join('')}
       <rect class="ink" x="70" y="52" width="140" height="20" rx="10" fill="var(--accent,#4fd1c5)" opacity="0.85" style="animation:barA 5s infinite"/>
       <rect class="ink" x="150" y="80" width="150" height="20" rx="10" fill="var(--accent-2,#b794f4)" opacity="0.85" style="animation:barB 5s infinite"/>
       <rect class="ink" x="70" y="66" width="230" height="22" rx="11" fill="var(--good,#7ee787)" opacity="0.9" style="animation:barM 5s infinite"/>
       <text class="lbl" x="20" y="28">overlapping ranges…</text>
       <text class="em" x="210" y="28">…merge into one</text>
       <text class="lbl" x="20" y="150">sort by start, then sweep once</text>`);
  };

  /* ---- monotonic-stack[1]: taller arrives, shorter bars pop ---- */
  V['monotonic-stack'] = {};
  V['monotonic-stack'][1] = () => {
    const bars = [[70, 60], [110, 92], [150, 40], [190, 74]];  // x, height (shorter ones pop)
    const els = bars.map(([x, h], i) => {
      const pop = h < 80;
      return `<rect class="ink" x="${x}" y="${130 - h}" width="30" height="${h}" rx="3" fill="${pop ? 'var(--text-dim,#8fa3ad)' : 'var(--accent,#4fd1c5)'}" ${pop ? `style="animation:pop 5s ${1 + i * 0.15}s infinite"` : ''}/>`;
    }).join('');
    return svg('0 0 440 165',
      `@keyframes pop{0%,18%{opacity:1;transform:translateY(0)}34%,100%{opacity:0;transform:translateY(-42px)}}
       @keyframes arrive{0%{transform:translateX(150px)}22%,100%{transform:translateX(0)}}`,
      `<line class="ln ink" x1="55" y1="130" x2="245" y2="130"/>
       ${els}
       <g style="animation:arrive 5s infinite"><rect class="ink" x="230" y="18" width="30" height="112" rx="3" fill="var(--good,#7ee787)"/><path class="ln gd ink" d="M245 8 V16" marker-end="url(#skarr)"/></g>
       <text class="lbl" x="270" y="60">taller arrives →</text>
       <text class="em" x="270" y="82">pop the shorter</text>
       <text class="lbl" x="270" y="104">hand them</text>
       <text class="lbl" x="270" y="122">their answer</text>`);
  };

  /* ---- linked-list-reversal[1]: arrows flip one by one ---- */
  V['linked-list-reversal'] = {};
  V['linked-list-reversal'][1] = () => {
    const xs = [60, 150, 240, 330], y = 90;
    const nodes = xs.map((x, i) =>
      `<g class="ln ink"><circle cx="${x}" cy="${y}" r="20"/><text class="em" x="${x}" y="${y + 5}" text-anchor="middle">${'ABCD'[i]}</text></g>`
    ).join('');
    const arrows = xs.slice(0, 3).map((x, i) =>
      `<g style="animation:flip 5s ${0.6 + i * 0.5}s infinite"><path class="ln a2 ink" d="M${x + 22} ${y} H${xs[i + 1] - 22}" marker-end="url(#skarr)"/></g>`
    ).join('');
    return svg('0 0 440 160',
      `@keyframes flip{0%,25%{opacity:1;transform:scaleX(1)}45%,100%{opacity:1;transform:scaleX(-1)}}
       .ln.a2{transform-box:fill-box;transform-origin:center}`,
      `${nodes}${arrows}
       <text class="lbl" x="20" y="30">grab next, flip the arrow, step forward</text>
       <text class="em" x="20" y="140">reverse the chain in place → O(1) space</text>`);
  };

  window.SLIDE_VISUALS = V;
  window.getSlideVisual = function (deckId, idx) {
    try {
      const d = V[deckId];
      const fn = d && d[idx];
      return fn ? fn() : '';
    } catch (e) { return ''; }
  };
})();
