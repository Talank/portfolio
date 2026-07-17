/* नेपाली Presentation engine.
   Slide decks live in data/nepali/<id>.js (window.NEPALI_DECKS[id]). The slide
   text stays in English; the narration is a Nepali script (Devanagari, with
   technical terms left in English) — like a presenter in Nepal explaining
   English slides.

   Narration is played from *pre-rendered* MP3 files (one per slide) generated
   with a neural Nepali voice (ne-NP-HemkalaNeural via edge-tts). The manifest
   at data/nepali/audio/manifest.js (window.NEPALI_AUDIO) maps each deck+slide
   to its MP3 and per-sentence start times, which drive the read-along
   transcript highlight. This replaces the old browser speechSynthesis path,
   which had no real Nepali voice on most machines. A tiny speechSynthesis
   fallback remains only for slides whose audio is somehow missing. */

(function () {
  'use strict';

  /* Nepali subtitles for the deck index cards (deck files themselves are
     lazy-loaded per module, so the index needs its own copy of these). */
  const TITLES_NE = {
    'warmup': 'Big-O भनेको के हो? + Python का जुक्तिहरू',
    'two-pointers': 'दुई छेउबाट भेट्न आउने दुई साथी',
    'sliding-window': 'माइक्रोको झ्यालबाट हेरेजस्तै — सर्दै जाने झ्याल',
    'fast-slow-pointers': 'खरायो र कछुवाको दौड',
    'merge-intervals': 'दशैंको टीका — समय जुधेका निम्ता जोड्ने',
    'binary-search': 'शब्दकोश बीचबाट खोल्ने बानी',
    'hashing-patterns': 'साँचो झुण्ड्याउने किला — नाम भन, ठाउँ पा',
    'prefix-sum': 'सडक किनारका किलोमिटर-ढुङ्गा',
    'linked-list-reversal': 'तीन औंलाले साङ्लो उल्टाउने',
    'monotonic-stack': 'अग्लो आयो, होचालाई पप!',
    'queue-deque': 'मन्दिरको लाइन र दुई-ढोके micro',
    'tree-dfs-bfs': 'वंशावली घुम्ने दुई तरिका',
    'binary-search-trees': 'देब्रे सानो, दाहिने ठूलो',
    'heaps-top-k': 'मेरिट लिस्टमा टिकिरहने उपाय',
    'backtracking': 'चौबाटोमा ढुङ्गा राख्दै जङ्गल छिचोल्ने',
    'graphs-bfs-dfs-topo-union': 'हल्ला फैलिने शहर — साथी-सञ्जाल',
    'dynamic-programming': 'हिजोको हिसाब आज नफेरि गर',
    'greedy': 'खुद्रा फिर्ता गर्ने पसलेको चाल',
    'bit-manipulation': 'बत्तीका स्विच र XOR को जादु',
    'trie': 'अक्षरैपिच्छे हाँगा हाल्ने रूख',
  };

  const RATE_KEY = 'dsa-np-rate';   // now: audio playbackRate (media stays in sync)
  const AUTO_KEY = 'dsa-np-auto';
  const AUDIO_BASE = 'data/nepali/audio/';

  function qs(name) { return new URLSearchParams(window.location.search).get(name); }
  function esc(str) { return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  /* Sentence split — MUST match the Python generator (generate_audio.py) so the
     transcript spans line up 1:1 with the manifest's per-sentence timings. */
  function splitSentences(text) {
    const parts = String(text).match(/[^।!?]+[।!?]*/g) || [];
    return parts.map(s => s.trim()).filter(Boolean);
  }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  /* ---------------- Player state ---------------- */

  let deck = null;
  let slideIdx = 0;
  let playing = false;
  let session = 0;            // bumped to invalidate stale async callbacks
  let chunkEls = [];          // transcript sentence spans of current slide
  let audioEl = null;         // single reused <audio>
  let prefetchEl = null;      // hidden element that warms the next slide's file

  function ttsSupported() { return typeof window.speechSynthesis !== 'undefined'; }

  /* Manifest lookup for the current slide (or a given index). */
  function audioInfo(idx) {
    idx = (idx == null) ? slideIdx : idx;
    const a = window.NEPALI_AUDIO;
    if (!a || !a.decks || !deck) return null;
    const d = a.decks[deck.id];
    return d ? d[idx] : null;
  }

  function currentRate() {
    const r = parseFloat(localStorage.getItem(RATE_KEY));
    if (isNaN(r)) return 1.0;              // audio already baked to a soothing pace
    return Math.min(1.5, Math.max(0.7, r));
  }

  function autoplayOn() { return localStorage.getItem(AUTO_KEY) !== '0'; }

  function getAudioEl() {
    if (!audioEl) {
      audioEl = new Audio();
      audioEl.preload = 'auto';
    }
    return audioEl;
  }

  /* Stop any playback and invalidate in-flight callbacks. */
  function stopAudio() {
    session++;
    if (audioEl) { try { audioEl.pause(); } catch (e) {} }
    if (ttsSupported()) window.speechSynthesis.cancel();
  }

  function prefetch(idx) {
    const info = audioInfo(idx);
    if (!info || !info.file) return;
    if (!prefetchEl) prefetchEl = new Audio();
    prefetchEl.preload = 'auto';
    prefetchEl.src = AUDIO_BASE + info.file;
  }

  /* Read-along highlight: i = active sentence, -1 = none. */
  function markChunk(i) {
    chunkEls.forEach((el, idx) => {
      el.classList.toggle('np-now', idx === i);
      el.classList.toggle('np-said', i !== -1 ? idx < i : true);
    });
  }

  function activeSentence(t, starts) {
    let idx = 0;
    for (let i = 0; i < starts.length; i++) {
      if (t + 0.05 >= starts[i]) idx = i; else break;
    }
    return idx;
  }

  function updateScrub() {
    const a = audioEl;
    const bar = document.getElementById('np-scrub');
    const tlabel = document.getElementById('np-time');
    if (!a || !bar) return;
    const dur = isFinite(a.duration) && a.duration > 0 ? a.duration : (audioInfo() || {}).dur || 0;
    bar.max = dur || 0;
    if (!bar.dragging) bar.value = a.currentTime || 0;
    if (tlabel) tlabel.textContent = fmtTime(a.currentTime) + ' / ' + fmtTime(dur);
  }

  /* Play the current slide's narration audio; call onEnded when it finishes. */
  function playSlideAudio(onEnded) {
    const info = audioInfo();
    if (!info || !info.file) { speakSlideTTS(onEnded); return; }

    const mySession = ++session;
    const a = getAudioEl();
    const starts = info.sentences || [];

    a.onended = null; a.ontimeupdate = null; a.onerror = null;
    a.src = AUDIO_BASE + info.file;
    a.playbackRate = currentRate();

    a.ontimeupdate = () => {
      if (mySession !== session) return;
      markChunk(activeSentence(a.currentTime, starts));
      updateScrub();
    };
    a.onended = () => {
      if (mySession !== session) return;
      markChunk(starts.length - 1);
      chunkEls.forEach(el => el.classList.add('np-said'));
      updateScrub();
      if (onEnded) onEnded();
    };
    a.onerror = () => {
      if (mySession !== session) return;
      speakSlideTTS(onEnded);      // graceful fallback if the file won't load
    };

    markChunk(0);
    prefetch(slideIdx + 1);
    const p = a.play();
    if (p && p.catch) p.catch(() => { /* autoplay policy — ignored, click retries */ });
  }

  /* Minimal browser-TTS fallback: only used when a slide's MP3 is unavailable. */
  function speakSlideTTS(onAllDone) {
    const mySession = ++session;
    const chunks = splitSentences(deck.slides[slideIdx].narration);
    if (!ttsSupported() || !chunks.length) {
      if (onAllDone) setTimeout(() => { if (mySession === session) onAllDone(); }, 1200);
      return;
    }
    window.speechSynthesis.cancel();
    function speakChunk(i) {
      if (mySession !== session) return;
      if (i >= chunks.length) { markChunk(-1); if (onAllDone) onAllDone(); return; }
      markChunk(i);
      const u = new SpeechSynthesisUtterance(chunks[i]);
      u.lang = 'ne-NP'; u.rate = 0.85;
      let done = false;
      const next = () => { if (done || mySession !== session) return; done = true; speakChunk(i + 1); };
      u.onend = next; u.onerror = next;
      setTimeout(next, Math.max(5000, chunks[i].length * 260 / 0.85));
      try { window.speechSynthesis.speak(u); } catch (e) { next(); }
    }
    speakChunk(0);
  }

  /* ---------------- Rendering ---------------- */

  function renderIndex() {
    const root = document.getElementById('nepali-root');
    document.title = 'नेपाली Presentation — DSA Crash Course';
    const grouped = {};
    window.SCHEDULE.forEach(m => { (grouped[m.category] = grouped[m.category] || []).push(m); });
    const groups = Object.keys(grouped).map(cat => {
      const cards = grouped[cat].map(m => `
        <a class="module-card" href="nepali.html?id=${m.id}">
          <span class="mc-title">${esc(m.title)}</span>
          <span class="mc-meta np-ne">${esc(TITLES_NE[m.id] || '')}</span>
        </a>`).join('');
      return `<h2>${esc(cat)}</h2><div class="grid">${cards}</div>`;
    }).join('');
    root.innerHTML = `
      <h1>नेपाली Presentation</h1>
      <p class="lede">Every module of the course, re-taught as a narrated slide show — the slides stay in
      English, but the voice explains everything <b>in Nepali</b>, with Nepali-flavoured anecdotes and
      mnemonics instead of a word-for-word reading. जुन कुरा अङ्ग्रेजीमा छिटो बुझिँदैन, त्यही कुरा कथा र
      सूत्रसहित बिस्तारै, शान्त आवाजमा।</p>
      <div class="card">
        <b>आवाजको बारेमा:</b> narration अब browser को robotic आवाजले होइन, <b>असली neural नेपाली स्वर</b>ले
        भनिन्छ — पहिल्यै record गरिएका audio फाइलहरू बजाइन्छन्, त्यसैले जुनसुकै browser मा एउटै मीठो, शान्त
        आवाज सुनिन्छ। बोलिरहेको वाक्य transcript मा हाइलाइट हुन्छ; कुनै वाक्यमा click गरे त्यहीँबाट सुन्न
        सकिन्छ। तल Player भित्रको speed slider ले चाहेअनुसार अझ बिस्तारै वा छिटो पार्न मिल्छ।
      </div>
      ${groups}`;
    document.getElementById('nepali-footer-nav').innerHTML = '';
  }

  function slideBodyHtml(s) {
    let h = '';
    if (s.big) h += `<div class="np-big">${s.big}</div>`;
    if (s.bullets && s.bullets.length) h += `<ul>${s.bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
    if (s.code) h += `<pre><code>${esc(s.code)}</code></pre>`;
    return h;
  }

  function renderSlide() {
    const s = deck.slides[slideIdx];
    const stage = document.getElementById('np-stage');
    stage.innerHTML = `
      <div class="np-slide sa-cap-in">
        <div class="np-count">Slide ${slideIdx + 1} / ${deck.slides.length}</div>
        <h2 class="np-slide-heading">${s.heading}</h2>
        ${slideBodyHtml(s)}
      </div>`;
    const chunks = splitSentences(s.narration);
    const starts = (audioInfo() || {}).sentences || [];
    chunkEls = [];
    const tr = document.getElementById('np-transcript-body');
    tr.innerHTML = '';
    chunks.forEach((c, i) => {
      const span = document.createElement('span');
      span.className = 'np-chunk';
      span.textContent = c + ' ';
      span.title = 'यहाँबाट सुन्नुहोस्';
      span.addEventListener('click', () => seekToSentence(i, starts));
      tr.appendChild(span);
      chunkEls.push(span);
    });
    document.getElementById('np-prev').disabled = slideIdx === 0;
    document.getElementById('np-next').disabled = slideIdx === deck.slides.length - 1;
    updateScrub();
  }

  function seekToSentence(i, starts) {
    const t = starts[i];
    if (t == null) return;
    if (!playing) { playCurrent(); }
    const a = getAudioEl();
    const apply = () => { a.currentTime = t; markChunk(i); };
    if (a.readyState >= 1) apply(); else a.addEventListener('loadedmetadata', apply, { once: true });
  }

  function setPlayLabel() {
    document.getElementById('np-play').textContent = playing ? '⏸ रोक्नुहोस्' : '▶ सुन्नुहोस्';
  }

  function playCurrent() {
    playing = true;
    setPlayLabel();
    playSlideAudio(() => {
      if (!playing) return;
      const mySession = session;
      if (autoplayOn() && slideIdx < deck.slides.length - 1) {
        setTimeout(() => {
          if (!playing || session !== mySession) return;
          slideIdx++;
          renderSlide();
          playCurrent();
        }, 700);
      } else {
        playing = false;
        setPlayLabel();
      }
    });
  }

  function pause() {
    playing = false;
    stopAudio();
    markChunk(-1);
    chunkEls.forEach(el => el.classList.remove('np-said'));
    setPlayLabel();
  }

  function goTo(idx) {
    const wasPlaying = playing;
    stopAudio();
    slideIdx = Math.max(0, Math.min(deck.slides.length - 1, idx));
    renderSlide();
    if (wasPlaying) playCurrent(); else pause();
  }

  function renderDeck(id) {
    deck = (window.NEPALI_DECKS || {})[id];
    const root = document.getElementById('nepali-root');
    if (!deck) {
      root.innerHTML = `<p>Deck "${esc(id)}" not found. <a href="nepali.html">← सबै presentation</a></p>`;
      return;
    }
    document.title = `${deck.title} (नेपालीमा) — DSA Crash Course`;
    const mod = window.SCHEDULE.find(m => m.id === id);
    const patternLink = mod && mod.type === 'pattern'
      ? `<a href="pattern.html?id=${id}">full English write-up ↗</a>`
      : `<a href="pythonic-idioms.html">full English write-up ↗</a>`;

    root.innerHTML = `
      <div class="pill">${esc(mod ? mod.category : '')}</div>
      <div class="pill time">नेपालीमा</div>
      <h1>${esc(deck.title)}</h1>
      <p class="lede">${esc(deck.titleNe)} — ${deck.intro} (${patternLink})</p>

      <div class="np-stage" id="np-stage"></div>
      <div class="np-progress">
        <input type="range" id="np-scrub" min="0" max="0" step="0.1" value="0" aria-label="Narration position">
        <span class="np-time" id="np-time">0:00 / 0:00</span>
      </div>
      <div class="np-controls">
        <button class="btn" id="np-play">▶ सुन्नुहोस्</button>
        <button id="np-replay" title="यही slide फेरि">🔁 फेरि</button>
        <button id="np-prev">⏮ अघिल्लो</button>
        <button id="np-next">अर्को ⏭</button>
        <label class="np-opt"><input type="checkbox" id="np-auto"> auto-advance</label>
        <span class="np-flex"></span>
        <label class="np-opt">Speed
          <input type="range" id="np-rate" min="0.7" max="1.5" step="0.05">
          <span id="np-rate-val"></span>
        </label>
      </div>
      <div class="np-transcript">
        <div class="np-label">🎙 Narration transcript — बोलिरहेको वाक्य हाइलाइट हुन्छ (click गरे त्यहीँबाट सुनिन्छ)</div>
        <div id="np-transcript-body"></div>
      </div>
      <p id="np-voice-hint" style="color:var(--text-dim); font-size:0.82rem;"></p>`;

    renderSlide();

    document.getElementById('np-play').addEventListener('click', () => {
      if (playing) pause(); else playCurrent();
    });
    document.getElementById('np-replay').addEventListener('click', () => { pause(); playCurrent(); });
    document.getElementById('np-prev').addEventListener('click', () => goTo(slideIdx - 1));
    document.getElementById('np-next').addEventListener('click', () => goTo(slideIdx + 1));

    const auto = document.getElementById('np-auto');
    auto.checked = autoplayOn();
    auto.addEventListener('change', () => localStorage.setItem(AUTO_KEY, auto.checked ? '1' : '0'));

    const rate = document.getElementById('np-rate');
    const rateVal = document.getElementById('np-rate-val');
    rate.value = currentRate();
    rateVal.textContent = currentRate().toFixed(2) + 'x';
    rate.addEventListener('input', () => {
      localStorage.setItem(RATE_KEY, rate.value);
      rateVal.textContent = parseFloat(rate.value).toFixed(2) + 'x';
      if (audioEl) audioEl.playbackRate = currentRate();   // live, no restart needed
    });

    // Scrubber: drag to seek within the current narration.
    const scrub = document.getElementById('np-scrub');
    scrub.addEventListener('input', () => {
      scrub.dragging = true;
      const a = getAudioEl();
      if (isFinite(a.duration)) a.currentTime = parseFloat(scrub.value);
      const starts = (audioInfo() || {}).sentences || [];
      markChunk(activeSentence(parseFloat(scrub.value), starts));
    });
    scrub.addEventListener('change', () => { scrub.dragging = false; });

    // No Nepali voice on this machine? With pre-rendered audio it no longer
    // matters — only note the rare case where audio is entirely unavailable.
    const hint = document.getElementById('np-voice-hint');
    if (!window.NEPALI_AUDIO) {
      hint.textContent = 'Pre-rendered narration (manifest) not found — falling back to the browser voice, which may not read Nepali well. Run data/nepali/audio/generate_audio.py to build the audio.';
    } else {
      hint.textContent = '';
    }

    document.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowRight') goTo(slideIdx + 1);
      else if (e.key === 'ArrowLeft') goTo(slideIdx - 1);
      else if (e.key === ' ') { e.preventDefault(); if (playing) pause(); else playCurrent(); }
    });

    // prev/next deck links following course order
    const idx = window.SCHEDULE.findIndex(m => m.id === id);
    const nav = document.getElementById('nepali-footer-nav');
    const prev = idx > 0 ? window.SCHEDULE[idx - 1] : null;
    const next = idx < window.SCHEDULE.length - 1 ? window.SCHEDULE[idx + 1] : null;
    nav.innerHTML =
      (prev ? `<a href="nepali.html?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a href="nepali.html">← सबै presentation</a>`) +
      (next ? `<a href="nepali.html?id=${next.id}">${esc(next.title)} →</a>` : `<a href="nepali.html">सबै presentation →</a>`);

    prefetch(0);
    window.addEventListener('beforeunload', stopAudio);
  }

  function boot() {
    const id = qs('id');
    // Manifest first (small), then the deck. Both via <script> so it works over
    // file:// too, matching how decks are loaded.
    const loadDeck = () => {
      if (!id) { renderIndex(); return; }
      const script = document.createElement('script');
      script.src = `data/nepali/${id}.js`;
      script.onload = () => renderDeck(id);
      script.onerror = () => {
        document.getElementById('nepali-root').innerHTML =
          `<p>Could not load deck "${esc(id)}". <a href="nepali.html">← सबै presentation</a></p>`;
      };
      document.body.appendChild(script);
    };
    if (window.NEPALI_AUDIO) { loadDeck(); return; }
    const man = document.createElement('script');
    man.src = `${AUDIO_BASE}manifest.js`;
    man.onload = loadDeck;
    man.onerror = loadDeck;   // proceed without audio manifest (TTS fallback)
    document.body.appendChild(man);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
