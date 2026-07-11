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
    fetch('data/mnemonics.json').then(function(r){ if(!r.ok) throw new Error('mnemonics.json: '+r.status); return r.json(); })
  ]).then(function(res){
    boot(res[0], res[1], res[2]);
  }).catch(showLoadError);

  function boot(questionBank, drugs, mnemonics){
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
    function idx(t){ return Math.max(0,Math.min(N-1,Math.round(t*fs))); }
    function addAt(t, fn){ if(t<0||t>dur) return; fn(); }
    var rate, beats=[], pTimes=[];

    function narrowRegular(rateBpm, hasP, prS){
      var rr=60/rateBpm, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr; }
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
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.18,amp||1.15); });
        samp[i]=v;
      }
    }
    function afib(rateBpm){
      var rr=60/rateBpm, t=0.15;
      while(t<dur+1){ beats.push(t); t+= rr*(0.55+rnd()*0.9); }
      for(var i=0;i<N;i++){ var tt=i/fs;
        var v = 0.045*Math.sin(tt*2*Math.PI*7.3)+0.03*Math.sin(tt*2*Math.PI*11.1+1)+0.02*(rnd()-0.5);
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.08,1.0); v+=gauss(tt,bt+0.20,0.07,0.18); });
        samp[i]=v;
      }
    }
    function aflutter(){
      var rr=60/150, t=0.15;
      while(t<dur+1){ beats.push(t); t+=rr*2; }
      for(var i=0;i<N;i++){ var tt=i/fs;
        var v=0.14*Math.sin(tt*2*Math.PI*4.9 - Math.PI/2)*0.5+0.07*Math.sin(tt*2*Math.PI*4.9);
        beats.forEach(function(bt){ v+=qrsShape(tt,bt,0.08,1.0); });
        samp[i]=v;
      }
    }
    function torsades(){
      var rr=60/220, t=0.15, env=0;
      while(t<dur+1){ beats.push(t); t+=rr; }
      for(var i=0;i<N;i++){ var tt=i/fs;
        var envelope=Math.sin(tt*2*Math.PI*0.5);
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
      for(var i=0;i<N;i++){ var tt=i/fs; var v=0;
        pTimesL.forEach(function(pt){ v+=gauss(tt,pt,0.045,0.10); });
        qrsTimesL.forEach(function(qt){ v+=qrsShape(tt,qt,0.08,1.0); v+=gauss(tt,qt+0.20,0.07,0.2); });
        samp[i]=v;
      }
    }
    function mobitz2(){
      var t=0.15, n=0, pTimesL=[], qrsTimesL=[];
      while(t<dur+1){ pTimesL.push(t); if(n%3!==2){ qrsTimesL.push(t+0.16); } n++; t+=60/95; }
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
    return samp;
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

  // header animated strip (always normal sinus)
  var headCanvas = document.getElementById('ecgHead');
  var headSamples = genSamples('sinus_normal', 7);
  var headT = 0;
  function tickHead(){
    if(!prefersReduced){ headT += 1.6; drawSamples(headCanvas, headSamples, getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#34e08a', headT); }
    else if(headT===0){ headT=1; drawSamples(headCanvas, headSamples, '#34e08a', 0); }
    requestAnimationFrame(tickHead);
  }
  requestAnimationFrame(tickHead);

  // rhythm gallery on Rhythm Recognition page
  var galleryTypes = ['sinus_normal','sinus_tach','afib','vt_mono','vf_coarse','third_degree'];
  var gallery = document.getElementById('rhythmGallery');
  galleryTypes.forEach(function(type){
    var box = document.createElement('div');
    box.className = 'flash';
    box.style.cursor='pointer';
    box.innerHTML = '<div class="flash-f" style="position:static; height:100%;"><div class="lbl">Tap to drill</div>'+
      '<canvas width="300" height="90" style="width:100%;height:80px;background:#04120c;border-radius:6px;margin:6px 0;"></canvas>'+
      '<div style="font:700 .82rem -apple-system,sans-serif;">'+rhythmMeta[type].label+'</div></div>';
    box.addEventListener('click', function(){ goTo('sec-practice'); document.querySelector('.tabbtn[data-tab="tab-rhythm"]').click(); nextRhythm(); });
    gallery.appendChild(box);
    var cv = box.querySelector('canvas');
    setTimeout(function(){ drawSamples(cv, genSamples(type, 99), '#34e08a', 0); }, 10);
  });

  /* ---------------- rhythm drill ---------------- */
  var rhythmScore = {right:0, total:0};
  var curRhythmType = null;
  function nextRhythm(){
    curRhythmType = rhythmKeys[Math.floor(Math.random()*rhythmKeys.length)];
    var samples = genSamples(curRhythmType, Math.floor(Math.random()*9999));
    var canvas = document.getElementById('rhythmCanvas');
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#34e08a';
    drawSamples(canvas, samples, accent, 0);
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
  function getPoolIds(cat){
    var ids=[];
    questionBank.forEach(function(q,i){ if(cat==='all' || q.cat===cat) ids.push(i); });
    return ids;
  }
  function drawFromDeck(cat, n){
    var pool = getPoolIds(cat);
    if(!pool.length) return [];
    var key = 'acls_deck_'+cat;
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
      return {id:id, cat:q.cat, q:q.q, choices:q.choices, a:q.a, ex:q.ex};
    });
  }

  var quizState = {list:[], idx:0, score:0, total:0};
  function startQuiz(){
    var cat = document.getElementById('quizCategory').value;
    var pool = getPoolIds(cat);
    var list = drawFromDeck(cat, pool.length);
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
    area.innerHTML = '<div class="card"><h3 style="margin-bottom:12px;">'+ (quizState.idx+1) +'. '+q.q+'</h3>'+
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
    var lenSel = document.getElementById('mockLength').value;
    var pool = getPoolIds(cat);
    var n = lenSel==='all' ? pool.length : Math.min(parseInt(lenSel,10), pool.length);
    mockState = {list:drawFromDeck(cat, n), answers:{}, submitted:false, startTime:Date.now(), endTime:0};
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
      html += '<div class="card"><h3 style="margin-bottom:12px;">'+(i+1)+'. '+q.q+'</h3><div class="choicegrid" data-qi="'+i+'">';
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
    var accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#34e08a';
    if(curRhythmType){ var c=document.getElementById('rhythmCanvas'); drawSamples(c, genSamples(curRhythmType, 1), accent, 0); }
  });
  mo.observe(document.documentElement, {attributes:true, attributeFilter:['data-theme']});

  }
})();
