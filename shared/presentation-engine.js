/* Config-driven narrated slide-show engine, shared by every course except
   DSA_tool (which keeps its own bespoke copy at DSA_tool/js/presentation-engine.js).

   This is a generalization of the DSA engine: identical player behaviour
   (render, pre-rendered MP3/Opus narration, read-along transcript highlight,
   click-to-seek, Nepali⇄English toggle, keyboard, speechSynthesis fallback),
   but the four things that were hardcoded to DSA are now passed in by the page:

     initPresentation({
       page: 'presentation.html',
       keyPrefix: 'aivideo-pres',              // localStorage namespace
       courseName: 'AI Video Course',          // shown in the index heading/title
       writeupHref: id => `lesson.html?id=${id}`,   // "full write-up" link target
       titles: window.PRES_TITLES,             // { ne:{id:subtitle}, en:{id:subtitle} }
       lede: { ne: '…', en: '…' },             // optional index intro override
       lessonType: 'lesson',                   // SCHEDULE entries with a deck
     });

   Decks live in data/english/<id>.js (window.ENGLISH_DECKS) and
   data/nepali/<id>.js (window.NEPALI_DECKS); audio manifests in
   data/<lang>/audio/manifest.js. All lazy-loaded via <script> injection so it
   works over file:// too. Clips are named <deck>-<slide>.<ext>. */

(function () {
  'use strict';

  const LANG_CFG = {
    ne: { decksVar: 'NEPALI_DECKS', audioVar: 'NEPALI_AUDIO', deckDir: 'data/nepali', audioBase: 'data/nepali/audio/', ttsLang: 'ne-NP', sentRe: /[^।!?]+[।!?]*/g },
    en: { decksVar: 'ENGLISH_DECKS', audioVar: 'ENGLISH_AUDIO', deckDir: 'data/english', audioBase: 'data/english/audio/', ttsLang: 'en-US', sentRe: /[^.!?]+[.!?]*/g },
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
    const COURSE = baseCfg.courseName || 'Course';
    const LESSON_TYPE = baseCfg.lessonType || 'lesson';
    const TITLES = baseCfg.titles || window.PRES_TITLES || { ne: {}, en: {} };
    const writeupHref = baseCfg.writeupHref || (id => `lesson.html?id=${id}`);

    const LANG_KEY = (baseCfg.keyPrefix || 'pres') + '-lang';
    const RATE_KEY = (baseCfg.keyPrefix || 'pres') + '-rate';
    const AUTO_KEY = (baseCfg.keyPrefix || 'pres') + '-auto';

    const STRINGS = {
      ne: {
        play: '▶ सुन्नुहोस्', pause: '⏸ रोक्नुहोस्',
        replay: '🔁 फेरि', replayTitle: 'यही slide फेरि',
        prev: '⏮ अघिल्लो', next: 'अर्को ⏭',
        auto: 'auto-advance', speed: 'Speed',
        transcript: '🎙 Narration transcript — बोलिरहेको वाक्य हाइलाइट हुन्छ (click गरे त्यहीँबाट सुनिन्छ)',
        seekTitle: 'यहाँबाट सुन्नुहोस्',
        langPill: 'नेपालीमा', allLink: 'सबै presentation',
        writeup: 'full write-up ↗',
        narrationLabel: 'Narration:',
        slideOf: (a, b) => `Slide ${a} / ${b}`,
        indexTitle: `${COURSE} — Presentation`,
        indexLede: (baseCfg.lede && baseCfg.lede.ne) || `${esc(COURSE)} का हरेक lesson, एउटा narrated slide show जस्तै — उही slide, तर एउटा
          न्यानो स्वरले <b>बुझाउँदै लैजान्छ</b>। एउटै presentation, तर narration नेपाली वा English — जुनसुकैमा फेर्न मिल्ने।`,
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
        writeup: 'full write-up ↗',
        narrationLabel: 'Narration:',
        slideOf: (a, b) => `Slide ${a} / ${b}`,
        indexTitle: `${COURSE} — Presentation`,
        indexLede: (baseCfg.lede && baseCfg.lede.en) || `Every lesson of ${esc(COURSE)}, re-taught as a narrated slide show. The slides are the
          same write-ups, but a warm voice <b>talks you through them</b> instead of a word-for-word reading. One
          presentation; flip the narration between Nepali and English.`,
        indexCard: `<b>About the voice:</b> narration is <b>real recorded audio</b> (a neural voice), not your
          browser's robotic speech — so it sounds warm and calm on every browser. The <b>नेपाली ⇄ English</b>
          toggle inside any slide flips the narration language; click any sentence in the transcript to jump there.`,
        notFound: id => `Deck "${id}" not found. <a href="__PAGE__">← all presentations</a>`,
        loadFail: id => `Could not load deck "${id}". <a href="__PAGE__">← all presentations</a>`,
        noManifest: 'Pre-rendered narration not found for this language — using the browser voice. Run the audio dir\'s generate_audio.py.',
      },
    };

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
    const loadedScripts = {};

    const cfg = () => LANG_CFG[st.lang];
    const S = () => STRINGS[st.lang];
    const decks = lang => window[LANG_CFG[lang || st.lang].decksVar] || {};
    const audioRoot = lang => window[LANG_CFG[lang || st.lang].audioVar];
    const lessons = () => window.SCHEDULE.filter(m => (m.type || 'lesson') === LESSON_TYPE);

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

    const OPUS_OK = (function () {
      try { return new Audio().canPlayType('audio/ogg; codecs=opus') !== ''; } catch (e) { return false; }
    })();
    function clipUrl(file) {
      return cfg().audioBase + (OPUS_OK ? file.replace(/\.mp3$/i, '.opus') : file);
    }

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
      if (!st.prefetchEl) st.prefetchEl = [new Audio(), new Audio()];
      for (let k = 0; k < st.prefetchEl.length; k++) {
        const info = audioInfo(idx + k);
        if (!info || !info.file) continue;
        st.prefetchEl[k].preload = 'auto';
        st.prefetchEl[k].src = clipUrl(info.file);
      }
    }

    function warmDeckAudio() {
      const root = audioRoot();
      const clips = root && root.decks && st.deck && root.decks[st.deck.id];
      if (!clips || typeof fetch !== 'function' || location.protocol.indexOf('http') !== 0) return;
      const lang = st.lang, deckId = st.deck.id;
      let i = 0;
      (function next() {
        if (st.lang !== lang || !st.deck || st.deck.id !== deckId || i >= clips.length) return;
        const info = clips[i++];
        if (!info || !info.file) { next(); return; }
        fetch(clipUrl(info.file))
          .then(r => (r && r.ok ? r.blob() : null))
          .catch(() => {})
          .then(() => setTimeout(next, 250));
      })();
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
      a.src = clipUrl(info.file);
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
      a.onerror = () => {
        if (mySession !== st.session) return;
        if (/\.opus$/i.test(a.src)) {
          a.src = cfg().audioBase + info.file;
          const rp = a.play();
          if (rp && rp.catch) rp.catch(() => {});
          return;
        }
        speakSlideTTS(onEnded);
      };
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

    function ensureAssets(lang, id, cb) {
      const c = LANG_CFG[lang];
      const afterManifest = () => {
        if (!id || decks(lang)[id]) { cb(true); return; }
        loadScript(`${c.deckDir}/${id}.js`, cb);
      };
      if (audioRoot(lang)) afterManifest();
      else loadScript(`${c.audioBase}manifest.js`, () => afterManifest());
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
      document.title = S().indexTitle;
      const titles = TITLES[st.lang] || {};
      const grouped = {};
      lessons().forEach(m => { (grouped[m.category] = grouped[m.category] || []).push(m); });
      const groups = Object.keys(grouped).map(cat => {
        const cards = grouped[cat].map(m => `
          <a class="module-card" href="${PAGE}?id=${m.id}">
            <span class="mc-title">${esc(m.title)}</span>
            <span class="mc-meta np-ne">${esc(titles[m.id] || '')}</span>
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
      const foot = document.getElementById('nepali-footer-nav');
      if (foot) foot.innerHTML = '';
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
      document.title = `${st.deck.title} — ${COURSE}`;
      const mod = window.SCHEDULE.find(m => m.id === st.deckId);
      const link = `<a href="${writeupHref(st.deckId)}">${S().writeup}</a>`;

      root.innerHTML = `
        <div class="np-deckhead">
          <div>
            <div class="pill">${esc(mod ? mod.category : '')}</div>
            <div class="pill time">${esc(S().langPill)}</div>
          </div>
          <div class="np-narr"><span class="np-narr-label">${esc(S().narrationLabel)}</span>${langToggleHtml()}</div>
        </div>
        <h1>${esc(st.deck.title)}</h1>
        <p class="lede">${esc(st.deck.titleNe)} — ${st.deck.intro} (${link})</p>

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

      const list = lessons();
      const idx = list.findIndex(m => m.id === st.deckId);
      const nav = document.getElementById('nepali-footer-nav');
      if (nav) {
        const prev = idx > 0 ? list[idx - 1] : null;
        const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
        nav.innerHTML =
          (prev ? `<a href="${PAGE}?id=${prev.id}">← ${esc(prev.title)}</a>` : `<a href="${PAGE}">← ${esc(S().allLink)}</a>`) +
          (next ? `<a href="${PAGE}?id=${next.id}">${esc(next.title)} →</a>` : `<a href="${PAGE}">${esc(S().allLink)} →</a>`);
      }

      prefetch(0);
      const whenIdle = window.requestIdleCallback || (cb => setTimeout(cb, 1200));
      whenIdle(() => warmDeckAudio());
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
