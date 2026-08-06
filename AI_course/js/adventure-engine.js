/* Moominvalley — the game itself.
 *
 * WHAT THIS IS FOR
 * This course is built for somebody who watches closely and will not sit and
 * read. The lessons, the presentation and the bedtime voyage all attack that
 * from different directions; this is the one where you learn the material by
 * walking around in it. You are Moomintroll. Thirty-nine keepers stand about
 * the valley, one per lesson, and each of them explains their idea out loud
 * before asking you anything.
 *
 * THE RULES IT PLAYS BY
 *   There is no timer, no health, no way to lose and no way to be locked out.
 *   Every region is walkable from the start. A wrong answer costs nothing and
 *   is answered with an explanation, not a penalty; the question simply stays
 *   on the keeper's list until you get it. The only thing gated in the whole
 *   game is the Groke, and she opens at twenty pearls, because a review of
 *   everything is meaningless before there is an everything.
 *
 *   That is deliberate. Pressure makes people rush a thing they were enjoying,
 *   and the request behind this game was to be taught slowly and have fun.
 *
 * THE QUESTIONS ARE ON SCREEN, IN THE GAME
 *   The question and its four options are drawn on the canvas, inside the same
 *   frame as the valley, not in a dialog box bolted on beside it. Leaving the
 *   game to answer a quiz is leaving the game.
 *
 * WHAT IT SAVES
 *   Its own key, ai-adventure-v1. Answering questions here does NOT tick
 *   lessons off on the dashboard — the dashboard means "I have studied this
 *   lesson", and it is not this game's business to claim that on your behalf.
 *
 * Depends on: data/adventure/world.js, adventure-worldgen.js, adventure-art.js,
 * adventure-voice.js, and optionally adventure-trials.js.
 */
(function (root) {
  'use strict';

  var A = root.MoominArt;
  var TILE = A.TILE;
  var V = root.MoominVoice;
  var KEY = 'ai-adventure-v1';
  var GROKE_PEARLS = 20;

  var W = null;              // world data
  var regionById = {};
  var maps = {};             // region id -> generated grid, built once each

  var cv, ctx, vw = 960, vh = 600, zoom = 1;

  var G = {
    mode: 'title',           // title|intro|roam|talk|quiz|trial|journal
    region: null, map: null,
    px: 0, py: 0, face: 1, walk: 0, t: 0,
    cam: { x: 0, y: 0 },
    enc: null, intro: null, toast: null, hint: null,
    sel: 0, journalTab: 0, moved: 0, stepT: 0,
  };

  var SAVE = {
    region: 'valley', x: null, y: null,
    taught: {}, mastered: {}, visited: {}, shells: {}, pearls: {},
  };

  var keys = {};
  var pad = { x: 0, y: 0, a: false, b: false, prevA: false, prevB: false };
  var touch = { on: false, ox: 0, oy: 0, x: 0, y: 0 };

  /* ------------------------------------------------------------------ save */
  function loadSave() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        Object.keys(SAVE).forEach(function (k) {
          if (s[k] !== undefined && s[k] !== null) SAVE[k] = s[k];
        });
      }
    } catch (e) { /* private mode: the game still plays, it just forgets */ }
  }
  function store() {
    try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch (e) { /* ignore */ }
  }
  function pearlCount() { return Object.keys(SAVE.pearls).length; }
  function shellCount() { return Object.keys(SAVE.shells).length; }

  /* --------------------------------------------------------------- helpers */
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function wrap(text, maxW, font) {
    ctx.font = font;
    var words = String(text).split(' ');
    var lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function toast(msg) { G.toast = { text: msg, until: G.t + 2600 }; }

  /* --------------------------------------------------------------- regions */
  function mapFor(id) {
    if (!maps[id]) maps[id] = root.MoominMap.build(regionById[id]);
    return maps[id];
  }

  function enterRegion(id, at) {
    var r = regionById[id];
    G.region = r;
    G.map = mapFor(id);
    var spot = at || r.spawn;
    G.px = spot[0] * TILE + TILE / 2;
    G.py = spot[1] * TILE + TILE / 2;
    SAVE.region = id; SAVE.x = G.px; SAVE.y = G.py;
    store();
    V.bed(id);
    if (!SAVE.visited[id]) {
      SAVE.visited[id] = true; store();
      startIntro(r);
    } else {
      G.mode = 'roam';
      toast(r.name);
    }
  }

  function startIntro(r) {
    var man = V.manifest();
    var clips = (man && man.intro && man.intro[r.id]) || [];
    G.intro = { region: r, i: 0, clips: clips };
    G.mode = 'intro';
    playIntroLine();
  }

  function playIntroLine() {
    var it = G.intro;
    if (!it || it.i >= it.region.intro.length) {
      G.intro = null; G.mode = 'roam';
      return;
    }
    V.say(it.clips[it.i], it.region.intro[it.i], function () {
      if (G.mode !== 'intro' || !G.intro) return;
      G.intro.i++;
      playIntroLine();
    });
  }

  function skipIntro() {
    V.stop();
    if (!G.intro) return;
    G.intro.i++;
    if (G.intro.i >= G.intro.region.intro.length) { G.intro = null; G.mode = 'roam'; }
    else playIntroLine();
  }

  /* ------------------------------------------------------------ encounters */
  function npcAt(px, py) {
    var best = null, bd = 46 * 46;
    G.region.npcs.forEach(function (n) {
      var x = n.x * TILE + TILE / 2, y = n.y * TILE + TILE / 2;
      var d = (x - px) * (x - px) + (y - py) * (y - py);
      if (d < bd) { bd = d; best = n; }
    });
    return best;
  }

  function exitAt(px, py) {
    var best = null, bd = 52 * 52;
    G.region.exits.forEach(function (e) {
      var x = e.x * TILE + TILE / 2, y = e.y * TILE + TILE / 2;
      var d = (x - px) * (x - px) + (y - py) * (y - py);
      if (d < bd) { bd = d; best = e; }
    });
    return best;
  }

  /* The Groke asks about anything, so her questions are borrowed from every
     keeper you have already learned from rather than stored a second time. */
  function grokePool() {
    var pool = [];
    Object.keys(W.scenes).forEach(function (id) {
      if (id.charAt(0) === '@') return;
      if (!SAVE.pearls[id]) return;
      W.scenes[id].q.forEach(function (q, i) { pool.push({ id: id, i: i, q: q }); });
    });
    return pool;
  }

  function startEncounter(npc, again) {
    var scene = W.scenes[npc.lesson];
    var man = V.manifest();
    var clips = (man && man.scene && man.scene[npc.lesson]) || null;
    /* `again` is somebody pressing L to hear the whole lesson a second time.
       Without it a keeper you have met only ever greets you, which is right
       the fortieth time you walk past and wrong when you have forgotten. */
    var first = again || !SAVE.taught[npc.lesson];

    if (npc.lesson === '@groke' && pearlCount() < GROKE_PEARLS) {
      G.enc = {
        lesson: npc.lesson, who: npc.who, tint: W.cast[npc.who].tint,
        name: W.cast[npc.who].name, clips: null, script: [{
          text: 'Not yet. Come back when you have twenty pearls. There is nothing ' +
                'to review until there is something to review.', clip: null,
        }], si: 0, phase: 'say', asked: [], qi: -1, justSay: true,
      };
      G.mode = 'talk'; sayCurrent();
      return;
    }

    var script = [{ text: scene.hook, clip: clips ? clips.hook : null }];
    if (first) {
      scene.teach.forEach(function (line, i) {
        script.push({ text: line, clip: clips ? clips.teach[i] : null });
      });
    }

    /* Which questions this visit. Anything already right is left alone, and
       nothing is asked twice in one conversation — being drilled on the same
       question until you crack is the opposite of what this is for. */
    var asked = [];
    if (npc.lesson === '@groke') {
      var pool = grokePool();
      for (var k = pool.length - 1; k > 0; k--) {
        var j = (Math.random() * (k + 1)) | 0;
        var tmp = pool[k]; pool[k] = pool[j]; pool[j] = tmp;
      }
      asked = pool.slice(0, 8).map(function (p) {
        return { borrowed: p.id, i: p.i, q: p.q };
      });
    } else {
      var got = SAVE.mastered[npc.lesson] || [];
      scene.q.forEach(function (q, i) {
        if (got.indexOf(i) < 0) asked.push({ i: i, q: q });
      });
    }

    G.enc = {
      lesson: npc.lesson, who: npc.who, name: W.cast[npc.who].name,
      tint: W.cast[npc.who].tint, body: W.cast[npc.who].body,
      scene: scene, clips: clips, script: script, si: 0,
      asked: asked, qi: -1, phase: 'say',
      sel: 0, chosen: -1, correct: false, trial: npc.trial || null,
      firstVisit: first,
    };
    SAVE.taught[npc.lesson] = true; store();
    G.mode = 'talk';
    sayCurrent();
  }

  function sayCurrent() {
    var e = G.enc;
    if (!e) return;
    var line = e.script[e.si];
    if (!line) return;
    e.waiting = true;
    V.say(line.clip, line.text, function () {
      if (!G.enc || G.enc !== e) return;
      e.waiting = false;
      /* Talking auto-advances, exactly like the Dojo. Being made to press a
         button to hear the next sentence of a story is a chore. */
      if (G.mode === 'talk' && e.phase === 'say') advanceTalk();
    });
  }

  function advanceTalk() {
    var e = G.enc;
    if (!e) return;
    V.stop();
    e.si++;
    if (e.si < e.script.length) { sayCurrent(); return; }

    /* Somebody who only had one thing to say — the Groke before you have
       twenty pearls — has no questions and no farewell to reach. */
    if (e.justSay) { endEncounter(); return; }

    if (e.phase === 'say') {
      /* A trial, if this keeper has one and you have not passed it. */
      if (e.trial && root.MoominTrials && !SAVE.mastered['trial:' + e.lesson]) {
        var tr = root.MoominTrials.start(e.trial);
        if (tr) { G.trial = tr; G.mode = 'trial'; return; }
      }
      nextQuestion();
      return;
    }
    if (e.phase === 'after') { nextQuestion(); return; }
    endEncounter();
  }

  function nextQuestion() {
    var e = G.enc;
    e.qi++;
    if (e.qi >= e.asked.length) {
      finishEncounter();
      return;
    }
    e.phase = 'ask';
    e.sel = 0; e.chosen = -1;
    G.mode = 'quiz';
    var item = e.asked[e.qi];
    var clip = null;
    if (e.clips && !item.borrowed) clip = e.clips.q[item.i].q;
    else if (item.borrowed) {
      var man = V.manifest();
      var sc = man && man.scene && man.scene[item.borrowed];
      if (sc) clip = sc.q[item.i].q;
    }
    item.clip = clip;
    V.say(clip, item.q.q, null);
  }

  function answer(idx) {
    var e = G.enc;
    if (!e || e.chosen >= 0) return;
    var item = e.asked[e.qi];
    e.chosen = idx;
    e.correct = idx === item.q.c;

    var lesson = item.borrowed || e.lesson;
    if (e.correct && !item.borrowed) {
      var got = SAVE.mastered[lesson] || (SAVE.mastered[lesson] = []);
      if (got.indexOf(item.i) < 0) got.push(item.i);
      var total = W.scenes[lesson].q.length;
      if (got.length >= total && !SAVE.pearls[lesson]) {
        SAVE.pearls[lesson] = true;
        e.earned = true;
      }
      store();
    }

    V.sfx[e.correct ? 'right' : 'wrong']();

    /* Reaction in the keeper's own voice, then the explanation. */
    var man = V.manifest();
    var bank = man && man.react && man.react[e.who];
    var pool = W.reactions[e.correct ? 'right' : 'wrong'];
    var ri = (Math.random() * pool.length) | 0;
    var reactClip = bank ? bank[e.correct ? 'right' : 'wrong'][ri] : null;

    var explainClip = null;
    if (item.borrowed) {
      var sc = man && man.scene && man.scene[item.borrowed];
      if (sc) explainClip = sc.q[item.i].e;
    } else if (e.clips) {
      explainClip = e.clips.q[item.i].e;
    }

    e.phase = 'after';
    e.script = [
      { text: pool[ri], clip: reactClip },
      { text: item.q.e, clip: explainClip },
    ];
    e.si = 0;
    G.mode = 'quiz';        // stay on the panel so the options remain visible
    V.say(reactClip, pool[ri], function () {
      if (!G.enc || G.enc !== e) return;
      e.si = 1;
      V.say(explainClip, item.q.e, function () {
        if (!G.enc || G.enc !== e) return;
        e.si = 2;
      });
    });
  }

  function finishEncounter() {
    var e = G.enc;
    e.phase = 'done';
    e.script = [{ text: e.scene.done, clip: e.clips ? e.clips.done : null }];
    e.si = 0;
    G.mode = 'talk';
    if (e.earned) {
      V.sfx.pearl();
      toast('A pearl for ' + (e.scene.title || 'the lesson') + '.');
    }
    sayCurrent();
  }

  function endEncounter() {
    V.stop();
    G.enc = null;
    G.mode = 'roam';
  }

  /* ------------------------------------------------------------- movement  */
  function solidAt(px, py) {
    return G.map.solid(Math.floor(px / TILE), Math.floor(py / TILE));
  }

  function tryMove(dx, dy) {
    var r = 9;
    var nx = G.px + dx;
    if (!solidAt(nx - r, G.py - r) && !solidAt(nx + r, G.py - r) &&
        !solidAt(nx - r, G.py + r) && !solidAt(nx + r, G.py + r)) G.px = nx;
    var ny = G.py + dy;
    if (!solidAt(G.px - r, ny - r) && !solidAt(G.px + r, ny - r) &&
        !solidAt(G.px - r, ny + r) && !solidAt(G.px + r, ny + r)) G.py = ny;
    G.px = clamp(G.px, r, G.map.w * TILE - r);
    G.py = clamp(G.py, r, G.map.h * TILE - r);
  }

  function pollPad() {
    pad.prevA = pad.a; pad.prevB = pad.b;
    pad.x = 0; pad.y = 0; pad.a = false; pad.b = false;
    if (!navigator.getGamepads) return;
    var gps = navigator.getGamepads();
    for (var i = 0; i < gps.length; i++) {
      var gp = gps[i];
      if (!gp) continue;
      var ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (Math.abs(ax) > 0.25) pad.x = ax;
      if (Math.abs(ay) > 0.25) pad.y = ay;
      if (gp.buttons[12] && gp.buttons[12].pressed) pad.y = -1;
      if (gp.buttons[13] && gp.buttons[13].pressed) pad.y = 1;
      if (gp.buttons[14] && gp.buttons[14].pressed) pad.x = -1;
      if (gp.buttons[15] && gp.buttons[15].pressed) pad.x = 1;
      if (gp.buttons[0] && gp.buttons[0].pressed) pad.a = true;
      if (gp.buttons[1] && gp.buttons[1].pressed) pad.b = true;
      break;
    }
    if (pad.a && !pad.prevA) interact();
    if (pad.b && !pad.prevB) back();
  }

  function update(dt) {
    G.t += dt;
    pollPad();

    if (G.mode === 'trial' && G.trial) {
      G.trial.update(dt, { keys: keys, pad: pad });
      if (G.trial.done) {
        if (G.trial.passed) SAVE.mastered['trial:' + G.enc.lesson] = true;
        store();
        var line = G.trial.verdict || '';
        G.trial = null;
        if (line) toast(line);
        nextQuestion();
      }
      return;
    }

    if (G.mode !== 'roam') return;

    var dx = 0, dy = 0;
    if (keys.ArrowLeft || keys.KeyA) dx -= 1;
    if (keys.ArrowRight || keys.KeyD) dx += 1;
    if (keys.ArrowUp || keys.KeyW) dy -= 1;
    if (keys.ArrowDown || keys.KeyS) dy += 1;
    dx += pad.x; dy += pad.y;
    if (touch.on) {
      dx += clamp((touch.x - touch.ox) / 40, -1, 1);
      dy += clamp((touch.y - touch.oy) / 40, -1, 1);
    }
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len > 1) { dx /= len; dy /= len; }

    var speed = 0.165 * dt;                     /* tiles are 32; this is a stroll */
    if (dx || dy) {
      tryMove(dx * speed, dy * speed);
      if (dx) G.face = dx > 0 ? 1 : -1;
      G.walk += dt * 0.012;
      G.stepT += dt;
      if (G.stepT > 300) { G.stepT = 0; V.sfx.step(); }
    } else {
      G.walk = 0;
    }

    /* Shells are picked up by walking into them; nothing to press. */
    G.map.shells.forEach(function (s, i) {
      var k = G.region.id + ':' + i;
      if (SAVE.shells[k]) return;
      var sx = s.x * TILE + TILE / 2, sy = s.y * TILE + TILE / 2;
      if (Math.abs(sx - G.px) < 20 && Math.abs(sy - G.py) < 20) {
        SAVE.shells[k] = true; store();
        V.sfx.pick();
        toast('A shell. ' + shellCount() + ' found.');
      }
    });

    var n = npcAt(G.px, G.py);
    var x = exitAt(G.px, G.py);
    G.hint = n ? { kind: 'npc', npc: n } : (x ? { kind: 'exit', exit: x } : null);

    SAVE.x = G.px; SAVE.y = G.py;
  }

  /* --------------------------------------------------------------- drawing */
  function drawWorld() {
    var m = G.map;
    var camX = clamp(G.px - vw / (2 * zoom), 0, Math.max(0, m.w * TILE - vw / zoom));
    var camY = clamp(G.py - vh / (2 * zoom), 0, Math.max(0, m.h * TILE - vh / zoom));
    if (m.w * TILE < vw / zoom) camX = (m.w * TILE - vw / zoom) / 2;
    if (m.h * TILE < vh / zoom) camY = (m.h * TILE - vh / zoom) / 2;
    G.cam.x = camX; G.cam.y = camY;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    var x0 = Math.max(0, Math.floor(camX / TILE));
    var y0 = Math.max(0, Math.floor(camY / TILE));
    var x1 = Math.min(m.w - 1, Math.ceil((camX + vw / zoom) / TILE));
    var y1 = Math.min(m.h - 1, Math.ceil((camY + vh / zoom) / TILE));

    for (var y = y0; y <= y1; y++) {
      for (var x = x0; x <= x1; x++) A.tile(ctx, m, x, y, x * TILE, y * TILE, G.t);
    }

    m.props.forEach(function (p) {
      if (p.x * TILE > camX + vw / zoom + 64 || (p.x + p.w) * TILE < camX - 64) return;
      A.prop(ctx, p, G.t);
      if (p.t === 'sign' && p.text) {
        ctx.font = '9px sans-serif';
        ctx.fillStyle = '#3a2c1c';
        ctx.textAlign = 'center';
        ctx.fillText(p.text.slice(0, 14), p.x * TILE + 16, p.y * TILE + 12);
        ctx.textAlign = 'left';
      }
    });

    m.shells.forEach(function (s, i) {
      if (SAVE.shells[G.region.id + ':' + i]) return;
      A.shell(ctx, s.x * TILE + 16, s.y * TILE + 20, G.t);
    });

    /* The island is full of them, and they are the only decoration in this
       game that is also a point being made. */
    if (G.region.id === 'island') {
      for (var i = 0; i < 14; i++) {
        var hx = 120 + ((i * 137) % (m.w * TILE - 200));
        var hy = 160 + ((i * 311) % (m.h * TILE - 260));
        A.hattifattener(ctx, hx + Math.sin(G.t * 0.0004 + i) * 24, hy, G.t + i * 500);
      }
    }

    var actors = G.region.npcs.map(function (n) {
      return { y: n.y * TILE + TILE / 2, draw: function () {
        var cx = n.x * TILE + TILE / 2, cy = n.y * TILE + TILE / 2;
        var cast = W.cast[n.who];
        A.character(ctx, cast.body, cx, cy, G.px < cx ? -1 : 1,
                    Math.sin(G.t * 0.002 + n.x) * 1.2);
        if (SAVE.pearls[n.lesson]) A.pearl(ctx, cx, cy - 44, G.t);
        if (G.hint && G.hint.kind === 'npc' && G.hint.npc === n) {
          ctx.fillStyle = '#4fd1c5';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('▲', cx, cy - 34 + Math.sin(G.t * 0.006) * 2);
          ctx.textAlign = 'left';
        }
      } };
    });
    actors.push({ y: G.py, draw: function () {
      A.character(ctx, 'moomin', G.px, G.py, G.face,
                  G.walk ? Math.abs(Math.sin(G.walk)) * -2.5 : 0);
    } });
    actors.sort(function (a, b) { return a.y - b.y; });
    actors.forEach(function (a) { a.draw(); });

    G.region.exits.forEach(function (e) {
      var ex = e.x * TILE + TILE / 2, ey = e.y * TILE + TILE / 2;
      ctx.fillStyle = 'rgba(79,209,197,0.18)';
      ctx.beginPath();
      ctx.arc(ex, ey, 20 + Math.sin(G.t * 0.003) * 3, 0, 6.283);
      ctx.fill();
    });

    ctx.restore();
  }

  function drawHud() {
    ctx.save();
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = 'rgba(13,17,23,0.66)';
    roundRect(12, 12, 300, 30, 8); ctx.fill();
    ctx.fillStyle = '#dbe2ef';
    ctx.fillText(G.region.name, 22, 32);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#4fd1c5';
    ctx.textAlign = 'right';
    ctx.fillText('◍ ' + pearlCount() + '/39   ✧ ' + shellCount(), 302, 32);
    ctx.textAlign = 'left';

    if (G.toast && G.t < G.toast.until) {
      var a = Math.min(1, (G.toast.until - G.t) / 500);
      ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(13,17,23,0.8)';
      var lines = wrap(G.toast.text, vw - 120, '14px sans-serif');
      var th = lines.length * 20 + 16;
      roundRect(vw / 2 - 220, 54, 440, th, 8); ctx.fill();
      ctx.fillStyle = '#f6ad55';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      lines.forEach(function (l, i) { ctx.fillText(l, vw / 2, 74 + i * 20); });
      ctx.textAlign = 'left';
      ctx.globalAlpha = 1;
    }

    if (G.mode === 'roam' && G.hint) {
      var label = G.hint.kind === 'npc'
        ? 'Talk to ' + W.cast[G.hint.npc.who].name +
          (SAVE.taught[G.hint.npc.lesson] ? '   ·   L to hear the lesson again' : '')
        : 'Go to ' + G.hint.exit.label;
      ctx.font = '14px sans-serif';
      var w = ctx.measureText(label).width + 68;
      ctx.fillStyle = 'rgba(13,17,23,0.8)';
      roundRect(vw / 2 - w / 2, vh - 52, w, 34, 8); ctx.fill();
      ctx.fillStyle = '#4fd1c5';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('SPACE', vw / 2 - w / 2 + 14, vh - 30);
      ctx.fillStyle = '#dbe2ef';
      ctx.font = '14px sans-serif';
      ctx.fillText(label, vw / 2 - w / 2 + 62, vh - 30);
    }
    ctx.restore();
  }

  function portrait(x, y, body, tint) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.283); ctx.fill();
    ctx.strokeStyle = tint; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.283); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, 32, 0, 6.283); ctx.clip();
    ctx.translate(x, y + 22);
    ctx.scale(1.7, 1.7);
    A.character(ctx, body, 0, 0, 1, 0);
    ctx.restore();
  }

  function drawDialogue(text, name, tint, body, hint) {
    var pad = 20, boxH = 150;
    var y = vh - boxH - 16;
    ctx.save();
    ctx.fillStyle = 'rgba(13,17,23,0.93)';
    roundRect(16, y, vw - 32, boxH, 12); ctx.fill();
    ctx.strokeStyle = 'rgba(79,209,197,0.35)'; ctx.lineWidth = 1;
    roundRect(16, y, vw - 32, boxH, 12); ctx.stroke();

    portrait(70, y + boxH / 2, body, tint);

    ctx.fillStyle = tint;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(name, 122, y + 30);

    ctx.fillStyle = '#dbe2ef';
    var font = '16px sans-serif';
    var lines = wrap(text, vw - 176, font);
    ctx.font = font;
    lines.slice(0, 4).forEach(function (l, i) {
      ctx.fillText(l, 122, y + 56 + i * 23);
    });

    ctx.fillStyle = '#8b98ac';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(hint || 'SPACE to go on   ·   ESC to walk away', vw - 34, y + boxH - 12);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  /* The question and its options, drawn in the game window. */
  function quizLayout() {
    var e = G.enc, item = e.asked[e.qi];
    var boxW = Math.min(760, vw - 48);
    var x = (vw - boxW) / 2;
    var qLines = wrap(item.q.q, boxW - 48, 'bold 17px sans-serif');
    var rows = item.q.o.map(function (o) {
      return wrap(o, boxW - 120, '15px sans-serif');
    });
    var rowH = rows.map(function (r) { return 14 + r.length * 21; });
    var h = 30 + qLines.length * 24 + 12 + rowH.reduce(function (a, b) { return a + b + 8; }, 0) + 46;
    var y = Math.max(16, (vh - h) / 2 - 20);
    return { x: x, y: y, w: boxW, h: h, qLines: qLines, rows: rows, rowH: rowH, item: item };
  }

  function drawQuiz() {
    var e = G.enc;
    var L = quizLayout();
    ctx.save();
    ctx.fillStyle = 'rgba(8,11,16,0.72)';
    ctx.fillRect(0, 0, vw, vh);

    ctx.fillStyle = 'rgba(21,27,35,0.98)';
    roundRect(L.x, L.y, L.w, L.h, 14); ctx.fill();
    ctx.strokeStyle = e.tint; ctx.lineWidth = 1.5;
    roundRect(L.x, L.y, L.w, L.h, 14); ctx.stroke();

    ctx.fillStyle = e.tint;
    ctx.font = 'bold 12px sans-serif';
    var head = e.name + '  ·  ' + (e.qi + 1) + ' of ' + e.asked.length;
    ctx.fillText(head.toUpperCase(), L.x + 24, L.y + 24);

    ctx.fillStyle = '#f0f4fa';
    ctx.font = 'bold 17px sans-serif';
    L.qLines.forEach(function (l, i) { ctx.fillText(l, L.x + 24, L.y + 50 + i * 24); });

    var oy = L.y + 50 + L.qLines.length * 24 + 10;
    L.rows.forEach(function (lines, i) {
      var h = L.rowH[i];
      var isSel = e.chosen < 0 && i === e.sel;
      var reveal = e.chosen >= 0;
      var fill = 'rgba(28,36,48,0.9)', edge = 'rgba(90,104,126,0.5)', txt = '#dbe2ef';
      if (reveal && i === L.item.q.c) { fill = 'rgba(46,110,80,0.55)'; edge = '#68d391'; txt = '#e8ffe8'; }
      else if (reveal && i === e.chosen) { fill = 'rgba(120,50,50,0.5)'; edge = '#f56565'; txt = '#ffe8e8'; }
      else if (isSel) { fill = 'rgba(40,58,72,0.95)'; edge = e.tint; }
      ctx.fillStyle = fill;
      roundRect(L.x + 20, oy, L.w - 40, h, 9); ctx.fill();
      ctx.strokeStyle = edge; ctx.lineWidth = isSel ? 2 : 1;
      roundRect(L.x + 20, oy, L.w - 40, h, 9); ctx.stroke();

      ctx.fillStyle = isSel || reveal ? edge : '#8b98ac';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(String(i + 1), L.x + 36, oy + 22);

      ctx.fillStyle = txt;
      ctx.font = '15px sans-serif';
      lines.forEach(function (l, k) { ctx.fillText(l, L.x + 58, oy + 22 + k * 21); });
      oy += h + 8;
    });

    ctx.fillStyle = '#8b98ac';
    ctx.font = '12px sans-serif';
    ctx.fillText(e.chosen < 0
      ? '1–4 or ↑ ↓ to choose   ·   SPACE to answer   ·   ESC to walk away'
      : 'SPACE to go on', L.x + 24, L.y + L.h - 16);
    ctx.restore();

    if (e.chosen >= 0 && e.phase === 'after') {
      var line = e.script[Math.min(e.si, e.script.length - 1)];
      drawDialogue(line.text, e.name, e.correct ? '#68d391' : e.tint, e.body,
                   'SPACE to go on');
    }
  }

  function drawIntro() {
    var it = G.intro;
    ctx.save();
    ctx.fillStyle = 'rgba(6,9,13,0.9)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = '#4fd1c5';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(it.region.part.toUpperCase(), vw / 2, vh / 2 - 130);
    ctx.fillStyle = '#f0f4fa';
    ctx.font = 'bold 30px Georgia, serif';
    ctx.fillText(it.region.name, vw / 2, vh / 2 - 90);

    ctx.font = '17px Georgia, serif';
    ctx.fillStyle = '#c8d2e2';
    var lines = wrap(it.region.intro[it.i] || '', Math.min(700, vw - 80), '17px Georgia, serif');
    lines.forEach(function (l, i) { ctx.fillText(l, vw / 2, vh / 2 - 30 + i * 27); });

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#8b98ac';
    ctx.fillText('SPACE to go on   ·   ' + (it.i + 1) + ' / ' + it.region.intro.length,
                 vw / 2, vh - 40);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawTitle() {
    ctx.save();
    var g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, '#101a26'); g.addColorStop(1, '#1b2b33');
    ctx.fillStyle = g; ctx.fillRect(0, 0, vw, vh);

    for (var i = 0; i < 40; i++) {
      var sx = (i * 97) % vw, sy = (i * 53) % (vh / 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + 0.2 * Math.abs(Math.sin(G.t * 0.001 + i))) + ')';
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f0f4fa';
    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillText('Moominvalley', vw / 2, vh / 2 - 60);
    ctx.fillStyle = '#4fd1c5';
    ctx.font = '18px Georgia, serif';
    ctx.fillText('and the Thinking Machines', vw / 2, vh / 2 - 28);

    A.character(ctx, 'moomin', vw / 2 - 40, vh / 2 + 60, 1, Math.sin(G.t * 0.002) * 2);
    A.character(ctx, 'my', vw / 2 + 30, vh / 2 + 62, -1, Math.sin(G.t * 0.003) * 2);

    ctx.fillStyle = '#c8d2e2';
    ctx.font = '15px sans-serif';
    ctx.fillText(pearlCount() ? 'Continue — ' + pearlCount() + ' of 39 pearls'
                              : 'The whole AI Engineer course, learned by walking about in it',
                 vw / 2, vh / 2 + 116);
    ctx.fillStyle = '#8b98ac';
    ctx.font = '13px sans-serif';
    ctx.fillText('SPACE to begin   ·   WASD or arrows to walk   ·   TAB for the journal',
                 vw / 2, vh - 44);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  function drawJournal() {
    ctx.save();
    ctx.fillStyle = 'rgba(8,11,16,0.94)';
    ctx.fillRect(0, 0, vw, vh);
    ctx.fillStyle = '#f0f4fa';
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('Journal', 40, 48);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#8b98ac';
    ctx.fillText(pearlCount() + ' of 39 pearls   ·   ' + shellCount() + ' shells   ·   ' +
                 'walk, talk, answer. Nothing here is timed.', 40, 70);

    var colW = (vw - 80) / 3, col = 0, y = 106, x = 40;
    W.regions.forEach(function (r) {
      var need = 22 + r.npcs.length * 19 + 16;
      if (y + need > vh - 60) { col++; y = 106; }
      x = 40 + col * colW;
      ctx.fillStyle = SAVE.visited[r.id] ? '#4fd1c5' : '#54607a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(r.name, x, y);
      y += 20;
      r.npcs.forEach(function (n) {
        var sc = W.scenes[n.lesson];
        var got = (SAVE.mastered[n.lesson] || []).length;
        var tot = sc.q.length;
        var done = !!SAVE.pearls[n.lesson];
        ctx.fillStyle = done ? '#68d391' : (SAVE.taught[n.lesson] ? '#dbe2ef' : '#5c6880');
        ctx.font = '12px sans-serif';
        var title = sc.title || 'The Groke';
        if (title.length > 40) title = title.slice(0, 38) + '…';
        ctx.fillText((done ? '◍ ' : '· ') + title, x, y);
        if (!done && tot) {
          ctx.fillStyle = '#54607a';
          ctx.fillText(got + '/' + tot, x + colW - 60, y);
        }
        y += 19;
      });
      y += 14;
    });

    ctx.fillStyle = '#8b98ac';
    ctx.font = '12px sans-serif';
    ctx.fillText('TAB or ESC to close   ·   M mutes the valley   ·   ' +
                 'the keeper you have already met will not repeat the lesson unless you ask',
                 40, vh - 26);
    ctx.restore();
  }

  function frame(ts) {
    var dt = Math.min(48, ts - (frame.last || ts));
    frame.last = ts;
    update(dt);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);

    if (G.mode === 'title') { drawTitle(); requestAnimationFrame(frame); return; }

    drawWorld();
    drawHud();

    if (G.mode === 'intro') drawIntro();
    else if (G.mode === 'talk' && G.enc) {
      var line = G.enc.script[Math.min(G.enc.si, G.enc.script.length - 1)];
      drawDialogue(line.text, G.enc.name, G.enc.tint, G.enc.body);
    } else if (G.mode === 'quiz' && G.enc) drawQuiz();
    else if (G.mode === 'trial' && G.trial) G.trial.draw(ctx, vw, vh, G.t);
    else if (G.mode === 'journal') drawJournal();

    requestAnimationFrame(frame);
  }

  /* ----------------------------------------------------------------- input */
  function interact() {
    if (G.mode === 'title') { begin(); return; }
    if (G.mode === 'intro') { skipIntro(); return; }
    if (G.mode === 'journal') { G.mode = 'roam'; return; }
    if (G.mode === 'trial' && G.trial) { if (G.trial.press) G.trial.press(); return; }

    if (G.mode === 'talk') {
      var e = G.enc;
      if (e.phase === 'done' && e.si >= e.script.length - 1) { endEncounter(); return; }
      advanceTalk();
      return;
    }
    if (G.mode === 'quiz') {
      var q = G.enc;
      if (q.chosen < 0) { answer(q.sel); return; }
      /* Let the explanation finish being read if it has not started yet. */
      V.stop();
      nextQuestion();
      return;
    }
    if (G.mode !== 'roam') return;

    if (G.hint && G.hint.kind === 'npc') { startEncounter(G.hint.npc); return; }
    if (G.hint && G.hint.kind === 'exit') {
      var ex = G.hint.exit;
      V.sfx.door();
      /* Arrive next to the matching door on the other side, not on top of it. */
      var dest = regionById[ex.to];
      var back = null;
      dest.exits.forEach(function (o) { if (o.to === G.region.id) back = o; });
      var at = back ? [back.x === 0 ? 2 : (back.x >= dest.w - 1 ? dest.w - 3 : back.x),
                       back.y] : null;
      enterRegion(ex.to, at);
    }
  }

  function back() {
    if (G.mode === 'journal') { G.mode = 'roam'; return; }
    if (G.mode === 'intro') { V.stop(); G.intro = null; G.mode = 'roam'; return; }
    if (G.mode === 'talk' || G.mode === 'quiz') { endEncounter(); return; }
    if (G.mode === 'trial') { G.trial = null; nextQuestion(); return; }
  }

  function onKey(ev) {
    var c = ev.code;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].indexOf(c) >= 0) {
      ev.preventDefault();
    }
    keys[c] = true;

    if (c === 'Space' || c === 'Enter' || c === 'KeyE') { interact(); return; }
    if (c === 'Escape') { back(); return; }
    if (c === 'Tab') {
      if (G.mode === 'roam') G.mode = 'journal';
      else if (G.mode === 'journal') G.mode = 'roam';
      return;
    }
    if (c === 'KeyL' && G.mode === 'roam' && G.hint && G.hint.kind === 'npc') {
      startEncounter(G.hint.npc, true);
      return;
    }
    if (c === 'KeyM') {
      V.setEnabled(!V.enabled());
      toast(V.enabled() ? 'Sound on.' : 'Sound off.');
      return;
    }
    if (G.mode === 'quiz' && G.enc && G.enc.chosen < 0) {
      var n = G.enc.asked[G.enc.qi].q.o.length;
      if (c === 'ArrowUp' || c === 'KeyW') { G.enc.sel = (G.enc.sel + n - 1) % n; V.sfx.move(); }
      if (c === 'ArrowDown' || c === 'KeyS') { G.enc.sel = (G.enc.sel + 1) % n; V.sfx.move(); }
      var d = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(c);
      if (d >= 0 && d < n) { G.enc.sel = d; answer(d); }
    }
  }

  function onKeyUp(ev) { keys[ev.code] = false; }

  function onPointer(ev) {
    var r = cv.getBoundingClientRect();
    var x = (ev.clientX - r.left) * (vw / r.width);
    var y = (ev.clientY - r.top) * (vh / r.height);

    if (G.mode === 'quiz' && G.enc && G.enc.chosen < 0) {
      var L = quizLayout();
      var oy = L.y + 50 + L.qLines.length * 24 + 10;
      for (var i = 0; i < L.rows.length; i++) {
        if (x > L.x + 20 && x < L.x + L.w - 20 && y > oy && y < oy + L.rowH[i]) {
          G.enc.sel = i; answer(i); return;
        }
        oy += L.rowH[i] + 8;
      }
      return;
    }
    interact();
  }

  function onTouchStart(ev) {
    var r = cv.getBoundingClientRect();
    var t = ev.touches[0];
    var x = (t.clientX - r.left) * (vw / r.width);
    /* Left half is a thumbstick, right half is the button. Waiting for the
       synthesized mouse event instead works on most phones and not all. */
    if (G.mode !== 'roam' || x >= vw / 2) {
      var pt = { clientX: t.clientX, clientY: t.clientY };
      ev.preventDefault();
      onPointer(pt);
      return;
    }
    if (G.mode === 'roam' && x < vw / 2) {
      touch.on = true;
      touch.ox = touch.x = x;
      touch.oy = touch.y = (t.clientY - r.top) * (vh / r.height);
      ev.preventDefault();
    }
  }
  function onTouchMove(ev) {
    if (!touch.on) return;
    var r = cv.getBoundingClientRect();
    var t = ev.touches[0];
    touch.x = (t.clientX - r.left) * (vw / r.width);
    touch.y = (t.clientY - r.top) * (vh / r.height);
    ev.preventDefault();
  }
  function onTouchEnd() { touch.on = false; }

  /* ------------------------------------------------------------------ boot */
  var dpr = 1;
  function resize() {
    var r = cv.getBoundingClientRect();
    dpr = Math.min(2, root.devicePixelRatio || 1);
    vw = Math.round(r.width); vh = Math.round(r.height);
    cv.width = Math.round(vw * dpr);
    cv.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    /* Show roughly the same amount of valley on a phone as on a laptop. */
    zoom = clamp(vw / 760, 0.72, 1.5);
  }

  function begin() {
    G.mode = 'roam';
    V.bed(G.region.id);
    V.load(function () {
      var startAt = null;
      if (SAVE.x !== null && SAVE.region === G.region.id) {
        G.px = SAVE.x; G.py = SAVE.y;
      }
      if (!SAVE.visited[G.region.id]) startIntro(G.region);
      else toast(G.region.name);
      return startAt;
    });
  }

  function init(canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    W = root.MOOMIN_WORLD;
    if (!W) { throw new Error('world.js did not load'); }
    W.regions.forEach(function (r) { regionById[r.id] = r; });

    loadSave();
    resize();
    if (!init.wired) root.addEventListener('resize', resize);

    var startRegion = regionById[SAVE.region] ? SAVE.region : 'valley';
    G.region = regionById[startRegion];
    G.map = mapFor(startRegion);
    G.px = SAVE.x !== null ? SAVE.x : G.region.spawn[0] * TILE + 16;
    G.py = SAVE.y !== null ? SAVE.y : G.region.spawn[1] * TILE + 16;

    /* Wired once, however many times init is called. A second set of listeners
       would make every key press count twice, which does not look like a bug —
       it looks like the game skipping your turn. */
    if (!init.wired) {
      init.wired = true;
      root.addEventListener('keydown', onKey);
      root.addEventListener('keyup', onKeyUp);
      cv.addEventListener('mousedown', onPointer);
      cv.addEventListener('touchstart', onTouchStart, { passive: false });
      cv.addEventListener('touchmove', onTouchMove, { passive: false });
      cv.addEventListener('touchend', onTouchEnd);
      cv.setAttribute('tabindex', '0');
      requestAnimationFrame(frame);
    }
  }

  root.MoominGame = {
    init: init,
    reset: function () {
      SAVE = { region: 'valley', x: null, y: null, taught: {}, mastered: {},
               visited: {}, shells: {}, pearls: {} };
      store();
      maps = {};
      G.mode = 'title';
      enterRegion('valley');
      G.mode = 'title';
    },
    stats: function () { return { pearls: pearlCount(), shells: shellCount() }; },
    /* Read-only view for the headless play-through harness. A canvas game has
       no DOM to assert against, so without this a test can press keys and hope
       — which is not testing. */
    _state: function () {
      return {
        mode: G.mode, region: G.region && G.region.id,
        lesson: G.enc && G.enc.lesson, phase: G.enc && G.enc.phase,
        qi: G.enc && G.enc.qi,
        question: G.enc && G.enc.phase === 'ask' && G.enc.asked[G.enc.qi]
          ? G.enc.asked[G.enc.qi].q : null,
        chosen: G.enc && G.enc.chosen,
        hint: G.hint && G.hint.kind,
        trial: G.trial ? true : false,
      };
    },
  };
})(window);
