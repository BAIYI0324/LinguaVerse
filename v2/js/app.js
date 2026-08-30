/* ============================================================
   语界 · 应用逻辑
   本地账号 · 不背单词式词卡 · SRS 间隔复习 · MIUIX 安卓 App
   ============================================================ */
'use strict';

/* ---------- 工具 ---------- */
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
    // 英语: [词, 音标, 释义, 词根, [[例句,译文,标签],...]]
    return { w:raw[0], ph:raw[1], def:raw[2], root:raw[3],
      ex:(raw[4]||[]).map(e=>({t:e[0], m:e[1], tag:e[2]||''})) };
  }
  // 日韩: [词, 读音, 释义, 例句, 例句译文]
  return { w:raw[0], ph:raw[1], def:raw[2], root:'', ex:[{t:raw[3], m:raw[4], tag:''}] };
}
function lessonWords(lessonId){
  const c = CONTENT[lessonId];
  return c && c.words ? c.words.map(w => normWord(lessonId, w)) : [];
}

/* ---------- 本地数据库 ---------- */
const LS_KEY = 'yujie_v3';
let DB = (() => {
  try{ const d = JSON.parse(localStorage.getItem(LS_KEY)); if(d && d.users) return d; }catch(e){}
  return { users:[], session:null };
})();
const save = () => localStorage.setItem(LS_KEY, JSON.stringify(DB));
let U = DB.users.find(u => u.id === DB.session) || null;

function newUser(name, avatar, lang, level, goal){
  return {
    id:'u'+Date.now().toString(36), name, avatar, color:colorOf(name),
    createdAt:Date.now(), lang, level, dailyGoal:goal, ttsRate:1,
    xp:0,
    streak:{count:0, last:'', days:{}},
    log:{},                        // {日期: {words,review,xp}}
    stats:{decks:0,words:0,reviews:0,grammar:0,listen:0,speak:0},
    srs:{},                        // {lessonId: {word: {box,due,reps}}}
    lessons:{},                    // {lessonId: {done,at,score}}
    badges:[],
  };
}
const levelOf   = (l,lv) => LANGUAGES[l].levels.find(x=>x.id===lv);
const userLevel = () => levelOf(U.lang, U.level);

/* ---------- Toast / 彩带 ---------- */
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

/* ---------- 语音 (浏览器 TTS / 安卓原生桥) ---------- */
function speak(text, langId, rate){
  rate = rate || (U && U.ttsRate) || 1;
  try{
    if(window.NativeTTS && window.NativeTTS.speak){          // 安卓 WebView 桥
      window.NativeTTS.speak(text, LANGUAGES[langId].ttsLang, rate);
      return;
    }
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGUAGES[langId].ttsLang; u.rate = rate;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    }
  }catch(e){ /* 静默降级 */ }
}

/* ---------- 导航 ---------- */
let tab = 'home';         // home | courses | review | me
let courseView = null;    // {lang, level} 词书详情
let ob = null;            // onboarding 状态

function go(t){ tab = t; courseView = null; render(); }
function openCourse(l, lv){ courseView = {lang:l, level:lv}; render(); }

/* ---------- 渲染入口 ---------- */
function render(){
  if(!U){ renderOnboard(); return; }
  if(!courseLangTab) courseLangTab = U.lang;
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

/* ============================================================
   引导 · 创建本地账号
   ============================================================ */
function startOnboard(){
  ob = { step:1, name:'', avatar:AVATARS[Math.floor(Math.random()*AVATARS.length)],
         lang:'en', level:'cet4', goal:20 };
  renderOnboard();
}
function renderOnboard(){
  $('#tabbar').hidden = true;
  const el = $('#app');
  if(ob.step === 1){
    el.innerHTML = `
    <div class="onboard">
      <div class="ob-hero">
        <div class="ob-logo">🌏</div>
        <h1>语界</h1>
        <p>不背单词 · 四六级 / 日语 / 韩语<br>所有数据仅保存在本机</p>
      </div>
      <div class="ob-form">
        <div class="field">
          <label>怎么称呼你?</label>
          <input id="obName" placeholder="昵称(1-12字)" maxlength="12" value="${esc(ob.name)}">
        </div>
        <div class="field">
          <label>选个头像</label>
          <div class="avatar-pick">
            ${AVATARS.map(a=>`<button class="avatar-opt ${a===ob.avatar?'active':''}" data-a="${a}">${a}</button>`).join('')}
          </div>
        </div>
        <button class="btn btn-primary" id="obNext">下一步</button>
      </div>
    </div>`;
    $$('.avatar-opt').forEach(b => b.onclick = () => {
      ob.name = $('#obName').value.trim();            // 保留已输入的昵称
      ob.avatar = b.dataset.a; renderOnboard();
    });
    $('#obNext').onclick = () => {
      const n = $('#obName').value.trim();
      if(!n){ toast('先给自己起个名字吧','✏️'); return; }
      ob.name = n; ob.step = 2; renderOnboard();
    };
  }
  else if(ob.step === 2){
    el.innerHTML = `
    <div class="onboard">
      <div class="ob-hero">
        <h1 style="font-size:24px">想学哪门语言?</h1>
        <p>随时可以在「词书」中切换</p>
      </div>
      <div class="choice-grid" style="grid-template-columns:1fr">
        ${Object.values(LANGUAGES).map(l=>`
          <button class="choice ${ob.lang===l.id?'active':''}" data-l="${l.id}">
            <span class="c-flag">${l.flag}</span>
            <span class="c-name">${l.name} ${l.native}</span>
          </button>`).join('')}
      </div>
      <div class="choice-grid">
        ${LANGUAGES[ob.lang].levels.map(lv=>`
          <button class="choice ${ob.level===lv.id?'active':''}" data-lv="${lv.id}">
            <span class="c-name">${lv.name}</span>
            <span class="c-desc">${lv.desc}</span>
          </button>`).join('')}
      </div>
      <button class="btn btn-primary" id="obNext">下一步</button>
      <button class="btn btn-soft" id="obBack" style="margin-top:10px;height:42px;font-size:14px">上一步</button>
    </div>`;
    $$('.choice[data-l]').forEach(b => b.onclick = () => {
      ob.lang = b.dataset.l; ob.level = LANGUAGES[ob.lang].levels[0].id; renderOnboard();
    });
    $$('.choice[data-lv]').forEach(b => b.onclick = () => { ob.level = b.dataset.lv; renderOnboard(); });
    $('#obBack').onclick = () => { ob.step = 1; renderOnboard(); };
    $('#obNext').onclick = () => { ob.step = 3; renderOnboard(); };
  }
  else{
    el.innerHTML = `
    <div class="onboard">
      <div class="ob-hero">
        <h1 style="font-size:24px">每日目标?</h1>
        <p>每天学习+复习的单词量</p>
      </div>
      <div class="choice-grid">
        ${[10,20,30,40].map(n=>`
          <button class="choice ${ob.goal===n?'active':''}" data-g="${n}">
            <span class="c-name">${n} 个</span>
            <span class="c-desc">${n<=10?'轻松':n<=20?'标准':n<=30?'进阶':'学霸'}</span>
          </button>`).join('')}
      </div>
      <button class="btn btn-primary" id="obDone">开始学习</button>
      <button class="btn btn-soft" id="obBack" style="margin-top:10px;height:42px;font-size:14px">上一步</button>
    </div>`;
    $$('.choice[data-g]').forEach(b => b.onclick = () => { ob.goal = +b.dataset.g; renderOnboard(); });
    $('#obBack').onclick = () => { ob.step = 2; renderOnboard(); };
    $('#obDone').onclick = () => {
      U = newUser(ob.name, ob.avatar, ob.lang, ob.level, ob.goal);
      DB.users.push(U); DB.session = U.id; save();
      ob = null; tab = 'home'; render();
      confetti(); toast('欢迎加入语界!','🎉');
    };
  }
}

/* ============================================================
   首页
   ============================================================ */
function todayLog(){ return U.log[today()] || {words:0,review:0,xp:0}; }

function renderHome(){
  const h = new Date().getHours();
  const lg = todayLog();
  const done = Math.min(lg.words + lg.review, U.dailyGoal);
  const pct = Math.round(done / U.dailyGoal * 100);
  const due = dueWords().length;
  const lv = userLevel();
  const quote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];

  // 继续学习: 优先复习, 否则下一个未完成课时
  let next = null;
  if(due > 0) next = {type:'review', title:'开始复习', desc:`${due} 个单词到期`};
  else{
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
    <div class="continue-card" onclick="${next.type==='review' ? 'go(\'review\')' : `startLesson('${next.id}')`}">
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

/* ============================================================
   词书
   ============================================================ */
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
let courseLangTab = null;
function switchLangTab(l){ courseLangTab = l; render(); }
function backToLevels(){ courseView = null; render(); }
function levelBg(l){ return {en:'#EAF0FF', ja:'#FDEDF0', ko:'#E3F6EE'}[l] || '#EAF0FF'; }

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
function lessonBg(t){
  return {vocab:'#EAF0FF', grammar:'#FFF2E3', listening:'#E3F6EE', speaking:'#FDEDF0'}[t] || '#EAF0FF';
}

/* 进度: 已完成课时 / 总课时 */
function levelProgress(lang, level){
  const units = COURSES[lang][level] || [];
  let total = 0, done = 0;
  units.forEach(u => u.lessons.forEach(ls => {
    total++;
    if(U.lessons[ls.id] && U.lessons[ls.id].done) done++;
  }));
  return total ? Math.round(done/total*100) : 0;
}
/* 下一个未完成课时(当前语言+级别) */
function nextLesson(){
  const units = COURSES[U.lang][U.level] || [];
  for(const u of units)
    for(const ls of u.lessons)
      if(!(U.lessons[ls.id] && U.lessons[ls.id].done))
        return {type:'lesson', id:ls.id, title:ls.title, desc:`${u.title} · ${TYPE_META[ls.type].name}`, meta:ls};
  return null;
}

/* ============================================================
   复习 (SRS)
   ============================================================ */
function srsOf(lessonId){ return U.srs[lessonId] || {}; }
function dueWords(){
  const t = today(), out = [];
  Object.keys(U.srs).forEach(lid => {
    if(!lid.startsWith(U.lang + '-')) return;             // 仅当前语言
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

/* ============================================================
   我的
   ============================================================ */
function renderMe(){
  const level = Math.floor(U.xp/300)+1;
  const xpIn = U.xp % 300;
  const st = U.stats;
  const days = Object.keys(U.streak.days).length;
  const badegs = ACHIEVEMENTS.map(a => {
    const got = U.badges.includes(a.id);
    return `<div class="badge-cell ${got?'got':''}" title="${esc(a.desc)}">
      <span class="b-ic">${a.icon}</span><span>${esc(a.name)}</span>
    </div>`;
  }).join('');
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
    <div class="sec-title">🏅 成就墙 (${U.badges.length}/${ACHIEVEMENTS.length})</div>
    <div class="badge-grid">${badegs}</div>
    <div class="sec-title">⚙️ 设置</div>
    <div class="set-group">
      <div class="set-row" onclick="setGoal()">
        <div class="s-ic" style="background:#EAF0FF">🎯</div>
        <div class="s-t">每日目标</div>
        <div class="s-v">${U.dailyGoal} 个</div>
        <div class="s-arrow">›</div>
      </div>
      <div class="set-row" onclick="setRate()">
        <div class="s-ic" style="background:#FFF2E3">🔊</div>
        <div class="s-t">朗读语速</div>
        <div class="s-v">${U.ttsRate}x</div>
        <div class="s-arrow">›</div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-row" onclick="switchAccount()">
        <div class="s-ic" style="background:#F1EDFC">👥</div>
        <div class="s-t">切换账号</div>
        <div class="s-v">${DB.users.length} 个本地账号</div>
        <div class="s-arrow">›</div>
      </div>
      <div class="set-row" onclick="exportData()">
        <div class="s-ic" style="background:#E3F6EE">📦</div>
        <div class="s-t">导出学习数据</div>
        <div class="s-v">JSON</div>
        <div class="s-arrow">›</div>
      </div>
      <div class="set-row" onclick="confirmClear()">
        <div class="s-ic" style="background:#FEECEC">🗑️</div>
        <div class="s-t">清空学习记录</div>
        <div class="s-arrow">›</div>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--text-3);padding:8px 0 4px">语界 LinguaVerse · 数据仅保存在本机<br>v3.0 · MIUIX</p>
  </div>`;
}

/* ---------- 设置动作 ---------- */
function setGoal(){
  const opts = [10,20,30,40];
  showModal('每日目标', `当前: <b>${U.dailyGoal}</b> 个/天`, opts.map(n =>
    `<button class="btn btn-ghost btn-sm" style="flex:1" data-g="${n}">${n}</button>`).join(''), (m)=>{
    m.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
      U.dailyGoal = +b.dataset.g; save(); m.remove(); closeModalMask(); render(); toast(`目标已设为 ${U.dailyGoal} 个/天`,'🎯');
    });
  });
}
function setRate(){
  const opts = [0.5, 0.75, 1, 1.25, 1.5];
  showModal('朗读语速', `当前: <b>${U.ttsRate}x</b>`, opts.map(n =>
    `<button class="btn btn-ghost btn-sm" style="flex:1" data-r="${n}">${n}x</button>`).join(''), (m)=>{
    m.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
      U.ttsRate = +b.dataset.r; save(); m.remove(); closeModalMask(); render();
      speak(U.lang==='en'?'sample':'例句', U.lang); toast(`语速 ${U.ttsRate}x`,'🔊');
    });
  });
}
function switchAccount(){
  const others = DB.users.filter(u=>u.id!==U.id);
  showModal('切换本地账号', others.length ? '选择一个账号' : '没有其它账号', `
    ${others.map(u=>`<button class="btn btn-ghost" style="margin-bottom:8px" data-u="${u.id}">${u.avatar} ${esc(u.name)} · Lv.${Math.floor(u.xp/300)+1}</button>`).join('')}
    <button class="btn btn-primary" data-new="1" style="margin-top:4px">＋ 创建新账号</button>
  `, (m)=>{
    m.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      DB.session = b.dataset.u; save(); location.reload();
    });
    m.querySelector('[data-new]').onclick = () => {
      DB.session = null; save(); startOnboard();
    };
  });
}
function exportData(){
  const blob = new Blob([JSON.stringify(DB, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `语界-学习数据-${today()}.json`;
  a.click();
  toast('已导出 JSON 文件','📦');
}
function confirmClear(){
  showModal('清空学习记录', '将删除当前账号的<strong>全部学习进度、SRS 记忆与成就</strong>,账号本身保留。此操作不可恢复。', `
    <div class="m-row">
      <button class="btn btn-soft" data-x="no" style="flex:1">取消</button>
      <button class="btn btn-danger" data-x="yes" style="flex:1">确认清空</button>
    </div>`, (m)=>{
    m.querySelector('[data-x=no]').onclick = () => { m.remove(); closeModalMask(); };
    m.querySelector('[data-x=yes]').onclick = () => {
      U.xp=0; U.streak={count:0,last:'',days:{}}; U.log={};
      U.stats={decks:0,words:0,reviews:0,grammar:0,listen:0,speak:0};
      U.srs={}; U.lessons={}; U.badges=[];
      save(); m.remove(); closeModalMask(); render(); toast('学习记录已清空','🧹');
    };
  });
}
function showModal(title, body, buttonsHtml, bind){
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `<div class="modal"><h3>${title}</h3><p>${body}</p>${buttonsHtml}</div>`;
  document.body.appendChild(mask);
  mask.addEventListener('click', e => { if(e.target === mask){ mask.remove(); } });
  bind(mask);
}
function closeModalMask(){ $$('.modal-mask').forEach(m=>m.remove()); }

/* ============================================================
   课时播放器 (不背单词式)
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
    let queue = words.filter(w => !seen[w.w]);           // 新词
    if(queue.length === 0) queue = words;                 // 全部学过 → 重刷
    P = { mode:'lesson', id, meta, queue:shuffle(queue), idx:0, origLen:queue.length,
          newWords:0, reviews:0, xp:meta.xp };
    if(!U.lessons[id]) U.lessons[id] = {started:true};
  } else {
    P = { mode:'lesson', id, meta, items:content.items, idx:0,
          correct:0, total:content.items.length, answered:false };
  }
  save();
  openPlayer();
  if(meta.type === 'vocab') toast('点击卡片翻面查看释义','🃏');
}

/* 复习会话 */
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

function openPlayer(){
  $('#player').hidden = false;
  renderPlayer();
}
function closePlayer(){
  $('#player').hidden = true;
  P = null;
  render();
}

function renderPlayer(){
  const root = $('#player');
  if(!P){ root.hidden = true; return; }

  // 完成页
  if(P.done){
    root.innerHTML = playerDoneHtml();
    return;
  }

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
  }
  else if(P.meta.type === 'grammar'){
    body = quizHtml(P.items[idx], '语法练习');
    foot = '';
  }
  else if(P.meta.type === 'listening'){
    body = listeningHtml(P.items[idx]);
    foot = '';
  }
  else if(P.meta.type === 'speaking'){
    body = speakingHtml(P.items[idx]);
    foot = '';
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

  // 词卡点击翻面
  const wc = $('#wc');
  if(wc && !P.flip) wc.onclick = () => flipCard();
  // 听力自动播放
  if(P.meta && P.meta.type === 'listening' && !P.listenedOnce){
    P.listenedOnce = true;
    setTimeout(()=> speak(P.items[P.idx].t, P.meta.lang), 400);
  }
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
/* 听力/口语: 播放当前句 (供内联按钮调用) */
function replayListen(rate){ speak(P.items[P.idx].t, P.meta.lang, rate); }

/* ---------- 不背单词判分 + SRS ---------- */
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
    // 不认识: 卡片稍后重新出现
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

/* ---------- 选择题 (语法) ---------- */
function quizHtml(item, tag){
  const letters = ['A','B','C','D'];
  return `
  <div class="quiz-q">
    <span class="q-tag">${esc(tag)}</span>
    ${esc(item.q)}
  </div>
  <div class="opts">
    ${item.opts.map((o,i)=>`
      <button class="opt" data-i="${i}" onclick="answerQuiz(${i})">
        <span class="o-ic">${letters[i]}</span>${esc(o)}
      </button>`).join('')}
  </div>
  <div id="quizExp"></div>`;
}
function answerQuiz(i){
  if(P.answered) return;
  P.answered = true;
  const item = P.items[P.idx];
  const right = item.a === i;
  $$('.opt').forEach((b,j) => {
    b.onclick = null;
    if(j === item.a) b.classList.add('right');
    else if(j === i)  b.classList.add('wrong');
    else b.classList.add('dim');
  });
  if(right) P.correct++;
  const st = U.stats;
  if(P.meta.type==='grammar'){ if(right) st.grammar++; }
  if(P.meta.type==='listening'){ if(right) st.listen++; }
  $('#quizExp').innerHTML = `
    <div class="explain"><b>${right?'✓ 回答正确':'✗ 回答错误'}</b><br>${esc(item.explain||'')}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="nextQuiz()">继续</button>`;
  save();
}
function nextQuiz(){
  P.answered = false;
  P.idx++;
  if(P.idx >= P.items.length){ finishQuizSession(); return; }
  P.listenedOnce = false;
  renderPlayer();
}

/* ---------- 听力 ---------- */
function listeningHtml(item){
  // 干扰项: 同课时其它句子的译文
  const others = shuffle(P.items.filter(x=>x!==item)).slice(0,3).map(x=>x.m);
  const opts = shuffle([item.m, ...others]);
  const letters = ['A','B','C','D'];
  P._lOpts = opts; P._lAns = opts.indexOf(item.m);
  return `
  <div class="listen-box">
    <span class="wave">🎧</span>
    <div style="font-size:13px;color:var(--text-2);margin-top:8px;font-weight:600">听音频,选择正确译文</div>
    <div class="btns">
      <button class="btn btn-ghost btn-sm" onclick="replayListen(1)">▶ 再听一次</button>
      <button class="btn btn-soft btn-sm" onclick="replayListen(0.6)">🐢 慢速</button>
    </div>
  </div>
  <div class="opts">
    ${opts.map((o,i)=>`
      <button class="opt" onclick="answerListen(${i})">
        <span class="o-ic">${letters[i]}</span>${esc(o)}
      </button>`).join('')}
  </div>
  <div id="quizExp"></div>`;
}
function answerListen(i){
  if(P.answered) return;
  P.answered = true;
  const right = i === P._lAns;
  $$('.opt').forEach((b,j) => {
    b.onclick = null;
    if(j === P._lAns) b.classList.add('right');
    else if(j === i)  b.classList.add('wrong');
    else b.classList.add('dim');
  });
  if(right) P.correct++;
  if(right) U.stats.listen++;
  $('#quizExp').innerHTML = `
    <div class="explain"><b>${right?'✓ 回答正确':'✗ 正确答案已标出'}</b><br>
      原文:${esc(P.items[P.idx].t)}<br>${esc(P.items[P.idx].m)}</div>
    <button class="btn btn-primary" style="margin-top:16px" onclick="nextQuiz()">继续</button>`;
  save();
}

/* ---------- 口语 ---------- */
function speakingHtml(item){
  return `
  <div class="listen-box">
    <span class="wave">🎤</span>
    <div style="font-size:13px;color:var(--text-2);margin-top:8px;font-weight:600">听示范,然后大声跟读</div>
    <div class="btns">
      <button class="btn btn-ghost btn-sm" onclick="replayListen(1)">▶ 正常</button>
      <button class="btn btn-soft btn-sm" onclick="replayListen(0.6)">🐢 慢速</button>
    </div>
  </div>
  <div class="speak-model">${esc(item.t)}</div>
  ${item.r?`<div class="speak-phon">${esc(item.r)}</div>`:''}
  <div class="speak-mean">${esc(item.m)}</div>
  <div id="speakArea">
    <button class="btn btn-primary" style="margin-top:22px" onclick="startRecognize()">🎙️ 开始跟读</button>
    <p style="text-align:center;font-size:11.5px;color:var(--text-3);margin-top:10px">
      ${('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? '将使用麦克风识别你的发音' : '当前环境不支持语音识别,可自评'}
    </p>
  </div>`;
}
function startRecognize(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const item = CONTENT[P.id].items[P.idx];
  if(!SR){
    // 无麦克风: 自评
    $('#speakArea').innerHTML = `
      <div class="explain" style="text-align:center">听得出你很努力!<br>觉得自己读得怎么样?</div>
      <div class="judge-row" style="margin-top:14px">
        <button class="judge-btn judge-no" onclick="speakSelf(false)">不太顺<small>再练练</small></button>
        <button class="judge-btn judge-yes" onclick="speakSelf(true)">读得很棒<small>下一句</small></button>
      </div>`;
    return;
  }
  try{
    const r = new SR();
    r.lang = LANGUAGES[P.meta.lang].ttsLang;
    r.interimResults = false; r.maxAlternatives = 1;
    $('#speakArea').innerHTML = `<div class="explain" style="text-align:center">🎧 正在聆听,请跟读…</div>`;
    r.onresult = e => {
      const said = e.results[0][0].transcript;
      const score = Math.round(similarity(said, item.t) * 100);
      speakScored(score, said);
    };
    r.onerror = () => {
      $('#speakArea').innerHTML = `
        <div class="explain" style="text-align:center">没能听清,再试一次或自评</div>
        <div class="judge-row" style="margin-top:14px">
          <button class="judge-btn judge-no" onclick="startRecognize()">重试</button>
          <button class="judge-btn judge-yes" onclick="speakSelf(true)">过 ✓</button>
        </div>`;
    };
    r.start();
  }catch(e){
    toast('无法启动麦克风','🔇');
  }
}
function speakScored(score, said){
  const col = score>=80?'#00B578':score>=50?'#FF8A00':'#FA5151';
  const R = 45, C = 2*Math.PI*R;
  $('#speakArea').innerHTML = `
    <div class="score-ring">
      <svg width="110" height="110">
        <circle cx="55" cy="55" r="${R}" fill="none" stroke="#E8EAF0" stroke-width="10"/>
        <circle cx="55" cy="55" r="${R}" fill="none" stroke="${col}" stroke-width="10" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C*(1-score/100)}" transform="rotate(-90 55 55)"/>
      </svg>
      <div class="sc" style="color:${col}">${score}</div>
    </div>
    <p style="text-align:center;font-size:12.5px;color:var(--text-2);margin-bottom:16px">你说的:${esc(said)}</p>
    <div class="judge-row">
      <button class="judge-btn judge-no" onclick="startRecognize()">再读一次</button>
      <button class="judge-btn judge-yes" onclick="speakSelf(${score>=60})">下一句</button>
    </div>`;
}
function speakSelf(good){
  U.stats.speak++; save();
  P.idx++;
  if(P.idx >= P.items.length){ finishQuizSession(); return; }
  renderPlayer();
}
function similarity(a, b){
  a = a.toLowerCase().replace(/[\s.,!?'"-]/g,'');
  b = b.toLowerCase().replace(/[\s.,!?'"-]/g,'');
  if(!a || !b) return 0;
  const m = a.length, n = b.length;
  const dp = Array.from({length:m+1},(_,i)=>[i,...Array(n).fill(0)]);
  for(let j=0;j<=n;j++) dp[0][j]=j;
  for(let i=1;i<=m;i++) for(let j=1;j<=n;j++)
    dp[i][j] = Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
  return Math.max(0, 1 - dp[m][n]/Math.max(m,n));
}

/* ---------- 会话结束 ---------- */
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
  save(); checkBadges();
  confetti();
  renderPlayer();
}
function finishQuizSession(){
  U.lessons[P.id] = {...(U.lessons[P.id]||{}), done:true, at:Date.now(), score:P.correct+'/'+P.total};
  P.xp = Math.round(P.meta.xp * P.correct / P.total);
  awardXp(P.xp);
  if(P.meta.type === 'speaking') U.stats.speak += P.correct;
  bumpStreak();
  P.done = {kind:'quiz', correct:P.correct, total:P.total,
    label:{grammar:'语法练习', listening:'听力训练', speaking:'口语跟读'}[P.meta.type]};
  save(); checkBadges();
  if(P.correct === P.total) confetti();
  renderPlayer();
}
function playerDoneHtml(){
  const d = P.done;
  const stats = d.kind==='vocab'
    ? `<div class="done-stats">
         <div class="ds"><b>${P.newWords}</b><span>新学单词</span></div>
         <div class="ds"><b>${P.reviews}</b><span>复习次数</span></div>
         <div class="ds"><b>+${P.xp}</b><span>获得 XP</span></div>
       </div>`
    : `<div class="done-stats">
         <div class="ds"><b style="color:${d.correct===d.total?'var(--ok)':'var(--warn)'}">${d.correct}/${d.total}</b><span>正确率 ${Math.round(d.correct/d.total*100)}%</span></div>
         <div class="ds"><b>+${P.xp}</b><span>获得 XP</span></div>
       </div>`;
  return `
  <div class="pl-done">
    <div class="emoji">${d.kind==='vocab' ? '🎉' : (d.correct===d.total?'🏆':'👏')}</div>
    <h2>${esc(d.label)}</h2>
    <p>连续学习 ${U.streak.count} 天 · Lv.${Math.floor(U.xp/300)+1}</p>
    ${stats}
    <button class="btn btn-primary" onclick="closePlayer()">完成</button>
  </div>`;
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

/* ---------- 成就 ---------- */
function checkBadges(){
  ACHIEVEMENTS.forEach(a => {
    if(!U.badges.includes(a.id) && typeof a.check === 'function' && a.check(U)){
      U.badges.push(a.id);
      toast(`解锁成就「${a.name}」`, a.icon);
    }
  });
  save();
}

/* ---------- 退出确认 ---------- */
function askClosePlayer(){
  showModal('放弃本次学习?', '当前进度将不被保存', `
    <div class="m-row">
      <button class="btn btn-soft" data-x="no" style="flex:1">继续学习</button>
      <button class="btn btn-danger" data-x="yes" style="flex:1">放弃</button>
    </div>`, (m)=>{
    m.querySelector('[data-x=no]').onclick = () => m.remove();
    m.querySelector('[data-x=yes]').onclick = () => { m.remove(); closePlayer(); };
  });
}

/* ---------- 启动 ---------- */
(function init(){
  if(!U) startOnboard();
  else render();
})();

/* 暴露给内联 onclick */
window.go = go; window.openCourse = openCourse; window.switchLangTab = switchLangTab;
window.startLesson = startLesson; window.startReviewSession = startReviewSession;
window.speak = speak; window.flipCard = flipCard; window.gradeWord = gradeWord;
window.answerQuiz = answerQuiz; window.answerListen = answerListen; window.nextQuiz = nextQuiz;
window.startRecognize = startRecognize; window.speakSelf = speakSelf;
window.closePlayer = closePlayer; window.askClosePlayer = askClosePlayer;
window.speakCur = speakCur; window.speakEx = speakEx;
window.setGoal = setGoal; window.setRate = setRate; window.switchAccount = switchAccount;
window.exportData = exportData; window.confirmClear = confirmClear; window.render = render;
window.backToLevels = backToLevels; window.replayListen = replayListen;
