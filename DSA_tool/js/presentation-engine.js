/* Shared presentation engine for the narrated slide-show tabs.

   Two tabs use it, each with its own config (see nepali.html / english.html):
     - नेपाली Presentation : Nepali narration, data/nepali/*.js decks
     - English Presentation: English narration, data/english/*.js decks

   Slide text (heading/bullets/code/big) is English on both; only the narration
   language and voice differ. Narration is played from pre-rendered MP3s (one
   per slide, neural voice) — see data/<lang>/audio/. The manifest
   (window.<AUDIO_VAR>) maps each deck+slide to its MP3 and per-sentence start
   times (media seconds) that drive the read-along transcript highlight. A tiny
   speechSynthesis fallback remains only for slides whose audio is missing.

   Boot: a page calls window.initPresentation(config). */

(function () {
  'use strict';

  /* Index-card subtitles per language (deck files are lazy-loaded, so the index
     needs its own copy). */
  const TITLES = {
    ne: {
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
    },
    en: {
      'warmup': 'What Big-O really means + Python power-moves',
      'two-pointers': 'Two friends walking in from both ends',
      'sliding-window': 'A window that slides — like peering through a moving frame',
      'fast-slow-pointers': 'The tortoise and the hare, on a linked list',
      'merge-intervals': 'Dashain tika — merging invites whose times overlap',
      'binary-search': 'Opening the dictionary from the middle',
      'hashing-patterns': 'Name it, find its shelf instantly',
      'prefix-sum': 'The kilometre-stones along the highway',
      'linked-list-reversal': 'Flipping a chain with three fingers',
      'monotonic-stack': 'Taller arrives — pop the shorter!',
      'queue-deque': 'The temple queue and the two-door micro',
      'tree-dfs-bfs': 'Two ways to walk the family tree',
      'binary-search-trees': 'Left is smaller, right is bigger',
      'heaps-top-k': 'How to stay on the merit list',
      'backtracking': 'Marking crossroads as you cross the jungle',
      'graphs-bfs-dfs-topo-union': 'The town where rumours spread — who knows whom',
      'dynamic-programming': "Don't redo yesterday's arithmetic",
      'greedy': "The shopkeeper's change-making trick",
      'bit-manipulation': 'Light switches and the magic of XOR',
      'trie': 'A tree that branches letter by letter',
    },
  };

  const STRINGS = {
    ne: {
      play: '▶ सुन्नुहोस्', pause: '⏸ रोक्नुहोस्',
      replay: '🔁 फेरि', replayTitle: 'यही slide फेरि',
      prev: '⏮ अघिल्लो', next: 'अर्को ⏭',
      auto: 'auto-advance', speed: 'Speed',
      transcript: '🎙 Narration transcript — बोलिरहेको वाक्य हाइलाइट हुन्छ (click गरे त्यहीँबाट सुनिन्छ)',
      seekTitle: 'यहाँबाट सुन्नुहोस्',
      langPill: 'नेपालीमा', allLink: 'सबै presentation',
      writeup: 'full English write-up ↗',
      slideOf: (a, b) => `Slide ${a} / ${b}`,
      indexTitle: 'नेपाली Presentation',
      indexLede: `Every module of the course, re-taught as a narrated slide show — the slides stay in
        English, but the voice explains everything <b>in Nepali</b>, with Nepali-flavoured anecdotes and
        mnemonics instead of a word-for-word reading. जुन कुरा अङ्ग्रेजीमा छिटो बुझिँदैन, त्यही कुरा कथा र
        सूत्रसहित बिस्तारै, शान्त आवाजमा।`,
      indexCard: `<b>आवाजको बारेमा:</b> narration अब browser को robotic आवाजले होइन, <b>असली neural नेपाली स्वर</b>ले
        भनिन्छ — पहिल्यै record गरिएका audio फाइलहरू बजाइन्छन्, त्यसैले जुनसुकै browser मा एउटै मीठो, शान्त
        आवाज सुनिन्छ। बोलिरहेको वाक्य transcript मा हाइलाइट हुन्छ; कुनै वाक्यमा click गरे त्यहीँबाट सुन्न
        सकिन्छ। तल Player भित्रको speed slider ले चाहेअनुसार अझ बिस्तारै वा छिटो पार्न मिल्छ।`,
      notFound: id => `Deck "${id}" not found. <a href="__PAGE__">← सबै presentation</a>`,
      loadFail: id => `Could not load deck "${id}". <a href="__PAGE__">← सबै presentation</a>`,
      noManifest: 'Pre-rendered narration (manifest) not found — falling back to the browser voice. Run the audio dir\'s generate_audio.py to build it.',
    },
    en: {
      play: '▶ Play', pause: '⏸ Pause',
      replay: '🔁 Replay', replayTitle: 'Replay this slide',
      prev: '⏮ Prev', next: 'Next ⏭',
      auto: 'auto-advance', speed: 'Speed',
      transcript: '🎙 Narration transcript — the sentence being spoken is highlighted (click to jump)',
      seekTitle: 'Play from here',
      langPill: 'in English', allLink: 'all presentations',
      writeup: 'full English write-up ↗',
      slideOf: (a, b) => `Slide ${a} / ${b}`,
      indexTitle: 'English Presentation',
      indexLede: `Every module of the course, re-taught as a narrated slide show. The slides are the same
        English write-ups, but a warm voice <b>talks you through them</b> — with the same Nepal-flavoured
        anecdotes and mnemonics, not a word-for-word reading. The stuff that doesn't click when you just
        read it, explained slowly with a story and a memory hook.`,
      indexCard: `<b>About the voice:</b> narration is <b>real recorded audio</b> (a neural voice), not your
        browser's robotic speech — so it sounds the same, warm and calm, on every browser. The sentence being
        spoken is highlighted in the transcript; click any sentence to jump there. Use the Speed slider in the
        player to slow it down or speed it up.`,
      notFound: id => `Deck "${id}" not found. <a href="__PAGE__">← all presentations</a>`,
      loadFail: id => `Could not load deck "${id}". <a href="__PAGE__">← all presentations</a>`,
      noManifest: 'Pre-rendered narration (manifest) not found — falling back to the browser voice. Run the audio dir\'s generate_audio.py to build it.',
    },
  };

  function esc(str) { return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function qs(name) { return new URLSearchParams(window.location.search).get(name); }

  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function initPresentation(cfg) {
    const S = STRINGS[cfg.lang];
    const TITLE_MAP = TITLES[cfg.lang];
    const AUDIO_BASE = cfg.audioBase;
    const RATE_KEY = `dsa-${cfg.lang}-rate`;
    const AUTO_KEY = `dsa-${cfg.lang}-auto`;

    /* Sentence split — MUST match the Python generator so transcript spans line
       up 1:1 with the manifest's per-sentence timings. Devanagari splits on ।!?;
       English on .!? */
    const SENT_RE = cfg.lang === 'en' ? /[^.!?]+[.!?]*/g : /[^।!?]+[।!?]*/g;
    function splitSentences(text) {
      const parts = String(text).match(SENT_RE) || [];
      return parts.map(s => s.trim()).filter(Boolean);
    }

    const decks = () => window[cfg.decksVar] || {};
    const audioRoot = () => window[cfg.audioVar];

    /* ---------------- Player state ---------------- */
    let deck = null, slideIdx = 0, playing = false, session = 0;
    let chunkEls = [], audioEl = null, prefetchEl = null;

    function ttsSupported() { return typeof window.speechSynthesis !== 'undefined'; }

    function audioInfo(idx) {
      idx = (idx == null) ? slideIdx : idx;
      const a = audioRoot();
      if (!a || !a.decks || !deck) return null;
      const d = a.decks[deck.id];
      return d ? d[idx] : null;
    }

    function currentRate() {
      const r = parseFloat(localStorage.getItem(RATE_KEY));
      if (isNaN(r)) return 1.0;
      return Math.min(1.5, Math.max(0.7, r));
    }
    function autoplayOn() { return localStorage.getItem(AUTO_KEY) !== '0'; }

    function getAudioEl() {
      if (!audioEl) { audioEl = new Audio(); audioEl.preload = 'auto'; }
      return audioEl;
    }

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
      a.onerror = () => { if (mySession === session) speakSlideTTS(onEnded); };
      markChunk(0);
      prefetch(slideIdx + 1);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    }

    /* Browser-TTS fallback: only when a slide's MP3 is unavailable. */
    function speakSlideTTS(onAllDone) {
      const mySession = ++session;
      const chunks = splitSentences(deck.slides[slideIdx].narration);
      if (!ttsSupported() || !chunks.length) {
        if (onAllDone) setTimeout(() => { if (mySession === session) onAllDone(); }, 1200);
        return;
      }
      window.speechSynthesis.cancel();
      const lang = cfg.lang === 'en' ? 'en-US' : 'ne-NP';
      (function speakChunk(i) {
        if (mySession !== session) return;
        if (i >= chunks.length) { markChunk(-1); if (onAllDone) onAllDone(); return; }
        markChunk(i);
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = lang; u.rate = 0.9;
        let done = false;
        const next = () => { if (done || mySession !== session) return; done = true; speakChunk(i + 1); };
        u.onend = next; u.onerror = next;
        setTimeout(next, Math.max(5000, chunks[i].length * 260 / 0.9));
        try { window.speechSynthesis.speak(u); } catch (e) { next(); }
      })(0);
    }

    /* ---------------- Rendering ---------------- */

    function renderIndex() {
      const root = document.getElementById('nepali-root');
      document.title = S.indexTitle + ' — DSA Crash Course';
      const grouped = {};
      window.SCHEDULE.forEach(m => { (grouped[m.category] = grouped[m.category] || []).push(m); });
      const groups = Object.keys(grouped).map(cat => {
        const cards = grouped[cat].map(m => `
          <a class="module-card" href="${cfg.page}?id=${m.id}">
            <span class="mc-title">${esc(m.title)}</span>
            <span class="mc-meta np-ne">${esc(TITLE_MAP[m.id] || '')}</span>
          </a>`).join('');
        return `<h2>${esc(cat)}</h2><div class="grid">${cards}</div>`;
      }).join('');
      root.innerHTML = `
        <h1>${esc(S.indexTitle)}</h1>
        <p class="lede">${S.indexLede}</p>
        <div class="card">${S.indexCard}</div>
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
          <div class="np-count">${S.slideOf(slideIdx + 1, deck.slides.length)}</div>
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
        span.title = S.seekTitle;
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
      if (!playing) playCurrent();
      const a = getAudioEl();
      const apply = () => { a.currentTime = t; markChunk(i); };
      if (a.readyState >= 1) apply(); else a.addEventListener('loadedmetadata', apply, { once: true });
    }

    function setPlayLabel() {
      document.getElementById('np-play').textContent = playing ? S.pause : S.play;
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
      deck = decks()[id];
      const root = document.getElementById('nepali-root');
      if (!deck) { root.innerHTML = `<p>${S.notFound(esc(id)).replace('__PAGE__', cfg.page)}</p>`; return; }
      document.title = `${deck.title} — ${S.indexTitle}`;
      const mod = window.SCHEDULE.find(m => m.id === id);
      const patternLink = mod && mod.type === 'pattern'
        ? `<a href="pattern.html?id=${id}">${S.writeup}</a>`
        : `<a href="pythonic-idioms.html">${S.writeup}</a>`;

      root.innerHTML = `
        <div class="pill">${esc(mod ? mod.category : '')}</div>
        <div class="pill time">${esc(S.langPill)}</div>
        <h1>${esc(deck.title)}</h1>
        <p class="lede">${esc(deck.titleNe)} — ${deck.intro} (${patternLink})</p>

        <div class="np-stage" id="np-stage"></div>
        <div class="np-progress">
          <input type="range" id="np-scrub" min="0" max="0" step="0.1" value="0" aria-label="Narration position">
          <span class="np-time" id="np-time">0:00 / 0:00</span>
        </div>
        <div class="np-controls">
          <button class="btn" id="np-play">${S.play}</button>
          <button id="np-replay" title="${esc(S.replayTitle)}">${S.replay}</button>
          <button id="np-prev">${S.prev}</button>
          <button id="np-next">${S.next}</button>
          <label class="np-opt"><input type="checkbox" id="np-auto"> ${S.auto}</label>
          <span class="np-flex"></span>
          <label class="np-opt">${S.speed}
            <input type="range" id="np-rate" min="0.7" max="1.5" step="0.05">
            <span id="np-rate-val"></span>
          </label>
        </div>
        <div class="np-transcript">
          <div class="np-label">${S.transcript}</div>
          <div id="np-transcript-body"></div>
        </div>
        <p id="np-voice-hint" style="color:var(--text-dim); font-size:0.82rem;"></p>`;

      renderSlide();

      document.getElementById('np-play').addEventListener('click', () => { if (playing) pause(); else playCurrent(); });
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
        if (audioEl) audioEl.playbackRate = currentRate();
      });

      const scrub = document.getElementById('np-scrub');
      scrub.addEventListener('input', () => {
        scrub.dragging = true;
        const a = getAudioEl();
        if (isFinite(a.duration)) a.currentTime = parseFloat(scrub.value);
        const starts = (audioInfo() || {}).sentences || [];
        markChunk(activeSentence(parseFloat(scrub.value), starts));
      });
      scrub.addEventListener('change', () => { scrub.dragging = false; });

      const hint = document.getElementById('np-voice-hint');
      hint.textContent = audioRoot() ? '' : S.noManifest;

      document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowRight') goTo(slideIdx + 1);
        else if (e.key === 'ArrowLeft') goTo(slideIdx - 1);
        else if (e.key === ' ') { e.preventDefault(); if (playing) pause(); else playCurrent(); }
      });

      const idx = window.SCHEDULE.findIndex(m => m.id === id);
      const nav = document.getElementById('nepali-footer-nav');
      const prev = idx > 0 ? window.SCHEDULE[idx - 1] : null;
      const next = idx < window.SCHEDULE.length - 1 ? window.SCHEDULE[idx + 1] : null;
      nav.innerHTML =
        (prev ? `<a href="${cfg.page}?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a href="${cfg.page}">← ${esc(S.allLink)}</a>`) +
        (next ? `<a href="${cfg.page}?id=${next.id}">${esc(next.title)} →</a>` : `<a href="${cfg.page}">${esc(S.allLink)} →</a>`);

      prefetch(0);
      window.addEventListener('beforeunload', stopAudio);
    }

    function boot() {
      const id = qs('id');
      const loadDeck = () => {
        if (!id) { renderIndex(); return; }
        const script = document.createElement('script');
        script.src = `${cfg.deckDir}/${id}.js`;
        script.onload = () => renderDeck(id);
        script.onerror = () => {
          document.getElementById('nepali-root').innerHTML = `<p>${S.loadFail(esc(id)).replace('__PAGE__', cfg.page)}</p>`;
        };
        document.body.appendChild(script);
      };
      if (audioRoot()) { loadDeck(); return; }
      const man = document.createElement('script');
      man.src = `${AUDIO_BASE}manifest.js`;
      man.onload = loadDeck;
      man.onerror = loadDeck;   // proceed without manifest (TTS fallback)
      document.body.appendChild(man);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  window.initPresentation = initPresentation;
})();
