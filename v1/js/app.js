/* 语界 v1 · 应用逻辑: 注册/登录(mock API) + SPA 路由 + 顶部导航 */
'use strict';

const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS_KEY = 'linguaverse_v1';

/* ---------- Mock API (setTimeout 模拟) ---------- */
const MockAPI = {
  register(name, email, password){
    return new Promise((res, rej) => {
      setTimeout(() => {
        if(!name || !email || !password) return rej({msg:'请填写完整信息'});
        if(password.length < 6) return rej({msg:'密码至少 6 位'});
        if(email && !email.includes('@')) return rej({msg:'邮箱格式不正确'});
        // 模拟查重
        const users = JSON.parse(localStorage.getItem(LS_KEY+'_users') || '[]');
        if(users.find(u => u.email === email)) return rej({msg:'该邮箱已注册'});
        const user = {
          id: 'u' + Date.now().toString(36),
          name, email,
          avatar: ['🐻','🐱','🦊','🐼','🐰','🐸','🦁','🐯'][Math.floor(Math.random()*8)],
          color: ['#409EFF','#67C23A','#E6A23C','#F56C6C','#909399'][Math.floor(Math.random()*5)],
          createdAt: Date.now(),
          xp: 0, lessonsDone: {}, streak: {count:0, last:''}, stats:{words:0,quiz:0}
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
        // 简化: 只要邮箱存在就允许登录(演示环境)
        res({token:'mock-'+u.id, user:u});
      }, 500);
    });
  }
};

/* ---------- 用户状态 ---------- */
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
function logout(){
  localStorage.removeItem(LS_KEY+'_token');
  U = null;
  router();
}

/* ---------- Toast ---------- */
let tTimer = null;
function toast(msg){
  if(tTimer) clearTimeout(tTimer);
  const old = $('#toastId'); if(old) old.remove();
  const t = document.createElement('div');
  t.id = 'toastId'; t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  tTimer = setTimeout(() => t.remove(), 2200);
}

/* ---------- SPA 路由 ---------- */
let route = 'home';
let courseState = {lang:'en', level:null};

function router(){
  const hash = location.hash || '#/';
  const parts = hash.replace('#/','').split('/').filter(Boolean);
  route = parts[0] || 'home';
  if(!U){
    renderAuth();
    return;
  }
  // 渲染导航
  $('#navbar').hidden = false;
  $$('#navLinks a').forEach(a => a.classList.toggle('active', a.dataset.route === route));
  const av = $('#navUser');
  av.innerHTML = `<div class="avatar" style="background:${U.color}">${U.avatar}</div>
    <span style="font-weight:700">${esc(U.name)}</span>
    <button onclick="logout()">退出</button>`;
  const app = $('#app');
  app.className = 'container';
  if(route === 'home') app.innerHTML = renderHome();
  else if(route === 'courses') app.innerHTML = renderCourses();
  else if(route === 'community') app.innerHTML = renderCommunity();
  else if(route === 'me') app.innerHTML = renderMe();
  else { route = 'home'; location.hash = '#/'; }
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
  const todayStr = new Date().toLocaleDateString('zh-CN');
  const totalWords = Object.values(CONTENT).reduce((s,c)=>s+(c.words?c.words.length:0),0);
  const totalLessons = Object.values(COURSES).reduce((s,lang)=>
    s+Object.values(lang).reduce((ss,lv)=>ss+lv.reduce((s2,u)=>s2+u.lessons.length,0),0),0);
  return `
  <div class="hero">
    <h1>🌏 欢迎回来, ${esc(U.name)}</h1>
    <p>语界是一款多语种在线教育平台,覆盖英语(A1/B2)、日语(N5/N3)、韩语(TOPIK I-III),
      提供单词、语法、听力、口语四大学习模块。坚持每日学习,见证语言能力的稳步提升。</p>
    <div class="hero-stats">
      <div class="hs"><b>${Object.keys(LANGUAGES).length}</b><span>支持语种</span></div>
      <div class="hs"><b>${totalLessons}</b><span>精品课时</span></div>
      <div class="hs"><b>${totalWords}</b><span>精选词汇</span></div>
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
          <div class="lesson-item g-${ls.type}">
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

/* ---------- 社区 (占位: commit 5 完善) ---------- */
function renderCommunity(){
  return `
  <div class="section-title">学习社区</div>
  <div style="background:#fff;border-radius:14px;padding:48px 24px;text-align:center;color:#909399">
    <div style="font-size:48px;margin-bottom:12px">💬</div>
    <h3 style="color:#606266">社区模块即将上线</h3>
    <p style="margin-top:8px;font-size:13px">和小伙伴一起打卡、讨论、互助学习。</p>
  </div>`;
}

/* ---------- 我的 (占位: commit 5 完善) ---------- */
function renderMe(){
  return `
  <div class="section-title">个人中心</div>
  <div style="background:#fff;border-radius:14px;padding:48px 24px;text-align:center;color:#909399">
    <div style="font-size:48px;margin-bottom:12px">👤</div>
    <h3 style="color:#606266">${esc(U.name)}</h3>
    <p style="margin-top:8px;font-size:13px">注册时间: ${new Date(U.createdAt).toLocaleDateString('zh-CN')}</p>
    <p style="margin-top:4px;font-size:13px">邮箱: ${esc(U.email)}</p>
  </div>`;
}

/* ---------- 启动 ---------- */
window.addEventListener('hashchange', router);
tryRestoreSession();
router();
