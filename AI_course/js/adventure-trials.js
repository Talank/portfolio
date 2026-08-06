/* The trials — the part of the game where the mathematics is the toy.
 *
 * A multiple-choice question about cosine similarity tests whether you can
 * recognise a sentence about cosine similarity. Turning an arrow with the
 * arrow keys and watching the number climb to one as it lines up teaches you
 * what the number IS, in about fifteen seconds, permanently. That is the whole
 * argument for this file, and it is why the mathematics region has a trial on
 * every keeper rather than none.
 *
 * Every trial obeys the same three rules:
 *   - it can be left at any time with ESC and nothing is lost;
 *   - it cannot be failed, only passed or skipped, so there is never a reason
 *     to dread one;
 *   - the number you are chasing is always on screen and always live, because
 *     the point is to watch it move as you move.
 *
 * A trial is an object with update / draw / press. A keeper whose trial is not
 * written yet simply has none — start() returns null and the engine goes
 * straight to the questions, so this file can grow without touching anything
 * else.
 */
(function (root) {
  'use strict';

  var prev = {};
  function resetEdges() { prev = {}; }
  function edge(input, code) {
    var down = !!input.keys[code];
    var was = !!prev[code];
    prev[code] = down;
    return down && !was;
  }
  function held(input, code) { return !!input.keys[code]; }

  /* Repeatable scatter. The obvious one-liner, sin(i) * 43758.5 % 1, can
     return a negative number, which quietly biases every point it places. */
  function frac(i) {
    var v = Math.sin(i * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  }

  /* --- shared chrome ---------------------------------------------------- */
  function frame(ctx, w, h, title, help) {
    var bw = Math.min(700, w - 40), bh = Math.min(470, h - 40);
    var x = (w - bw) / 2, y = (h - bh) / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(8,11,16,0.86)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(21,27,35,0.98)';
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.rect(x, y, bw, bh);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#4fd1c5';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(title.toUpperCase(), x + 20, y + 24);
    ctx.fillStyle = '#8b98ac';
    ctx.font = '12px sans-serif';
    ctx.fillText(help, x + 20, y + bh - 14);
    ctx.restore();
    return { x: x, y: y, w: bw, h: bh };
  }

  function readout(ctx, b, label, value, good) {
    ctx.save();
    ctx.font = '13px sans-serif';
    ctx.fillStyle = '#8b98ac';
    ctx.fillText(label, b.x + 20, b.y + b.h - 44);
    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = good ? '#68d391' : '#f6ad55';
    ctx.fillText(value, b.x + 20, b.y + b.h - 44 + 26);
    ctx.restore();
  }

  function axes(ctx, cx, cy, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(139,152,172,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
    ctx.stroke();
    ctx.restore();
  }

  function arrow(ctx, cx, cy, dx, dy, colour, width) {
    ctx.save();
    ctx.strokeStyle = colour; ctx.fillStyle = colour;
    ctx.lineWidth = width || 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
    var a = Math.atan2(dy, dx);
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + dy);
    ctx.lineTo(cx + dx - Math.cos(a - 0.4) * 11, cy + dy - Math.sin(a - 0.4) * 11);
    ctx.lineTo(cx + dx - Math.cos(a + 0.4) * 11, cy + dy - Math.sin(a + 0.4) * 11);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* Slider trials all share this: one value, moved with left and right, and a
     curve drawn above it that the value walks along. */
  function curveTrial(opts) {
    var t = {
      p: opts.start, done: false, passed: false, verdict: '',
      solve: function () { t.p = opts.answer; },
      update: function (dt, input) {
        var d = (held(input, 'ArrowRight') || held(input, 'KeyD') ? 1 : 0) -
                (held(input, 'ArrowLeft') || held(input, 'KeyA') ? 1 : 0);
        d += input.pad.x;
        if (d) t.p = Math.max(opts.min, Math.min(opts.max, t.p + d * opts.speed * dt));
      },
      press: function () {
        t.passed = Math.abs(t.p - opts.answer) <= opts.tol;
        t.verdict = t.passed ? opts.win : opts.lose(t.p);
        t.done = true;
      },
      draw: function (ctx, w, h) {
        var b = frame(ctx, w, h, opts.title,
                      '← → to move   ·   SPACE when you are there   ·   ESC to skip');
        ctx.save();
        ctx.fillStyle = '#dbe2ef';
        ctx.font = '14px sans-serif';
        opts.blurb.split('\n').forEach(function (l, i) {
          ctx.fillText(l, b.x + 20, b.y + 50 + i * 20);
        });

        var gx = b.x + 60, gy = b.y + b.h - 96, gw = b.w - 120, gh = 170;
        ctx.strokeStyle = 'rgba(139,152,172,0.35)';
        ctx.beginPath();
        ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy);
        ctx.stroke();

        var maxY = 0, i, v;
        var pts = [];
        for (i = 0; i <= 120; i++) {
          var x = opts.min + (opts.max - opts.min) * i / 120;
          v = opts.f(x);
          maxY = Math.max(maxY, v);
          pts.push([x, v]);
        }
        ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach(function (pt, k) {
          var px = gx + gw * (pt[0] - opts.min) / (opts.max - opts.min);
          var py = gy - gh * (pt[1] / (maxY || 1));
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();

        var mx = gx + gw * (t.p - opts.min) / (opts.max - opts.min);
        var my = gy - gh * (opts.f(t.p) / (maxY || 1));
        ctx.strokeStyle = 'rgba(246,173,85,0.6)';
        ctx.beginPath(); ctx.moveTo(mx, gy); ctx.lineTo(mx, my); ctx.stroke();
        ctx.fillStyle = '#f6ad55';
        ctx.beginPath(); ctx.arc(mx, my, 6, 0, 6.283); ctx.fill();
        ctx.restore();

        readout(ctx, b, opts.label, opts.fmt(t.p, opts.f(t.p)),
                Math.abs(t.p - opts.answer) <= opts.tol);
      },
    };
    return t;
  }

  /* --------------------------------------------------------------- trials */
  var make = {

    /* Vectors: turn your arrow until it agrees with hers. */
    cosine: function () {
      var target = -0.55;                       /* radians, up and to the right */
      var a = 2.2;
      var t = {
        done: false, passed: false, verdict: '',
        update: function (dt, input) {
          var d = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          d += input.pad.x;
          a += d * 0.0022 * dt;
        },
        cos: function () { return Math.cos(a - target); },
        solve: function () { a = target; },
        press: function () {
          t.passed = t.cos() >= 0.97;
          t.verdict = t.passed
            ? 'Cosine ' + t.cos().toFixed(3) + '. Same direction, and the lengths never mattered.'
            : 'Cosine ' + t.cos().toFixed(3) + '. Not lined up — but you saw what the number does.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Compass Rock',
                        '← → to turn your arrow   ·   SPACE to lock it in   ·   ESC to skip');
          var cx = b.x + b.w / 2, cy = b.y + b.h / 2 - 10;
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Turn the orange arrow until it points the way the blue one does.',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('The blue arrow is three times longer. Watch whether that changes anything.',
                       b.x + 20, b.y + 70);
          axes(ctx, cx, cy, 130);
          arrow(ctx, cx, cy, Math.cos(target) * 120, Math.sin(target) * 120, '#5b8dd9', 4);
          arrow(ctx, cx, cy, Math.cos(a) * 40, Math.sin(a) * 40, '#f6ad55', 3);
          ctx.restore();
          readout(ctx, b, 'cosine similarity', t.cos().toFixed(3), t.cos() >= 0.97);
        },
      };
      return t;
    },

    /* Matrices: bend the graph paper until it matches the outline. */
    matrix: function () {
      var goal = [1.4, 0.6, -0.3, 1.1];
      var m = [1, 0, 0, 1];
      var sel = 0;
      var t = {
        done: false, passed: false, verdict: '',
        err: function () {
          var e = 0;
          for (var i = 0; i < 4; i++) e = Math.max(e, Math.abs(m[i] - goal[i]));
          return e;
        },
        solve: function () { m = goal.slice(); },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) sel = (sel + 1) % 4;
          if (edge(input, 'ArrowLeft')) sel = (sel + 3) % 4;
          var d = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          d -= input.pad.y;
          m[sel] = Math.max(-2, Math.min(2, m[sel] + d * 0.0012 * dt));
        },
        press: function () {
          t.passed = t.err() < 0.12;
          t.verdict = t.passed
            ? 'That is the transformation. Four numbers, and the whole plane moved.'
            : 'Close enough to see it. Four numbers move every point at once.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Folding Bridge',
                        '← → picks a number   ·   ↑ ↓ changes it   ·   SPACE to finish   ·   ESC to skip');
          var cx = b.x + b.w / 2 + 40, cy = b.y + b.h / 2 - 4, s = 42;
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Match the dashed outline by changing the four numbers.',
                       b.x + 20, b.y + 50);
          axes(ctx, cx, cy, 150);

          function shape(mat, stroke, dash) {
            var pts = [[0, 0], [1, 0], [1, 1], [0, 1]];
            ctx.save();
            ctx.setLineDash(dash || []);
            ctx.strokeStyle = stroke; ctx.lineWidth = 2;
            ctx.beginPath();
            pts.forEach(function (p, i) {
              var x = cx + (mat[0] * p[0] + mat[1] * p[1]) * s;
              var y = cy - (mat[2] * p[0] + mat[3] * p[1]) * s;
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            });
            ctx.closePath(); ctx.stroke();
            ctx.restore();
          }
          shape(goal, '#68d391', [6, 5]);
          shape(m, '#f6ad55');

          var lx = b.x + 30, ly = b.y + 110;
          ctx.font = 'bold 20px monospace';
          for (var i = 0; i < 4; i++) {
            var px = lx + (i % 2) * 74, py = ly + ((i / 2) | 0) * 40;
            ctx.fillStyle = i === sel ? '#4fd1c5' : '#8b98ac';
            ctx.fillText(m[i].toFixed(2), px, py);
            if (i === sel) {
              ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 1;
              ctx.strokeRect(px - 6, py - 20, 68, 26);
            }
          }
          ctx.restore();
          readout(ctx, b, 'worst error', t.err().toFixed(2), t.err() < 0.12);
        },
      };
      return t;
    },

    /* Eigenvectors: find the direction the transformation does not turn. */
    eigen: function () {
      var M = [2, 1, 1, 2];                     /* eigen directions at 45 and 135 */
      var a = 0.15;
      var t = {
        done: false, passed: false, verdict: '',
        out: function () {
          var vx = Math.cos(a), vy = Math.sin(a);
          return [M[0] * vx + M[1] * vy, M[2] * vx + M[3] * vy];
        },
        turn: function () {
          var o = t.out();
          var vx = Math.cos(a), vy = Math.sin(a);
          var cross = vx * o[1] - vy * o[0];
          var len = Math.sqrt(o[0] * o[0] + o[1] * o[1]) || 1;
          return Math.abs(cross / len);
        },
        lambda: function () {
          var o = t.out();
          return Math.sqrt(o[0] * o[0] + o[1] * o[1]);
        },
        solve: function () { a = Math.PI / 4; },
        update: function (dt, input) {
          var d = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          d += input.pad.x;
          a += d * 0.0018 * dt;
        },
        press: function () {
          t.passed = t.turn() < 0.06;
          t.verdict = t.passed
            ? 'Not turned at all, only stretched by ' + t.lambda().toFixed(2) +
              '. That is an eigenvector, and that is its eigenvalue.'
            : 'Still turning. The two directions that do not turn are the grain of the matrix.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Cave of Echoes',
                        '← → to turn the white arrow   ·   SPACE when the orange one stops turning   ·   ESC to skip');
          var cx = b.x + b.w / 2, cy = b.y + b.h / 2, s = 52;
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('White is your arrow. Orange is what the matrix does to it.',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('Find a direction where orange points exactly the same way as white.',
                       b.x + 20, b.y + 70);
          axes(ctx, cx, cy, 150);
          var o = t.out();
          arrow(ctx, cx, cy, o[0] * s, -o[1] * s, '#f6ad55', 3);
          arrow(ctx, cx, cy, Math.cos(a) * s, -Math.sin(a) * s, '#f0f4fa', 3);
          ctx.restore();
          readout(ctx, b, 'how much it turned', t.turn().toFixed(3), t.turn() < 0.06);
        },
      };
      return t;
    },

    /* Gradient descent, in fog, with a learning rate you can ruin. */
    gradient: function () {
      function f(x) { return 0.35 * (x - 2.1) * (x - 2.1) + 0.9 + 0.25 * Math.sin(x * 1.7); }
      function df(x) { return 0.7 * (x - 2.1) + 0.425 * Math.cos(x * 1.7); }
      var x = -4.2, lr = 0.35, steps = 0, trail = [];
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { for (var i = 0; i < 400; i++) x -= df(x) * 0.2; },
        update: function (dt, input) {
          var d = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          d -= input.pad.y;
          if (d) lr = Math.max(0.02, Math.min(3.2, lr + d * 0.0012 * dt));
          if (edge(input, 'ArrowRight') || edge(input, 'ArrowLeft')) {
            x -= df(x) * lr;
            steps++;
            trail.push(x);
            if (trail.length > 30) trail.shift();
          }
        },
        press: function () {
          t.passed = Math.abs(df(x)) < 0.12;
          t.verdict = t.passed
            ? 'Downhill, one step, feel again — ' + steps + ' steps and the slope is flat.'
            : 'The slope is still ' + df(x).toFixed(2) + '. Too big a step jumps the valley; too small never arrives.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Foggy Slope',
                        '← or → takes ONE step downhill   ·   ↑ ↓ changes the learning rate   ·   SPACE to stop   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('You cannot see the valley. You can only feel the slope where you stand.',
                       b.x + 20, b.y + 50);

          var gx = b.x + 40, gy = b.y + b.h - 110, gw = b.w - 80, gh = 150;
          function px(v) { return gx + gw * (v + 6) / 12; }
          function py(v) { return gy - gh * (v / 6); }

          /* The curve is only drawn where you have been — this is fog. */
          ctx.strokeStyle = 'rgba(79,209,197,0.75)'; ctx.lineWidth = 2;
          ctx.beginPath();
          for (var i = -14; i <= 14; i++) {
            var vx = x + i * 0.09;
            if (i === -14) ctx.moveTo(px(vx), py(f(vx))); else ctx.lineTo(px(vx), py(f(vx)));
          }
          ctx.stroke();

          ctx.strokeStyle = 'rgba(139,152,172,0.25)';
          ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();

          trail.forEach(function (tx, i) {
            ctx.fillStyle = 'rgba(246,173,85,' + (0.12 + 0.5 * i / trail.length) + ')';
            ctx.beginPath(); ctx.arc(px(tx), py(f(tx)), 3, 0, 6.283); ctx.fill();
          });
          ctx.fillStyle = '#f6ad55';
          ctx.beginPath(); ctx.arc(px(x), py(f(x)), 7, 0, 6.283); ctx.fill();

          var g = df(x);
          arrow(ctx, px(x), py(f(x)) - 22, -Math.sign(g) * 34, 0, '#68d391', 2);

          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('learning rate ' + lr.toFixed(2) + '   ·   steps ' + steps,
                       b.x + 20, b.y + 78);
          ctx.restore();
          readout(ctx, b, 'slope under your feet', g.toFixed(3), Math.abs(g) < 0.12);
        },
      };
      return t;
    },

    /* Bayes: the rare disease, drawn as a thousand berries. */
    bayes: function () {
      var guess = 50;
      var N = 1000, rate = 0.01, sens = 0.9, fpr = 0.1;
      var truePos = N * rate * sens;                 /* 9 */
      var falsePos = N * (1 - rate) * fpr;           /* 99 */
      var answer = 100 * truePos / (truePos + falsePos);
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { guess = answer; },
        update: function (dt, input) {
          var d = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          d += input.pad.x;
          guess = Math.max(0, Math.min(100, guess + d * 0.03 * dt));
        },
        press: function () {
          t.passed = Math.abs(guess - answer) <= 6;
          t.verdict = 'It is ' + answer.toFixed(0) + ' percent. Nine real cases, ' +
                      'ninety nine false alarms — the rarity wins.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Berry Gamble',
                        '← → to change your guess   ·   SPACE to answer   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          [
            'A thousand berries. One in a hundred is poisonous.',
            'The test finds nine out of ten real poisons, and wrongly flags one in ten good ones.',
            'Of every berry the test flags, what percent is truly poisonous?',
          ].forEach(function (l, i) { ctx.fillText(l, b.x + 20, b.y + 50 + i * 20); });

          var gx = b.x + 30, gy = b.y + 130, cols = 50;
          for (var i = 0; i < N; i++) {
            var cxp = gx + (i % cols) * 12, cyp = gy + ((i / cols) | 0) * 8;
            var poison = i < N * rate;
            var flagged = poison ? i < truePos : (i - N * rate) < falsePos;
            ctx.fillStyle = poison ? '#f56565'
                          : (flagged ? 'rgba(246,173,85,0.85)' : 'rgba(90,104,126,0.28)');
            ctx.fillRect(cxp, cyp, 6, 4);
          }
          ctx.fillStyle = '#8b98ac'; ctx.font = '11px sans-serif';
          ctx.fillText('red = really poisonous   ·   orange = flagged and fine', gx, gy - 8);
          ctx.restore();
          readout(ctx, b, 'your answer', guess.toFixed(0) + '%',
                  Math.abs(guess - answer) <= 6);
        },
      };
      return t;
    },

    /* Maximum likelihood, as a curve you walk along. */
    mle: function () {
      return curveTrial({
        title: 'The Butterfly Census',
        blurb: 'Ten butterflies caught. Three of them were blue.\n' +
               'Move the guess to the rate that makes that catch least surprising.',
        label: 'guessed rate  ·  likelihood',
        min: 0.01, max: 0.99, start: 0.75, answer: 0.3, tol: 0.05, speed: 0.0007,
        f: function (p) { return Math.pow(p, 3) * Math.pow(1 - p, 7); },
        fmt: function (p, v) { return p.toFixed(2) + '   ' + (v * 1000).toFixed(2); },
        win: 'Three in ten. Maximum likelihood is nothing grander than that.',
        lose: function (p) {
          return 'You stopped at ' + p.toFixed(2) + '. The peak is at nought point three — ' +
                 'exactly the fraction you actually saw.';
        },
      });
    },

    /* Entropy: where is a coin at its most surprising? */
    entropy: function () {
      return curveTrial({
        title: 'The Signal Fire',
        blurb: 'A coin that lands heads with this probability.\n' +
               'Find the setting where the next flip tells you the most.',
        label: 'probability of heads  ·  entropy in bits',
        min: 0.01, max: 0.99, start: 0.9, answer: 0.5, tol: 0.05, speed: 0.0007,
        f: function (p) { return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p); },
        fmt: function (p, v) { return p.toFixed(2) + '   ' + v.toFixed(3) + ' bits'; },
        win: 'One whole bit, at an even coin. Certainty carries no information at all.',
        lose: function (p) {
          return 'At ' + p.toFixed(2) + ' you already half know the answer, so the flip ' +
                 'tells you less. The peak is the fair coin.';
        },
      });
    },

    /* Overfitting: choose how bendy the curve is allowed to be. */
    overfit: function () {
      var deg = 1;
      var pts = [];
      for (var i = 0; i < 11; i++) {
        var x = -1 + i * 0.2;
        pts.push([x, 0.9 * x * x - 0.2 * x + 0.15 + frac(i) * 0.3 - 0.15]);
      }
      function fit(d) {
        /* Small, plain least squares on a Vandermonde system — big enough to
           show the shape of the problem, small enough to read. */
        var n = d + 1, X = [], y = [];
        pts.forEach(function (p) {
          var row = [];
          for (var k = 0; k < n; k++) row.push(Math.pow(p[0], k));
          X.push(row); y.push(p[1]);
        });
        var ATA = [], ATy = [];
        for (var r = 0; r < n; r++) {
          ATy[r] = 0; ATA[r] = [];
          for (var c = 0; c < n; c++) {
            var s = 0;
            for (var m = 0; m < X.length; m++) s += X[m][r] * X[m][c];
            ATA[r][c] = s + (r === c ? 1e-7 : 0);
          }
          for (var m2 = 0; m2 < X.length; m2++) ATy[r] += X[m2][r] * y[m2];
        }
        for (var col = 0; col < n; col++) {
          var piv = ATA[col][col] || 1e-9;
          for (var cc = col; cc < n; cc++) ATA[col][cc] /= piv;
          ATy[col] /= piv;
          for (var rr = 0; rr < n; rr++) {
            if (rr === col) continue;
            var fct = ATA[rr][col];
            for (var c2 = col; c2 < n; c2++) ATA[rr][c2] -= fct * ATA[col][c2];
            ATy[rr] -= fct * ATy[col];
          }
        }
        return ATy;
      }
      function evalp(co, x) {
        var s = 0;
        for (var k = 0; k < co.length; k++) s += co[k] * Math.pow(x, k);
        return s;
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { deg = 2; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) deg = Math.min(9, deg + 1);
          if (edge(input, 'ArrowLeft')) deg = Math.max(1, deg - 1);
        },
        press: function () {
          t.passed = deg === 2;
          t.verdict = t.passed
            ? 'Two. It follows the shape and ignores the wobble, which is the whole craft.'
            : (deg > 4 ? 'A curve that goes through every point has learned the points, not the rule.'
                       : 'A straight line cannot see the bend that is really there.');
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Jam Cellar',
                        '← → changes how bendy the curve may be   ·   SPACE to choose   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Eleven jars. Find the curve that will also be right about next summer.',
                       b.x + 20, b.y + 50);
          var gx = b.x + 60, gy = b.y + b.h - 110, gw = b.w - 120, gh = 170;
          function PX(x) { return gx + gw * (x + 1.1) / 2.2; }
          function PY(y) { return gy - gh * (y + 0.3) / 1.6; }
          ctx.strokeStyle = 'rgba(139,152,172,0.3)';
          ctx.strokeRect(gx, gy - gh, gw, gh);
          var co = fit(deg);
          ctx.strokeStyle = deg === 2 ? '#68d391' : '#f6ad55';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (var i = 0; i <= 120; i++) {
            var x = -1.05 + 2.1 * i / 120;
            var yv = Math.max(-0.35, Math.min(1.35, evalp(co, x)));
            if (i === 0) ctx.moveTo(PX(x), PY(yv)); else ctx.lineTo(PX(x), PY(yv));
          }
          ctx.stroke();
          ctx.fillStyle = '#dbe2ef';
          pts.forEach(function (p) {
            ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), 4, 0, 6.283); ctx.fill();
          });
          ctx.restore();
          readout(ctx, b, 'bendiness', 'degree ' + deg, deg === 2);
        },
      };
      return t;
    },

    /* Least squares, by hand. */
    fitline: function () {
      var m = 0.1, c = 0.2;
      var pts = [];
      for (var i = 0; i < 14; i++) {
        var x = i / 13;
        var wob = frac(i + 7) * 0.22 - 0.11;
        pts.push([x, 0.75 * x + 0.15 + wob]);
      }
      function sse() {
        var s = 0;
        pts.forEach(function (p) { var e = p[1] - (m * p[0] + c); s += e * e; });
        return s;
      }
      var t = {
        done: false, passed: false, verdict: '',
        /* the least-squares answer, which is what the trial is asking you to
           find by hand */
        solve: function () {
          var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
          pts.forEach(function (q) { sx += q[0]; sy += q[1]; sxx += q[0] * q[0]; sxy += q[0] * q[1]; });
          m = (n * sxy - sx * sy) / (n * sxx - sx * sx);
          c = (sy - m * sx) / n;
        },
        update: function (dt, input) {
          var dx = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          var dy = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          dx += input.pad.x; dy -= input.pad.y;
          m += dx * 0.0011 * dt;
          c += dy * 0.0007 * dt;
        },
        press: function () {
          t.passed = sse() < 0.09;
          t.verdict = t.passed
            ? 'Cost ' + sse().toFixed(3) + '. That is what gradient descent does for you, only faster.'
            : 'Cost ' + sse().toFixed(3) + '. Every step you took by hand, a model takes by feeling the slope.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Beanpole Field',
                        '← → tilts the line   ·   ↑ ↓ raises it   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Put the line where the squared distances add up to as little as possible.',
                       b.x + 20, b.y + 50);
          var gx = b.x + 60, gy = b.y + b.h - 110, gw = b.w - 120, gh = 170;
          function PX(x) { return gx + gw * x; }
          function PY(y) { return gy - gh * y; }
          ctx.strokeStyle = 'rgba(139,152,172,0.3)';
          ctx.strokeRect(gx, gy - gh, gw, gh);
          ctx.strokeStyle = 'rgba(245,101,101,0.55)'; ctx.lineWidth = 1;
          pts.forEach(function (p) {
            ctx.beginPath();
            ctx.moveTo(PX(p[0]), PY(p[1]));
            ctx.lineTo(PX(p[0]), PY(m * p[0] + c));
            ctx.stroke();
          });
          ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(PX(0), PY(c)); ctx.lineTo(PX(1), PY(m + c));
          ctx.stroke();
          ctx.fillStyle = '#dbe2ef';
          pts.forEach(function (p) {
            ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), 4, 0, 6.283); ctx.fill();
          });
          ctx.restore();
          readout(ctx, b, 'sum of squared error', sse().toFixed(3), sse() < 0.09);
        },
      };
      return t;
    },

    /* K-means, one iteration per press. */
    cluster: function () {
      var pts = [], cents = [[0.2, 0.8], [0.25, 0.75], [0.3, 0.7]];
      var seeds = [[0.25, 0.3], [0.75, 0.35], [0.5, 0.78]];
      for (var g = 0; g < 3; g++) {
        for (var i = 0; i < 14; i++) {
          var r = frac(g * 31 + i);
          var r2 = frac(g * 57 + i + 3);
          pts.push([seeds[g][0] + r * 0.22 - 0.11, seeds[g][1] + r2 * 0.22 - 0.11]);
        }
      }
      var iter = 0, moved = 1;
      function assign() {
        return pts.map(function (p) {
          var best = 0, bd = 9;
          cents.forEach(function (c, k) {
            var d = (c[0] - p[0]) * (c[0] - p[0]) + (c[1] - p[1]) * (c[1] - p[1]);
            if (d < bd) { bd = d; best = k; }
          });
          return best;
        });
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { for (var i = 0; i < 40 && !t.done; i++) t.press(); },
        update: function () { /* nothing moves on its own */ },
        press: function () {
          if (moved < 0.004 && iter > 1) {
            t.passed = true;
            t.passed = true;
            t.verdict = 'Converged in ' + iter + ' rounds. Nobody told it what the three sorts were.';
            t.done = true;
            return;
          }
          var a = assign();
          moved = 0;
          cents.forEach(function (c, k) {
            var sx = 0, sy = 0, n = 0;
            pts.forEach(function (p, i) { if (a[i] === k) { sx += p[0]; sy += p[1]; n++; } });
            if (!n) return;
            var nx = sx / n, ny = sy / n;
            moved += Math.abs(nx - c[0]) + Math.abs(ny - c[1]);
            c[0] = nx; c[1] = ny;
          });
          iter++;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Wildflower Bank',
                        'SPACE runs one round   ·   press it again when nothing moves   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Assign every flower to its nearest pin, then move each pin to the middle.',
                       b.x + 20, b.y + 50);
          var gx = b.x + 90, gy = b.y + b.h - 110, gs = Math.min(b.w - 180, 200);
          function PX(x) { return gx + gs * x; }
          function PY(y) { return gy - gs * y; }
          ctx.strokeStyle = 'rgba(139,152,172,0.3)';
          ctx.strokeRect(gx, gy - gs, gs, gs);
          var cols = ['#4fd1c5', '#f6ad55', '#c8a7e0'];
          var a = assign();
          pts.forEach(function (p, i) {
            ctx.fillStyle = cols[a[i]];
            ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), 3.5, 0, 6.283); ctx.fill();
          });
          cents.forEach(function (c, k) {
            ctx.strokeStyle = cols[k]; ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(PX(c[0]) - 7, PY(c[1])); ctx.lineTo(PX(c[0]) + 7, PY(c[1]));
            ctx.moveTo(PX(c[0]), PY(c[1]) - 7); ctx.lineTo(PX(c[0]), PY(c[1]) + 7);
            ctx.stroke();
          });
          ctx.restore();
          readout(ctx, b, 'round  ·  how far the pins moved',
                  iter + '   ' + moved.toFixed(3), moved < 0.004 && iter > 1);
        },
      };
      return t;
    },

    /* One neuron: a line, and which side you are on. */
    neuron: function () {
      var ang = 0.2, off = 0.0;
      var pts = [];
      for (var i = 0; i < 18; i++) {
        var r = frac(i);
        var r2 = frac(i + 11);
        var cls = i % 2;
        pts.push([r * 0.8 - 0.4 + (cls ? 0.34 : -0.34),
                  r2 * 0.8 - 0.4 + (cls ? 0.22 : -0.22), cls]);
      }
      function score(p) {
        return Math.cos(ang) * p[0] + Math.sin(ang) * p[1] + off;
      }
      function wrong() {
        return pts.filter(function (p) { return (score(p) > 0 ? 1 : 0) !== p[2]; }).length;
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () {
          for (var i = 0; i < 360; i++) {
            for (var j = -30; j <= 30; j++) {
              ang = i * Math.PI / 180; off = j / 40;
              if (wrong() === 0) return;
            }
          }
        },
        update: function (dt, input) {
          var d = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          var d2 = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          d += input.pad.x; d2 -= input.pad.y;
          ang += d * 0.0016 * dt;
          off += d2 * 0.0006 * dt;
        },
        press: function () {
          t.passed = wrong() === 0;
          t.verdict = t.passed
            ? 'Every one on the right side. Two weights and a bias — that is one neuron.'
            : wrong() + ' still wrong. A single neuron can only ever draw one straight line.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Mill Wheel',
                        '← → turns the boundary   ·   ↑ ↓ shifts it   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('The weights turn the line. The bias slides it. Separate the two colours.',
                       b.x + 20, b.y + 50);
          var cx = b.x + b.w / 2, cy = b.y + b.h / 2 - 6, s = 150;
          ctx.strokeStyle = 'rgba(139,152,172,0.3)';
          ctx.strokeRect(cx - s, cy - s * 0.62, s * 2, s * 1.24);
          var nx = Math.cos(ang), ny = Math.sin(ang);
          ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx + (-ny * 400) - nx * off * s, cy - (-nx * 400) + ny * off * s);
          ctx.lineTo(cx + (ny * 400) - nx * off * s, cy - (nx * 400) + ny * off * s);
          ctx.stroke();
          pts.forEach(function (p) {
            var ok = (score(p) > 0 ? 1 : 0) === p[2];
            ctx.fillStyle = p[2] ? '#f6ad55' : '#5b8dd9';
            ctx.beginPath(); ctx.arc(cx + p[0] * s, cy - p[1] * s, 5, 0, 6.283); ctx.fill();
            if (!ok) {
              ctx.strokeStyle = '#f56565'; ctx.lineWidth = 1.5;
              ctx.beginPath(); ctx.arc(cx + p[0] * s, cy - p[1] * s, 8, 0, 6.283); ctx.stroke();
            }
          });
          ctx.restore();
          readout(ctx, b, 'on the wrong side', String(wrong()), wrong() === 0);
        },
      };
      return t;
    },
    /* Backpropagation: three gates in a row, and the chain rule as a feeling
       in your hands rather than a formula on a page. */
    blame: function () {
      var w = [0.8, 1.4, 0.6], target = 2.0, sel = 0;
      function out() { return 1.5 * w[0] * w[1] * w[2]; }
      function loss() { var e = out() - target; return e * e; }
      function grad(i) {
        var p = 1.5;
        for (var k = 0; k < 3; k++) if (k !== i) p *= w[k];
        return 2 * (out() - target) * p;
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { w = [1, 1, target / 1.5]; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) sel = (sel + 1) % 3;
          if (edge(input, 'ArrowLeft')) sel = (sel + 2) % 3;
          var d = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          d -= input.pad.y;
          w[sel] = Math.max(0.05, Math.min(3, w[sel] + d * 0.0009 * dt));
        },
        press: function () {
          t.passed = loss() < 0.02;
          t.verdict = t.passed
            ? 'Loss ' + loss().toFixed(3) + '. Every weight knew which way to move, and none of them saw the answer.'
            : 'Loss ' + loss().toFixed(3) + '. Notice the gate with the biggest number under it moves the output most.';
          t.done = true;
        },
        draw: function (ctx, w2, h) {
          var b = frame(ctx, w2, h, 'The Weir',
                        '← → picks a gate   ·   ↑ ↓ opens or closes it   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Water goes in at 1.5 and must come out at 2.0. Three gates in the way.',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('Under each gate is how much the final error changes if you open it — its gradient.',
                       b.x + 20, b.y + 70);

          var y = b.y + 150, x0 = b.x + 70, gap = (b.w - 160) / 3;
          ctx.strokeStyle = 'rgba(120,170,210,0.5)'; ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(b.x + 30, y); ctx.lineTo(b.x + b.w - 30, y); ctx.stroke();
          for (var i = 0; i < 3; i++) {
            var gx = x0 + gap * i + gap / 2;
            ctx.fillStyle = i === sel ? '#4fd1c5' : '#5f6b80';
            ctx.fillRect(gx - 16, y - 34, 32, 68);
            ctx.fillStyle = '#0d1117';
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(w[i].toFixed(2), gx, y + 4);
            ctx.fillStyle = '#f6ad55';
            ctx.font = '12px monospace';
            ctx.fillText(grad(i).toFixed(2), gx, y + 56);
            ctx.textAlign = 'left';
          }
          ctx.fillStyle = '#dbe2ef'; ctx.font = '13px sans-serif';
          ctx.fillText('out ' + out().toFixed(2) + '   ·   wanted ' + target.toFixed(2),
                       b.x + 20, b.y + 108);
          ctx.restore();
          readout(ctx, b, 'squared error', loss().toFixed(3), loss() < 0.02);
        },
      };
      return t;
    },

    /* Tokenization: cut the word where the vocabulary already knows it. */
    token: function () {
      var word = 'unbelievable';
      var vocab = ['un', 'believ', 'able', 'be', 'lie', 'v', 'a', 'ble', 'unbe'];
      var cuts = {}, cur = 1;
      function pieces() {
        var out = [], start = 0;
        for (var i = 1; i < word.length; i++) {
          if (cuts[i]) { out.push(word.slice(start, i)); start = i; }
        }
        out.push(word.slice(start));
        return out;
      }
      function known() {
        return pieces().every(function (p) { return vocab.indexOf(p) >= 0; });
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { cuts = { 2: true, 8: true }; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) cur = Math.min(word.length - 1, cur + 1);
          if (edge(input, 'ArrowLeft')) cur = Math.max(1, cur - 1);
          if (edge(input, 'ArrowUp') || edge(input, 'ArrowDown')) {
            if (cuts[cur]) delete cuts[cur]; else cuts[cur] = true;
          }
        },
        press: function () {
          var p = pieces();
          t.passed = known() && p.length <= 3;
          t.verdict = t.passed
            ? p.join(' + ') + '. Three pieces the model has seen before, and it has never met the whole word.'
            : (known() ? 'All known, but ' + p.length + ' pieces. Fewer and longer is cheaper.'
                       : p.filter(function (q) { return vocab.indexOf(q) < 0; })[0] +
                         ' is not in the vocabulary, so that cut cannot be used.');
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Fish Market',
                        '← → moves the knife   ·   ↑ or ↓ cuts   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('The model has never seen this word. Cut it into crates it already knows.',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('vocabulary:  ' + vocab.join('   '), b.x + 20, b.y + 74);

          var cw = 30, x0 = b.x + (b.w - word.length * cw) / 2, y = b.y + 150;
          for (var i = 0; i < word.length; i++) {
            ctx.fillStyle = 'rgba(40,52,66,0.9)';
            ctx.fillRect(x0 + i * cw + 2, y, cw - 4, 40);
            ctx.fillStyle = '#f0f4fa';
            ctx.font = 'bold 18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(word[i], x0 + i * cw + cw / 2, y + 27);
            ctx.textAlign = 'left';
            if (cuts[i]) {
              ctx.strokeStyle = '#f6ad55'; ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(x0 + i * cw, y - 6); ctx.lineTo(x0 + i * cw, y + 46);
              ctx.stroke();
            }
          }
          ctx.strokeStyle = '#4fd1c5'; ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0 + cur * cw, y - 16); ctx.lineTo(x0 + cur * cw, y - 4);
          ctx.stroke();

          var p = pieces();
          ctx.fillStyle = known() ? '#68d391' : '#f56565';
          ctx.font = '15px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.join('  +  '), b.x + b.w / 2, y + 84);
          ctx.textAlign = 'left';
          ctx.restore();
          readout(ctx, b, 'pieces  ·  all in the vocabulary',
                  p.length + '   ' + (known() ? 'yes' : 'no'), known() && p.length <= 3);
        },
      };
      return t;
    },

    /* Word embeddings: walk the king-to-queen step yourself. */
    analogy: function () {
      var words = {
        king: [0.62, 0.72], queen: [0.30, 0.74], man: [0.66, 0.30],
        woman: [0.34, 0.32], prince: [0.72, 0.58], throne: [0.52, 0.90],
        boy: [0.70, 0.14], girl: [0.38, 0.16],
      };
      var p = [words.king[0], words.king[1]];
      function nearest() {
        var best = null, bd = 9;
        Object.keys(words).forEach(function (k) {
          var d = (words[k][0] - p[0]) * (words[k][0] - p[0]) +
                  (words[k][1] - p[1]) * (words[k][1] - p[1]);
          if (d < bd) { bd = d; best = k; }
        });
        return best;
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () {
          p[0] = words.king[0] + words.woman[0] - words.man[0];
          p[1] = words.king[1] + words.woman[1] - words.man[1];
        },
        update: function (dt, input) {
          var dx = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          var dy = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          dx += input.pad.x; dy -= input.pad.y;
          p[0] = Math.max(0, Math.min(1, p[0] + dx * 0.0004 * dt));
          p[1] = Math.max(0, Math.min(1, p[1] + dy * 0.0004 * dt));
        },
        press: function () {
          t.passed = nearest() === 'queen';
          t.verdict = t.passed
            ? 'Queen. The step from man to woman is the same step, and nobody built that in.'
            : 'You landed on ' + nearest() + '. Take the man-to-woman step and start from king.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Net Loft',
                        'arrows move the marker   ·   SPACE to name where you landed   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Start at king. Move by exactly the arrow that goes from man to woman.',
                       b.x + 20, b.y + 50);
          var gs = Math.min(b.w - 200, b.h - 190);
          var gx = b.x + (b.w - gs) / 2, gy = b.y + b.h - 76;
          function PX(x) { return gx + gs * x; }
          function PY(y) { return gy - gs * y; }
          ctx.strokeStyle = 'rgba(139,152,172,0.25)';
          ctx.strokeRect(gx, gy - gs, gs, gs);
          arrow(ctx, PX(words.man[0]), PY(words.man[1]),
                PX(words.woman[0]) - PX(words.man[0]),
                PY(words.woman[1]) - PY(words.man[1]), 'rgba(104,211,145,0.8)', 2);
          Object.keys(words).forEach(function (k) {
            ctx.fillStyle = '#8b98ac';
            ctx.beginPath(); ctx.arc(PX(words[k][0]), PY(words[k][1]), 3.5, 0, 6.283); ctx.fill();
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#c8d2e2';
            ctx.fillText(k, PX(words[k][0]) + 7, PY(words[k][1]) + 4);
          });
          ctx.fillStyle = '#f6ad55';
          ctx.beginPath(); ctx.arc(PX(p[0]), PY(p[1]), 6, 0, 6.283); ctx.fill();
          ctx.restore();
          readout(ctx, b, 'nearest word', nearest(), nearest() === 'queen');
        },
      };
      return t;
    },

    /* Self-attention: give the weight to the word it actually refers to. */
    attention: function () {
      var sent = ['The', 'animal', 'did', 'not', 'cross', 'the', 'street',
                  'because', 'it', 'was', 'too', 'tired'];
      var right = 1;                              /* animal */
      var score = sent.map(function () { return 0; });
      var sel = 0;
      function soft() {
        var m = Math.max.apply(null, score);
        var ex = score.map(function (s) { return Math.exp(s - m); });
        var sum = ex.reduce(function (a, b) { return a + b; }, 0);
        return ex.map(function (e) { return e / sum; });
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { score[right] = 5; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) sel = (sel + 1) % sent.length;
          if (edge(input, 'ArrowLeft')) sel = (sel + sent.length - 1) % sent.length;
          var d = (held(input, 'ArrowUp') ? 1 : 0) - (held(input, 'ArrowDown') ? 1 : 0);
          d -= input.pad.y;
          score[sel] = Math.max(-2, Math.min(6, score[sel] + d * 0.004 * dt));
        },
        press: function () {
          var w = soft();
          var top = w.indexOf(Math.max.apply(null, w));
          t.passed = top === right;
          t.verdict = t.passed
            ? 'It looks at "animal", and that is the whole trick — every word scores every other word.'
            : 'Most of your weight went to "' + sent[top] + '". The word "it" has to find "animal".';
          t.done = true;
        },
        draw: function (ctx, w2, h) {
          var b = frame(ctx, w2, h, 'The Lamp Room',
                        '← → picks a word   ·   ↑ ↓ raises its score   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('The query is the word "it". Which word should it be looking at?',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('Your scores go through a softmax, so the bars always add up to one.',
                       b.x + 20, b.y + 70);
          var wts = soft();
          var x = b.x + 30, y = b.y + 120;
          ctx.font = '14px sans-serif';
          sent.forEach(function (word, i) {
            var tw = ctx.measureText(word).width + 18;
            if (x + tw > b.x + b.w - 30) { x = b.x + 30; y += 74; }
            ctx.fillStyle = i === sel ? 'rgba(79,209,197,0.2)' : 'rgba(40,52,66,0.7)';
            ctx.fillRect(x, y - 16, tw, 24);
            ctx.fillStyle = word === 'it' ? '#f6ad55' : '#dbe2ef';
            ctx.fillText(word, x + 9, y);
            ctx.fillStyle = i === sel ? '#4fd1c5' : '#5b8dd9';
            ctx.fillRect(x, y + 12, tw, Math.max(1, wts[i] * 46));
            x += tw + 8;
          });
          ctx.restore();
          var top = wts.indexOf(Math.max.apply(null, wts));
          readout(ctx, b, 'looking hardest at', sent[top], top === right);
        },
      };
      return t;
    },

    /* Scaling laws: spend a fixed budget between size and reading. */
    scaling: function () {
      function lossAt(p) {
        var N = Math.max(0.02, p), D = Math.max(0.02, 1 - p);
        return 0.34 / Math.pow(N, 0.34) + 0.29 / Math.pow(D, 0.28);
      }
      var best = 0.5, bl = 9;
      for (var i = 1; i < 100; i++) {
        var v = lossAt(i / 100);
        if (v < bl) { bl = v; best = i / 100; }
      }
      var worst = Math.max(lossAt(0.02), lossAt(0.98));
      return curveTrial({
        title: 'The Slipway',
        blurb: 'One budget. Spend it on a bigger model, or on more text to read.\n' +
               'The curve is how good the finished model is. Higher is better.',
        label: 'share spent on model size  ·  loss',
        min: 0.02, max: 0.98, start: 0.9, answer: best, tol: 0.08, speed: 0.0007,
        f: function (p) { return worst - lossAt(p); },
        fmt: function (p) {
          return (p * 100).toFixed(0) + '% size   ' + lossAt(p).toFixed(3) + ' loss';
        },
        win: 'About half and half. Everybody built models far too large for what they were fed.',
        lose: function (p) {
          return p > best
            ? 'Too much model, too little reading — that was the whole industry until Chinchilla.'
            : 'A tiny model cannot use all that text. The best spend is near the middle.';
        },
      });
    },

    /* LoRA: how thin can the patch be before it stops fitting? */
    lora: function () {
      /* The tail has to fall away fast enough that exactly one rank is both
         thin and good enough — otherwise the trial cannot be won. */
      var wts = [1.0, 0.55, 0.28, 0.09, 0.03, 0.02, 0.01, 0.005];
      var side = 12, r = 8;
      function err() {
        var s = 0;
        for (var k = r; k < wts.length; k++) s += wts[k];
        return s;
      }
      function params() { return 2 * side * r; }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { r = 4; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight') || edge(input, 'ArrowUp')) r = Math.min(8, r + 1);
          if (edge(input, 'ArrowLeft') || edge(input, 'ArrowDown')) r = Math.max(1, r - 1);
        },
        press: function () {
          t.passed = err() < 0.1 && r <= 4;
          t.verdict = t.passed
            ? 'Rank ' + r + '. ' + params() + ' numbers instead of ' + side * side +
              ', and the difference is under a tenth.'
            : (err() >= 0.1 ? 'Rank ' + r + ' is too thin — it cannot follow the change you are teaching.'
                            : 'It fits, but you are training more than you need to.');
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Sewing Room',
                        '← → changes the rank   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('The frozen weight is the big square. Your patch is the two thin strips.',
                       b.x + 20, b.y + 50);
          ctx.fillStyle = '#8b98ac'; ctx.font = '12px sans-serif';
          ctx.fillText('Find the thinnest patch that still fits what you are teaching.',
                       b.x + 20, b.y + 70);
          var cell = 13, ox = b.x + 60, oy = b.y + 120;
          for (var y = 0; y < side; y++) {
            for (var x = 0; x < side; x++) {
              ctx.fillStyle = 'rgba(90,104,126,0.35)';
              ctx.fillRect(ox + x * cell, oy + y * cell, cell - 2, cell - 2);
            }
          }
          ctx.fillStyle = '#8b98ac'; ctx.font = '11px sans-serif';
          ctx.fillText('frozen  ' + side * side, ox, oy + side * cell + 16);

          var ax = ox + side * cell + 50;
          for (y = 0; y < side; y++) {
            for (x = 0; x < r; x++) {
              ctx.fillStyle = '#4fd1c5';
              ctx.fillRect(ax + x * cell, oy + y * cell, cell - 2, cell - 2);
            }
          }
          for (y = 0; y < r; y++) {
            for (x = 0; x < side; x++) {
              ctx.fillStyle = '#4fd1c5';
              ctx.fillRect(ax + x * cell, oy + (side + 1.6) * cell + y * cell, cell - 2, cell - 2);
            }
          }
          ctx.fillStyle = '#4fd1c5'; ctx.font = '11px sans-serif';
          ctx.fillText('trainable  ' + params(), ax, oy - 8);
          ctx.restore();
          readout(ctx, b, 'rank  ·  what it still cannot copy',
                  r + '   ' + err().toFixed(2), err() < 0.1 && r <= 4);
        },
      };
      return t;
    },

    /* Sampling: turn the dial until the right number of words survive. */
    sampling: function () {
      var probs = [0.34, 0.24, 0.16, 0.09, 0.06, 0.04, 0.03, 0.02, 0.01, 0.01];
      var toks = ['road', 'river', 'forest', 'morning', 'harbour', 'window',
                  'kettle', 'letter', 'bridge', 'hat'];
      var p = 0.95, want = 3;
      function keep() {
        var s = 0, n = 0;
        for (var i = 0; i < probs.length; i++) {
          if (s >= p) break;
          s += probs[i]; n++;
        }
        return n;
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () {
          var s = 0;
          for (var i = 0; i < want; i++) s += probs[i];
          p = s - probs[want - 1] / 2;
        },
        update: function (dt, input) {
          var d = (held(input, 'ArrowRight') ? 1 : 0) - (held(input, 'ArrowLeft') ? 1 : 0);
          d += input.pad.x;
          p = Math.max(0.05, Math.min(0.99, p + d * 0.00035 * dt));
        },
        press: function () {
          t.passed = keep() === want;
          t.verdict = t.passed
            ? 'Top p of ' + p.toFixed(2) + ' keeps three. When the model is sure, the same dial keeps one.'
            : 'That keeps ' + keep() + '. The dial is a share of the probability, not a count of words.';
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Long Road Out',
                        '← → changes top p   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('The model’s ten candidates for the next word. Keep exactly three alive.',
                       b.x + 20, b.y + 50);
          var n = keep();
          var bw = (b.w - 80) / probs.length;
          probs.forEach(function (pr, i) {
            var x = b.x + 40 + i * bw, hgt = pr * 420;
            ctx.fillStyle = i < n ? '#4fd1c5' : 'rgba(90,104,126,0.35)';
            ctx.fillRect(x, b.y + b.h - 130 - hgt, bw - 8, hgt);
            ctx.save();
            ctx.translate(x + bw / 2 - 4, b.y + b.h - 122);
            ctx.rotate(0.9);
            ctx.fillStyle = i < n ? '#dbe2ef' : '#6b7688';
            ctx.font = '11px sans-serif';
            ctx.fillText(toks[i], 0, 0);
            ctx.restore();
          });
          ctx.restore();
          readout(ctx, b, 'top p  ·  words kept',
                  p.toFixed(2) + '   ' + n, n === want);
        },
      };
      return t;
    },

    /* RAG: cut the document without cutting the fact in half. */
    rag: function () {
      var sents = [
        'Moominvalley lies south of the Lonely Mountains.',
        'The house was built by Moominpappa in a single summer.',
        'It has a veranda and a blue tower.',
        'The key to the cellar hangs behind the kitchen clock,',
        'and only Moominmamma is allowed to move it.',
        'Winter closes the valley for four months.',
        'Snufkin leaves before the first frost.',
        'He comes back when the ice breaks.',
      ];
      var factA = 3, factB = 4;                  /* the answer spans these two */
      var size = 1, overlap = 0;
      function chunks() {
        var out = [], i = 0;
        while (i < sents.length) {
          out.push([i, Math.min(sents.length, i + size)]);
          var step = Math.max(1, size - overlap);
          i += step;
        }
        return out;
      }
      function intact() {
        return chunks().some(function (c) { return c[0] <= factA && c[1] > factB; });
      }
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () { size = 3; overlap = 0; },
        update: function (dt, input) {
          if (edge(input, 'ArrowRight')) size = Math.min(8, size + 1);
          if (edge(input, 'ArrowLeft')) size = Math.max(1, size - 1);
          if (edge(input, 'ArrowUp')) overlap = Math.min(Math.max(0, size - 1), overlap + 1);
          if (edge(input, 'ArrowDown')) overlap = Math.max(0, overlap - 1);
        },
        press: function () {
          t.passed = intact() && size <= 3;
          t.verdict = t.passed
            ? 'The fact survives in one chunk, and the chunk is still mostly about the fact.'
            : (intact() ? 'It fits, but a chunk that big buries the answer in eight other sentences.'
                        : 'The answer is cut in half, so neither piece can answer the question. Overlap fixes that.');
          t.done = true;
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Herbarium',
                        '← → chunk size   ·   ↑ ↓ overlap   ·   SPACE to finish   ·   ESC to skip');
          ctx.save();
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText('Question: who may move the cellar key?  The answer needs both orange lines.',
                       b.x + 20, b.y + 50);
          var cs = chunks();
          var y = b.y + 86;
          sents.forEach(function (s, i) {
            var isFact = i === factA || i === factB;
            ctx.fillStyle = isFact ? '#f6ad55' : '#9aa6ba';
            ctx.font = (isFact ? 'bold ' : '') + '12px sans-serif';
            ctx.fillText(s.length > 62 ? s.slice(0, 60) + '…' : s, b.x + 90, y + i * 20);
          });
          cs.forEach(function (c, k) {
            ctx.strokeStyle = (c[0] <= factA && c[1] > factB) ? '#68d391' : 'rgba(79,209,197,0.4)';
            ctx.lineWidth = 2;
            var x = b.x + 30 + (k % 4) * 13;
            ctx.beginPath();
            ctx.moveTo(x, y + c[0] * 20 - 12);
            ctx.lineTo(x, y + (c[1] - 1) * 20 + 4);
            ctx.stroke();
          });
          ctx.restore();
          readout(ctx, b, 'chunk size  ·  overlap  ·  fact whole',
                  size + '   ' + overlap + '   ' + (intact() ? 'yes' : 'no'),
                  intact() && size <= 3);
        },
      };
      return t;
    },

    /* The agent loop, one decision at a time. */
    react: function () {
      var steps = [
        { ask: 'The goal: what is the weather where the Moomins live?',
          opts: ['Answer straight away from memory',
                 'Look up where Moominvalley is',
                 'Call the weather tool with no place'],
          right: 1,
          why: 'Reason first, and the first reasoning step is noticing you do not know the place yet.' },
        { ask: 'The lookup says: Moominvalley, in Finland.',
          opts: ['Call the weather tool for Finland',
                 'Look it up again',
                 'Answer that it is probably cold'],
          right: 0,
          why: 'Act. The observation gave you exactly the argument the tool was missing.' },
        { ask: 'The weather tool returns: 4 degrees, raining.',
          opts: ['Call the tool once more to be sure',
                 'Answer with the temperature and the rain',
                 'Start again from the beginning'],
          right: 1,
          why: 'Stop. An agent with no stopping rule is a Hattifattener with a bank account.' },
      ];
      var i = 0, sel = 0, log = [], wrongCount = 0;
      var t = {
        done: false, passed: false, verdict: '',
        solve: function () {
          while (!t.done) { sel = steps[i].right; t.press(); }
        },
        update: function (dt, input) {
          if (edge(input, 'ArrowDown')) sel = (sel + 1) % 3;
          if (edge(input, 'ArrowUp')) sel = (sel + 2) % 3;
        },
        press: function () {
          if (sel !== steps[i].right) { wrongCount++; }
          log.push(steps[i].opts[sel]);
          i++; sel = 0;
          if (i >= steps.length) {
            t.passed = wrongCount === 0;
            t.verdict = t.passed
              ? 'Reason, act, observe, stop. That is the whole of an agent.'
              : 'The loop finished, but it wandered. Reason, act, observe — and know when to stop.';
            t.done = true;
          }
        },
        draw: function (ctx, w, h) {
          var b = frame(ctx, w, h, 'The Hattifattener Camp',
                        '↑ ↓ to choose   ·   SPACE to do it   ·   ESC to skip');
          ctx.save();
          var st = steps[Math.min(i, steps.length - 1)];
          ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
          ctx.fillText(st.ask, b.x + 20, b.y + 52);
          log.forEach(function (l, k) {
            ctx.fillStyle = '#5f6b80'; ctx.font = '12px sans-serif';
            ctx.fillText('· ' + l, b.x + 24, b.y + 80 + k * 18);
          });
          var oy = b.y + 96 + log.length * 18;
          st.opts.forEach(function (o, k) {
            ctx.fillStyle = k === sel ? 'rgba(40,58,72,0.95)' : 'rgba(28,36,48,0.85)';
            ctx.fillRect(b.x + 20, oy + k * 40, b.w - 40, 34);
            ctx.strokeStyle = k === sel ? '#4fd1c5' : 'rgba(90,104,126,0.5)';
            ctx.lineWidth = k === sel ? 2 : 1;
            ctx.strokeRect(b.x + 20, oy + k * 40, b.w - 40, 34);
            ctx.fillStyle = '#dbe2ef'; ctx.font = '14px sans-serif';
            ctx.fillText(o, b.x + 36, oy + k * 40 + 22);
          });
          ctx.restore();
          readout(ctx, b, 'step of the loop', (Math.min(i + 1, 3)) + ' of 3', false);
        },
      };
      return t;
    },
  };

  root.MoominTrials = {
    /* A keeper whose trial has not been written yet simply has none. */
    start: function (name) {
      if (!make[name]) return null;
      resetEdges();
      return make[name]();
    },
    has: function (name) { return !!make[name]; },
  };
})(window);
