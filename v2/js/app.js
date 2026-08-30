/* ============================================================
   语界 v2 · 应用逻辑 (阶段 1: 不背单词式词卡 + SRS + 基础四Tab骨架)
   ============================================================ */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const dateKey = (offset=0) => { const d=new Date(); d.setDate(d.getDate()+offset); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const today = () => dateKey(0);
const GREET = h => h<5?'夜深了':h<9?'早上好':h<12?'上午好':h<14?'中午好':h<18?'下午好':h<22?'晚上好':'夜深了';
const AVATARS = ['🐻','🐱','🦊','🐼','🐰','🐸','🦁','🐯','🐨','🦉'];
const COLORS  = ['#2E6BFF','#00B578','#FA5151','#FF8A00','#8A6BE0','#00A8C6','#C13A54','#B8860B'];
const colorOf = s => COLORS[[...s].reduce((x,c)=>x+c.charCodeAt(0),0)%COLORS.length];

/* 词义归一化: 兼容英语富格式与日韩简格式 */
function normWord(lessonId, raw){
  if(Array.isArray(raw[4] && raw[4][0])){
    return { w:raw[0], ph:raw[1], def:raw[2], root:raw[3],
      ex:(raw[4]||[]).map(e=>({t:e[0], m:e[1], tag:e[2]||''})) };
  }
  return { w:raw[0], ph:raw[1], def:raw[2], root:'', ex:[{t:raw[3], m:raw[4], tag:''}] };
}
function lessonWords(lessonId){
  const c = CONTENT[lessonId];
  return c && c.words ? c.words.map(w => normWord(lessonId, w)) : [];
}

/* ---------- 本地数据库 (阶段1: 单用户,简化) ---------- */
const LS_KEY = 'yujie_v3_stage1';
let DB = (() => {
  try{ const d = JSON.parse(localStorage.getItem(LS_KEY)); if(d && d.users) return d; }catch(e){}
  return { users:[], session:null };
})();
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(DB));
let U = null;         // 当前用户
let courseLangTab = 'en';

function seedUser(){
  const u = {
    id:'u_demo', name:'语界学习者', avatar:'🐻', color:COLORS[0],
    createdAt:Date.now(), lang:'en', level:'cet4', dailyGoal:20, ttsRate:1,
    xp:0, streak:{count:0,last:'',days:{}}, log:{},
    stats:{decks:0,words:0,reviews:0,grammar:0,listen:0,speak:0},
    srs:{}, lessons:{}, badges:[],
  };
  DB.users.push(u); DB.session = u.id; save(); return u;
}
U = DB.users.find(u => u.id === DB.session) || seedUser();

const levelOf   = (l,lv) => LANGUAGES[l].levels.find(x=>x.id===lv);
const userLevel = () => levelOf(U.lang, U.level);

/* SRS 间隔(天) (定义从 data.js 取兜底) */
const SRS_INTERVALS = (typeof window.SRS_INTERVALS !== 'undefined') ? window.SRS_INTERVALS : [1,2,4,7,15,30];

/* ---------- Toast ---------- */
function toast(msg, icon='✨'){
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${icon}</span><span>${esc(msg)}</span>`;
  $('#toasts').appendChild(t);
  setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),320); }, 2400);
}
function confetti(){
  const colors=['#2E6BFF','#FF8A00','#00B578','#FA5151','#8A6BE0'];
  for(let i=0;i<60;i++){
    const c=document.createElement('div');
    c.className='confetti';
    c.style.cssText=`left:${Math.random()*100}vw;background:${colors[i%5]};animation-delay:${Math.random()*.6}s;animation-duration:${2+Math.random()*1.4}s;transform:rotate(${Math.random()*360}deg)`;
    document.body.appendChild(c);
    setTimeout(()=>c.remove(), 4000);
  }
}

/* ---------- TTS ---------- */
function speak(text, langId, rate){
  rate = rate || U.ttsRate || 1;
  try{
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGUAGES[langId].ttsLang; u.rate = rate;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }catch(e){}
}

/* ---------- 导航状态 ---------- */
let tab = 'home';
let courseView = null;

function go(t){ tab = t; courseView = null; render(); }
function openCourse(l, lv){ courseView = {lang:l, level:lv}; render(); }
function switchLangTab(l){ courseLangTab = l; render(); }
function backToLevels(){ courseView = null; render(); }
function levelBg(l){ return {en:'#EAF0FF', ja:'#FDEDF0', ko:'#E3F6EE'}[l] || '#EAF0FF'; }
function lessonBg(t){
  return {vocab:'#EAF0FF', grammar:'#FFF2E3', listening:'#E3F6EE', speaking:'#FDEDF0'}[t] || '#EAF0FF';
}

/* ---------- 渲染入口 ---------- */
function render(){
  $('#tabbar').hidden = false;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const app = $('#app');
  if(courseView){ app.innerHTML = renderCourseDetail(); }
  else if(tab === 'home')    app.innerHTML = renderHome();
  else if(tab === 'courses') app.innerHTML = renderCourses();
  else if(tab === 'review')  app.innerHTML = renderReview();
  else if(tab === 'me')      app.innerHTML = renderMe();
  app.scrollTop = 0;
  bindCommon();
}
function bindCommon(){
  $$('.tab').forEach(b => b.onclick = () => go(b.dataset.tab));
}

/* ---------- 首页 ---------- */
function todayLog(){ return U.log[today()] || {words:0,review:0,xp:0}; }
function renderHome(){
  const h = new Date().getHours();
  const lg = todayLog();
  const done = Math.min(lg.words + lg.review, U.dailyGoal);
  const pct = Math.round(done / U.dailyGoal * 100);
  const due = dueWords().length;
  const lv = userLevel();
  const QUOTES = (typeof DAILY_QUOTES !== 'undefined') ? DAILY_QUOTES :
    [{t:'The limits of my language mean the limits of my world.', m:'语言的边界就是我世界的边界。——维特根斯坦'}];
  const quote = QUOTES[new Date().getDate() % QUOTES.length];
  let next = null;
  if(due > 0) next = {type:'review', title:'开始复习', desc:`${due} 个单词到期`};
  else {
    next = nextLesson() || {type:'done', title:'本级别已全部完成', desc:'太棒了,去「我的」看看成就'};
  }
  const cont = next.type==='done' ? `
    <div class="continue-card" onclick="go('courses')">
      <div class="cc-info">
        <span class="cc-tag">🎉 恭喜</span>
        <div class="cc-title">${esc(lv.name)} 已全部完成</div>
        <div class="cc-desc">探索其它词书继续学习</div>
      </div>
      <div class="cc-go"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
    </div>` : `
    <div class="continue-card" onclick="${next.type==='review' ? `go('review')` : `startLesson('${next.id}')`}">
      <div class="cc-info">
        <span class="cc-tag">${next.type==='review' ? '🔄 复习' : '📚 ' + esc(TYPE_META[next.meta.type].name)}</span>
        <div class="cc-title">${esc(next.title)}</div>
        <div class="cc-desc">${esc(next.desc)}</div>
      </div>
      <div class="cc-go"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
    </div>`;
  const R = 31, C = 2*Math.PI*R;
  return `
  <div class="page">
    <div class="appbar">
      <div>
        <div class="title">${GREET(h)}, ${esc(U.name)}</div>
        <div class="sub">${LANGUAGES[U.lang].flag} ${esc(lv.name)} · 连续学习 ${U.streak.count} 天</div>
      </div>
      <div class="hero-ring">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle cx="39" cy="39" r="${R}" fill="none" stroke="#E8EAF0" stroke-width="8"/>
          <circle cx="39" cy="39" r="${R}" fill="none" stroke="#2E6BFF" stroke-width="8"
            stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-done/U.dailyGoal)}"
            transform="rotate(-90 39 39)" style="transition:stroke-dashoffset .6s"/>
        </svg>
        <div class="num"><b>${done}</b><i>/${U.dailyGoal}</i></div>
      </div>
    </div>
    ${cont}
    <div class="stat-grid">
      <div class="stat-cell"><b>${U.stats.words}</b><span>已学单词</span></div>
      <div class="stat-cell"><b>${srsStat().mastered}</b><span>已掌握</span></div>
      <div class="stat-cell"><b>${U.xp}</b><span>总 XP</span></div>
    </div>
    <div class="quote-card">
      <div class="q-ic">💬</div>
      <div>
        <div class="q-t">${esc(quote.t)}</div>
        <div class="q-m">${esc(quote.m)}</div>
      </div>
    </div>
  </div>`;
}

/* ---------- 词书 ---------- */
function renderCourses(){
  const lang = courseLangTab;
  const levels = LANGUAGES[lang].levels;
  return `
  <div class="page">
    <div class="appbar"><div>
      <div class="title">词书</div>
      <div class="sub">选择你的学习材料</div>
    </div></div>
  </div>
  <div class="lang-pills">
    ${Object.values(LANGUAGES).map(l=>`
      <button class="pill ${lang===l.id?'active':''}" onclick="switchLangTab('${l.id}')">
        <span class="flag">${l.flag}</span>${l.name}
      </button>`).join('')}
  </div>
  <div class="page" style="padding-top:0">
    ${levels.map(lv=>{
      const p = levelProgress(lang, lv.id);
      return `
      <div class="level-card" onclick="openCourse('${lang}','${lv.id}')">
        <div class="level-ic" style="background:${levelBg(lang)}">${LANGUAGES[lang].flag}</div>
        <div class="lv-body">
          <div class="lv-name">${esc(lv.name)}</div>
          <div class="lv-desc">${esc(lv.desc)}</div>
          <div class="lv-bar"><i style="width:${p}%"></i></div>
        </div>
        <div class="lv-pct">${p}%</div>
      </div>`;
    }).join('')}
  </div>`;
}
function renderCourseDetail(){
  const {lang, level} = courseView;
  const lv = levelOf(lang, level);
  const units = COURSES[lang][level];
  const p = levelProgress(lang, level);
  return `
  <div class="back-row" onclick="backToLevels()">
    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 4.5 8 12l7.5 7.5 1.8-1.8L11.6 12l5.7-5.7z"/></svg>
    <span>${esc(LANGUAGES[lang].name)}</span>
  </div>
  <div class="page">
    <div class="appbar" style="padding-top:6px"><div>
      <div class="title">${esc(lv.name)}</div>
      <div class="sub">${esc(lv.desc)} · 完成 ${p}%</div>
    </div></div>
    ${units.map((u,i)=>{
      const lessons = u.lessons.map(ls => {
        const st = U.lessons[ls.id];
        const state = st && st.done ? ['done','✓ 完成'] : (st && st.started ? ['ing','学习中'] : ['todo','开始']);
        const ic = TYPE_META[ls.type];
        return `
        <div class="lesson-row" onclick="startLesson('${ls.id}')">
          <div class="lesson-ic" style="background:${lessonBg(ls.type)}">${ic.icon}</div>
          <div class="ls-body">
            <div class="ls-t">${esc(ls.title)}</div>
            <div class="ls-d"><span>${esc(ic.name)}</span><span>${ls.xp} XP</span></div>
          </div>
          <div class="ls-state ${state[0]}">${state[1]}</div>
        </div>`;
      }).join('');
      return `
      <div class="unit-block">
        <div class="unit-title"><b>Unit ${i+1} · ${esc(u.title)}</b><span>${esc(u.desc)}</span></div>
        ${lessons}
      </div>`;
    }).join('')}
  </div>`;
}
function levelProgress(lang, level){
  const units = COURSES[lang][level] || [];
  let total = 0, done = 0;
  units.forEach(u => u.lessons.forEach(ls => {
    total++;
    if(U.lessons[ls.id] && U.lessons[ls.id].done) done++;
  }));
  return total ? Math.round(done/total*100) : 0;
}
function nextLesson(){
  const units = COURSES[U.lang][U.level] || [];
  for(const u of units)
    for(const ls of u.lessons)
      if(!(U.lessons[ls.id] && U.lessons[ls.id].done))
        return {type:'lesson', id:ls.id, title:ls.title, desc:`${u.title} · ${TYPE_META[ls.type].name}`, meta:ls};
  return null;
}

/* ---------- SRS 复习 ---------- */
function srsOf(lessonId){ return U.srs[lessonId] || {}; }
function dueWords(){
  const t = today(), out = [];
  Object.keys(U.srs).forEach(lid => {
    if(!lid.startsWith(U.lang + '-')) return;
    const words = srsOf(lid);
    Object.keys(words).forEach(w => {
      if(words[w].due <= t) out.push({lesson:lid, word:w});
    });
  });
  return out;
}
function srsStat(){
  let total = 0, mastered = 0, learning = 0, due = 0;
  const t = today();
  Object.keys(U.srs).forEach(lid => {
    const words = U.srs[lid];
    Object.keys(words).forEach(w => {
      total++;
      const s = words[w];
      if(s.box >= 4) mastered++;
      else learning++;
      if(s.due <= t) due++;
    });
  });
  return {total, mastered, learning, due};
}
function renderReview(){
  const st = srsStat();
  const due = dueWords().length;
  return `
  <div class="page">
    <div class="appbar"><div>
      <div class="title">复习</div>
      <div class="sub">根据记忆曲线智能安排</div>
    </div></div>
    <div class="review-hero">
      <div class="big-ic">🧠</div>
      ${due > 0 ? `
        <div class="due-num">${due}</div>
        <div class="due-cap">个单词到期,趁热打铁!</div>
      ` : `
        <div class="due-num" style="color:var(--ok)">✓</div>
        <div class="due-cap">今日复习已清空</div>
      `}
    </div>
    <div class="review-stats">
      <div class="rs-cell master"><b>${st.mastered}</b><span>已掌握</span></div>
      <div class="rs-cell learning"><b>${st.learning}</b><span>学习中</span></div>
      <div class="rs-cell due"><b>${st.due}</b><span>待复习</span></div>
    </div>
    <button class="btn ${due>0?'btn-primary':'btn-soft'}" ${due>0?'':'disabled'} onclick="startReviewSession()">
      ${due>0 ? '开始复习' : '暂无需复习的单词'}
    </button>
    ${st.total === 0 ? `<div class="empty"><span class="e-ic">📭</span><p>还没有学习记录<br>先去「词书」学一组新词吧</p></div>` : ''}
  </div>`;
}

/* ---------- 我的 (简化, 下一 commit 增强) ---------- */
function renderMe(){
  const level = Math.floor(U.xp/300)+1;
  const xpIn = U.xp % 300;
  const st = U.stats;
  const days = Object.keys(U.streak.days).length;
  return `
  <div class="page">
    <div class="me-head">
      <div class="avatar" style="background:${U.color}">${U.avatar}</div>
      <div style="flex:1">
        <div class="me-name">${esc(U.name)} <span style="font-size:12px;color:var(--primary);background:var(--primary-soft);padding:3px 10px;border-radius:999px">Lv.${level}</span></div>
        <div class="me-sub">${LANGUAGES[U.lang].flag} ${esc(userLevel().name)} · 已陪伴 ${days} 天</div>
        <div class="me-xp">
          <div class="xp-txt"><span>Lv.${level}</span><b>${xpIn}/300 XP</b></div>
          <div class="lv-bar"><i style="width:${xpIn/3}%"></i></div>
        </div>
      </div>
    </div>
    <div class="sec-title">📊 学习数据</div>
    <div class="grid-4">
      <div class="g-cell"><b>${st.words}</b><span>新学单词</span></div>
      <div class="g-cell"><b>${st.reviews}</b><span>复习次数</span></div>
      <div class="g-cell"><b>${st.grammar}</b><span>语法对题</span></div>
      <div class="g-cell"><b>${st.listen}</b><span>听力对题</span></div>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--text-3);padding:28px 0 4px">语界 LinguaVerse v2<br>阶段构建: Commit 10 (词卡 + SRS 基础)</p>
  </div>`;
}

/* ============================================================
   课时播放器 · 不背单词式词卡 + gradeWord + SRS
   ============================================================ */
let P = null;   // player state

function lessonMeta(lessonId){
  for(const lang of Object.keys(COURSES))
    for(const level of Object.keys(COURSES[lang]))
      for(const u of COURSES[lang][level])
        for(const ls of u.lessons)
          if(ls.id === lessonId) return {...ls, lang, level, unit:u.title};
  return null;
}

function startLesson(id){
  const meta = lessonMeta(id);
  if(!meta) return;
  const content = CONTENT[id];
  if(!content){ toast('课程内容加载失败','⚠️'); return; }
  if(meta.type === 'vocab'){
    const words = lessonWords(id);
    const seen = U.srs[id] || {};
    let queue = words.filter(w => !seen[w.w]);
    if(queue.length === 0) queue = words;
    P = { mode:'lesson', id, meta, queue:shuffle(queue), idx:0, origLen:queue.length,
          newWords:0, reviews:0, xp:meta.xp };
    if(!U.lessons[id]) U.lessons[id] = {started:true};
  } else {
    P = { mode:'lesson', id, meta, items:(content.items||[]), idx:0,
          correct:0, total:(content.items||[]).length, answered:false };
  }
  save();
  openPlayer();
  if(meta.type === 'vocab') toast('点击卡片翻面查看释义','🃏');
}

function startReviewSession(){
  const due = dueWords();
  if(!due.length) return;
  const byWord = shuffle(due).map(d => {
    const words = lessonWords(d.lesson);
    return {lesson:d.lesson, w:words.find(x=>x.w===d.word) || normWord(d.lesson, [d.word,'','','',''])};
  }).filter(x=>x.w.def);
  P = { mode:'review', queue:byWord, idx:0, origLen:byWord.length, newWords:0, reviews:0, xp:0 };
  openPlayer();
}

function openPlayer(){ $('#player').hidden = false; renderPlayer(); }
function closePlayer(){ $('#player').hidden = true; P = null; render(); }

function renderPlayer(){
  const root = $('#player');
  if(!P){ root.hidden = true; return; }
  if(P.done){ root.innerHTML = playerDoneHtml(); return; }
  const isVocab = P.mode === 'review' || P.meta.type === 'vocab';
  const total = isVocab ? P.queue.length : P.items.length;
  const idx = P.idx;
  const pct = Math.round(idx / total * 100);
  let body = '', foot = '';
  if(isVocab){
    const item = P.queue[idx];
    const cur = P.mode==='review' ? item.w : item;
    const flipped = P.flip;
    body = `
    <div class="wordcard ${flipped?'flip':''}" id="wc">
      <div class="wc-inner">
        <div class="wc-face front">
          <div class="wc-hint">点击卡片查看释义</div>
          <div class="wc-word">${esc(cur.w)}</div>
          <div class="wc-ph">${esc(cur.ph||'')}</div>
          <button class="wc-speak" onclick="event.stopPropagation();speakCur()">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4z"/></svg>
          </button>
        </div>
        <div class="wc-face back">
          <div class="wc-def">${esc(cur.def||'')}</div>
          ${cur.root ? `<div class="wc-root">🧩 ${esc(cur.root)}</div>` : ''}
          <div class="wc-exs">
            ${cur.ex.map(e=>`
              <div class="wc-ex">
                <button class="ex-play" onclick="event.stopPropagation();speakEx(this)" data-t="${esc(e.t)}">🔊</button>
                ${e.tag?`<span class="ex-tag">${esc(e.tag)}</span>`:''}
                <div class="ex-t">${esc(e.t)}</div>
                <div class="ex-m">${esc(e.m)}</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
    foot = `
    <div class="pl-foot">
      <button class="btn btn-primary" id="revealBtn" style="display:${flipped?'none':'flex'}" onclick="flipCard()">查看释义</button>
      <div class="judge-row" id="judgeRow" style="display:${flipped?'flex':'none'}">
        <button class="judge-btn judge-no" onclick="gradeWord(false)">不认识<small>再练一次</small></button>
        <button class="judge-btn judge-yes" onclick="gradeWord(true)">认识<small>下一个</small></button>
      </div>
    </div>`;
  } else {
    body = `<div class="empty"><span class="e-ic">📚</span><p>语法/听力/口语内容将在后续 commit 构建</p></div>`;
    foot = `<div class="pl-foot"><button class="btn btn-primary" onclick="closePlayer()">返回</button></div>`;
  }
  root.innerHTML = `
    <div class="pl-head">
      <button class="pl-close" onclick="askClosePlayer()">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" transform="translate(1.5 0)"/></svg>
      </button>
      <div class="pl-prog"><div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="pl-count">${idx+1}/${total}</div>
    </div>
    <div class="pl-body">${body}</div>
    ${foot}`;
  const wc = $('#wc');
  if(wc && !P.flip) wc.onclick = () => flipCard();
}

function speakCur(){
  const item = P.queue[P.idx];
  const wo = P.mode==='review' ? item.w : item;
  const lang = P.mode==='review' ? item.lesson.split('-')[0] : P.meta.lang;
  speak(wo.w, lang);
}
function speakEx(btn){
  const lang = P.mode==='review' ? P.queue[P.idx].lesson.split('-')[0] : P.meta.lang;
  speak(btn.dataset.t, lang);
}
function flipCard(){
  P.flip = true;
  const wc = $('#wc');
  if(wc) wc.classList.add('flip');
  const rb = $('#revealBtn'), jr = $('#judgeRow');
  if(rb) rb.style.display = 'none';
  if(jr) jr.style.display = 'flex';
}

/* ---------- gradeWord SRS 判分 ---------- */
function gradeWord(known){
  const item = P.queue[P.idx];
  const lessonId = P.mode==='review' ? item.lesson : P.id;
  const word = P.mode==='review' ? item.w.w : item.w;
  if(!U.srs[lessonId]) U.srs[lessonId] = {};
  const s = U.srs[lessonId][word] || {box:0, due:today(), reps:0, seen:false};
  if(known){
    s.box = Math.min(s.box + 1, SRS_INTERVALS.length);
    s.due = dateKey(SRS_INTERVALS[Math.min(s.box, SRS_INTERVALS.length-1)]);
    if(!s.seen){ s.seen = true; P.newWords++; U.stats.words++; }
    P.reviews++;
    P.idx++;
  } else {
    s.box = Math.max(0, s.box - 1);
    s.due = dateKey(SRS_INTERVALS[Math.max(0, s.box)]);
    P.queue.splice(Math.min(P.idx + 3, P.queue.length), 0, item);
    if(!s.seen){ s.seen = true; U.stats.words++; }
    P.reviews++;
    P.idx++;
  }
  s.reps++;
  U.srs[lessonId][word] = s;
  P.flip = false;
  if(P.idx >= P.queue.length){ finishVocabSession(); return; }
  save();
  renderPlayer();
}

function finishVocabSession(){
  if(P.done) return;
  U.stats.reviews += P.reviews;
  if(P.mode === 'lesson'){
    U.lessons[P.id] = {...(U.lessons[P.id]||{}), done:true, at:Date.now()};
    U.stats.decks++;
    P.xp = Math.round(P.meta.xp * Math.max(.5, P.newWords/Math.max(1,P.origLen)) + P.reviews);
  } else {
    P.xp = P.reviews;
  }
  awardXp(P.xp);
  bumpStreak();
  P.done = {kind:'vocab', label: P.mode==='review' ? '复习完成' : '新词学习'};
  save();
  confetti();
  renderPlayer();
}
function awardXp(xp){
  U.xp += xp;
  const log = U.log[today()] || {words:0,review:0,xp:0};
  log.xp += xp;
  log.words += (P && P.newWords) || 0;
  log.review += (P && P.reviews) || 0;
  U.log[today()] = log;
}
function bumpStreak(){
  const t = today();
  if(U.streak.last === t) return;
  const yest = dateKey(-1);
  U.streak.count = (U.streak.last === yest) ? U.streak.count + 1 : 1;
  U.streak.last = t;
  U.streak.days[t] = 1;
}
function playerDoneHtml(){
  const d = P.done;
  const stats = `<div class="done-stats">
         <div class="ds"><b>${P.newWords}</b><span>新学单词</span></div>
         <div class="ds"><b>${P.reviews}</b><span>复习次数</span></div>
         <div class="ds"><b>+${P.xp}</b><span>获得 XP</span></div>
       </div>`;
  return `
  <div class="pl-done">
    <div class="emoji">🎉</div>
    <h2>${esc(d.label)}</h2>
    <p>连续学习 ${U.streak.count} 天 · Lv.${Math.floor(U.xp/300)+1}</p>
    ${stats}
    <button class="btn btn-primary" onclick="closePlayer()">完成</button>
  </div>`;
}
function askClosePlayer(){
  if(confirm('放弃本次学习?当前进度不会被保存')) closePlayer();
}

/* ---------- 启动 ---------- */
(function init(){ render(); })();

/* 暴露给内联 onclick */
window.go = go; window.openCourse = openCourse; window.switchLangTab = switchLangTab;
window.startLesson = startLesson; window.startReviewSession = startReviewSession;
window.speak = speak; window.flipCard = flipCard; window.gradeWord = gradeWord;
window.speakCur = speakCur; window.speakEx = speakEx;
window.closePlayer = closePlayer; window.askClosePlayer = askClosePlayer;
window.backToLevels = backToLevels;
