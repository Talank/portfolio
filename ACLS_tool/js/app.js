(function(){
  "use strict";

  function showLoadError(err){
    var main = document.getElementById('mainArea');
    if(main){
      main.innerHTML =
        '<div class="card spine-critical"><h3>Could not load study data</h3>' +
        '<p>This page loads its questions, drug reference, and mnemonics from local JSON files in <code>data/</code>. ' +
        'Browsers block that kind of fetch when a page is opened directly from disk (the <code>file://</code> protocol).</p>' +
        '<p style="margin-bottom:0;">From the <code>ACLS_tool</code> folder, run <code>./start.sh</code> and open the printed ' +
        'http://localhost address instead.</p></div>';
    }
    console.error('ACLS_tool: data load failed', err);
  }

  Promise.all([
    fetch('data/questions.json').then(function(r){ if(!r.ok) throw new Error('questions.json: '+r.status); return r.json(); }),
    fetch('data/drugs.json').then(function(r){ if(!r.ok) throw new Error('drugs.json: '+r.status); return r.json(); }),
    fetch('data/mnemonics.json').then(function(r){ if(!r.ok) throw new Error('mnemonics.json: '+r.status); return r.json(); }),
    fetch('data/rhythms.json').then(function(r){ if(!r.ok) throw new Error('rhythms.json: '+r.status); return r.json(); })
  ]).then(function(res){
    boot(res[0], res[1], res[2], res[3]);
  }).catch(showLoadError);

  function boot(questionBank, drugs, mnemonics, rhythmsInfo){
  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- theme ---------------- */
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  var themeState = localStorage.getItem('acls_theme') || 'auto';
  function applyTheme(){
    if(themeState==='auto'){ root.removeAttribute('data-theme'); themeBtn.textContent='Theme: Auto'; }
    else { root.setAttribute('data-theme', themeState); themeBtn.textContent = 'Theme: '+(themeState==='dark'?'Dark':'Light'); }
  }
  applyTheme();
  themeBtn.addEventListener('click', function(){
    themeState = themeState==='auto' ? 'dark' : (themeState==='dark' ? 'light' : 'auto');
    localStorage.setItem('acls_theme', themeState);
    applyTheme();
  });

  /* ---------------- section nav ---------------- */
  var navbtns = Array.prototype.slice.call(document.querySelectorAll('.navbtn'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('.section'));
  function goTo(id){
    sections.forEach(function(s){ s.classList.toggle('active', s.id===id); });
    navbtns.forEach(function(b){ b.classList.toggle('active', b.dataset.target===id); });
    document.getElementById('mainArea').scrollTo({top:0, behavior: prefersReduced ? 'auto' : 'smooth'});
    window.scrollTo({top:0, behavior:'auto'});
  }
  navbtns.forEach(function(b){ b.addEventListener('click', function(){ goTo(b.dataset.target); }); });
  document.querySelectorAll('[data-jump]').forEach(function(a){
    a.addEventListener('click', function(e){ e.preventDefault(); goTo(a.dataset.jump); });
  });

  /* ---------------- tabs (Practice) ---------------- */
  document.querySelectorAll('.tabbtn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var group = btn.parentElement;
      group.querySelectorAll('.tabbtn').forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      var panes = document.querySelectorAll('.tabpane');
      panes.forEach(function(p){ p.classList.remove('active'); });
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  /* ---------------- accordion ---------------- */
  function makeAccordion(container, items){
    items.forEach(function(item){
      var wrap = document.createElement('div');
      wrap.className = 'accordion';
      wrap.innerHTML =
        '<button class="acc-head" type="button">'+
          '<span class="t"><span class="drugname">'+item.name+'</span><span class="dose">'+item.doseShort+'</span></span>'+
          '<span class="chev">&#9656;</span>'+
        '</button>'+
        '<div class="acc-body"><div class="acc-body-in">'+
          '<p><b>Indication:</b> '+item.indication+'</p>'+
          '<p><b>Dose:</b> '+item.dose+'</p>'+
          '<p style="margin-bottom:0;"><b>Caution:</b> '+item.caution+'</p>'+
          '<div class="mnem"><b>Mnemonic:</b> '+item.mnemonic+'</div>'+
        '</div></div>';
      var head = wrap.querySelector('.acc-head');
      var body = wrap.querySelector('.acc-body');
      head.addEventListener('click', function(){
        var open = wrap.classList.toggle('open');
        body.style.maxHeight = open ? body.scrollHeight+'px' : 0;
      });
      container.appendChild(wrap);
    });
  }

  
  makeAccordion(document.getElementById('drugAccordions'), drugs);

  /* ---------------- flashcards (generic) ---------------- */
  function buildFlashDeck(container, items){
    container.innerHTML = '';
    items.forEach(function(it){
      var card = document.createElement('div');
      card.className = 'flash';
      card.tabIndex = 0;
      card.setAttribute('role','button');
      card.setAttribute('aria-label', it.front);
      card.innerHTML =
        '<div class="flash-in">'+
          '<div class="flash-f"><div class="lbl">'+(it.label||'Mnemonic')+'</div><div class="txt">'+it.front+'</div></div>'+
          '<div class="flash-b"><div class="lbl">Payoff</div><div class="txt">'+it.back+'</div></div>'+
        '</div>';
      function flip(){ card.classList.toggle('flip'); }
      card.addEventListener('click', flip);
      card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); flip(); } });
      container.appendChild(card);
    });
  }

  
  buildFlashDeck(document.getElementById('mnemDeck'), mnemonics);
  document.getElementById('mnemShuffle').addEventListener('click', function(){
    for(var i=mnemonics.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=mnemonics[i]; mnemonics[i]=mnemonics[j]; mnemonics[j]=t; }
    buildFlashDeck(document.getElementById('mnemDeck'), mnemonics);
  });
  document.getElementById('mnemFlipAll').addEventListener('click', function(){
    document.querySelectorAll('#mnemDeck .flash').forEach(function(c){ c.classList.toggle('flip'); });
  });

  var drugFlash = drugs.map(function(d){ return {label:d.name, front:'Dose?', back:d.dose}; });
  buildFlashDeck(document.getElementById('drugDeck'), drugFlash);
  document.getElementById('drugShuffle').addEventListener('click', function(){
    for(var i=drugFlash.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=drugFlash[i]; drugFlash[i]=drugFlash[j]; drugFlash[j]=t; }
    buildFlashDeck(document.getElementById('drugDeck'), drugFlash);
  });

  /* ---------------- ECG drawing engine ---------------- */
  function gauss(t,c,w,a){ var d=(t-c)/w; return a*Math.exp(-0.5*d*d); }
  function qrsShape(t,c,width,amp){
    var w = width/2.4;
    return gauss(t,c-width*0.32,w*0.55,-0.14*amp) + gauss(t,c,w*0.62,amp) + gauss(t,c+width*0.42,w*0.55,-0.26*amp);
  }
  function seededRand(seed){ var s=seed%2147483647; if(s<=0) s+=2147483646; return function(){ s=(s*16807)%2147483647; return (s-1)/2147483646; }; }

  function genSamples(type, seed){
    var dur=6, fs=240, N=dur*fs;
    var samp=new Float32Array(N);
    var rnd = seededRand(seed||42);
    var beats=[];
    // event annotations for the ECG Lab: P-wave times, QRS times, QRS width (s)
    var evP=[], evQ=[], evQW=0.08;

    function narrowRegular(rateBpm, hasP, prS){
      var rr=60/rateBpm, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr; }
      if(hasP) evP=beats.slice();
      evQ=beats.map(function(b){ return b+(hasP?prS:0); });
      evQW=0.08;
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        beats.forEach(function(bt){
          if(hasP) v+=gauss(tt,bt,0.045,0.10);
          v+=qrsShape(tt,bt+(hasP?prS:0),0.08,1.0);
          v+=gauss(tt,bt+(hasP?prS:0)+0.20,0.07,0.22);
        });
        samp[i]=v;
      }
    }
    function wideRegular(rateBpm, amp){
      var rr=60/rateBpm, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr; }
      evQ=beats.slice(); evQW=0.18;
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.18,amp||1.15); });
        samp[i]=v;
      }
    }
    function afib(rateBpm){
      var rr=60/rateBpm, t=0.15;
      while(t<dur+1){ beats.push(t); t+= rr*(0.55+rnd()*0.9); }
      evQ=beats.slice(); evQW=0.08;
      for(var i=0;i<N;i++){ var tt=i/fs;
        var v = 0.045*Math.sin(tt*2*Math.PI*7.3)+0.03*Math.sin(tt*2*Math.PI*11.1+1)+0.02*(rnd()-0.5);
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.08,1.0); v+=gauss(tt,bt+0.20,0.07,0.18); });
        samp[i]=v;
      }
    }
    function aflutter(){
      var rr=60/150, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr*2; }
      evQ=beats.slice(); evQW=0.08;
      for(var i=0;i<N;i++){ var tt=i/fs;
        var v=0.14*Math.sin(tt*2*Math.PI*4.9 - Math.PI/2)*0.5+0.07*Math.sin(tt*2*Math.PI*4.9);
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.08,1.0); });
        samp[i]=v;
      }
    }
    function torsades(){
      var rr=60/220, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr; }
      evQ=beats.slice(); evQW=0.16;
      for(var i=0;i<N;i++){ var tt=i/fs;
        var v=0;
        beats.forEach(function(bt){ var localEnv=Math.sin(bt*2*Math.PI*0.5); v+=qrsShape(tt,bt,0.16,0.9*localEnv); });
        samp[i]=v;
      }
    }
    function vf(coarse){
      for(var i=0;i<N;i++){ var tt=i/fs;
        var a = coarse?0.55:0.18;
        samp[i]= a*Math.sin(tt*2*Math.PI*(5+rnd()*2)) + a*0.6*Math.sin(tt*2*Math.PI*(8+rnd()*3)+2) + a*0.4*(rnd()-0.5);
      }
    }
    function asystole(){
      for(var i=0;i<N;i++){ var tt=i/fs; samp[i]=0.02*Math.sin(tt*2*Math.PI*0.3)+0.01*(rnd()-0.5); }
    }
    function firstDegree(){ narrowRegular(75,true,0.26); }
    function mobitz1(){
      var t=0.15, pr=0.16, cycle=0;
      var pTimesL=[], qrsTimesL=[];
      while(t<dur+1){ pTimesL.push(t); if(cycle<3){ qrsTimesL.push(t+pr); pr+=0.07; } else { pr=0.16; } cycle=(cycle+1)%4; t+=60/88; }
      evP=pTimesL; evQ=qrsTimesL; evQW=0.08;
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        pTimesL.forEach(function(pt){ v+=gauss(tt,pt,0.045,0.10); });
        qrsTimesL.forEach(function(qt){ v+=qrsShape(tt,qt,0.08,1.0); v+=gauss(tt,qt+0.20,0.07,0.2); });
        samp[i]=v;
      }
    }
    function mobitz2(){
      var t=0.15, n=0, pTimesL=[], qrsTimesL=[];
      while(t<dur+1){ pTimesL.push(t); if(n%3!==2){ qrsTimesL.push(t+0.16); } n++; t+=60/95; }
      evP=pTimesL; evQ=qrsTimesL; evQW=0.08;
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        pTimesL.forEach(function(pt){ v+=gauss(tt,pt,0.045,0.10); });
        qrsTimesL.forEach(function(qt){ v+=qrsShape(tt,qt,0.08,1.0); v+=gauss(tt,qt+0.20,0.07,0.2); });
        samp[i]=v;
      }
    }
    function thirdDegree(){
      var pt=0.1, qt=0.3, pTimesL=[], qrsTimesL=[];
      while(pt<dur+1){ pTimesL.push(pt); pt+=60/100; }
      while(qt<dur+1){ qrsTimesL.push(qt); qt+=60/38; }
      evP=pTimesL; evQ=qrsTimesL; evQW=0.19;
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        pTimesL.forEach(function(p){ v+=gauss(tt,p,0.045,0.09); });
        qrsTimesL.forEach(function(q){ v+=qrsShape(tt,q,0.19,1.05); });
        samp[i]=v;
      }
    }

    switch(type){
      case 'sinus_normal': narrowRegular(75,true,0.16); break;
      case 'sinus_brady': narrowRegular(44,true,0.16); break;
      case 'sinus_tach': narrowRegular(128,true,0.14); break;
      case 'svt': narrowRegular(185,false,0.10); break;
      case 'afib': afib(112); break;
      case 'aflutter': aflutter(); break;
      case 'vt_mono': wideRegular(165,1.2); break;
      case 'torsades': torsades(); break;
      case 'vf_coarse': vf(true); break;
      case 'vf_fine': vf(false); break;
      case 'asystole': asystole(); break;
      case 'first_degree': firstDegree(); break;
      case 'mobitz1': mobitz1(); break;
      case 'mobitz2': mobitz2(); break;
      case 'third_degree': thirdDegree(); break;
      default: narrowRegular(75,true,0.16);
    }
    var inRange = function(t){ return t>=0 && t<=dur; };
    return {samp:samp, p:evP.filter(inRange), q:evQ.filter(inRange), qw:evQW, dur:dur};
  }

  function drawSamples(canvas, samples, color, animT){
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    var cw = canvas.clientWidth||canvas.width, ch = canvas.clientHeight||canvas.height;
    if(canvas.width !== cw*dpr) canvas.width = cw*dpr;
    if(canvas.height !== ch*dpr) canvas.height = ch*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,cw,ch);
    // grid
    ctx.strokeStyle = 'rgba(127,165,150,0.12)';
    ctx.lineWidth = 1;
    for(var gx=0; gx<cw; gx+=cw/24){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,ch); ctx.stroke(); }
    for(var gy=0; gy<ch; gy+=ch/6){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(cw,gy); ctx.stroke(); }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin='round'; ctx.lineCap='round';
    ctx.beginPath();
    var N = samples.length;
    var mid = ch*0.55, scale = ch*0.34;
    var shift = animT ? (animT % N) : 0;
    for(var x=0;x<N;x++){
      var sampIdx = Math.floor((x+shift)%N);
      var px = (x/N)*cw;
      var py = mid - samples[sampIdx]*scale;
      if(x===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.stroke();
  }

  var rhythmMeta = {
    sinus_normal:{label:'Normal sinus rhythm'}, sinus_brady:{label:'Sinus bradycardia'},
    sinus_tach:{label:'Sinus tachycardia'}, svt:{label:'Supraventricular tachycardia'},
    afib:{label:'Atrial fibrillation'}, aflutter:{label:'Atrial flutter'},
    vt_mono:{label:'Monomorphic ventricular tachycardia'}, torsades:{label:'Torsades de pointes'},
    vf_coarse:{label:'Coarse ventricular fibrillation'}, vf_fine:{label:'Fine ventricular fibrillation'},
    asystole:{label:'Asystole'}, first_degree:{label:'1st-degree AV block'},
    mobitz1:{label:'2nd-degree AV block, Mobitz I (Wenckebach)'}, mobitz2:{label:'2nd-degree AV block, Mobitz II'},
    third_degree:{label:'3rd-degree (complete) AV block'}
  };
  var rhythmKeys = Object.keys(rhythmMeta);

  /* ---------------- theme-aware canvas palette ---------------- */
  var palette = {};
  function refreshPalette(){
    var cs = getComputedStyle(document.documentElement);
    palette.accent  = cs.getPropertyValue('--accent').trim()  || '#34e08a';
    palette.accentInk = cs.getPropertyValue('--accent-ink').trim() || '#04140c';
    palette.caution = cs.getPropertyValue('--caution').trim() || '#e8b23c';
    palette.info    = cs.getPropertyValue('--info').trim()    || '#4fb6dd';
    palette.dim     = cs.getPropertyValue('--ink-dim').trim() || '#7fa596';
  }
  refreshPalette();

  // header animated strip (always normal sinus)
  var headCanvas = document.getElementById('ecgHead');
  var headSamples = genSamples('sinus_normal', 7).samp;
  var headT = 0;
  function tickHead(){
    if(!prefersReduced){ headT += 1.6; drawSamples(headCanvas, headSamples, palette.accent, headT); }
    else if(headT===0){ headT=1; drawSamples(headCanvas, headSamples, palette.accent, 0); }
    requestAnimationFrame(tickHead);
  }
  requestAnimationFrame(tickHead);

  /* ---------------- ECG Lab ----------------
     A live monitor-style sweep of the selected rhythm, plus a step-through
     of the five framework questions. Each step draws its evidence directly
     on the strip: numbered R waves, R-R calipers, P markers, PR brackets,
     QRS-width shading. Teaching text comes from data/rhythms.json. */
  var labSteps = [
    {key:'overview', tag:'SWEEP',  label:'Watch it run'},
    {key:'rate',     tag:'STEP 1', label:'Rate'},
    {key:'reg',      tag:'STEP 2', label:'Regularity'},
    {key:'p',        tag:'STEP 3', label:'P waves'},
    {key:'pr',       tag:'STEP 4', label:'PR interval'},
    {key:'qrs',      tag:'STEP 5', label:'QRS width'}
  ];
  var labState = {type:'sinus_normal', gen:null, step:0, playing:!prefersReduced, t0:performance.now()};
  var labCanvas = document.getElementById('labCanvas');
  var labChips = document.getElementById('labChips');
  var labStepper = document.getElementById('labStepper');

  rhythmKeys.forEach(function(type){
    var c = document.createElement('button');
    c.type='button';
    c.className = 'chip' + (rhythmsInfo[type] && rhythmsInfo[type].group==='AV block' ? ' blockgroup' : '');
    c.textContent = rhythmMeta[type].label;
    c.dataset.type = type;
    c.addEventListener('click', function(){ setLabRhythm(type); });
    labChips.appendChild(c);
  });

  labSteps.forEach(function(s, i){
    var b = document.createElement('button');
    b.type='button'; b.className='stepbtn';
    b.innerHTML = '<span class="n">'+s.tag+'</span>'+s.label;
    b.addEventListener('click', function(){ setLabStep(i); });
    labStepper.appendChild(b);
  });

  function setLabRhythm(type){
    labState.type = type;
    labState.gen = genSamples(type, 42);
    labState.t0 = performance.now();
    Array.prototype.forEach.call(labChips.children, function(c){ c.classList.toggle('active', c.dataset.type===type); });
    var info = rhythmsInfo[type];
    document.getElementById('labGroup').textContent = info.group;
    document.getElementById('labHallmark').textContent = info.hallmark;
    document.getElementById('labMnem').textContent = info.mnemonic;
    document.getElementById('labConfuse').textContent = info.confuse;
    document.getElementById('labAction').textContent = info.action;
    setLabStep(labState.step);
  }

  function setLabStep(i){
    labState.step = i;
    Array.prototype.forEach.call(labStepper.children, function(b, bi){ b.classList.toggle('active', bi===i); });
    var info = rhythmsInfo[labState.type];
    var gen = labState.gen;
    var ans = document.getElementById('labAnswer');
    var key = labSteps[i].key;
    var hint = ' <span style="color:var(--ink-dim);font-size:.85em;">';
    if(key==='overview'){
      ans.innerHTML = '<b>'+rhythmMeta[labState.type].label+'</b> — '+info.group+'.'+hint+'Watch a couple of full sweeps to get the gestalt, then walk steps 1–5. Each step marks its evidence on the strip.</span>';
    } else if(key==='rate'){
      var counted = gen.q.length ? gen.q.length : 0;
      ans.innerHTML = '<b>Rate:</b> '+info.rate+(counted ? hint+'This is a 6-second strip — the numbered R waves count '+counted+', so '+counted+' × 10 = '+(counted*10)+'/min.</span>' : '');
    } else if(key==='reg'){
      ans.innerHTML = '<b>Regularity:</b> '+info.regular+(gen.q.length>1 ? hint+'Calipers between R waves: green = equal spacing, amber = unequal.</span>' : '');
    } else if(key==='p'){
      ans.innerHTML = '<b>P waves:</b> '+info.p;
    } else if(key==='pr'){
      ans.innerHTML = '<b>PR interval:</b> '+info.pr+(gen.p.length&&gen.q.length ? hint+'Brackets under the baseline join each P to its QRS: green = constant PR, amber = changing or unrelated.</span>' : '');
    } else {
      ans.innerHTML = '<b>QRS width:</b> '+info.qrs+(gen.q.length ? hint+'Shaded bands sit over each QRS: green = narrow (&lt;0.12 s), amber = wide.</span>' : '');
    }
  }

  function drawLab(){
    if(!labCanvas || !labState.gen) return;
    var ctx = labCanvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio||1, 2);
    var cw = labCanvas.clientWidth||900, ch = labCanvas.clientHeight||190;
    if(labCanvas.width!==cw*dpr) labCanvas.width=cw*dpr;
    if(labCanvas.height!==ch*dpr) labCanvas.height=ch*dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,cw,ch);
    var gen = labState.gen, samples = gen.samp, N = samples.length, dur = gen.dur;
    var mid = ch*0.58, scale = ch*0.30;
    function tx(t){ return (t/dur)*cw; }
    function ty(t){ var k=Math.max(0,Math.min(N-1,Math.round(t/dur*N))); return mid - samples[k]*scale; }

    // grid — big boxes every 0.2 s
    ctx.strokeStyle='rgba(127,165,150,0.13)'; ctx.lineWidth=1;
    for(var gx=0; gx<=cw; gx+=cw/(dur*5)){ ctx.beginPath(); ctx.moveTo(gx,0); ctx.lineTo(gx,ch); ctx.stroke(); }
    for(var gy=0; gy<ch; gy+=ch/6){ ctx.beginPath(); ctx.moveTo(0,gy); ctx.lineTo(cw,gy); ctx.stroke(); }

    // trace with monitor-style sweep: bright behind the head, dim ahead, gap at the head
    function strokeRange(x0,x1,alpha){
      if(x1<=x0) return;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0,0,x1-x0,ch); ctx.clip();
      ctx.globalAlpha=alpha;
      ctx.strokeStyle=palette.accent; ctx.lineWidth=1.9; ctx.lineJoin='round'; ctx.lineCap='round';
      ctx.beginPath();
      for(var x=0;x<=cw;x++){
        var k=Math.min(N-1,Math.floor(x/cw*N));
        var py=mid - samples[k]*scale;
        if(x===0) ctx.moveTo(x,py); else ctx.lineTo(x,py);
      }
      ctx.stroke();
      ctx.restore();
    }
    var sweeping = labState.playing && !prefersReduced;
    if(sweeping){
      var elapsed=(performance.now()-labState.t0)/1000;
      var sweepX=((elapsed/dur)%1)*cw;
      var gap=cw*0.055;
      strokeRange(0,sweepX,1);
      strokeRange(sweepX+gap,cw,0.30);
      ctx.fillStyle=palette.accent;
      ctx.beginPath(); ctx.arc(sweepX, mid - samples[Math.min(N-1,Math.floor(sweepX/cw*N))]*scale, 3, 0, 7); ctx.fill();
    } else {
      strokeRange(0,cw,1);
    }

    // annotations
    var key = labSteps[labState.step].key;
    ctx.font='700 11px ui-monospace, Menlo, monospace';
    ctx.textAlign='center';
    function banner(msg){
      ctx.font='700 12px -apple-system, sans-serif';
      ctx.fillStyle=palette.caution;
      ctx.fillText(msg, cw/2, 20);
      ctx.font='700 11px ui-monospace, Menlo, monospace';
    }
    if(key==='rate'){
      if(gen.q.length){
        gen.q.forEach(function(t,i){
          var x=tx(t), y=Math.max(13, ty(t)-16);
          ctx.fillStyle=palette.accent;
          ctx.beginPath(); ctx.arc(x,y,9,0,7); ctx.fill();
          ctx.fillStyle=palette.accentInk;
          ctx.fillText(String(i+1), x, y+3.5);
        });
      } else { banner('No organized R waves to count — no rate exists here'); }
    }
    if(key==='reg'){
      if(gen.q.length>1){
        var ints=[]; for(var i=1;i<gen.q.length;i++) ints.push(gen.q[i]-gen.q[i-1]);
        var med=ints.slice().sort(function(a,b){return a-b;})[Math.floor(ints.length/2)];
        var y=16;
        for(var i=1;i<gen.q.length;i++){
          var x0=tx(gen.q[i-1]), x1=tx(gen.q[i]);
          var even=Math.abs(ints[i-1]-med)/med < 0.08;
          ctx.strokeStyle= even ? palette.accent : palette.caution;
          ctx.lineWidth=1.5;
          ctx.beginPath();
          ctx.moveTo(x0,y); ctx.lineTo(x1,y);
          ctx.moveTo(x0,y-4); ctx.lineTo(x0,y+4);
          ctx.moveTo(x1,y-4); ctx.lineTo(x1,y+4);
          ctx.stroke();
        }
      } else { banner('No beats to compare — chaos or silence has no regularity'); }
    }
    if(key==='p'){
      if(gen.p.length){
        gen.p.forEach(function(t){
          var x=tx(t), y=ty(t)-9;
          ctx.fillStyle=palette.info;
          ctx.beginPath(); ctx.arc(x,y,3.2,0,7); ctx.fill();
          ctx.fillText('P', x, y-8);
        });
        ctx.fillStyle=palette.info;
      } else if(labState.type==='aflutter'){ banner('No true P waves — the whole baseline is continuous sawtooth flutter'); }
      else { banner('No organized P waves on this rhythm'); }
    }
    if(key==='pr'){
      if(gen.p.length && gen.q.length){
        var pairs=[], prVals=[];
        gen.q.forEach(function(qt){
          var best=null;
          gen.p.forEach(function(pt){ if(pt<qt && qt-pt<0.45 && (best===null||pt>best)) best=pt; });
          if(best!==null){ pairs.push([best,qt]); prVals.push(qt-best); }
        });
        if(pairs.length){
          var consistent=true;
          if(prVals.length>1){
            var mn=Math.min.apply(null,prVals), mx=Math.max.apply(null,prVals);
            consistent=(mx-mn)<0.03;
          }
          var yb=ch-14;
          ctx.strokeStyle = consistent ? palette.accent : palette.caution;
          ctx.lineWidth=1.5;
          pairs.forEach(function(pr){
            var x0=tx(pr[0]), x1=tx(pr[1]);
            ctx.beginPath();
            ctx.moveTo(x0,yb-5); ctx.lineTo(x0,yb); ctx.lineTo(x1,yb); ctx.lineTo(x1,yb-5);
            ctx.stroke();
          });
          if(!consistent) banner(labState.type==='third_degree' ? 'No two PR brackets match — Ps and QRSs are strangers' : 'PR is changing — watch it stretch');
        } else { banner('No P pairs with any QRS'); }
      } else { banner('No measurable PR — '+(gen.p.length ? 'no QRS to pair with' : 'no P waves exist here')); }
    }
    if(key==='qrs'){
      if(gen.q.length){
        var wide = gen.qw>=0.12;
        ctx.fillStyle = wide ? 'rgba(232,178,60,0.20)' : 'rgba(52,224,138,0.15)';
        gen.q.forEach(function(t){
          var x=tx(t-gen.qw/2), w=Math.max(6,(gen.qw/dur)*cw);
          ctx.fillRect(x,6,w,ch-12);
        });
      } else { banner('No QRS complexes at all — that is the finding'); }
    }
  }

  function tickLab(){
    if(document.getElementById('sec-rhythms').classList.contains('active')){ drawLab(); }
    requestAnimationFrame(tickLab);
  }
  requestAnimationFrame(tickLab);

  var labPlayBtn = document.getElementById('labPlay');
  if(prefersReduced){ labPlayBtn.style.display='none'; }
  labPlayBtn.addEventListener('click', function(){
    labState.playing = !labState.playing;
    if(labState.playing){ labState.t0 = performance.now(); }
    labPlayBtn.textContent = labState.playing ? 'Pause sweep' : 'Resume sweep';
  });
  document.getElementById('labDrill').addEventListener('click', function(){
    goTo('sec-practice');
    document.querySelector('.tabbtn[data-tab="tab-rhythm"]').click();
    nextRhythm();
  });
  setLabRhythm('sinus_normal');

  /* ---------------- rhythm drill ---------------- */
  var rhythmScore = {right:0, total:0};
  var curRhythmType = null;
  function nextRhythm(){
    curRhythmType = rhythmKeys[Math.floor(Math.random()*rhythmKeys.length)];
    var samples = genSamples(curRhythmType, Math.floor(Math.random()*9999)).samp;
    var canvas = document.getElementById('rhythmCanvas');
    drawSamples(canvas, samples, palette.accent, 0);
    var choices = [rhythmMeta[curRhythmType].label];
    var pool = rhythmKeys.filter(function(k){ return k!==curRhythmType; });
    while(choices.length<4 && pool.length){
      var pick = pool.splice(Math.floor(Math.random()*pool.length),1)[0];
      choices.push(rhythmMeta[pick].label);
    }
    for(var i=choices.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=choices[i]; choices[i]=choices[j]; choices[j]=t; }
    var box = document.getElementById('rhythmChoices');
    box.innerHTML='';
    var fb = document.getElementById('rhythmFeedback');
    fb.className='feedback'; fb.textContent='';
    choices.forEach(function(label){
      var b = document.createElement('button');
      b.className='choice'; b.type='button'; b.textContent=label;
      b.addEventListener('click', function(){
        var correctLabel = rhythmMeta[curRhythmType].label;
        Array.prototype.forEach.call(box.children, function(c){ c.disabled=true; if(c.textContent===correctLabel) c.classList.add('correct'); });
        rhythmScore.total++;
        if(label===correctLabel){ rhythmScore.right++; b.classList.add('correct'); fb.className='feedback show right'; fb.textContent='Correct — '+correctLabel+'.'; }
        else { b.classList.add('wrong'); fb.className='feedback show wrong'; fb.textContent='Not quite — that was '+correctLabel+'.'; }
        document.getElementById('rhythmScore').textContent = rhythmScore.right+' / '+rhythmScore.total;
      });
      box.appendChild(b);
    });
  }
  document.getElementById('rhythmNext').addEventListener('click', nextRhythm);
  nextRhythm();

  /* ---------------- quiz ---------------- */
  

  /* ---------------- no-repeat sampling deck ----------------
     A shuffled "bag" of question ids is kept in localStorage per category.
     Draws come off the front of the bag; the bag is only reshuffled with a
     fresh full pool once it runs low, so every question in a category is
     served once before any question repeats — across both Quiz and Mock
     Exam, and across page reloads. */
  function shuffleArr(arr){
    for(var i=arr.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=arr[i]; arr[i]=arr[j]; arr[j]=t; }
    return arr;
  }
  function getPoolIds(cat, diff){
    var ids=[];
    questionBank.forEach(function(q,i){
      var okCat = (cat==='all' || q.cat===cat);
      var okDiff = (!diff || diff==='all' || (q.difficulty||'medium')===diff);
      if(okCat && okDiff) ids.push(i);
    });
    return ids;
  }
  function drawFromDeck(cat, diff, n){
    var pool = getPoolIds(cat, diff);
    if(!pool.length) return [];
    var key = 'acls_deck_'+cat+'_'+(diff||'all');
    var deck;
    try{ deck = JSON.parse(localStorage.getItem(key)||'[]'); }catch(e){ deck=[]; }
    deck = deck.filter(function(id){ return pool.indexOf(id)!==-1; });
    var guard=0;
    while(deck.length < n && guard<50){
      var fresh = shuffleArr(pool.slice());
      if(deck.length && fresh.length>1 && fresh[0]===deck[deck.length-1]){
        var tmp=fresh[0]; fresh[0]=fresh[1]; fresh[1]=tmp;
      }
      deck = deck.concat(fresh);
      guard++;
    }
    var drawCount = Math.min(n, deck.length);
    var drawn = deck.slice(0, drawCount);
    var rest = deck.slice(drawCount);
    localStorage.setItem(key, JSON.stringify(rest));
    return drawn.map(function(id){
      var q = questionBank[id];
      return {id:id, cat:q.cat, q:q.q, choices:q.choices, a:q.a, ex:q.ex, difficulty:q.difficulty||'medium'};
    });
  }

  function difficultyPill(diff){
    var d = diff||'medium';
    var label = d.charAt(0).toUpperCase()+d.slice(1);
    var cls = d==='easy' ? 'ok' : (d==='hard' ? 'crit' : 'caut');
    return '<span class="pill '+cls+'" style="margin-left:8px;vertical-align:1px;">'+label+'</span>';
  }

  var quizState = {list:[], idx:0, score:0, total:0};
  function startQuiz(){
    var cat = document.getElementById('quizCategory').value;
    var diff = document.getElementById('quizDifficulty').value;
    var pool = getPoolIds(cat, diff);
    var list = drawFromDeck(cat, diff, pool.length);
    quizState = {list:list, idx:0, score:0, total:0};
    document.getElementById('quizScore').textContent = 'Score: 0 / 0';
    renderQuizQ();
  }
  function renderQuizQ(){
    var area = document.getElementById('quizArea');
    if(quizState.idx >= quizState.list.length){
      var best = Math.max(quizState.score, parseInt(localStorage.getItem('acls_quiz_best')||'0',10));
      if(quizState.list.length){ localStorage.setItem('acls_quiz_best', String(best)); }
      area.innerHTML = '<div class="card spine-accent"><h3>Done — '+quizState.score+' / '+quizState.list.length+'</h3>'+
        '<p style="margin-bottom:0;">Best raw score this browser: '+best+'. Restart to try a different category or shuffle again.</p></div>';
      return;
    }
    var q = quizState.list[quizState.idx];
    area.innerHTML = '<div class="card"><h3 style="margin-bottom:12px;">'+ (quizState.idx+1) +'. '+q.q+difficultyPill(q.difficulty)+'</h3>'+
      '<div class="choicegrid" id="quizChoices"></div>'+
      '<div class="feedback" id="quizFeedback"></div>'+
      '<div class="deck-controls" style="margin-top:14px;"><button class="btn" id="quizNext" type="button" disabled>Next question</button></div>'+
      '</div>';
    var box = document.getElementById('quizChoices');
    q.choices.forEach(function(choice, ci){
      var b = document.createElement('button');
      b.className='choice'; b.type='button'; b.textContent=choice;
      b.addEventListener('click', function(){
        Array.prototype.forEach.call(box.children, function(c){ c.disabled=true; });
        var fb = document.getElementById('quizFeedback');
        quizState.total++;
        if(ci===q.a){ quizState.score++; b.classList.add('correct'); fb.className='feedback show right'; fb.textContent='Correct. '+q.ex; }
        else { b.classList.add('wrong'); box.children[q.a].classList.add('correct'); fb.className='feedback show wrong'; fb.textContent='Not quite. '+q.ex; }
        document.getElementById('quizScore').textContent = 'Score: '+quizState.score+' / '+quizState.total;
        document.getElementById('quizNext').disabled=false;
      });
      box.appendChild(b);
    });
    document.getElementById('quizNext').addEventListener('click', function(){ quizState.idx++; renderQuizQ(); });
  }
  document.getElementById('quizStart').addEventListener('click', startQuiz);

  /* ---------------- mock exam ---------------- */
  document.getElementById('bankTotal').textContent = questionBank.length;
  var mockState = {list:[], answers:{}, submitted:false, startTime:0, endTime:0};

  function startMock(){
    var cat = document.getElementById('mockCategory').value;
    var diff = document.getElementById('mockDifficulty').value;
    var lenSel = document.getElementById('mockLength').value;
    var pool = getPoolIds(cat, diff);
    var n = lenSel==='all' ? pool.length : Math.min(parseInt(lenSel,10), pool.length);
    mockState = {list:drawFromDeck(cat, diff, n), answers:{}, submitted:false, startTime:Date.now(), endTime:0};
    renderMock();
  }

  function renderMock(){
    var area = document.getElementById('mockArea');
    var html = '';
    if(mockState.submitted){
      var correct=0;
      mockState.list.forEach(function(q,i){ if(mockState.answers[i]===q.a) correct++; });
      var total = mockState.list.length;
      var pct = total ? Math.round(100*correct/total) : 0;
      var pass = pct>=84;
      var elapsedSec = Math.round((mockState.endTime-mockState.startTime)/1000);
      var mins=Math.floor(elapsedSec/60), secs=elapsedSec%60;
      html += '<div class="card '+(pass?'spine-accent':'spine-critical')+'">'+
        '<h3>'+correct+' / '+total+' correct — '+pct+'%'+(pass?' — pass':' — below pass line')+'</h3>'+
        '<p style="margin-bottom:4px;">Time: '+mins+'m '+(secs<10?'0':'')+secs+'s. Reference pass line: 84% (typical AHA renewal exam threshold — this tool issues no certification).</p>'+
        '<div class="deck-controls" style="margin-top:10px;"><button class="btn" id="mockRetake" type="button">New mock exam</button></div>'+
        '</div>';
    }
    mockState.list.forEach(function(q,i){
      var chosen = mockState.answers[i];
      html += '<div class="card"><h3 style="margin-bottom:12px;">'+(i+1)+'. '+q.q+difficultyPill(q.difficulty)+'</h3><div class="choicegrid" data-qi="'+i+'">';
      q.choices.forEach(function(choice, ci){
        var cls = 'choice';
        if(mockState.submitted){
          if(ci===q.a) cls += ' correct';
          else if(ci===chosen) cls += ' wrong';
        } else if(chosen===ci){ cls += ' selected'; }
        html += '<button type="button" class="'+cls+'" data-ci="'+ci+'"'+(mockState.submitted?' disabled':'')+'>'+choice+'</button>';
      });
      html += '</div>';
      if(mockState.submitted){
        html += '<div class="feedback show '+(chosen===q.a?'right':'wrong')+'">'+(chosen===undefined?'Not answered. ':'')+q.ex+'</div>';
      }
      html += '</div>';
    });
    if(!mockState.submitted && mockState.list.length){
      html += '<div class="deck-controls"><span class="scoreline" id="mockProgress"></span><button class="btn" id="mockSubmit" type="button">Submit exam</button></div>';
    }
    area.innerHTML = html;
    if(!mockState.submitted){
      area.querySelectorAll('.choicegrid').forEach(function(grid){
        var qi = parseInt(grid.dataset.qi,10);
        Array.prototype.forEach.call(grid.children, function(btn){
          btn.addEventListener('click', function(){
            mockState.answers[qi] = parseInt(btn.dataset.ci,10);
            renderMock();
          });
        });
      });
      var prog = document.getElementById('mockProgress');
      if(prog){ prog.textContent = Object.keys(mockState.answers).length+' / '+mockState.list.length+' answered'; }
      var submitBtn = document.getElementById('mockSubmit');
      if(submitBtn){ submitBtn.addEventListener('click', function(){
        mockState.submitted = true; mockState.endTime = Date.now();
        renderMock();
      }); }
    } else {
      var retakeBtn = document.getElementById('mockRetake');
      if(retakeBtn){ retakeBtn.addEventListener('click', startMock); }
    }
  }
  document.getElementById('mockStart').addEventListener('click', startMock);

  /* redraw canvases on theme change (grid/color) */
  var mo = new MutationObserver(function(){
    refreshPalette();
    if(curRhythmType){ var c=document.getElementById('rhythmCanvas'); drawSamples(c, genSamples(curRhythmType, 1).samp, palette.accent, 0); }
  });
  mo.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

  }
})();
