/* Original character portraits for episode scenes — simple flat-vector busts,
   drawn from scratch (not traced from any existing artwork). Kept iconic and
   geometric, in the same spirit as the emoji actors used elsewhere on the
   site: enough to read as "Luffy", "Nami", etc. without reproducing anyone's
   copyrighted character design. Consumed by js/episode-engine.js. */

(function () {
  'use strict';

  function svg(inner, bg) {
    return (
      '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img">' +
      '<circle cx="60" cy="60" r="58" fill="' + bg + '"/>' +
      inner +
      '</svg>'
    );
  }

  const C = {};

  // voice: tuning for the browser's built-in speech synthesizer (js/voice-engine.js).
  // pitch/rate are SpeechSynthesisUtterance ranges (~0-2 / ~0.1-10); genderHint steers
  // which installed system voice gets picked, when one is available.
  C.luffy = {
    name: 'Luffy',
    color: '#e94b3c',
    voice: { pitch: 1.6, rate: 1.0, volume: 1, genderHint: 'male', style: 'energetic', emotion: 'happy', energy: 0.95, pauseScale: 0.9},
    portrait: svg(
      '<circle cx="60" cy="68" r="30" fill="#f3c98b"/>' +               // face
      '<path d="M28 58 Q60 0 92 58 Q92 40 60 30 Q28 40 28 58Z" fill="#e0b23c"/>' + // straw hat cone
      '<ellipse cx="60" cy="52" rx="36" ry="10" fill="#e0b23c"/>' +      // hat brim
      '<rect x="34" y="46" width="52" height="8" rx="3" fill="#c0392b"/>' + // hat band
      '<circle cx="49" cy="70" r="4" fill="#2b2b2b"/>' +                 // eyes
      '<circle cx="71" cy="70" r="4" fill="#2b2b2b"/>' +
      '<path d="M46 85 Q60 96 74 85" stroke="#7a3d1f" stroke-width="3" fill="none" stroke-linecap="round"/>', // grin
      '#3f7cac'
    )
  };

  C.nami = {
    name: 'Nami',
    color: '#f6ad55',
    voice: { pitch: 1.5, rate: 1.00, volume: 1, genderHint: 'female', style: 'conversational', emotion: 'curious', energy: 0.8, pauseScale: 0.8 },
    portrait: svg(
      '<path d="M22 60 Q20 15 60 12 Q100 15 98 60 L88 60 Q86 28 60 26 Q34 28 32 60Z" fill="#f6a623"/>' + // orange hair
      '<circle cx="60" cy="68" r="28" fill="#f3c98b"/>' +
      '<circle cx="50" cy="70" r="3.5" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="70" r="3.5" fill="#2b2b2b"/>' +
      '<path d="M48 84 Q60 90 72 84" stroke="#7a3d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M18 62 Q10 90 24 108" stroke="#f6a623" stroke-width="10" fill="none" stroke-linecap="round"/>' +
      '<path d="M102 62 Q110 90 96 108" stroke="#f6a623" stroke-width="10" fill="none" stroke-linecap="round"/>',
      '#2f8f6f'
    )
  };

  C.robin = {
    name: 'Robin',
    color: '#8e5fc9',
    voice: { pitch: 0.95, rate: 0.85, volume: 1, genderHint: 'female', style: 'conversational', emotion: 'curious', energy: 0.8, pauseScale: 0.8 },
    portrait: svg(
      '<path d="M20 55 Q18 10 60 8 Q102 10 100 55 L60 66Z" fill="#2b2340"/>' + // dark hair
      '<circle cx="60" cy="70" r="27" fill="#f0c9a0"/>' +
      '<circle cx="50" cy="72" r="3.2" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="72" r="3.2" fill="#2b2b2b"/>' +
      '<path d="M50 86 Q60 90 70 86" stroke="#7a3d1f" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<path d="M20 55 Q14 92 30 112" stroke="#2b2340" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M100 55 Q106 92 90 112" stroke="#2b2340" stroke-width="9" fill="none" stroke-linecap="round"/>',
      '#4a3b6b'
    )
  };

  C.usopp = {
    name: 'Usopp',
    color: '#6fae44',
    voice: { pitch: 1.8, rate: 0.9, volume: 0.95, genderHint: 'male', style: 'conversational', emotion: 'curious', energy: 0.8, pauseScale: 1.1 },
    portrait: svg(
      '<circle cx="55" cy="72" r="26" fill="#c88a5a"/>' +                // face
      '<path d="M55 72 Q90 68 92 78 Q90 86 55 82Z" fill="#c88a5a"/>' +   // long nose
      '<path d="M22 58 Q54 24 86 50 Q86 58 60 54 Q34 54 22 58Z" fill="#2f2a1e"/>' + // curly hair
      '<circle cx="46" cy="70" r="3.2" fill="#2b2b2b"/>' +
      '<path d="M42 86 Q55 92 66 86" stroke="#5a3a1f" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
      '<circle cx="18" cy="52" r="7" fill="#e8c27a"/>' +                 // sniper goggles hint
      '<circle cx="18" cy="52" r="4" fill="#274b5e"/>',
      '#8a6a3c'
    )
  };

  C.zoro = {
    name: 'Zoro',
    color: '#2f855a',
    voice: { pitch: 0.84, rate: 1.0, volume: 1, genderHint: 'male', style: 'stoic', emotion: 'calm', energy: 0.8, pauseScale: 1.15 },
    portrait: svg(
      '<path d="M20 54 Q18 12 60 10 Q102 12 100 54 L60 60Z" fill="#2f8f5a"/>' + // green hair
      '<circle cx="60" cy="72" r="27" fill="#e8b98a"/>' +
      '<rect x="30" y="60" width="60" height="10" fill="#111" opacity="0.85"/>' + // eye bandana/scar hint
      '<circle cx="70" cy="76" r="3.2" fill="#2b2b2b"/>' +
      '<path d="M48 88 Q60 84 72 88" stroke="#6a4a2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>',
      '#274a3a'
    )
  };

  C.chopper = {
    name: 'Chopper',
    color: '#d9822b',
    voice: { pitch: 2.1, rate: 1.0, volume: 1, genderHint: 'male', style: 'cute', emotion: 'curious', energy: 0.5, pauseScale: 0.95 },
    portrait: svg(
      '<circle cx="60" cy="72" r="28" fill="#c88a4a"/>' +
      '<path d="M40 50 Q30 10 46 40Z" fill="#5a3a1f"/>' +                // antlers L
      '<path d="M80 50 Q90 10 74 40Z" fill="#5a3a1f"/>' +                // antlers R
      '<circle cx="48" cy="74" r="3.4" fill="#2b2b2b"/>' +
      '<circle cx="72" cy="74" r="3.4" fill="#2b2b2b"/>' +
      '<ellipse cx="60" cy="86" rx="8" ry="5" fill="#3a2a1a"/>' +        // nose
      '<circle cx="60" cy="40" r="16" fill="#e0c08a"/>',                 // pom-pom hat
      '#3f6b8a'
    )
  };

  C.brook = {
    name: 'Brook',
    color: '#cbd5e1',
    voice: { pitch: 0.8, rate: 0.93, volume: 1, genderHint: 'male', style: 'theatrical', emotion: 'wistful', energy: 0.6, pauseScale: 1.15 },
    portrait: svg(
      '<path d="M16 48 Q10 4 60 2 Q110 4 104 48 Q92 28 60 28 Q28 28 16 48Z" fill="#1c1c1c"/>' + // afro silhouette
      '<circle cx="60" cy="68" r="30" fill="#f5f2e8"/>' +                 // bare skull
      '<circle cx="49" cy="66" r="7.5" fill="#141414"/>' +                // eye socket L
      '<circle cx="71" cy="66" r="7.5" fill="#141414"/>' +                // eye socket R
      '<path d="M56 80 Q60 86 64 80" fill="none" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>' + // nasal cavity
      '<path d="M40 92 Q60 102 80 92" fill="none" stroke="#141414" stroke-width="2.4" stroke-linecap="round"/>' + // grin
      '<rect x="39" y="91" width="4" height="7" fill="#141414"/>' +
      '<rect x="49" y="94" width="4" height="7" fill="#141414"/>' +
      '<rect x="59" y="95" width="4" height="7" fill="#141414"/>' +
      '<rect x="69" y="94" width="4" height="7" fill="#141414"/>' +
      '<rect x="79" y="91" width="4" height="7" fill="#141414"/>',        // grin teeth
      '#2b2b3a'
    )
  };

  C.marine = {
    name: 'Marine Clerk',
    color: '#6b7f99',
    portrait: svg(
      '<circle cx="60" cy="70" r="27" fill="#e8b98a"/>' +
      '<path d="M24 58 Q60 30 96 58 Q96 46 60 40 Q24 46 24 58Z" fill="#f4f4f4"/>' + // white cap
      '<circle cx="50" cy="72" r="3.2" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="72" r="3.2" fill="#2b2b2b"/>' +
      '<path d="M48 86 Q60 88 72 86" stroke="#6a4a2a" stroke-width="2" fill="none" stroke-linecap="round"/>',
      '#37475a'
    )
  };

  // ── Added for the AI Engineer Course ──────────────────────────────────

  C.sanji = {
    name: 'Sanji',
    color: '#f2c14e',
    voice: { pitch: 1.0, rate: 1.05, volume: 1, genderHint: 'male', style: 'conversational', emotion: 'happy', energy: 0.85, pauseScale: 0.85 },
    portrait: svg(
      '<path d="M26 58 Q28 18 60 16 Q92 18 94 58 L84 56 Q84 30 60 28 Q40 30 38 44 L36 70Z" fill="#e8c358"/>' + // swept blond hair
      '<circle cx="60" cy="68" r="28" fill="#f3c98b"/>' +
      '<path d="M34 52 Q46 44 58 52 L58 74 Q46 70 36 74Z" fill="#e8c358"/>' + // fringe over one eye
      '<circle cx="70" cy="70" r="3.5" fill="#2b2b2b"/>' +
      '<path d="M62 78 Q68 76 74 78" stroke="#7a3d1f" stroke-width="2" fill="none"/>' +
      '<path d="M50 86 Q60 91 70 86" stroke="#7a3d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      '#31485e'
    )
  };

  C.franky = {
    name: 'Franky',
    color: '#37b6e0',
    voice: { pitch: 0.7, rate: 0.95, volume: 1, genderHint: 'male', style: 'energetic', emotion: 'happy', energy: 1.0, pauseScale: 0.8 },
    portrait: svg(
      '<path d="M34 40 Q60 6 86 40 L80 52 Q60 30 40 52Z" fill="#37b6e0"/>' + // pompadour swoosh
      '<circle cx="60" cy="70" r="28" fill="#e8b07a"/>' +
      '<rect x="40" y="60" width="40" height="10" rx="5" fill="#1f2a36"/>' + // sunglasses bar
      '<circle cx="49" cy="65" r="6" fill="#37b6e0"/>' +
      '<circle cx="71" cy="65" r="6" fill="#37b6e0"/>' +
      '<path d="M46 86 Q60 94 74 86" stroke="#7a3d1f" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<rect x="52" y="98" width="16" height="6" rx="3" fill="#6b7c8f"/>', // metal chin plate
      '#c0392b'
    )
  };

  C.vegapunk = {
    name: 'Dr. Vegapunk',
    color: '#9ad06d',
    voice: { pitch: 1.1, rate: 0.9, volume: 1, genderHint: 'male', style: 'conversational', emotion: 'curious', energy: 0.7, pauseScale: 1.1 },
    portrait: svg(
      '<circle cx="60" cy="44" r="26" fill="#f7e6c4"/>' + // oversized cranium
      '<path d="M36 44 Q60 10 84 44" stroke="#9ad06d" stroke-width="4" fill="none"/>' + // energy arc
      '<circle cx="60" cy="78" r="22" fill="#f3c98b"/>' +
      '<circle cx="52" cy="76" r="3.5" fill="#2b2b2b"/>' +
      '<circle cx="68" cy="76" r="3.5" fill="#2b2b2b"/>' +
      '<rect x="44" y="70" width="14" height="10" rx="2" fill="none" stroke="#5a6b7a" stroke-width="2"/>' + // monocle-ish
      '<path d="M52 90 Q60 94 68 90" stroke="#7a3d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="60" cy="34" r="4" fill="#9ad06d"/>', // antenna node
      '#4a3f6b'
    )
  };

  // The Big Bang Theory — same flat-vector, non-traced treatment.
  C.sheldon = {
    name: 'Sheldon',
    color: '#7ec8e3',
    voice: { pitch: 1.15, rate: 1.05, volume: 1, genderHint: 'male', style: 'conversational', emotion: 'neutral', energy: 0.75, pauseScale: 1.0 },
    portrait: svg(
      '<circle cx="60" cy="66" r="28" fill="#f3d6b8"/>' +
      '<path d="M32 58 Q34 32 60 30 Q86 32 88 58 L80 54 Q78 40 60 38 Q42 40 40 54Z" fill="#5b4632"/>' + // short flat hair
      '<circle cx="50" cy="66" r="3.5" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="66" r="3.5" fill="#2b2b2b"/>' +
      '<path d="M50 84 L70 84" stroke="#7a3d1f" stroke-width="2.5" stroke-linecap="round"/>' + // deadpan mouth
      '<rect x="40" y="96" width="40" height="14" rx="4" fill="#c0392b"/>' + // layered tees
      '<rect x="46" y="96" width="28" height="14" rx="4" fill="#f2c14e"/>',
      '#2e5e4e'
    )
  };

  C.leonard = {
    name: 'Leonard',
    color: '#b0bec5',
    voice: { pitch: 0.95, rate: 1.0, volume: 1, genderHint: 'male', style: 'conversational', emotion: 'neutral', energy: 0.7, pauseScale: 0.95 },
    portrait: svg(
      '<circle cx="60" cy="66" r="28" fill="#f3d6b8"/>' +
      '<path d="M32 60 Q32 34 60 32 Q88 34 88 60 L80 56 Q78 42 60 40 Q42 42 40 56Z" fill="#3d3126"/>' +
      '<circle cx="50" cy="66" r="9" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>' + // glasses
      '<circle cx="70" cy="66" r="9" fill="none" stroke="#2b2b2b" stroke-width="2.5"/>' +
      '<path d="M59 66 L61 66" stroke="#2b2b2b" stroke-width="2.5"/>' +
      '<circle cx="50" cy="66" r="3" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="66" r="3" fill="#2b2b2b"/>' +
      '<path d="M50 85 Q60 90 70 85" stroke="#7a3d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      '#6d4c41'
    )
  };

  C.penny = {
    name: 'Penny',
    color: '#f8bbd0',
    voice: { pitch: 1.35, rate: 1.0, volume: 1, genderHint: 'female', style: 'conversational', emotion: 'happy', energy: 0.85, pauseScale: 0.85 },
    portrait: svg(
      '<path d="M24 62 Q22 20 60 16 Q98 20 96 62 L86 60 Q86 32 60 30 Q34 32 34 60Z" fill="#f2d16b"/>' + // blond hair
      '<circle cx="60" cy="68" r="27" fill="#f3d6b8"/>' +
      '<circle cx="50" cy="68" r="3.5" fill="#2b2b2b"/>' +
      '<circle cx="70" cy="68" r="3.5" fill="#2b2b2b"/>' +
      '<path d="M48 84 Q60 91 72 84" stroke="#7a3d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M22 64 Q16 92 30 106" stroke="#f2d16b" stroke-width="9" fill="none" stroke-linecap="round"/>' +
      '<path d="M98 64 Q104 92 90 106" stroke="#f2d16b" stroke-width="9" fill="none" stroke-linecap="round"/>',
      '#7b3f61'
    )
  };

  window.CHARACTERS = C;
})();
