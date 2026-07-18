/* Narrated slide-show engine (single page, two narration languages).

   The slides (heading/bullets/code/big) are the same English write-ups; only the
   narration language + voice differ. A toggle in the player switches between:
     - नेपाली : Nepali narration, data/nepali/*.js decks + data/nepali/audio/
     - English: English narration, data/english/*.js decks + data/english/audio/

   Narration plays from pre-rendered MP3s (one per slide). Each language's
   manifest (window.NEPALI_AUDIO / window.ENGLISH_AUDIO) maps deck+slide to its
   MP3 and per-sentence start times (media seconds) driving the read-along
   highlight. Decks and manifests are lazy-loaded per language via <script>
   injection (works over file:// too). A tiny speechSynthesis fallback covers a
   slide whose audio is missing.

   Boot: the page calls window.initPresentation({ page: 'presentation.html' }). */

(function () {
  'use strict';

  const LANG_CFG = {
    ne: { decksVar: 'NEPALI_DECKS', audioVar: 'NEPALI_AUDIO', deckDir: 'data/nepali', audioBase: 'data/nepali/audio/', ttsLang: 'ne-NP', sentRe: /[^।!?]+[।!?]*/g },
    en: { decksVar: 'ENGLISH_DECKS', audioVar: 'ENGLISH_AUDIO', deckDir: 'data/english', audioBase: 'data/english/audio/', ttsLang: 'en-US', sentRe: /[^.!?]+[.!?]*/g },
  };

  const LANG_KEY = 'dsa-pres-lang';
  const RATE_KEY = 'dsa-pres-rate';
  const AUTO_KEY = 'dsa-pres-auto';

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
      'sliding-window': 'A window that slides — like a moving frame',
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
      'graphs-bfs-dfs-topo-union': 'The town where rumours spread',
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
      narrationLabel: 'Narration:',
      slideOf: (a, b) => `Slide ${a} / ${b}`,
      indexTitle: 'DSA Presentation',
      indexLede: `Every module of the course, re-taught as a narrated slide show — the same English slides,
        but a warm voice <b>talks you through them</b> with Nepal-flavoured anecdotes and mnemonics instead
        of a word-for-word reading. एउटै presentation, तर narration नेपाली वा English — जुनसुकैमा फेर्न मिल्ने।`,
      indexCard: `<b>आवाजको बारेमा:</b> narration अब browser को robotic आवाजले होइन, <b>असली neural स्वर</b>ले
        भनिन्छ — पहिल्यै record गरिएका audio बजाइन्छन्, त्यसैले जुनसुकै browser मा एउटै मीठो आवाज। कुनै पनि slide
        भित्रको <b>नेपाली ⇄ English</b> toggle ले narration को भाषा फेर्न मिल्छ; बोलिरहेको वाक्यमा click गरे त्यहीँबाट सुनिन्छ।`,
      notFound: id => `Deck "${id}" not found. <a href="__PAGE__">← सबै presentation</a>`,
      loadFail: id => `Could not load deck "${id}". <a href="__PAGE__">← सबै presentation</a>`,
      noManifest: 'Pre-rendered narration not found for this language — using the browser voice. Run the audio dir\'s generate_audio.py.',
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
      narrationLabel: 'Narration:',
      slideOf: (a, b) => `Slide ${a} / ${b}`,
      indexTitle: 'DSA Presentation',
      indexLede: `Every module of the course, re-taught as a narrated slide show. The slides are the same
        English write-ups, but a warm voice <b>talks you through them</b> — with Nepal-flavoured anecdotes and
        mnemonics, not a word-for-word reading. One presentation; flip the narration between Nepali and English.`,
      indexCard: `<b>About the voice:</b> narration is <b>real recorded audio</b> (a neural voice), not your
        browser's robotic speech — so it sounds warm and calm on every browser. The <b>नेपाली ⇄ English</b>
        toggle inside any slide flips the narration language; click any sentence in the transcript to jump there.`,
      notFound: id => `Deck "${id}" not found. <a href="__PAGE__">← all presentations</a>`,
      loadFail: id => `Could not load deck "${id}". <a href="__PAGE__">← all presentations</a>`,
      noManifest: 'Pre-rendered narration not found for this language — using the browser voice. Run the audio dir\'s generate_audio.py.',
    },
  };

  function esc(str) { return String(str).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
  function qs(name) { return new URLSearchParams(window.location.search).get(name); }
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) sec = 0;
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function initPresentation(baseCfg) {
    const PAGE = baseCfg.page;

    const st = {
      lang: (LANG_CFG[localStorage.getItem(LANG_KEY)] ? localStorage.getItem(LANG_KEY) : 'ne'),
      deckId: qs('id'),
      deck: null,
      slideIdx: 0,
      playing: false,
      session: 0,
      chunkEls: [],
      audioEl: null,
      prefetchEl: null,
    };
    const loadedScripts = {};   // src -> 'loading' | 'done'

    const cfg = () => LANG_CFG[st.lang];
    const S = () => STRINGS[st.lang];
    const decks = lang => window[LANG_CFG[lang || st.lang].decksVar] || {};
    const audioRoot = lang => window[LANG_CFG[lang || st.lang].audioVar];

    function ttsSupported() { return typeof window.speechSynthesis !== 'undefined'; }

    function splitSentences(text) {
      const parts = String(text).match(cfg().sentRe) || [];
      return parts.map(s => s.trim()).filter(Boolean);
    }

    function audioInfo(idx) {
      idx = (idx == null) ? st.slideIdx : idx;
      const a = audioRoot();
      if (!a || !a.decks || !st.deck) return null;
      const d = a.decks[st.deck.id];
      return d ? d[idx] : null;
    }

    function currentRate() {
      const r = parseFloat(localStorage.getItem(RATE_KEY));
      if (isNaN(r)) return 1.0;
      return Math.min(1.5, Math.max(0.7, r));
    }
    function autoplayOn() { return localStorage.getItem(AUTO_KEY) !== '0'; }

    function getAudioEl() {
      if (!st.audioEl) { st.audioEl = new Audio(); st.audioEl.preload = 'auto'; }
      return st.audioEl;
    }
    function stopAudio() {
      st.session++;
      if (st.audioEl) { try { st.audioEl.pause(); } catch (e) {} }
      if (ttsSupported()) window.speechSynthesis.cancel();
    }
    function prefetch(idx) {
      const info = audioInfo(idx);
      if (!info || !info.file) return;
      if (!st.prefetchEl) st.prefetchEl = new Audio();
      st.prefetchEl.preload = 'auto';
      st.prefetchEl.src = cfg().audioBase + info.file;
    }

    function markChunk(i) {
      st.chunkEls.forEach((el, idx) => {
        el.classList.toggle('np-now', idx === i);
        el.classList.toggle('np-said', i !== -1 ? idx < i : true);
      });
    }
    function activeSentence(t, starts) {
      let idx = 0;
      for (let i = 0; i < starts.length; i++) { if (t + 0.05 >= starts[i]) idx = i; else break; }
      return idx;
    }
    function updateScrub() {
      const a = st.audioEl;
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
      const mySession = ++st.session;
      const a = getAudioEl();
      const starts = info.sentences || [];
      a.onended = null; a.ontimeupdate = null; a.onerror = null;
      a.src = cfg().audioBase + info.file;
      a.playbackRate = currentRate();
      a.ontimeupdate = () => {
        if (mySession !== st.session) return;
        markChunk(activeSentence(a.currentTime, starts));
        updateScrub();
      };
      a.onended = () => {
        if (mySession !== st.session) return;
        markChunk(starts.length - 1);
        st.chunkEls.forEach(el => el.classList.add('np-said'));
        updateScrub();
        if (onEnded) onEnded();
      };
      a.onerror = () => { if (mySession === st.session) speakSlideTTS(onEnded); };
      markChunk(0);
      prefetch(st.slideIdx + 1);
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    }

    function speakSlideTTS(onAllDone) {
      const mySession = ++st.session;
      const chunks = splitSentences(st.deck.slides[st.slideIdx].narration);
      if (!ttsSupported() || !chunks.length) {
        if (onAllDone) setTimeout(() => { if (mySession === st.session) onAllDone(); }, 1200);
        return;
      }
      window.speechSynthesis.cancel();
      const lang = cfg().ttsLang;
      (function speakChunk(i) {
        if (mySession !== st.session) return;
        if (i >= chunks.length) { markChunk(-1); if (onAllDone) onAllDone(); return; }
        markChunk(i);
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = lang; u.rate = 0.9;
        let done = false;
        const next = () => { if (done || mySession !== st.session) return; done = true; speakChunk(i + 1); };
        u.onend = next; u.onerror = next;
        setTimeout(next, Math.max(5000, chunks[i].length * 260 / 0.9));
        try { window.speechSynthesis.speak(u); } catch (e) { next(); }
      })(0);
    }

    /* ---------------- asset loading ---------------- */

    function loadScript(src, cb) {
      if (loadedScripts[src] === 'done') { cb(true); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => { loadedScripts[src] = 'done'; cb(true); };
      s.onerror = () => cb(false);
      document.body.appendChild(s);
    }

    // Ensure both the manifest and the deck for (lang, id) are present, then cb.
    function ensureAssets(lang, id, cb) {
      const c = LANG_CFG[lang];
      const afterManifest = () => {
        if (!id || decks(lang)[id]) { cb(true); return; }
        loadScript(`${c.deckDir}/${id}.js`, cb);
      };
      if (audioRoot(lang)) afterManifest();
      else loadScript(`${c.audioBase}manifest.js`, () => afterManifest());  // proceed even if missing
    }

    /* ---------------- language toggle ---------------- */

    function langToggleHtml() {
      const mk = (l, label) => `<button class="np-lang ${st.lang === l ? 'active' : ''}" data-lang="${l}">${label}</button>`;
      return `<div class="np-langtoggle" title="Narration language">${mk('ne', 'नेपाली')}${mk('en', 'English')}</div>`;
    }
    function wireLangToggle(root) {
      root.querySelectorAll('.np-lang').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang')));
      });
    }
    function setLang(newLang) {
      if (newLang === st.lang || !LANG_CFG[newLang]) return;
      const wasPlaying = st.playing;
      stopAudio();
      st.playing = false;
      st.lang = newLang;
      localStorage.setItem(LANG_KEY, newLang);
      if (!st.deckId) { renderIndex(); return; }
      ensureAssets(newLang, st.deckId, () => {
        st.deck = decks(newLang)[st.deckId] || st.deck;
        renderDeck(true);
        if (wasPlaying) playCurrent();
      });
    }

    /* ---------------- rendering ---------------- */

    function renderIndex() {
      const root = document.getElementById('nepali-root');
      document.title = S().indexTitle + ' — DSA Crash Course';
      const grouped = {};
      window.SCHEDULE.forEach(m => { (grouped[m.category] = grouped[m.category] || []).push(m); });
      const groups = Object.keys(grouped).map(cat => {
        const cards = grouped[cat].map(m => `
          <a class="module-card" href="${PAGE}?id=${m.id}">
            <span class="mc-title">${esc(m.title)}</span>
            <span class="mc-meta np-ne">${esc(TITLES[st.lang][m.id] || '')}</span>
          </a>`).join('');
        return `<h2>${esc(cat)}</h2><div class="grid">${cards}</div>`;
      }).join('');
      root.innerHTML = `
        <div class="np-indexhead">
          <h1>${esc(S().indexTitle)}</h1>
          ${langToggleHtml()}
        </div>
        <p class="lede">${S().indexLede}</p>
        <div class="card">${S().indexCard}</div>
        ${groups}`;
      wireLangToggle(root);
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
      const s = st.deck.slides[st.slideIdx];
      const stage = document.getElementById('np-stage');
      const visual = (window.getSlideVisual && window.getSlideVisual(st.deck.id, st.slideIdx)) || '';
      stage.innerHTML = `
        <div class="np-slide sa-cap-in">
          <div class="np-count">${S().slideOf(st.slideIdx + 1, st.deck.slides.length)}</div>
          <h2 class="np-slide-heading">${s.heading}</h2>
          ${visual ? `<div class="np-visual">${visual}</div>` : ''}
          ${slideBodyHtml(s)}
        </div>`;
      const chunks = splitSentences(s.narration);
      const starts = (audioInfo() || {}).sentences || [];
      st.chunkEls = [];
      const tr = document.getElementById('np-transcript-body');
      tr.innerHTML = '';
      chunks.forEach((c, i) => {
        const span = document.createElement('span');
        span.className = 'np-chunk';
        span.textContent = c + ' ';
        span.title = S().seekTitle;
        span.addEventListener('click', () => seekToSentence(i, starts));
        tr.appendChild(span);
        st.chunkEls.push(span);
      });
      document.getElementById('np-prev').disabled = st.slideIdx === 0;
      document.getElementById('np-next').disabled = st.slideIdx === st.deck.slides.length - 1;
      updateScrub();
    }

    function seekToSentence(i, starts) {
      const t = starts[i];
      if (t == null) return;
      if (!st.playing) playCurrent();
      const a = getAudioEl();
      const apply = () => { a.currentTime = t; markChunk(i); };
      if (a.readyState >= 1) apply(); else a.addEventListener('loadedmetadata', apply, { once: true });
    }

    function setPlayLabel() {
      const b = document.getElementById('np-play');
      if (b) b.textContent = st.playing ? S().pause : S().play;
    }

    function playCurrent() {
      st.playing = true;
      setPlayLabel();
      playSlideAudio(() => {
        if (!st.playing) return;
        const mySession = st.session;
        if (autoplayOn() && st.slideIdx < st.deck.slides.length - 1) {
          setTimeout(() => {
            if (!st.playing || st.session !== mySession) return;
            st.slideIdx++;
            renderSlide();
            playCurrent();
          }, 700);
        } else {
          st.playing = false;
          setPlayLabel();
        }
      });
    }
    function pause() {
      st.playing = false;
      stopAudio();
      markChunk(-1);
      st.chunkEls.forEach(el => el.classList.remove('np-said'));
      setPlayLabel();
    }
    function goTo(idx) {
      const wasPlaying = st.playing;
      stopAudio();
      st.slideIdx = Math.max(0, Math.min(st.deck.slides.length - 1, idx));
      renderSlide();
      if (wasPlaying) playCurrent(); else pause();
    }

    // keydown handler installed once
    let keysBound = false;
    function bindKeys() {
      if (keysBound) return; keysBound = true;
      document.addEventListener('keydown', e => {
        if (!st.deck) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'ArrowRight') goTo(st.slideIdx + 1);
        else if (e.key === 'ArrowLeft') goTo(st.slideIdx - 1);
        else if (e.key === ' ') { e.preventDefault(); if (st.playing) pause(); else playCurrent(); }
      });
    }

    function renderDeck(keepIdx) {
      st.deck = decks()[st.deckId];
      const root = document.getElementById('nepali-root');
      if (!st.deck) { root.innerHTML = `<p>${S().notFound(esc(st.deckId)).replace('__PAGE__', PAGE)}</p>`; return; }
      if (!keepIdx) st.slideIdx = 0;
      document.title = `${st.deck.title} — ${S().indexTitle}`;
      const mod = window.SCHEDULE.find(m => m.id === st.deckId);
      const patternLink = mod && mod.type === 'pattern'
        ? `<a href="pattern.html?id=${st.deckId}">${S().writeup}</a>`
        : `<a href="pythonic-idioms.html">${S().writeup}</a>`;

      root.innerHTML = `
        <div class="np-deckhead">
          <div>
            <div class="pill">${esc(mod ? mod.category : '')}</div>
            <div class="pill time">${esc(S().langPill)}</div>
          </div>
          <div class="np-narr"><span class="np-narr-label">${esc(S().narrationLabel)}</span>${langToggleHtml()}</div>
        </div>
        <h1>${esc(st.deck.title)}</h1>
        <p class="lede">${esc(st.deck.titleNe)} — ${st.deck.intro} (${patternLink})</p>

        <div class="np-stage" id="np-stage"></div>
        <div class="np-progress">
          <input type="range" id="np-scrub" min="0" max="0" step="0.1" value="0" aria-label="Narration position">
          <span class="np-time" id="np-time">0:00 / 0:00</span>
        </div>
        <div class="np-controls">
          <button class="btn" id="np-play">${S().play}</button>
          <button id="np-replay" title="${esc(S().replayTitle)}">${S().replay}</button>
          <button id="np-prev">${S().prev}</button>
          <button id="np-next">${S().next}</button>
          <label class="np-opt"><input type="checkbox" id="np-auto"> ${S().auto}</label>
          <span class="np-flex"></span>
          <label class="np-opt">${S().speed}
            <input type="range" id="np-rate" min="0.7" max="1.5" step="0.05">
            <span id="np-rate-val"></span>
          </label>
        </div>
        <div class="np-transcript">
          <div class="np-label">${S().transcript}</div>
          <div id="np-transcript-body"></div>
        </div>
        <p id="np-voice-hint" style="color:var(--text-dim); font-size:0.82rem;"></p>`;

      wireLangToggle(root);
      renderSlide();

      document.getElementById('np-play').addEventListener('click', () => { if (st.playing) pause(); else playCurrent(); });
      document.getElementById('np-replay').addEventListener('click', () => { pause(); playCurrent(); });
      document.getElementById('np-prev').addEventListener('click', () => goTo(st.slideIdx - 1));
      document.getElementById('np-next').addEventListener('click', () => goTo(st.slideIdx + 1));

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
        if (st.audioEl) st.audioEl.playbackRate = currentRate();
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
      hint.textContent = audioRoot() ? '' : S().noManifest;

      bindKeys();

      const idx = window.SCHEDULE.findIndex(m => m.id === st.deckId);
      const nav = document.getElementById('nepali-footer-nav');
      const prev = idx > 0 ? window.SCHEDULE[idx - 1] : null;
      const next = idx < window.SCHEDULE.length - 1 ? window.SCHEDULE[idx + 1] : null;
      nav.innerHTML =
        (prev ? `<a href="${PAGE}?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a href="${PAGE}">← ${esc(S().allLink)}</a>`) +
        (next ? `<a href="${PAGE}?id=${next.id}">${esc(next.title)} →</a>` : `<a href="${PAGE}">${esc(S().allLink)} →</a>`);

      prefetch(0);
    }

    function boot() {
      st.deckId = qs('id');
      ensureAssets(st.lang, st.deckId, () => {
        if (!st.deckId) renderIndex(); else renderDeck(false);
      });
      window.addEventListener('beforeunload', stopAudio);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  }

  window.initPresentation = initPresentation;
})();
