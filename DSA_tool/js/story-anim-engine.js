/* Story animation engine — acts out One Piece anecdotes as small animated scenes.
   Scene schema (window.STORY_ANIMS[patternId]):
     h      : stage height in px (default 230)
     props  : [{id, emoji, label, x, y, cls}]      — fixed scenery, % coordinates
     actors : [{id, emoji, label, x, y}]            — characters that slide around
     steps  : [{c, a: {actorId:[x,y]}, p: {propId: ''|'lit'|'good'|'bad'|'dim'|'off'}, l: {propId:'newLabel'}}]
   Step changes are cumulative; jumping to step i replays steps 0..i from the base state. */

(function () {
  'use strict';

  function el(tag, cls) {
    const d = document.createElement(tag);
    if (cls) d.className = cls;
    return d;
  }

  function computeState(scene, upto) {
    const actors = {}, props = {}, labels = {};
    (scene.actors || []).forEach(a => { actors[a.id] = [a.x, a.y]; });
    (scene.props || []).forEach(p => { props[p.id] = p.cls || ''; labels[p.id] = p.label; });
    for (let i = 0; i <= upto; i++) {
      const s = scene.steps[i];
      if (s.a) Object.keys(s.a).forEach(k => { actors[k] = s.a[k]; });
      if (s.p) Object.assign(props, s.p);
      if (s.l) Object.assign(labels, s.l);
    }
    return { actors, props, labels };
  }

  function renderStoryAnim(container, scene) {
    container.classList.add('story-anim');
    container.innerHTML = '';

    const stage = el('div', 'sa-stage');
    stage.style.height = (scene.h || 230) + 'px';

    const propEls = {}, propTagEls = {}, actorEls = {}, lastPropCls = {};

    (scene.props || []).forEach(p => {
      const d = el('div', 'sa-prop');
      d.style.left = p.x + '%';
      d.style.top = p.y + '%';
      if (p.emoji) {
        const e = el('span', 'sa-emoji');
        e.textContent = p.emoji;
        d.appendChild(e);
      }
      if (p.label != null) {
        const t = el('span', 'sa-tag');
        t.textContent = p.label;
        d.appendChild(t);
        propTagEls[p.id] = t;
      }
      propEls[p.id] = d;
      stage.appendChild(d);
    });

    (scene.actors || []).forEach(a => {
      const d = el('div', 'sa-actor');
      const e = el('span', 'sa-emoji');
      e.textContent = a.emoji;
      d.appendChild(e);
      if (a.label) {
        const n = el('span', 'sa-name');
        n.textContent = a.label;
        d.appendChild(n);
      }
      d.style.left = a.x + '%';
      d.style.top = a.y + '%';
      actorEls[a.id] = d;
      stage.appendChild(d);
    });

    const caption = el('div', 'sa-caption');
    const controls = el('div', 'sa-controls');
    const btnPrev = el('button');  btnPrev.textContent = '⏮ Back';
    const btnPlay = el('button');  btnPlay.textContent = '▶ Play';
    const btnNext = el('button');  btnNext.textContent = 'Next ⏭';
    const counter = el('span', 'step-count');
    controls.appendChild(btnPrev);
    controls.appendChild(btnPlay);
    controls.appendChild(btnNext);
    controls.appendChild(counter);

    container.appendChild(stage);
    container.appendChild(caption);
    container.appendChild(controls);

    let idx = 0, timer = null;

    function apply(i) {
      idx = i;
      const st = computeState(scene, i);
      Object.keys(st.actors).forEach(k => {
        const pos = st.actors[k];
        actorEls[k].style.left = pos[0] + '%';
        actorEls[k].style.top = pos[1] + '%';
      });
      Object.keys(st.props).forEach(k => {
        const cls = 'sa-prop' + (st.props[k] ? ' sa-' + st.props[k] : '');
        if (lastPropCls[k] !== cls) {
          propEls[k].className = cls;
          lastPropCls[k] = cls;
        }
        if (propTagEls[k] && propTagEls[k].textContent !== String(st.labels[k])) {
          propTagEls[k].textContent = st.labels[k];
        }
      });
      caption.classList.remove('sa-cap-in');
      void caption.offsetWidth;
      caption.textContent = scene.steps[i].c;
      caption.classList.add('sa-cap-in');
      counter.textContent = (i + 1) + ' / ' + scene.steps.length;
    }

    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
      btnPlay.textContent = '▶ Play';
    }

    function play() {
      stop();
      if (idx >= scene.steps.length - 1) apply(0);
      btnPlay.textContent = '⏸ Pause';
      timer = setInterval(() => {
        if (idx >= scene.steps.length - 1) { stop(); return; }
        apply(idx + 1);
      }, 2100);
    }

    btnPrev.addEventListener('click', () => { stop(); apply(Math.max(0, idx - 1)); });
    btnNext.addEventListener('click', () => { stop(); apply(Math.min(scene.steps.length - 1, idx + 1)); });
    btnPlay.addEventListener('click', () => { timer ? stop() : play(); });

    const det = container.closest('details');
    if (det) {
      det.addEventListener('toggle', () => {
        if (det.open) { apply(0); play(); } else { stop(); }
      });
      if (det.open) { play(); }
    }

    apply(0);
  }

  function mountStoryAnims(root) {
    const scenes = window.STORY_ANIMS || {};
    Array.prototype.forEach.call(
      (root || document).querySelectorAll('[data-story-anim]'),
      node => {
        if (node.dataset.saMounted) return;
        const scene = scenes[node.dataset.storyAnim];
        if (!scene) return;
        node.dataset.saMounted = '1';
        renderStoryAnim(node, scene);
      }
    );
  }

  window.renderStoryAnim = renderStoryAnim;
  window.mountStoryAnims = mountStoryAnims;
  document.addEventListener('DOMContentLoaded', () => mountStoryAnims());
})();
