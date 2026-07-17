/* नेपाली Presentation engine.
   Slide decks live in data/nepali/<id>.js (window.NEPALI_DECKS[id]). The slide
   text stays in English; the narration is a Nepali script (Devanagari, with
   technical terms left in English) spoken by the browser's speech synthesizer —
   like a presenter in Nepal explaining English slides. Narration is split into
   sentences and spoken one utterance at a time (works around Chrome's long-
   utterance cutoff) with read-along highlighting in the transcript. */

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

  const VOICE_KEY = 'dsa-np-voice';
  const RATE_KEY = 'dsa-np-rate';
  const AUTO_KEY = 'dsa-np-auto';

  function qs(name) { return new URLSearchParams(window.location.search).get(name); }
  function esc(str) { return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

  /* ---------------- Voice handling ---------------- */

  let voices = [];

  function ttsSupported() { return typeof window.speechSynthesis !== 'undefined'; }

  function refreshVoices() {
    if (!ttsSupported()) return [];
    voices = window.speechSynthesis.getVoices() || [];
    return voices;
  }

  /* Rank: Nepali first, then Hindi (every Devanagari-capable browser voice we
     can realistically expect — reads Nepali text understandably), then Indian
     English, then the rest. */
  function voiceRank(v) {
    if (/^ne/i.test(v.lang) || /nepali/i.test(v.name)) return 0;
    if (/^hi/i.test(v.lang) || /hindi|हिन्दी/i.test(v.name)) return 1;
    if (/^en-IN/i.test(v.lang)) return 2;
    return 3;
  }

  function sortedVoices() {
    return refreshVoices().slice().sort((a, b) => voiceRank(a) - voiceRank(b) || a.name.localeCompare(b.name));
  }

  function pickDefaultVoice() {
    const saved = localStorage.getItem(VOICE_KEY);
    const all = sortedVoices();
    if (saved) {
      const m = all.find(v => v.voiceURI === saved);
      if (m) return m;
    }
    return all[0] || null;
  }

  /* Split Devanagari narration into sentence chunks. Chrome's synthesizer
     silently dies on long utterances, so we always speak sentence-by-sentence. */
  function splitSentences(text) {
    const parts = String(text).match(/[^।!?]+[।!?]*/g) || [];
    return parts.map(s => s.trim()).filter(Boolean);
  }

  /* ---------------- Player state ---------------- */

  let deck = null;
  let slideIdx = 0;
  let playing = false;
  let session = 0;          // bumped to invalidate in-flight utterance chains
  let chunkEls = [];        // transcript sentence spans of current slide

  function stopSpeech() {
    session++;
    if (ttsSupported()) window.speechSynthesis.cancel();
  }

  function currentRate() {
    const r = parseFloat(localStorage.getItem(RATE_KEY));
    return isNaN(r) ? 0.85 : r;   // soothing default: slower than normal speech
  }

  function autoplayOn() {
    return localStorage.getItem(AUTO_KEY) !== '0';
  }

  function speakSlide(onAllDone) {
    const mySession = ++session;
    if (ttsSupported()) window.speechSynthesis.cancel();
    const chunks = splitSentences(deck.slides[slideIdx].narration);
    if (!ttsSupported() || !chunks.length) {
      if (onAllDone) setTimeout(onAllDone, 1200);
      return;
    }
    const voice = pickDefaultVoice();
    const rate = currentRate();

    function speakChunk(i) {
      if (mySession !== session) return;
      if (i >= chunks.length) {
        markChunk(-1);
        if (onAllDone) onAllDone();
        return;
      }
      markChunk(i);
      const u = new SpeechSynthesisUtterance(chunks[i]);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : 'ne-NP';
      u.rate = rate;
      u.pitch = 1;
      u.volume = 1;
      let done = false;
      const next = () => {
        if (done || mySession !== session) return;
        done = true;
        speakChunk(i + 1);
      };
      u.onend = next;
      u.onerror = next;
      // Safety net for browsers that silently drop an utterance.
      setTimeout(next, Math.max(5000, chunks[i].length * 260 / rate));
      try { window.speechSynthesis.speak(u); } catch (e) { next(); }
    }
    speakChunk(0);
  }

  /* Read-along highlight: i = active sentence, -1 = none (all done). */
  function markChunk(i) {
    chunkEls.forEach((el, idx) => {
      el.classList.toggle('np-now', idx === i);
      el.classList.toggle('np-said', i !== -1 ? idx < i : true);
    });
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
        <b>आवाजको बारेमा:</b> narration तपाईंकै browser को speech synthesizer ले पढ्छ। नेपाली voice भएका
        browser निकै कम छन्, त्यसैले <b>Google हिन्दी</b> (Chrome मा हुन्छ) जस्तो Devanagari पढ्न जान्ने voice
        छानिन्छ — नेपाली लेखाइ राम्रैसँग बुझिन्छ। Player भित्रको dropdown बाट voice फेर्न र speed घटाएर अझ
        soothing बनाउन सकिन्छ।
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
    chunkEls = [];
    const tr = document.getElementById('np-transcript-body');
    tr.innerHTML = '';
    chunks.forEach(c => {
      const span = document.createElement('span');
      span.className = 'np-chunk';
      span.textContent = c + ' ';
      tr.appendChild(span);
      chunkEls.push(span);
    });
    document.getElementById('np-prev').disabled = slideIdx === 0;
    document.getElementById('np-next').disabled = slideIdx === deck.slides.length - 1;
  }

  function setPlayLabel() {
    document.getElementById('np-play').textContent = playing ? '⏸ रोक्नुहोस्' : '▶ सुन्नुहोस्';
  }

  function playCurrent() {
    playing = true;
    setPlayLabel();
    speakSlide(() => {
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
    stopSpeech();
    markChunk(-1);
    chunkEls.forEach(el => el.classList.remove('np-said'));
    setPlayLabel();
  }

  function goTo(idx) {
    const wasPlaying = playing;
    stopSpeech();
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
      <div class="np-controls">
        <button class="btn" id="np-play">▶ सुन्नुहोस्</button>
        <button id="np-replay" title="यही slide फेरि">🔁 फेरि</button>
        <button id="np-prev">⏮ अघिल्लो</button>
        <button id="np-next">अर्को ⏭</button>
        <label class="np-opt"><input type="checkbox" id="np-auto"> auto-advance</label>
        <span class="np-flex"></span>
        <label class="np-opt">Voice
          <select id="np-voice"></select>
        </label>
        <label class="np-opt">Speed
          <input type="range" id="np-rate" min="0.6" max="1.2" step="0.05">
          <span id="np-rate-val"></span>
        </label>
      </div>
      <div class="np-transcript">
        <div class="np-label">🎙 Narration transcript — बोलिरहेको वाक्य हाइलाइट हुन्छ</div>
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
    });

    function fillVoices() {
      const sel = document.getElementById('np-voice');
      if (!sel) return;
      const all = sortedVoices();
      const chosen = pickDefaultVoice();
      sel.innerHTML = all.map(v =>
        `<option value="${esc(v.voiceURI)}" ${chosen && v.voiceURI === chosen.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`
      ).join('') || '<option>(no voices found)</option>';
      const hint = document.getElementById('np-voice-hint');
      if (!ttsSupported()) {
        hint.textContent = 'This browser has no speech synthesis — slides and the transcript still work, just without audio.';
      } else if (!all.some(v => voiceRank(v) <= 1)) {
        hint.textContent = 'नेपाली/हिन्दी voice भेटिएन — Chrome desktop मा "Google हिन्दी" voice आउँछ, त्यसले Devanagari राम्ररी पढ्छ। अहिलेलाई English voice ले नै पढ्नेछ (accent अनौठो सुनिन्छ)।';
      } else {
        hint.textContent = '';
      }
    }
    fillVoices();
    if (ttsSupported()) window.speechSynthesis.onvoiceschanged = fillVoices;
    document.getElementById('np-voice').addEventListener('change', e => {
      localStorage.setItem(VOICE_KEY, e.target.value);
      if (playing) { pause(); playCurrent(); }
    });

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

    window.addEventListener('beforeunload', stopSpeech);
  }

  function boot() {
    const id = qs('id');
    if (!id) { renderIndex(); return; }
    const script = document.createElement('script');
    script.src = `data/nepali/${id}.js`;
    script.onload = () => renderDeck(id);
    script.onerror = () => {
      document.getElementById('nepali-root').innerHTML =
        `<p>Could not load deck "${esc(id)}". <a href="nepali.html">← सबै presentation</a></p>`;
    };
    document.body.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
