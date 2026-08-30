/* 语界 v1 · 应用逻辑: 注册/登录(mock API) + SPA 路由 + 顶部导航 + 四大学习模块 */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS_KEY = 'linguaverse_v1';

/* ---------- Mock API ---------- */
const MockAPI = {
  register(name, email, password){
    return new Promise((res, rej) => {
      setTimeout(() => {
        if(!name || !email || !password) return rej({msg:'请填写完整信息'});
        if(password.length < 6) return rej({msg:'密码至少 6 位'});
        if(email && !email.includes('@')) return rej({msg:'邮箱格式不正确'});
        const users = JSON.parse(localStorage.getItem(LS_KEY+'_users') || '[]');
        if(users.find(u => u.email === email)) return rej({msg:'该邮箱已注册'});
        const user = {
          id:'u'+Date.now().toString(36), name, email,
          avatar:['🐻','🐱','🦊','🐼','🐰','🐸','🦁','🐯'][Math.floor(Math.random()*8)],
          color:['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399'][Math.floor(Math.random()*5)],
          createdAt:Date.now(), xp:0, lessonsDone:{},
          streak:{count:0,last:''}, stats:{words:0,quiz:0},
        };
        users.push(user);
        localStorage.setItem(LS_KEY+'_users', JSON.stringify(users));
        res({token:'mock-'+user.id, user});
      }, 600);
    });
  },
  login(email, password){
    return new Promise((res, rej) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(LS_KEY+'_users') || '[]');
        const u = users.find(x => x.email === email);
        if(!u) return rej({msg:'账号不存在,请先注册'});
        if(password.length < 6) return rej({msg:'密码格式错误(至少6位)'});
        res({token:'mock-'+u.id, user:u});
      }, 500);
    });
  }
};

let U = null;
function saveUser(){
  const users = JSON.parse(localStorage.getItem(LS_KEY+'_users') || '[]');
  const idx = users.findIndex(x => x.id === U.id);
  if(idx >= 0){ users[idx] = U; localStorage.setItem(LS_KEY+'_users', JSON.stringify(users)); }
}
function tryRestoreSession(){
  const token = localStorage.getItem(LS_KEY+'_token');
  if(!token) return false;
  const uid = token.replace('mock-','');
  const users = JSON.parse(localStorage.getItem(LS_KEY+'_users') || '[]');
  const u = users.find(x => x.id === uid);
  if(u){ U = u; return true; }
  return false;
}
function logout(){ localStorage.removeItem(LS_KEY+'_token'); U = null; router(); }

let tTimer = null;
function toast(msg){
  if(tTimer) clearTimeout(tTimer);
  const old = $('#toastId'); if(old) old.remove();
  const t = document.createElement('div');
  t.id='toastId'; t.className='toast'; t.textContent=msg;
  document.body.appendChild(t);
  tTimer = setTimeout(()=>t.remove(), 2200);
}

/* ---------- SPA 路由 ---------- */
let route = 'home';
let courseState = {lang:'en', level:null};
let lessonState = null; // {lessonId, type, words/items, idx, ...}

function router(){
  const hash = location.hash || '#/';
  const parts = hash.replace('#/','').split('/').filter(Boolean);
  route = parts[0] || 'home';
  if(!U){ renderAuth(); return; }
  $('#navbar').hidden = false;
  $$('#navLinks a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  const av = $('#navUser');
  av.innerHTML = `<div class="avatar" style="background:${U.color}">${U.avatar}</div>
    <span style="font-weight:700">${esc(U.name)}</span>
    <button onclick="logout()">退出</button>`;
  const app = $('#app');
  app.className = 'container';
  // 学习课
  if(route === 'lesson' && parts[1]){
    return startLesson(parts[1]);
  }
  if(route === 'home') app.innerHTML = renderHome();
  else if(route === 'courses') app.innerHTML = renderCourses();
  else if(route === 'community') app.innerHTML = renderCommunity();
  else if(route === 'me') app.innerHTML = renderMe();
  else { route='home'; location.hash='#/'; }
}
window.logout = logout;

/* ---------- 登录/注册 ---------- */
function renderAuth(){
  $('#navbar').hidden = true;
  const app = $('#app');
  app.className = '';
  let mode = 'login';
  const render = () => {
    app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <div style="text-align:center;margin-bottom:20px">
          <div style="width:60px;height:60px;border-radius:18px;background:linear-gradient(135deg,#409EFF,#67C23A);display:grid;place-items:center;color:#fff;font-size:28px;margin:0 auto 12px">🌏</div>
        </div>
        <h1>语界 LinguaVerse</h1>
        <p class="sub">多语种在线教育平台 · 开启你的学习之旅</p>
        <div class="auth-tabs">
          <button class="${mode==='login'?'active':''}" id="tLogin">登录</button>
          <button class="${mode==='register'?'active':''}" id="tReg">注册</button>
        </div>
        ${mode==='login' ? `
        <div class="auth-field"><label>邮箱</label><input id="email" placeholder="your@email.com" autocomplete="email"></div>
        <div class="auth-field"><label>密码</label><input id="pwd" type="password" placeholder="至少 6 位" autocomplete="current-password"></div>
        <button class="btn-primary" id="loginBtn">登录</button>
        <p class="auth-tip">没有账号?点击上方「注册」创建</p>
        ` : `
        <div class="auth-field"><label>昵称</label><input id="name" placeholder="怎么称呼你?"></div>
        <div class="auth-field"><label>邮箱</label><input id="email" placeholder="your@email.com" autocomplete="email"></div>
        <div class="auth-field"><label>密码</label><input id="pwd" type="password" placeholder="至少 6 位"></div>
        <button class="btn-primary" id="regBtn">创建账号</button>
        <p class="auth-tip">已有账号?点击上方「登录」</p>
        `}
      </div>
    </div>`;
    $('#tLogin').onclick = () => { mode='login'; render(); };
    $('#tReg').onclick = () => { mode='register'; render(); };
    if(mode==='login'){
      $('#loginBtn').onclick = async () => {
        const e = $('#email').value.trim(), p = $('#pwd').value;
        $('#loginBtn').disabled = true; $('#loginBtn').textContent = '登录中...';
        try{
          const r = await MockAPI.login(e, p);
          U = r.user;
          localStorage.setItem(LS_KEY+'_token', r.token);
          toast('登录成功,欢迎回来!');
          router();
        }catch(err){ toast(err.msg || '登录失败'); $('#loginBtn').disabled=false; $('#loginBtn').textContent='登录'; }
      };
    } else {
      $('#regBtn').onclick = async () => {
        const n = $('#name').value.trim(), e = $('#email').value.trim(), p = $('#pwd').value;
        $('#regBtn').disabled = true; $('#regBtn').textContent = '注册中...';
        try{
          const r = await MockAPI.register(n, e, p);
          U = r.user;
          localStorage.setItem(LS_KEY+'_token', r.token);
          toast('注册成功,欢迎加入语界!');
          router();
        }catch(err){ toast(err.msg || '注册失败'); $('#regBtn').disabled=false; $('#regBtn').textContent='创建账号'; }
      };
    }
  };
  render();
}

/* ---------- 首页 ---------- */
function renderHome(){
  const totalWords = Object.values(CONTENT).reduce((s,c)=>s+(c.words?c.words.length:0),0);
  const totalLessons = Object.values(COURSES).reduce((s,lang)=>
    s+Object.values(lang).reduce((ss,lv)=>ss+lv.reduce((s2,u)=>s2+u.lessons.length,0),0),0);
  const doneCount = Object.keys(U.lessonsDone).length;
  return `
  <div class="hero">
    <h1>🌏 欢迎回来, ${esc(U.name)}</h1>
    <p>语界是一款多语种在线教育平台,覆盖英语(A1/B2)、日语(N5/N3)、韩语(TOPIK I-III),
      提供单词、语法、听力、口语四大学习模块。坚持每日学习,见证语言能力的稳步提升。</p>
    <div class="hero-stats">
      <div class="hs"><b>${U.xp}</b><span>累计 XP</span></div>
      <div class="hs"><b>${doneCount}</b><span>完成课时</span></div>
      <div class="hs"><b>${U.streak.count}</b><span>连续天数</span></div>
      <div class="hs"><b>${U.stats.words}</b><span>学习词汇</span></div>
    </div>
  </div>
  <div class="section-title">选择你想学的语言</div>
  <div class="lang-grid">
    ${Object.values(LANGUAGES).map(l => `
      <div class="lang-card" onclick="location.hash='#/courses';window._sLang='${l.id}'">
        <div class="flag">${l.flag}</div>
        <h3>${l.name} <span style="font-size:13px;font-weight:500;color:#909399">${l.native}</span></h3>
        <p>${l.levels.length} 个级别 · 由浅入深循序渐进</p>
        <span class="lv">立即学习 →</span>
      </div>`).join('')}
  </div>
  <div class="section-title">四大学习模块</div>
  <div class="lang-grid">
    <div class="lang-card"><div class="flag">📇</div><h3>单词课</h3><p>精选高频词汇,含释义与例句,逐词学习掌握核心词义。</p></div>
    <div class="lang-card"><div class="flag">✏️</div><h3>语法课</h3><p>经典语法选择题,给出解析,打牢语言结构基础。</p></div>
    <div class="lang-card"><div class="flag">🎧</div><h3>听力课</h3><p>播放地道发音,通过选择题训练理解能力。</p></div>
  </div>`;
}

/* ---------- 词书 ---------- */
function renderCourses(){
  if(window._sLang){ courseState.lang = window._sLang; window._sLang = null; }
  const cs = courseState;
  if(!cs.level) cs.level = LANGUAGES[cs.lang].levels[0].id;
  const levels = LANGUAGES[cs.lang].levels;
  const units = COURSES[cs.lang][cs.level] || [];
  return `
  <div class="section-title">选择语言</div>
  <div class="tabs-row">
    ${Object.values(LANGUAGES).map(l => `
      <button class="${cs.lang===l.id?'active':''}" onclick="switchLang('${l.id}')">
        ${l.flag} ${l.name}
      </button>`).join('')}
  </div>
  <div class="section-title">选择级别</div>
  <div class="level-select">
    ${levels.map(lv => `
      <button class="${cs.level===lv.id?'active':''}" onclick="switchLevel('${lv.id}')">
        ${lv.name}
      </button>`).join('')}
  </div>
  <div style="margin:18px 2px 10px;color:#606266;font-size:13px;font-weight:600">
    ${levels.find(x=>x.id===cs.level).desc}
  </div>
  ${units.map((u,i) => `
    <div class="unit-card">
      <h3>Unit ${i+1} · ${esc(u.title)}</h3>
      <div class="u-desc">${esc(u.desc)}</div>
      <div class="lesson-list">
        ${u.lessons.map(ls => `
          <div class="lesson-item g-${ls.type}" onclick="location.hash='#/lesson/${ls.id}'">
            <div class="li-ic">${TYPE_META[ls.type].icon}</div>
            <div class="li-body">
              <div class="li-title">${esc(ls.title)}</div>
              <div class="li-meta">${TYPE_META[ls.type].name} · ${U.lessonsDone[ls.id]?'✓ 已完成':'未开始'}</div>
            </div>
            <div class="li-xp">+${ls.xp} XP</div>
          </div>`).join('')}
      </div>
    </div>`).join('')}
  `;
}
window.switchLang = l => { courseState.lang=l; courseState.level=LANGUAGES[l].levels[0].id; router(); };
window.switchLevel = lv => { courseState.level=lv; router(); };

/* ---------- 学习课播放器 ---------- */
function lessonMeta(id){
  for(const lang of Object.keys(COURSES))
    for(const lv of Object.keys(COURSES[lang]))
      for(const u of COURSES[lang][lv])
        for(const ls of u.lessons)
          if(ls.id === id) return {...ls, lang, level:lv, unit:u.title};
  return null;
}
function lessonLang(id){
  const m = lessonMeta(id);
  return m ? m.lang : 'en';
}

function startLesson(id){
  const meta = lessonMeta(id);
  if(!meta){ location.hash='#/courses'; return; }
  const content = CONTENT[id];
  if(!content){ toast('该课时暂无内容'); location.hash='#/courses'; return; }
  if(meta.type === 'vocab'){
    lessonState = {mode:'vocab', id, meta, words:content.words, idx:0, learned:0, xp:meta.xp};
  } else {
    lessonState = {mode:'quiz', id, meta, items:content.items, idx:0, correct:0, answered:false, xp:meta.xp};
  }
  renderLesson();
}

function renderLesson(){
  const S = lessonState; if(!S){ router(); return; }
  const app = $('#app');
  app.className = 'container';

  // 完成页
  if(S.done){
    const pct = S.mode==='vocab' ? 100 : Math.round(S.correct/S.items.length*100);
    app.innerHTML = `
    <div style="background:#fff;border-radius:20px;padding:48px 32px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,.06);max-width:600px;margin:40px auto">
      <div style="font-size:56px">${pct===100?'🏆':'🎉'}</div>
      <h1 style="font-size:28px;margin:16px 0 8px;font-weight:900">${esc(S.meta.title)} 完成!</h1>
      <p style="color:#909399;font-size:14px">${esc(S.unit||S.meta.type)} · ${new Date().toLocaleString('zh-CN')}</p>
      <div style="display:flex;justify-content:center;gap:20px;margin:32px 0">
        <div style="background:#ecf5ff;color:#409EFF;padding:16px 28px;border-radius:12px">
          <b style="font-size:24px;display:block">+${S.xp}</b><span style="font-size:12px">XP 获得</span>
        </div>
        ${S.mode==='quiz' ? `
        <div style="background:#f0f9eb;color:#67C23A;padding:16px 28px;border-radius:12px">
          <b style="font-size:24px;display:block">${S.correct}/${S.items.length}</b><span style="font-size:12px">正确率 ${pct}%</span>
        </div>` : `
        <div style="background:#f0f9eb;color:#67C23A;padding:16px 28px;border-radius:12px">
          <b style="font-size:24px;display:block">${S.learned}</b><span style="font-size:12px">学习单词</span>
        </div>`}
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn-primary" style="max-width:200px" onclick="location.hash='#/courses'">返回词书</button>
        <button class="btn-primary" style="max-width:200px;background:#67C23A" onclick="location.hash='#/'">回到首页</button>
      </div>
    </div>`;
    return;
  }

  const total = S.mode==='vocab' ? S.words.length : S.items.length;
  const pct = Math.round(S.idx/total*100);

  if(S.mode==='vocab'){
    const w = S.words[S.idx];
    app.innerHTML = `
    <div style="max-width:560px;margin:20px auto 0">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <button style="width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #e4e7ed;cursor:pointer;font-size:16px" onclick="location.hash='#/courses'">←</button>
        <div style="flex:1">
          <div style="font-size:12px;color:#909399">${esc(S.meta.title)} · ${TYPE_META[S.meta.type].name}</div>
          <div style="height:6px;background:#ebeef5;border-radius:4px;margin-top:6px;overflow:hidden">
            <div style="height:100%;background:#409EFF;width:${pct}%;border-radius:4px"></div>
          </div>
        </div>
        <div style="font-size:13px;font-weight:700;color:#909399">${S.idx+1}/${total}</div>
      </div>
      <div style="background:#fff;border-radius:18px;padding:36px 28px;box-shadow:0 2px 12px rgba(0,0,0,.04);text-align:center">
        <div style="font-size:38px;font-weight:900;margin-bottom:10px;letter-spacing:-.5px">${esc(w[0])}</div>
        <div style="color:#409EFF;font-size:15px;font-weight:600;margin-bottom:18px">${esc(w[1]||'')}</div>
        <div style="font-size:18px;font-weight:800;color:#303133;margin-bottom:24px">${esc(w[2])}</div>
        <div style="background:#f5f7fa;border-radius:12px;padding:16px;text-align:left;margin-bottom:24px">
          <div style="font-size:11px;font-weight:800;color:#67C23A;margin-bottom:6px">📖 例句</div>
          <div style="font-size:15px;font-weight:700;color:#303133;line-height:1.6">${esc(w[3])}</div>
          <div style="font-size:13px;color:#909399;margin-top:6px;line-height:1.6">${esc(w[4])}</div>
        </div>
        <button class="btn-primary" onclick="nextVocab()">我记住了 →</button>
      </div>
    </div>`;
  } else if(S.mode==='quiz'){
    const item = S.items[S.idx];
    if(S.meta.type === 'listening'){
      // 听力: 播放原文, 选择译文
      const others = S.items.filter((x,i)=>i!==S.idx).slice(0,3).map(x=>x.m);
      const opts = [item.m, ...others].sort(()=>Math.random()-.5);
      S._lOpts = opts; S._lAns = opts.indexOf(item.m);
      // 自动读
      speak(item.t, lessonLang(S.id));
      app.innerHTML = renderQuizShell(S, pct, total, `
        <div style="background:linear-gradient(135deg,#409EFF,#67C23A);color:#fff;border-radius:14px;padding:28px;text-align:center;margin-bottom:20px">
          <div style="font-size:32px;margin-bottom:8px">🎧</div>
          <div style="font-size:13px;opacity:.9">听音频,选择正确译文</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
            <button style="padding:8px 16px;border-radius:10px;border:none;background:rgba(255,255,255,.22);color:#fff;font-weight:700;cursor:pointer" onclick="speak(${JSON.stringify(item.t)},'${lessonLang(S.id)}')">▶ 再听一次</button>
          </div>
        </div>
        <div class="quiz-opts">
          ${opts.map((o,i)=>`
            <button class="q-opt" data-i="${i}" onclick="answerListen(${i})">
              <span class="q-letter">${String.fromCharCode(65+i)}</span>${esc(o)}
            </button>`).join('')}
        </div>
        <div id="qexp"></div>`);
    } else if(S.meta.type === 'speaking'){
      // 口语: 跟读示范
      speak(item.t, lessonLang(S.id));
      app.innerHTML = renderQuizShell(S, pct, total, `
        <div style="background:linear-gradient(135deg,#F56C6C,#E6A23C);color:#fff;border-radius:14px;padding:28px;text-align:center;margin-bottom:20px">
          <div style="font-size:32px;margin-bottom:8px">🎤</div>
          <div style="font-size:13px;opacity:.9">大声跟读,然后自评</div>
          <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
            <button style="padding:8px 16px;border-radius:10px;border:none;background:rgba(255,255,255,.22);color:#fff;font-weight:700;cursor:pointer" onclick="speak(${JSON.stringify(item.t)},'${lessonLang(S.id)}')">▶ 听示范</button>
          </div>
        </div>
        <div style="background:#fff;border:1px solid #ebeef5;border-radius:12px;padding:20px;margin-bottom:20px">
          <div style="font-size:18px;font-weight:800;color:#303133;margin-bottom:6px">${esc(item.t)}</div>
          ${item.r?`<div style="color:#409EFF;font-size:13px;font-weight:600;margin-bottom:6px">${esc(item.r)}</div>`:''}
          <div style="font-size:13px;color:#909399">${esc(item.m)}</div>
        </div>
        <div id="speakArea">
          <div class="judge-row">
            <button class="jbtn j-no" onclick="speakSelf(false)">需要再练</button>
            <button class="jbtn j-yes" onclick="speakSelf(true)">读得不错</button>
          </div>
        </div>
        <div id="qexp"></div>`);
    } else {
      // 语法
      const letters = ['A','B','C','D'];
      app.innerHTML = renderQuizShell(S, pct, total, `
        <div style="font-size:13px;font-weight:800;color:#E6A23C;margin-bottom:10px">✏️ 语法练习</div>
        <div style="font-size:20px;font-weight:800;color:#303133;line-height:1.6;margin-bottom:20px">${esc(item.q)}</div>
        <div class="quiz-opts">
          ${item.opts.map((o,i)=>`
            <button class="q-opt" data-i="${i}" onclick="answerGrammar(${i})">
              <span class="q-letter">${letters[i]}</span>${esc(o)}
            </button>`).join('')}
        </div>
        <div id="qexp"></div>`);
    }
  }
}

function renderQuizShell(S, pct, total, inner){
  return `
  <div style="max-width:560px;margin:20px auto 0">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
      <button style="width:38px;height:38px;border-radius:10px;background:#fff;border:1px solid #e4e7ed;cursor:pointer;font-size:16px" onclick="if(confirm('放弃本次学习?'))location.hash='#/courses'">←</button>
      <div style="flex:1">
        <div style="font-size:12px;color:#909399">${esc(S.meta.title)} · ${TYPE_META[S.meta.type].name}</div>
        <div style="height:6px;background:#ebeef5;border-radius:4px;margin-top:6px;overflow:hidden">
          <div style="height:100%;background:#409EFF;width:${pct}%;border-radius:4px"></div>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;color:#909399">${S.idx+1}/${total}</div>
    </div>
    <div style="background:#fff;border-radius:18px;padding:32px 28px;box-shadow:0 2px 12px rgba(0,0,0,.04)">
    ${inner}
    </div>
  </div>
  <style>
  .quiz-opts{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
  .q-opt{width:100%;display:flex;align-items:center;gap:12px;padding:14px 16px;background:#f5f7fa;border:2px solid transparent;border-radius:12px;font-size:15px;font-weight:700;color:#303133;text-align:left;cursor:pointer;transition:all .12s}
  .q-opt:hover{background:#ecf5ff}
  .q-opt.right{background:#f0f9eb;border-color:#67C23A;color:#67C23A}
  .q-opt.wrong{background:#fef0f0;border-color:#F56C6C;color:#F56C6C}
  .q-opt.dim{opacity:.4;pointer-events:none}
  .q-letter{width:28px;height:28px;border-radius:8px;background:#e4e7ed;display:grid;place-items:center;font-size:12px;font-weight:800;color:#909399;flex-shrink:0}
  .q-opt.right .q-letter{background:#67C23A;color:#fff}
  .q-opt.wrong .q-letter{background:#F56C6C;color:#fff}
  .explain-box{background:#ecf5ff;color:#1e6fb8;border-radius:10px;padding:14px 16px;font-size:13px;line-height:1.6}
  .explain-box b{font-weight:800}
  .judge-row{display:flex;gap:10px}
  .jbtn{flex:1;padding:14px;border:none;border-radius:12px;font-size:15px;font-weight:800;cursor:pointer;transition:transform .1s}
  .jbtn:active{transform:scale(.97)}
  .j-no{background:#fef0f0;color:#f56c6c}
  .j-yes{background:#f0f9eb;color:#67c23a}
  .next-btn{width:100%;margin-top:14px;padding:12px;background:#409EFF;color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer;font-size:14px}
  </style>`;
}

function nextVocab(){
  const S = lessonState;
  S.learned++; U.stats.words++;
  S.idx++;
  if(S.idx >= S.words.length){
    finishLesson();
  } else {
    saveUser(); renderLesson();
  }
}

function answerGrammar(i){
  const S = lessonState;
  if(S.answered) return;
  S.answered = true;
  const item = S.items[S.idx];
  const right = i === item.a;
  if(right) S.correct++;
  U.stats.quiz++;
  $$('.q-opt').forEach((b,j) => {
    b.onclick = null;
    if(j === item.a) b.classList.add('right');
    else if(j === i) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  $('#qexp').innerHTML = `
    <div class="explain-box" style="margin-top:14px">
      <b>${right?'✓ 回答正确':'✗ 回答错误'}</b><br>
      ${esc(item.explain||'')}
    </div>
    <button class="next-btn" onclick="nextItem()">继续下一题 →</button>`;
  saveUser();
}

function answerListen(i){
  const S = lessonState;
  if(S.answered) return;
  S.answered = true;
  const right = i === S._lAns;
  if(right) S.correct++;
  U.stats.quiz++;
  $$('.q-opt').forEach((b,j) => {
    b.onclick = null;
    if(j === S._lAns) b.classList.add('right');
    else if(j === i) b.classList.add('wrong');
    else b.classList.add('dim');
  });
  const item = S.items[S.idx];
  $('#qexp').innerHTML = `
    <div class="explain-box" style="margin-top:14px">
      <b>${right?'✓ 回答正确':'✗ 回答错误'}</b><br>
      原文: <b>${esc(item.t)}</b><br>${esc(item.m)}
    </div>
    <button class="next-btn" onclick="nextItem()">继续下一题 →</button>`;
  saveUser();
}
function speakSelf(good){
  const S = lessonState;
  if(S.answered) return;
  S.answered = true;
  if(good) S.correct++;
  const col = good ? '#67C23A' : '#E6A23C';
  $('#speakArea').innerHTML = `
    <div style="text-align:center;padding:16px;color:${col};font-weight:800;background:${good?'#f0f9eb':'#fdf6ec'};border-radius:10px;margin-bottom:14px">
      ${good?'✓ 读得不错,继续保持!':'💪 多练习几次会更好的'}
    </div>
    <button class="next-btn" style="display:block;margin:0 auto;max-width:300px" onclick="nextItem()">继续下一题 →</button>`;
  saveUser();
}

function nextItem(){
  const S = lessonState;
  S.answered = false;
  S.idx++;
  if(S.idx >= S.items.length){
    finishLesson();
  } else {
    renderLesson();
  }
}

function finishLesson(){
  const S = lessonState;
  S.done = true;
  const now = new Date();
  const today = now.toDateString();
  // 计算 XP
  if(S.mode === 'vocab'){
    S.xp = S.meta.xp;
  } else {
    S.xp = Math.round(S.meta.xp * Math.max(.4, S.correct/S.items.length));
  }
  U.xp += S.xp;
  U.lessonsDone[S.id] = {at: Date.now(), xp:S.xp};
  // 连续天数
  if(U.streak.last !== today){
    const y = new Date(now.getTime()-86400000).toDateString();
    U.streak.count = (U.streak.last === y) ? U.streak.count+1 : 1;
    U.streak.last = today;
  }
  saveUser();
  toast(`获得 ${S.xp} XP!`);
  renderLesson();
}

/* ---------- 简单 TTS ---------- */
function speak(text, lang){
  try{
    const map = {en:'en-US', ja:'ja-JP', ko:'ko-KR'};
    const u = new SpeechSynthesisUtterance(text);
    u.lang = map[lang] || 'en-US'; u.rate = 0.95;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------- 社区 ---------- */
function renderCommunity(){
  return `
  <div class="section-title">学习社区</div>
  <div style="background:#fff;border-radius:14px;padding:48px 24px;text-align:center;color:#909399">
    <div style="font-size:48px;margin-bottom:12px">💬</div>
    <h3 style="color:#606266">社区模块即将上线</h3>
    <p style="margin-top:8px;font-size:13px">和小伙伴一起打卡、讨论、互助学习。</p>
  </div>`;
}

/* ---------- 我的 ---------- */
function renderMe(){
  const doneCount = Object.keys(U.lessonsDone).length;
  return `
  <div class="section-title">个人中心</div>
  <div style="background:#fff;border-radius:16px;padding:28px;display:flex;align-items:center;gap:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,.03)">
    <div style="width:72px;height:72px;border-radius:50%;background:${U.color};color:#fff;display:grid;place-items:center;font-size:32px;font-weight:800">${U.avatar}</div>
    <div style="flex:1">
      <div style="font-size:22px;font-weight:900">${esc(U.name)}</div>
      <div style="color:#909399;font-size:13px;margin-top:4px">${esc(U.email)} · 注册于 ${new Date(U.createdAt).toLocaleDateString('zh-CN')}</div>
      <div style="color:#67C23A;font-size:13px;font-weight:700;margin-top:6px">🔥 连续学习 ${U.streak.count} 天</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px">
    <div style="background:#fff;border-radius:12px;padding:18px 6px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.03)"><b style="font-size:22px;display:block">${U.xp}</b><span style="font-size:12px;color:#909399">总 XP</span></div>
    <div style="background:#fff;border-radius:12px;padding:18px 6px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.03)"><b style="font-size:22px;display:block">${doneCount}</b><span style="font-size:12px;color:#909399">完成课时</span></div>
    <div style="background:#fff;border-radius:12px;padding:18px 6px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.03)"><b style="font-size:22px;display:block">${U.stats.words}</b><span style="font-size:12px;color:#909399">学过词汇</span></div>
    <div style="background:#fff;border-radius:12px;padding:18px 6px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.03)"><b style="font-size:22px;display:block">${U.stats.quiz}</b><span style="font-size:12px;color:#909399">答题次数</span></div>
  </div>`;
}

/* expose */
window.nextVocab = nextVocab; window.answerGrammar = answerGrammar;
window.answerListen = answerListen; window.speakSelf = speakSelf; window.nextItem = nextItem;

/* ---------- 启动 ---------- */
window.addEventListener('hashchange', router);
tryRestoreSession();
router();
