/* Rebuilds the ambient bed in the browser instead of shipping it inside the audio.
 *
 * The bed used to be mixed into every rendered segment, which is why those files
 * needed 28 kbps: opus was spending most of its budget re-describing surf that
 * never changes. Narration on its own fits the same quality into 16 kbps. So the
 * seven ambience loops are downloaded once (0.61 MB for the whole site) and
 * layered live here, under narration that is now roughly half the size it was.
 *
 * It is deliberately *not* in the narration's signal path. The <audio> elements
 * keep playing natively and keep their own crossfade logic; this runs beside
 * them on its own AudioContext and its own clock. Two reasons. Routing speech
 * through a MediaElementSource would put it at the mercy of this file, and a bed
 * that fails should cost you some waves, not the story. And the bed does not
 * need sample-accurate sync with the voice — it needs to know roughly where the
 * pauses are, which is what the manifest tells it.
 *
 * The swell is the same arithmetic the renderer used to bake in: each pause
 * contributes a triangle rising over SWELL_RAMP and falling over it, clamped at
 * 1, so a 7-second chapter break reaches the full lift, a 2.4-second paragraph
 * break gets about 60% of it, and the 0.75-second beat between two sentences
 * never qualifies. Keeping the maths identical is the point — the gap positions
 * in the manifest are the same ones build_bedtime.py placed.
 */
(function (root) {
  'use strict';

  var SWELL_RAMP = 2.0;      // seconds to rise into a pause and fall out of it
  var EDGE = 0.15;           // a pause this close to a file edge crosses it
  var SWELL_MIN_GAP = 1.5;   // shorter pauses are left alone entirely
  var TICK = 0.02;           // bedcodec.py's quantum, in seconds

  var B64 = {};
  (function () {
    var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    for (var i = 0; i < A.length; i++) B64[A.charAt(i)] = i;
  }());

  /* Twin of bedcodec.decode(). Varint deltas in 20 ms ticks, base64url.
     Returns a flat [start0, end0, start1, end1, ...] in seconds — flat because
     this is read on every animation frame and pairs of arrays allocate. */
  function decodeGaps(text) {
    if (!text) return [];
    var bytes = [], i, j, word, n;
    for (i = 0; i < text.length; i += 4) {
      n = Math.min(4, text.length - i);
      if (n < 2) break;
      word = 0;
      for (j = 0; j < 4; j++) word = (word << 6) | (j < n ? B64[text.charAt(i + j)] : 0);
      bytes.push((word >> 16) & 255);
      if (n > 2) bytes.push((word >> 8) & 255);
      if (n > 3) bytes.push(word & 255);
    }
    var vals = [], acc = 0, shift = 0;
    for (i = 0; i < bytes.length; i++) {
      acc |= (bytes[i] & 127) << shift;
      if (bytes[i] & 128) { shift += 7; } else { vals.push(acc); acc = 0; shift = 0; }
    }
    var out = [], cursor = 0, start, end;
    for (i = 0; i + 1 < vals.length; i += 2) {
      start = cursor + vals[i];
      end = start + vals[i + 1];
      out.push(start * TICK, end * TICK);
      cursor = end;
    }
    return out;
  }

  function BedEngine(opts) {
    opts = opts || {};
    this.base = opts.base || '';
    this.volume = opts.volume == null ? 1 : opts.volume;
    this.meta = null;
    this.ctx = null;
    this.buffers = {};      // name -> AudioBuffer
    this.pending = {};      // name -> Promise, so two scenes cannot double-fetch
    this.layers = {};       // name -> { src, gain }
    this.scene = null;
    this.gaps = [];
    this.segDur = 0;        // length of the segment the gaps belong to
    this.bedGain = 1;       // per-mode base level (drive is quieter than bedtime)
    this.lift = Math.pow(10, 6 / 20) - 1;
    this.failed = false;
    this._cursor = 0;       // index into this.gaps, so tick() is not O(gaps)
  }

  /* Load the manifest of scenes, gains and loop names. Cheap and safe to call
     before any user gesture — it is only JSON, no AudioContext yet. */
  BedEngine.prototype.load = function () {
    var self = this;
    if (this._load) return this._load;
    this._load = fetch(this.base + 'bed.json')
      .then(function (r) {
        if (!r.ok) throw new Error('bed.json ' + r.status);
        return r.json();
      })
      .then(function (m) { self.meta = m; return m; })
      .catch(function (e) { self.failed = true; throw e; });
    return this._load;
  };

  /* Must be called from a user gesture: browsers refuse to start an AudioContext
     without one, and on iOS a context created outside a gesture stays suspended
     forever with no error. */
  BedEngine.prototype.enable = function () {
    if (this.ctx || this.failed) return this.ctx;
    var AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) { this.failed = true; return null; }
    try {
      // 24 kHz because the bed is surf, wind and timber, none of which has
      // anything above 12 kHz worth decoding. Halves the resident footprint.
      this.ctx = new AC({ sampleRate: this.meta ? this.meta.sr : 24000 });
    } catch (e) {
      try { this.ctx = new AC(); } catch (e2) { this.failed = true; return null; }
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;          // faded up by the first setScene
    this.swell = this.ctx.createGain();
    this.swell.gain.value = 1;
    this.swell.connect(this.master);
    this.master.connect(this.ctx.destination);
    return this.ctx;
  };

  BedEngine.prototype._buffer = function (name) {
    var self = this;
    if (this.buffers[name]) return Promise.resolve(this.buffers[name]);
    if (this.pending[name]) return this.pending[name];
    this.pending[name] = fetch(this.base + name + '.opus')
      .then(function (r) {
        if (!r.ok) throw new Error(name + ' ' + r.status);
        return r.arrayBuffer();
      })
      .then(function (buf) {
        return new Promise(function (res, rej) {
          // callback form: Safari's decodeAudioData did not return a promise
          // until 14.1, and this is exactly the browser most likely to be old.
          var p = self.ctx.decodeAudioData(buf, res, rej);
          if (p && p.then) p.then(res, rej);
        });
      })
      .then(function (b) { self.buffers[name] = b; return b; });
    return this.pending[name];
  };

  /* Start one layer looping at a random phase and a slight detune.
     Both matter: seven loops entered at the same point and played at exactly
     1.0 would realign every time the shortest one came round, and the ear finds
     that pattern long before it finds any individual loop. */
  BedEngine.prototype._startLayer = function (name, buffer) {
    if (this.layers[name]) return this.layers[name];
    var src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.playbackRate.value = 0.994 + Math.random() * 0.012;
    var node = this.ctx.createGain();
    node.gain.value = 0;
    src.connect(node);
    node.connect(this.swell);
    try { src.start(0, Math.random() * buffer.duration); } catch (e) { src.start(0); }
    // `gain` is the AudioParam, not the node: everything downstream ramps it,
    // and holding the node here instead is how it first got passed to _ramp,
    // which then threw on the missing cancelScheduledValues.
    this.layers[name] = { src: src, node: node, gain: node.gain };
    return this.layers[name];
  };

  /* Move to a scene. Layer gains slide over the crossfade rather than cutting,
     because a scene change you can notice is a scene change that wakes you up. */
  BedEngine.prototype.setScene = function (scene) {
    if (!this.ctx || this.failed || !this.meta) return;
    if (scene === this.scene) return;
    this.scene = scene;
    var gains = this.meta.scenes[scene];
    if (!gains) return;
    var self = this;
    var now = this.ctx.currentTime;
    var xf = this.meta.crossfade || 20;

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(this.volume * this.bedGain, now + 2);

    this.meta.layers.forEach(function (layer, i) {
      var name = layer.name;
      var idx = self._layerIndex(name);
      var target = (gains[idx] || 0) * (self.meta.ceiling[name] || 0);
      var live = self.layers[name];
      if (target <= 0) {
        // Ramp it away but leave the node running: restarting a source costs a
        // fetch-free but audible re-entry, and a silent gain node is free.
        if (live) self._ramp(live.gain, 0, xf);
        return;
      }
      if (live) { self._ramp(live.gain, target, xf); return; }
      // The catch covers the fetch and the decode and nothing else. Wrapping
      // the ramp in it too is how a plain TypeError in this file once turned
      // into a bed that silently never came up.
      self._buffer(name).catch(function () {
        return null;   // one missing layer must not stop the other six
      }).then(function (buf) {
        if (!buf) return;
        // The scene may have changed again while this was downloading.
        var g = self.meta.scenes[self.scene];
        var want = g ? (g[idx] || 0) * (self.meta.ceiling[name] || 0) : 0;
        var l = self._startLayer(name, buf);
        self._ramp(l.gain, want, want > 0 ? xf : 0.5);
      });
    });
  };

  BedEngine.prototype._layerIndex = function (name) {
    // bed.json's scene tuples are in soundscape.LAYER_NAMES order, which is the
    // order meta.layers was written in minus any layer with no recording.
    if (!this._order) {
      this._order = { waves: 0, foam: 1, wind: 2, leaves: 3, water: 4, creak: 5, gulls: 6 };
    }
    return this._order[name];
  };

  BedEngine.prototype._ramp = function (param, to, seconds) {
    var now = this.ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(to, now + seconds);
  };

  /* Per-mode base level and swell depth: drive sits lower and breathes less,
     because road noise buries a bed set for a dark room and a big swell in a
     car just adds mush. */
  BedEngine.prototype.setMode = function (bedGain, swellDb) {
    this.bedGain = bedGain == null ? 1 : bedGain;
    this.lift = Math.pow(10, (swellDb == null ? 6 : swellDb) / 20) - 1;
    if (this.ctx && this.scene) this._ramp(this.master.gain, this.volume * this.bedGain, 2);
  };

  BedEngine.prototype.setVolume = function (v) {
    this.volume = v;
    if (this.ctx && this.scene) this._ramp(this.master.gain, this.volume * this.bedGain, 0.3);
  };

  /* Hand over the pause windows for the segment now playing. `gaps` is the
     base64 blob from the manifest, or an array of seconds already decoded.
     `dur` is the segment's length, and it matters more than it looks: the long
     silence between two chapters is split across the join, sitting as a short
     tail on one file and a seven-second head on the next. Without knowing where
     the file ends, the swell falls back to base right at the join and then
     re-ramps — the bed sagging at the exact moment it should be fullest. With
     it, a pause touching either edge is treated as continuing past it. */
  BedEngine.prototype.setSegment = function (scene, gaps, dur) {
    this.gaps = typeof gaps === 'string' ? decodeGaps(gaps) : (gaps || []);
    this.segDur = dur > 0 ? dur : 0;
    this._cursor = 0;
    if (scene) this.setScene(scene);
  };

  /* Called with the playhead's position *within the current segment*. */
  BedEngine.prototype.tick = function (t) {
    if (!this.ctx || this.failed || !this.swell) return;
    var g = this.gaps, n = g.length, i;

    // The playhead usually advances, so resume the scan where it left off and
    // only walk backwards when the listener seeks.
    if (this._cursor > 0 && g[this._cursor - 2] > t) this._cursor = 0;
    while (this._cursor + 1 < n && g[this._cursor + 1] + SWELL_RAMP < t) this._cursor += 2;

    var sum = 0;
    for (i = this._cursor; i + 1 < n; i += 2) {
      var a = g[i], b = g[i + 1];
      if (a - SWELL_RAMP > t) break;
      if (b - a < SWELL_MIN_GAP) continue;
      // A pause flush against the start of the file began in the file before,
      // and one flush against the end carries on into the next, so neither gets
      // its ramp on that side.
      var up = a <= EDGE ? 1 : (t - a) / SWELL_RAMP;
      var down = (this.segDur && b >= this.segDur - EDGE) ? 1
                 : (b - t) / SWELL_RAMP;
      var tri = Math.min(up, down);
      if (tri > 0) sum += Math.min(1, tri);
    }
    var target = 1 + this.lift * Math.min(1, sum);
    // A short time-constant on top of an envelope that is already smooth: this
    // only removes the stair-step from being sampled once per frame.
    this.swell.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
  };

  BedEngine.prototype.suspend = function () {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
  };

  BedEngine.prototype.resume = function () {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  };

  /* Fade out and let go of the decoded buffers — ~21 MB if every layer is
     resident, which is worth reclaiming when the listener leaves the page. */
  BedEngine.prototype.stop = function () {
    if (!this.ctx) return;
    var self = this, ctx = this.ctx;
    try { this._ramp(this.master.gain, 0, 1.5); } catch (e) { /* closing anyway */ }
    setTimeout(function () {
      try { ctx.close(); } catch (e) { /* already gone */ }
      self.ctx = null; self.layers = {}; self.buffers = {};
      self.pending = {}; self.scene = null;
    }, 1600);
  };

  BedEngine.decodeGaps = decodeGaps;
  root.BedEngine = BedEngine;
}(typeof window !== 'undefined' ? window : this));
