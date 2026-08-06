/* Everything you see in Moominvalley, drawn with arithmetic.
 *
 * There is not one image file in this game. Every tile, building and character
 * is shapes on a canvas, which is why the whole valley costs about twelve
 * kilobytes and loads instantly on a phone. It also means the drawings are
 * original: nothing here is traced from anything, and nothing was generated.
 * They are round white creatures with long snouts because that is what these
 * characters have always been, and they are drawn the way somebody would draw
 * them on a napkin from memory.
 *
 * Two rules the whole file follows:
 *
 *   Detail is a function of position, never of time. A tuft of grass is placed
 *   by hashing its tile coordinates, so it sits in the same spot on every
 *   frame. Random detail per frame looks like static and gives people
 *   headaches. Only things that are meant to move — water, fire, the walk bob
 *   — get time.
 *
 *   Nothing is drawn outside the camera. At 46 by 30 tiles that matters on a
 *   phone.
 *
 * Exposes window.MoominArt.
 */
(function (root) {
  'use strict';

  var T = root.MoominMap.T;
  var TILE = 32;

  var INK = '#232a36';

  /* Stable per-tile noise: same tile, same speckles, every frame. */
  function hash(x, y) {
    var n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967296;
  }

  var GROUND = {};
  GROUND[T.GRASS] = ['#3f6b46', '#4a7a50'];
  GROUND[T.STONE] = ['#5b6270', '#666e7d'];
  GROUND[T.SAND] = ['#9a8a63', '#a89772'];
  GROUND[T.SNOW] = ['#c8d4e2', '#d6e0ec'];
  GROUND[T.PATH] = ['#7d6f56', '#8a7b60'];
  GROUND[T.BRIDGE] = ['#6b5335', '#775d3c'];
  GROUND[T.ICE] = ['#9fc4d8', '#addbe8'];

  function groundOf(t) {
    if (GROUND[t]) return GROUND[t];
    return GROUND[T.GRASS];
  }

  /* --- tiles ------------------------------------------------------------ */
  function tile(ctx, m, x, y, px, py, time) {
    var t = m.at(x, y);
    var r = hash(x, y);

    if (t === T.WATER) {
      var d = 0.5 + 0.5 * Math.sin(time * 0.0011 + (x + y) * 0.6);
      ctx.fillStyle = '#2a4a63';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = 'rgba(140,190,215,' + (0.10 + 0.10 * d) + ')';
      ctx.fillRect(px, py + ((r * 20) | 0), TILE, 3);
      return;
    }

    /* Decor sits on its own ground, so a tree in the snow has snow under it. */
    var under = (t === T.TREE || t === T.ROCK || t === T.FLOWER ||
                 t === T.MUSHROOM || t === T.TALLGRASS || t === T.BLOCK)
      ? m.baseTile : t;
    var g = groundOf(under);
    ctx.fillStyle = r > 0.5 ? g[0] : g[1];
    ctx.fillRect(px, py, TILE, TILE);

    if (under === T.GRASS && r > 0.75) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(px + ((r * 24) | 0), py + ((hash(y, x) * 24) | 0), 3, 3);
    }
    if (under === T.SAND && r > 0.8) {
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.fillRect(px + ((r * 26) | 0), py + ((hash(y, x) * 26) | 0), 2, 2);
    }
    if (under === T.SNOW && r > 0.86) {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(px + ((r * 26) | 0), py + ((hash(y, x) * 26) | 0), 2, 2);
    }
    if (under === T.STONE && r > 0.88) {
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.moveTo(px + 4, py + 6 + ((r * 18) | 0));
      ctx.lineTo(px + 26, py + 10 + ((r * 14) | 0));
      ctx.stroke();
    }

    if (t === T.TALLGRASS) {
      ctx.strokeStyle = 'rgba(120,180,120,0.55)';
      ctx.lineWidth = 2;
      for (var i = 0; i < 3; i++) {
        var bx = px + 6 + i * 9;
        ctx.beginPath();
        ctx.moveTo(bx, py + 28);
        ctx.quadraticCurveTo(bx + 2, py + 20, bx + 4 + Math.sin(time * 0.001 + i) * 2, py + 12);
        ctx.stroke();
      }
      ctx.lineWidth = 1;
    } else if (t === T.FLOWER) {
      var petal = ['#e8d36a', '#e8908f', '#c8a7e0', '#f0f0f0'][(r * 4) | 0];
      ctx.strokeStyle = '#3d6b45';
      ctx.beginPath(); ctx.moveTo(px + 16, py + 26); ctx.lineTo(px + 16, py + 16); ctx.stroke();
      ctx.fillStyle = petal;
      for (var a = 0; a < 5; a++) {
        var ang = a * 1.2566 + r;
        ctx.beginPath();
        ctx.arc(px + 16 + Math.cos(ang) * 4, py + 14 + Math.sin(ang) * 4, 3, 0, 6.283);
        ctx.fill();
      }
    } else if (t === T.MUSHROOM) {
      ctx.fillStyle = '#e8e0d0';
      ctx.fillRect(px + 14, py + 18, 4, 8);
      ctx.fillStyle = '#c05a4a';
      ctx.beginPath();
      ctx.ellipse(px + 16, py + 18, 8, 6, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(px + 13, py + 15, 1.6, 0, 6.283); ctx.fill();
      ctx.beginPath(); ctx.arc(px + 19, py + 16, 1.3, 0, 6.283); ctx.fill();
    } else if (t === T.ROCK) {
      ctx.fillStyle = '#6a7280';
      ctx.beginPath();
      ctx.moveTo(px + 5, py + 27);
      ctx.lineTo(px + 9 + r * 4, py + 12);
      ctx.lineTo(px + 20, py + 8 + r * 4);
      ctx.lineTo(px + 27, py + 27);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.moveTo(px + 9 + r * 4, py + 12);
      ctx.lineTo(px + 20, py + 8 + r * 4);
      ctx.lineTo(px + 16, py + 27);
      ctx.closePath();
      ctx.fill();
    } else if (t === T.TREE) {
      var pine = r > 0.45;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath(); ctx.ellipse(px + 16, py + 28, 9, 3, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#6b4f34';
      ctx.fillRect(px + 14, py + 16, 4, 12);
      if (pine) {
        ctx.fillStyle = '#2f5b3a';
        for (var k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(px + 16, py - 4 + k * 8);
          ctx.lineTo(px + 5 + k, py + 10 + k * 6);
          ctx.lineTo(px + 27 - k, py + 10 + k * 6);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        ctx.fillStyle = '#3d6f42';
        ctx.beginPath(); ctx.arc(px + 16, py + 11, 11, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.09)';
        ctx.beginPath(); ctx.arc(px + 12, py + 8, 5, 0, 6.283); ctx.fill();
      }
    }
  }

  /* --- buildings -------------------------------------------------------- */
  function roof(ctx, x, y, w, h, colour) {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w + 4, y + h);
    ctx.closePath();
    ctx.fill();
  }

  function prop(ctx, p, time) {
    var x = p.x * TILE, y = p.y * TILE, w = p.w * TILE, h = p.h * TILE;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = INK;

    switch (p.t) {
      case 'house':
        ctx.fillStyle = '#4a6fa5';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h);
        ctx.lineTo(x + 8, y + h * 0.42);
        ctx.lineTo(x + w - 8, y + h * 0.42);
        ctx.lineTo(x + w - 8, y + h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#8c3f3f';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.42, w / 2 - 6, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = '#e8d9a8';
        ctx.fillRect(x + 16, y + h * 0.55, 12, 12);
        ctx.fillRect(x + w - 28, y + h * 0.55, 12, 12);
        ctx.fillStyle = '#3d2e20';
        ctx.fillRect(x + w / 2 - 8, y + h - 22, 16, 22);
        break;
      case 'mill':
        ctx.fillStyle = '#6d5a44';
        ctx.fillRect(x + 6, y + 14, w - 12, h - 14);
        roof(ctx, x + 6, y - 2, w - 12, 18, '#4a3b2c');
        ctx.strokeStyle = '#c9b98f';
        ctx.lineWidth = 3;
        var spin = time * 0.0006;
        for (var i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(x + w - 4, y + h - 20);
          ctx.lineTo(x + w - 4 + Math.cos(spin + i * 1.571) * 20,
                     y + h - 20 + Math.sin(spin + i * 1.571) * 20);
          ctx.stroke();
        }
        break;
      case 'lighthouse':
        ctx.fillStyle = '#e6e6e6';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + h);
        ctx.lineTo(x + 14, y + 14);
        ctx.lineTo(x + w - 14, y + 14);
        ctx.lineTo(x + w - 6, y + h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#b6483f';
        ctx.fillRect(x + 10, y + h * 0.45, w - 20, 14);
        ctx.fillStyle = '#3a4250';
        ctx.fillRect(x + 12, y + 2, w - 24, 14);
        var beam = 0.35 + 0.35 * Math.sin(time * 0.0012);
        ctx.fillStyle = 'rgba(255,235,150,' + beam + ')';
        ctx.beginPath(); ctx.arc(x + w / 2, y + 9, 9, 0, 6.283); ctx.fill();
        break;
      case 'palace':
        ctx.fillStyle = 'rgba(190,225,240,0.85)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + h);
        ctx.lineTo(x + 10, y + 18);
        ctx.lineTo(x + w / 2, y - 6);
        ctx.lineTo(x + w - 10, y + 18);
        ctx.lineTo(x + w - 4, y + h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.fillRect(x + w / 2 - 10, y + h - 26, 20, 26);
        break;
      case 'ship':
        ctx.fillStyle = '#6b4a2e';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.quadraticCurveTo(x + w / 2, y + h + 12, x + w, y + h);
        ctx.lineTo(x + w - 6, y + h - 20);
        ctx.lineTo(x + 6, y + h - 20);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#8a7050'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + w / 2, y + h - 20); ctx.lineTo(x + w / 2, y); ctx.stroke();
        ctx.fillStyle = '#d8cdb4';
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y + 4);
        ctx.lineTo(x + w / 2 + 26, y + h - 26);
        ctx.lineTo(x + w / 2, y + h - 26);
        ctx.closePath(); ctx.fill();
        break;
      case 'tower':
        ctx.fillStyle = '#7a7466';
        ctx.fillRect(x + 6, y + 12, w - 12, h - 12);
        roof(ctx, x + 2, y - 4, w - 4, 18, '#4d4a40');
        ctx.fillStyle = '#e8d9a8';
        ctx.fillRect(x + w / 2 - 5, y + 22, 10, 12);
        break;
      case 'shed':
      case 'cellar':
      case 'stall':
        ctx.fillStyle = p.t === 'stall' ? '#8a5d3a' : '#5f5347';
        ctx.fillRect(x + 4, y + 10, w - 8, h - 10);
        roof(ctx, x, y - 2, w, 14, p.t === 'stall' ? '#a8443c' : '#3f382f');
        if (p.t === 'stall') {
          ctx.fillStyle = '#e8dcc0';
          for (var s = 0; s < 3; s++) ctx.fillRect(x + 8 + s * 14, y + 16, 10, 8);
        }
        break;
      case 'cave':
        ctx.fillStyle = '#4a4f5c';
        ctx.beginPath();
        ctx.moveTo(x, y + h);
        ctx.quadraticCurveTo(x + w / 2, y - 14, x + w, y + h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#12161d';
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h - 2, w / 4, h / 2, 0, Math.PI, 0);
        ctx.fill();
        break;
      case 'tent':
        ctx.fillStyle = '#6d7a4a';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w - 2, y + h);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#2b3222';
        ctx.beginPath();
        ctx.moveTo(x + w / 2 - 7, y + h);
        ctx.lineTo(x + w / 2, y + h * 0.4);
        ctx.lineTo(x + w / 2 + 7, y + h);
        ctx.closePath(); ctx.fill();
        break;
      case 'well':
        ctx.fillStyle = '#6a6a72';
        ctx.beginPath(); ctx.ellipse(x + 16, y + 22, 12, 7, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#1a1f28';
        ctx.beginPath(); ctx.ellipse(x + 16, y + 21, 8, 4.5, 0, 0, 6.283); ctx.fill();
        ctx.strokeStyle = '#6b4f34'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x + 7, y + 20); ctx.lineTo(x + 9, y + 2);
        ctx.lineTo(x + 23, y + 2); ctx.lineTo(x + 25, y + 20); ctx.stroke();
        break;
      case 'sign':
        ctx.fillStyle = '#6b4f34';
        ctx.fillRect(x + 14, y + 12, 4, 16);
        ctx.fillStyle = '#a5824f';
        ctx.fillRect(x + 2, y + 2, 28, 14);
        ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 2, y + 2, 28, 14);
        break;
      case 'boat':
        ctx.fillStyle = '#7a5433';
        ctx.beginPath();
        ctx.moveTo(x + 2, y + h * 0.5);
        ctx.quadraticCurveTo(x + w / 2, y + h + 4, x + w - 2, y + h * 0.5);
        ctx.closePath(); ctx.fill();
        break;
      case 'jetty':
      case 'bridge':
        ctx.fillStyle = '#775d3c';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1;
        for (var b = 0; b < p.h; b++) {
          ctx.beginPath();
          ctx.moveTo(x, y + b * TILE + 8); ctx.lineTo(x + w, y + b * TILE + 8);
          ctx.stroke();
        }
        break;
      case 'fire':
        var f = Math.sin(time * 0.008) * 2;
        ctx.fillStyle = '#4a3423';
        ctx.fillRect(x + 4, y + 20, 24, 6);
        ctx.fillStyle = '#e07a2a';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 2 + f);
        ctx.quadraticCurveTo(x + 26, y + 16, x + 16, y + 22);
        ctx.quadraticCurveTo(x + 6, y + 16, x + 16, y + 2 + f);
        ctx.fill();
        ctx.fillStyle = '#f6d76a';
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 10 + f);
        ctx.quadraticCurveTo(x + 21, y + 17, x + 16, y + 21);
        ctx.quadraticCurveTo(x + 11, y + 17, x + 16, y + 10 + f);
        ctx.fill();
        break;
    }
    ctx.restore();
  }

  /* --- characters -------------------------------------------------------
     One moomin-shaped body, drawn at 1x and then dressed. Everybody who is not
     a moomin gets their own silhouette so that you can tell who is who from
     across the map, which matters more than any amount of detail. */

  function moominBody(ctx, coat, face) {
    ctx.fillStyle = coat;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    /* legs */
    ctx.beginPath(); ctx.ellipse(-5, 12, 3.6, 3.2, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(5, 12, 3.6, 3.2, 0, 0, 6.283); ctx.fill(); ctx.stroke();
    /* body */
    ctx.beginPath();
    ctx.ellipse(0, 1, 10, 12, 0, 0, 6.283);
    ctx.fill(); ctx.stroke();
    /* snout */
    ctx.beginPath();
    ctx.ellipse(face * 8, -1, 7, 5.2, 0, 0, 6.283);
    ctx.fill(); ctx.stroke();
    /* ears */
    ctx.beginPath();
    ctx.moveTo(-7, -9); ctx.lineTo(-4, -15); ctx.lineTo(-2, -8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -9); ctx.lineTo(4, -15); ctx.lineTo(2, -8);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    /* eyes */
    ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(face * 2 - 2, -4, 1.5, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(face * 2 + 2, -4, 1.5, 0, 6.283); ctx.fill();
  }

  function character(ctx, body, cx, cy, face, bob) {
    ctx.save();
    ctx.translate(cx, cy - 16 + bob);
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(0, 16, 10, 3.5, 0, 0, 6.283); ctx.fill();

    switch (body) {
      case 'moomin':
        moominBody(ctx, '#f4f2ec', face);
        break;
      case 'mamma':
        moominBody(ctx, '#f4f2ec', face);
        ctx.fillStyle = '#b8446b'; ctx.strokeStyle = INK;
        ctx.beginPath();                       /* apron */
        ctx.moveTo(-7, 2); ctx.lineTo(7, 2); ctx.lineTo(6, 12); ctx.lineTo(-6, 12);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a3050';             /* handbag */
        ctx.beginPath(); ctx.ellipse(-11, 6, 4, 4.5, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        break;
      case 'pappa':
        moominBody(ctx, '#f4f2ec', face);
        ctx.fillStyle = '#22262e';             /* top hat */
        ctx.fillRect(-8, -17, 16, 2.5);
        ctx.fillRect(-5, -26, 10, 10);
        ctx.strokeRect(-5, -26, 10, 10);
        break;
      case 'snork':
        moominBody(ctx, '#cfe6e2', face);
        ctx.fillStyle = '#e8c65a';             /* fringe */
        ctx.beginPath(); ctx.ellipse(0, -10, 8, 4, 0, Math.PI, 0); ctx.fill();
        break;
      case 'snufkin':
        ctx.fillStyle = '#5c6b3f'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath();                        /* coat */
        ctx.moveTo(-7, 14); ctx.lineTo(-5, -4); ctx.lineTo(5, -4); ctx.lineTo(7, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e0c9a6';              /* face */
        ctx.beginPath(); ctx.arc(0, -8, 5.5, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#3f6b3a';              /* pointed hat */
        ctx.beginPath();
        ctx.moveTo(-9, -11); ctx.lineTo(0, -24); ctx.lineTo(9, -11);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 2 - 2, -8, 1.2, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(face * 2 + 2, -8, 1.2, 0, 6.283); ctx.fill();
        break;
      case 'my':
        ctx.fillStyle = '#c0392b'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath();                        /* tiny round dress */
        ctx.moveTo(-6, 13); ctx.lineTo(-3, 0); ctx.lineTo(3, 0); ctx.lineTo(6, 13);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f0d8c0';
        ctx.beginPath(); ctx.arc(0, -4, 5, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b5502c';              /* onion bun */
        ctx.beginPath(); ctx.arc(0, -11, 4.5, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 1.6 - 1.8, -4, 1.1, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(face * 1.6 + 1.8, -4, 1.1, 0, 6.283); ctx.fill();
        break;
      case 'sniff':
        ctx.fillStyle = '#c69b6d'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 4, 8, 9, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(face * 6, -5, 6, 4.5, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath();                        /* big ears */
        ctx.ellipse(-6, -11, 3, 6, -0.3, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(6, -11, 3, 6, 0.3, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 1.5 - 2, -6, 1.2, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(face * 1.5 + 2, -6, 1.2, 0, 6.283); ctx.fill();
        break;
      case 'hemulen':
        ctx.fillStyle = '#b9aee0'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath();                        /* long dress */
        ctx.moveTo(-8, 14); ctx.lineTo(-5, -8); ctx.lineTo(5, -8); ctx.lineTo(8, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#efe6d8';
        ctx.beginPath(); ctx.ellipse(face * 3, -13, 6.5, 5, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8b7fbf';              /* wide hat */
        ctx.beginPath(); ctx.ellipse(0, -18, 11, 3, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 2 - 1.5, -14, 1.1, 0, 6.283); ctx.fill();
        break;
      case 'tooticky':
        ctx.fillStyle = '#3f7d8c'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.ellipse(0, 3, 8, 10, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#d8e8ec'; ctx.lineWidth = 1.6;
        for (var st = 0; st < 3; st++) {
          ctx.beginPath();
          ctx.moveTo(-7, -2 + st * 5); ctx.lineTo(7, -2 + st * 5); ctx.stroke();
        }
        ctx.strokeStyle = INK;
        ctx.fillStyle = '#e8cba8';
        ctx.beginPath(); ctx.arc(0, -10, 5.5, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#c04a3a';              /* bobble cap */
        ctx.beginPath(); ctx.ellipse(0, -14, 6.5, 4, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 1.6 - 2, -10, 1.1, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(face * 1.6 + 2, -10, 1.1, 0, 6.283); ctx.fill();
        break;
      case 'groke':
        ctx.fillStyle = 'rgba(140,150,200,0.22)';
        ctx.beginPath(); ctx.ellipse(0, 6, 18, 16, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#4a4a6b'; ctx.strokeStyle = '#2b2b45'; ctx.lineWidth = 1.6;
        ctx.beginPath();                        /* a cold mound */
        ctx.moveTo(-12, 15);
        ctx.quadraticCurveTo(-11, -14, 0, -15);
        ctx.quadraticCurveTo(11, -14, 12, 15);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#e8f0ff';
        ctx.beginPath(); ctx.ellipse(-4, -6, 2.6, 3.4, 0, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.ellipse(4, -6, 2.6, 3.4, 0, 0, 6.283); ctx.fill();
        ctx.fillStyle = '#9aa8d8';
        for (var tth = 0; tth < 5; tth++) {
          ctx.fillRect(-8 + tth * 4, 1, 2.5, 3);
        }
        break;
      case 'filly':
        ctx.fillStyle = '#d9a8c8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-7, 14); ctx.lineTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(7, 14);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = INK; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -13); ctx.stroke();
        ctx.fillStyle = '#f0e2d2';
        ctx.beginPath(); ctx.ellipse(face * 2, -16, 5, 4.5, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#b56f9a';              /* bonnet */
        ctx.beginPath(); ctx.ellipse(0, -20, 7, 3.5, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
        ctx.fillStyle = INK;
        ctx.beginPath(); ctx.arc(face * 2, -16, 1.1, 0, 6.283); ctx.fill();
        break;
      case 'stinky':
        ctx.fillStyle = '#6f6b45'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 6, 9, 8, 0, 0, 6.283); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-8, -1); ctx.lineTo(-5, -10); ctx.lineTo(-1, -2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(8, -1); ctx.lineTo(5, -10); ctx.lineTo(1, -2);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f6e07a';
        ctx.beginPath(); ctx.arc(face * 1.6 - 2.5, 2, 1.6, 0, 6.283); ctx.fill();
        ctx.beginPath(); ctx.arc(face * 1.6 + 2.5, 2, 1.6, 0, 6.283); ctx.fill();
        break;
      default:
        moominBody(ctx, '#f4f2ec', face);
    }
    ctx.restore();
  }

  /* A hattifattener: pale, silent, always in a crowd. Decoration only. */
  function hattifattener(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y);
    var sway = Math.sin(t * 0.003 + x) * 1.5;
    ctx.fillStyle = '#e7e4d6';
    ctx.strokeStyle = '#8d8a7c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.quadraticCurveTo(-5 + sway, -8, 0 + sway, -10);
    ctx.quadraticCurveTo(5 + sway, -8, 4, 8);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6b6a5e';
    ctx.beginPath(); ctx.arc(-1.6 + sway, -6, 0.9, 0, 6.283); ctx.fill();
    ctx.beginPath(); ctx.arc(1.6 + sway, -6, 0.9, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  /* The collectible that does nothing. */
  function shell(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 0.003 + x) * 2);
    ctx.fillStyle = '#f0d9b5';
    ctx.strokeStyle = '#b08a5e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(-9, 2, 0, -7);
    ctx.quadraticCurveTo(9, 2, 0, 6);
    ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(-5, -3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(5, -3); ctx.stroke();
    ctx.restore();
  }

  /* A pearl marks a lesson you have finished with. */
  function pearl(ctx, x, y, t) {
    ctx.save();
    ctx.translate(x, y + Math.sin(t * 0.002 + y) * 2);
    var g = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#9fd8d0');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.283); ctx.fill();
    ctx.restore();
  }

  root.MoominArt = {
    TILE: TILE,
    tile: tile,
    prop: prop,
    character: character,
    hattifattener: hattifattener,
    shell: shell,
    pearl: pearl,
    INK: INK,
  };
})(window);
