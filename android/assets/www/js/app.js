/* ============================================================
   语界 · 应用逻辑  v4.1
   本地账号 · 不背单词式词卡 · SRS 间隔复习 · 澎湃美学 UI
   🔊 发音（多级引擎, 自动选择）:
      ① 在线: 微软 Edge TTS 自然语音 (WebSocket 直连, 免费, 音质最佳)
      ② 系统语音: speechSynthesis (设备本地, 自然音质)
      ③ 最终回退: meSpeak.js 纯 JS 合成 WAV (零外部依赖, 保证离线可用)
      ④ 在线合成结果 Blob 永久缓存到 IndexedDB, 下次命中秒开
   ✨ 体验: 左右滑动评分 / 上下滑动翻面 / 长按发音 / 自动朗读
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
const AVATARS = ['🐻','🐱','🦊','🐼','🐰','🐸','🦁','🐯','🐨','🦉','🐳','🦋'];
const COLORS  = ['#FF6A3D','#00B578','#2E6BFF','#FA5151','#A855F7','#8A6BE0','#00A8C6','#C13A54','#B8860B'];
const colorOf = s => COLORS[[...s].reduce((x,c)=>x+c.charCodeAt(0),0)%COLORS.length];
const delay = ms => new Promise(r => setTimeout(r, ms));

/* 词义归一化: 兼容英语富格式与日韩简格式 */
function normWord(lessonId, raw){
  if(!raw) return {w:'',ph:'',def:'',root:'',ex:[]};
  if(Array.isArray(raw[4] && raw[4][0])){
    return { w:raw[0], ph:raw[1]||'', def:raw[2]||'', root:raw[3]||'',
      ex:(raw[4]||[]).map(e=>({t:e[0]||'', m:e[1]||'', tag:e[2]||''})) };
  }
  return { w:raw[0]||'', ph:raw[1]||'', def:raw[2]||'', root:'', ex:[{t:raw[3]||'', m:raw[4]||'', tag:''}] };
}
function lessonWords(lessonId){
  const c = CONTENT[lessonId];
  if(c && c.words && c.words.length) return c.words.map(w => normWord(lessonId, w));
  // v4.0 词库范围查询: 四六级扩充词库由 data_words_patch.js 的 *LESSONS_RANGE 提供切片
  const rangeMap = (window.CET4_LESSONS_RANGE && window.CET4_LESSONS_RANGE[lessonId] && [window.CET4_WORDS, window.CET4_LESSONS_RANGE[lessonId]])
                || (window.CET6_LESSONS_RANGE && window.CET6_LESSONS_RANGE[lessonId] && [window.CET6_WORDS, window.CET6_LESSONS_RANGE[lessonId]]);
  if(rangeMap){
    const [arr, rng] = rangeMap;
    if(arr && Array.isArray(rng)){
      return arr.slice(rng[0], rng[1]).map(w => normWord(lessonId, w));
    }
  }
  return [];
}

/* ---------- 本地数据库 ---------- */
const LS_KEY = 'yujie_v3';
let DB = (() => {
  try{ const d = JSON.parse(localStorage.getItem(LS_KEY)); if(d && d.users) return d; }catch(e){}
  return { users:[], session:null, prefs:{autoSpeak:true, theme:'hyper', accent:'orange'} };
})();
if(!DB.prefs) DB.prefs = {autoSpeak:true, theme:'hyper', accent:'orange'};
const save = () => { try{ localStorage.setItem(LS_KEY, JSON.stringify(DB)); }catch(e){} };
let U = DB.users.find(u => u.id === DB.session) || null;

function newUser(name, avatar, lang, level, goal){
  return {
    id:'u'+Date.now().toString(36), name, avatar, color:colorOf(name),
    createdAt:Date.now(), lang, level, dailyGoal:goal, ttsRate:1,
    xp:0,
    streak:{count:0, last:'', days:{}},
    log:{},
    stats:{decks:0,words:0,reviews:0,grammar:0,listen:0,speak:0},
    srs:{},
    lessons:{},
    badges:[],
  };
}
const levelOf   = (l,lv) => LANGUAGES[l] && LANGUAGES[l].levels.find(x=>x.id===lv) || {name:l, desc:''};
const userLevel = () => levelOf(U && U.lang, U && U.level);

/* ---------- Toast / 彩带 / 触感 ---------- */
function toast(msg, icon){
  try{
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="toast-ic">${icon||'✨'}</span><span>${esc(msg)}</span>`;
    const host = $('#toasts');
    if(!host) return;
    host.appendChild(t);
    setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>{ try{t.remove();}catch(e){} }, 320); }, 2200);
  }catch(e){}
}
function confetti(){
  try{
    const colors=['#FF6A3D','#2E6BFF','#00B578','#FA5151','#A855F7','#FFB800'];
    for(let i=0;i<70;i++){
      const c=document.createElement('div');
      c.className='confetti';
      c.style.cssText=`left:${Math.random()*100}%;background:${colors[i%colors.length]};animation-delay:${Math.random()*.6}s;animation-duration:${2+Math.random()*1.4}s;transform:rotate(${Math.random()*360}deg);width:${6+Math.random()*6}px;height:${10+Math.random()*10}px;border-radius:2px;`;
      document.body.appendChild(c);
      setTimeout(()=>{ try{c.remove();}catch(e){} }, 4200);
    }
  }catch(e){}
}
function haptic(strength){
  try{
    if(!navigator.vibrate) return;
    if(strength==='heavy') navigator.vibrate([20,30,20]);
    else if(strength==='medium') navigator.vibrate(15);
    else navigator.vibrate(5);
  }catch(e){}
}
/* ============================================================
   🔊 语音 · 纯内置 meSpeak (零外部服务)
   ============================================================ */
/* meSpeak 引导层 */
const ME = {
  ready: false,
  initAttempt: false,
  rate: 170,       // eSpeak wpm, 英/美默认 175 左右
  pitch: 60,       // 0-99
  vol: 1,
  audioEl: null,
  voiceLoaded: {en:false, zh:false, ja:false, ko:false},
  ensure(){
    if(this.ready) return true;
    if(!this.initAttempt){
      this.initAttempt = true;
      try{
        const ms = window.mespeak || window.meSpeak;
        if(!ms) return false;
        const cfg = window.MESPEAK_CONFIG;
        if(cfg && ms.loadConfig){ try{ ms.loadConfig(cfg); }catch(_){} }
        // 英语(美音) + 英语RP + 中文(普通话) 语音预置
        if(window.VOICE_EN_US){ try{ ms.loadVoice(window.VOICE_EN_US); this.voiceLoaded.en = true; ms.setDefaultVoice && ms.setDefaultVoice('en-us'); }catch(_){} }
        if(window.VOICE_ZH   ){ try{ ms.loadVoice(window.VOICE_ZH);    this.voiceLoaded.zh = true; }catch(_){} }
        if(window.VOICE_EN_RP){ try{ ms.loadVoice(window.VOICE_EN_RP); }catch(_){} }
        this.ready = !!(ms && ms.speak && ms.isConfigLoaded && ms.isConfigLoaded());
      }catch(e){ this.ready = false; }
    }
    return this.ready;
  },
  /** 将 meSpeak 参数映射成不同语言的 voice + 语速 */
  langToVoice(langId, accent){
    if(langId === 'en'){
      if(accent === 'british' && this.voiceLoaded.en) return {voice:undefined, variant:undefined}; // RP 默认音
      return {voice:undefined, variant:undefined}; // 已default 是en-us
    }
    if(langId === 'zh') return {voice:'zh', variant:undefined};
    if(langId === 'ja') return {voice:undefined, variant:undefined}; // meSpeak内没ja, 走内部eSpeak ja音(若可用)
    if(langId === 'ko') return {voice:undefined, variant:undefined};
    return {voice:undefined, variant:undefined};
  },
  synthesize(text, langId, userRate){
    this.ensure();
    const ms = window.mespeak || window.meSpeak;
    if(!ms || !this.ready) return null;
    try{
      const opts = { rawdata: true };
      opts.speed = Math.max(80, Math.min(400, Math.round(170 * (userRate || 1))));
      opts.pitch = this.pitch;
      opts.amplitude = Math.max(20, Math.min(200, Math.round(200 * this.vol)));
      // 语言voice
      if(langId === 'zh' && this.voiceLoaded.zh) opts.voice = 'zh';
      if(langId === 'en') {
        // 无特殊voice, 用已默认的en-us; 但日语/韩语如果内置 eSpeak 支持,可以传voice
      }
      const ab = ms.speak(text, opts);
      if(!ab) return null;
      // 转 Uint8Array -> Blob (audio/wav)
      const u8 = (ab instanceof Uint8Array) ? ab : new Uint8Array(ab);
      return new Blob([u8], {type:'audio/wav'});
    }catch(e){
      return null;
    }
  },
  playBlob(blob, rate){
    return new Promise(res=>{
      try{
        if(!this.audioEl) this.audioEl = new Audio();
        const a = this.audioEl;
        try{ if(!a.paused) a.pause(); }catch(_){}
        const old = a.src;
        a.src = URL.createObjectURL(blob);
        if(old) try{ URL.revokeObjectURL(old); }catch(_){}
        a.playbackRate = rate || 1;
        let done=false;
        const f=(ok)=>{ if(done)return; done=true; try{URL.revokeObjectURL(a.src);}catch(_){} res(!!ok); };
        a.onended = ()=>f(true); a.onerror = ()=>f(false);
        const p = a.play();
        if(p && p.catch) p.catch(()=>f(false));
        setTimeout(()=>f(false), 15000);
      }catch(e){ res(false); }
    });
  },
  stop(){
    try{ if(this.audioEl) this.audioEl.pause(); }catch(_){}
    try{ if(window.speechSynthesis) window.speechSynthesis.cancel(); }catch(_){}
    const ms = window.mespeak || window.meSpeak;
    if(ms && ms.resetQueue) try{ ms.resetQueue(); }catch(_){}
    if(ms && ms.stop) try{ ms.stop(); }catch(_){}
  }
};

/* ============================================================
   🔊 在线自然语音 · Microsoft Edge TTS
   (WebSocket 直连微软朗读服务, 免费, 无需 API Key, 音质自然)
   失败 / 离线时自动回退 meSpeak 内置引擎。
   ============================================================ */

/* 纯 JS SHA-256 (用于生成 Sec-MS-GEC 鉴权参数, 兼容无 crypto.subtle 环境) */
function sha256hex(str){
  const K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const rr=(x,n)=>(x>>>n)|(x<<(32-n));
  let bytes;
  try{ bytes = new TextEncoder().encode(str); }
  catch(_){ const s=unescape(encodeURIComponent(str)); bytes=[]; for(let i=0;i<s.length;i++)bytes.push(s.charCodeAt(i)&255); }
  const l = bytes.length;
  const total = ((l+9+63)>>6)<<6;             // 补齐到 64 字节倍数
  const pad = new Array(total).fill(0);
  for(let i=0;i<l;i++) pad[i]=bytes[i];
  pad[l]=0x80;
  const bits = l*8;                            // 消息长度 < 512MB, 高32位恒为0
  pad[total-1]=bits&255; pad[total-2]=(bits>>>8)&255; pad[total-3]=(bits>>>16)&255; pad[total-4]=(bits>>>24)&255;
  const H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  for(let off=0; off<total; off+=64){
    const w=new Array(64);
    for(let i=0;i<16;i++) w[i]=(pad[off+i*4]<<24)|(pad[off+i*4+1]<<16)|(pad[off+i*4+2]<<8)|pad[off+i*4+3];
    for(let i=16;i<64;i++){
      const s0=rr(w[i-15],7)^rr(w[i-15],18)^(w[i-15]>>>3);
      const s1=rr(w[i-2],17)^rr(w[i-2],19)^(w[i-2]>>>10);
      w[i]=(w[i-16]+s0+w[i-7]+s1)|0;
    }
    let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
    for(let i=0;i<64;i++){
      const S1=rr(e,6)^rr(e,11)^rr(e,25), ch=(e&f)^(~e&g);
      const t1=(h+S1+ch+K[i]+w[i])|0;
      const S0=rr(a,2)^rr(a,13)^rr(a,22), mj=(a&b)^(a&c)^(b&c);
      const t2=(S0+mj)|0;
      h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;
    }
    H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;
    H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;
  }
  return H.map(x=>(x>>>0).toString(16).padStart(8,'0')).join('');
}

const ETTS = {
  TOKEN: '6A5AA1D4EAFF4E9FB37E23D68491D6F4',   // Edge 公开 TrustedClientToken
  BASE : 'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1',
  GEC_VER: '1-143.0.3650.75',                  // 须与当前 Edge 版本同步, 过旧会被服务端 403
  VOICES: {
    en: { us:'en-US-AriaNeural',  gb:'en-GB-SoniaNeural' },
    zh: 'zh-CN-XiaoxiaoNeural',
    ja: 'ja-JP-NanamiNeural',
    ko: 'ko-KR-SunHiNeural',
  },
  uuid(){
    const h='0123456789abcdef'; let s='';
    for(let i=0;i<32;i++) s+=h[Math.floor(Math.random()*16)];
    return s;
  },
  /* Sec-MS-GEC = SHA-256(TrustedClientToken + WindowsFileTime) 大写hex; 时间取整到5分钟 */
  secGec(){
    const WIN_EPOCH = 11644473600;              // 1601→1970 秒差
    const secs = Math.floor(Date.now()/1000/300)*300 + WIN_EPOCH;
    return sha256hex(this.TOKEN + secs + '0000000').toUpperCase();   // ×10^7 = 100ns 刻度
  },
  voiceOf(langId, accent){
    const v = this.VOICES[langId] || this.VOICES.en;
    if(typeof v === 'string') return v;
    return (langId==='en' && accent==='british') ? v.gb : v.us;
  },
  rateFmt(r){
    const p = Math.round(((r||1)-1)*100);
    return p===0 ? 'default' : (p>0?'+':'')+p+'%';
  },
  /* 合成自然语音, resolve(audio/mpeg Blob), 失败 reject */
  synthesize(text, langId, userRate, accent){
    return new Promise((resolve, reject)=>{
      let voice;
      try{ voice = this.voiceOf(langId, accent); }catch(e){ return reject(e); }
      if(!voice) return reject(new Error('etts-no-voice'));
      const connectId = this.uuid();
      const url = this.BASE
        + '?TrustedClientToken=' + this.TOKEN
        + '&Sec-MS-GEC=' + this.secGec()
        + '&Sec-MS-GEC-Version=' + this.GEC_VER
        + '&ConnectionId=' + connectId;
      let ws;
      try{ ws = new WebSocket(url); }
      catch(e){ return reject(e); }
      ws.binaryType = 'arraybuffer';
      const chunks = [];
      let done = false;
      const finish = (err, blob)=>{
        if(done) return; done = true;
        clearTimeout(timer);
        try{ ws.close(); }catch(_){}
        if(err) reject(err); else resolve(blob);
      };
      const timer = setTimeout(()=>finish(new Error('etts-timeout')), 15000);
      const dstr = ()=>{ try{ return new Date().toString(); }catch(_){ return ''; } };
      ws.onopen = ()=>{
        try{
          ws.send(
            'X-Timestamp:'+dstr()+'\r\n'
            + 'Content-Type:application/json; charset=utf-8\r\n'
            + 'Path:speech.config\r\n\r\n'
            + JSON.stringify({context:{synthesis:{audio:{
                metadataoptions:{sentenceBoundaryEnabled:'false', wordBoundaryEnabled:'false'},
                outputFormat:'audio-24khz-48kbitrate-mono-mp3'}}}})
          );
          const escT = String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
          const locale = voice.split('-').slice(0,2).join('-');
          const ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='"+locale+"'>"
            + "<voice name='"+voice+"'><prosody rate='"+this.rateFmt(userRate)+"' volume='+0%'>"+escT+"</prosody></voice></speak>";
          ws.send(
            'X-RequestId:'+this.uuid()+'\r\n'
            + 'Content-Type:application/ssml+xml\r\n'
            + 'X-Timestamp:'+dstr()+'Z\r\n'
            + 'Path:ssml\r\n\r\n' + ssml
          );
        }catch(e){ finish(e); }
      };
      ws.onmessage = ev=>{
        if(done) return;
        if(typeof ev.data === 'string'){
          const m = /Path:(\w+)/.exec(ev.data);
          if(m && m[1] === 'turn.end'){
            if(chunks.length){
              const size = chunks.reduce((n,c)=>n+c.length, 0);
              const out = new Uint8Array(size);
              let o = 0; chunks.forEach(c=>{ out.set(c, o); o += c.length; });
              finish(null, new Blob([out], {type:'audio/mpeg'}));
            } else finish(new Error('etts-empty'));
          }
          return;
        }
        try{                                    // 二进制帧: 头2字节(大端)=头部长度, 其后为音频
          const d = new Uint8Array(ev.data);
          if(d.length > 2){
            const hlen = (d[0]<<8)|d[1];
            if(d.length > hlen+2) chunks.push(d.slice(hlen+2));
          }
        }catch(_){}
      };
      ws.onerror  = ()=>finish(new Error('etts-error'));
      ws.onclose  = ()=>{ if(!done) finish(new Error('etts-close')); };
    });
  }
};

/* 系统语音 (浏览器/WebView speechSynthesis): 音质通常自然, 但依赖设备已装语音包且不可缓存 */
const SYS = {
  findVoice(langId){
    try{
      const ss = window.speechSynthesis;
      if(!ss) return null;
      const target = {en:'en', zh:'zh', ja:'ja', ko:'ko'}[langId] || 'en';
      return ss.getVoices().find(v => (v.lang||'').toLowerCase().replace('_','-').startsWith(target)) || null;
    }catch(_){ return null; }
  },
  speak(text, langId, rate){
    return new Promise(res=>{
      try{
        const ss = window.speechSynthesis;
        if(!ss) return res(false);
        const u = new SpeechSynthesisUtterance(text);
        const v = this.findVoice(langId);
        if(v){ u.voice = v; u.lang = v.lang; }
        else  { u.lang = {en:'en-US',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR'}[langId] || 'en-US'; }
        u.rate = Math.max(0.4, Math.min(2, rate||1));
        let settled = false;
        const done = ok => { if(settled) return; settled = true; clearTimeout(timer); res(!!ok); };
        const timer = setTimeout(()=>done(false), 12000);
        u.onend  = ()=>done(true);
        u.onerror = ()=>done(false);
        ss.speak(u);
        // 部分WebView不回调事件: 1.2秒内未开始朗读则判失败走回退
        setTimeout(()=>{ try{ if(!settled && !ss.speaking && !ss.pending) done(false); }catch(_){} }, 1200);
      }catch(e){ res(false); }
    });
  }
};

const AUD = {
  idb: null,
  dbReady: false,
  // netMode 仍保留但发音不再使用, 保留用于未来词包更新等(非TTS)用途
  netMode: (typeof navigator !== 'undefined' && navigator.onLine !== false),
  async openDB(){
    if(this.dbReady) return this.idb;
    return new Promise(res=>{
      try{
        const req = indexedDB.open('yujie_audio', 1);
        req.onupgradeneeded = e => {
          try{ const db = e.target.result; if(!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', {keyPath:'k'}); }catch(_){}
        };
        req.onsuccess = e => { this.idb = e.target.result; this.dbReady = true; res(this.idb); };
        req.onerror = () => res(null);
      }catch(e){ res(null); }
    });
  },
  async blobGet(k){
    await this.openDB();
    if(!this.idb) return null;
    return new Promise(res=>{
      try{
        const tx = this.idb.transaction('blobs','readonly');
        const r = tx.objectStore('blobs').get(k);
        r.onsuccess = () => res(r.result ? r.result.b : null);
        r.onerror = () => res(null);
      }catch(e){ res(null); }
    });
  },
  async blobPut(k, b){
    try{
      await this.openDB();
      if(!this.idb) return;
      const tx = this.idb.transaction('blobs','readwrite');
      tx.objectStore('blobs').put({k, b});
    }catch(e){}
  },
};

/* ---------- 公共 speak() 入口（在线自然语音优先, 离线自动回退内置引擎） ---------- */
let _speaking = false;
async function speak(text, langId, rate, opts){
  try{
    if(!text) return false;
    opts = opts || {};
    rate = rate || (U && U.ttsRate) || 1;
    langId = langId || (U && U.lang) || 'en';
    // 停止之前的发音
    if(_speaking){
      try{ ME.stop(); }catch(_){}
    }
    _speaking = true;
    const source = opts.source || 'word';
    const accent = (U && U.accent) || '';
    const textNorm = typeof text === 'string' ? text.trim() : String(text || '').trim();
    if(!textNorm) return false;

    // 是否走在线引擎: 设置开启 且 当前在线
    const online = (DB.prefs && DB.prefs.ttsOnline !== false)
                && (typeof navigator === 'undefined' || navigator.onLine !== false);
    const cacheable = (source === 'word' || source === 'sentence');
    const baseKey = langId + '::' + (accent||'') + '::' + rate + '::' + textNorm.toLowerCase();
    let ok = false;

    // ---- ① IndexedDB 缓存命中 (语速已包含在缓存内容中, 播放不二次加速) ----
    if(cacheable){
      const engine = online ? 'etts' : 'mespeak';
      const blob = await AUD.blobGet(engine + '::' + baseKey);
      if(blob && blob.size > 200){
        try{ ok = await ME.playBlob(blob, 1); }catch(e){ ok=false; }
      }
    }

    // ---- ② 在线: 微软 Edge TTS 自然语音, 成功后缓存 ----
    if(!ok && online){
      try{
        const blob = await ETTS.synthesize(textNorm, langId, rate, accent);
        if(blob && blob.size > 500){
          if(cacheable) AUD.blobPut('etts::' + baseKey, blob).catch(()=>{});
          try{ ok = await ME.playBlob(blob, 1); }catch(e){ ok=false; }
        }
      }catch(e){ /* 在线失败 → 系统语音/内置引擎 */ }
    }

    // ---- ③ 系统语音 (speechSynthesis, 设备本地, 音质自然但不可缓存) ----
    if(!ok){
      try{ ok = await SYS.speak(textNorm, langId, rate); }catch(e){ ok=false; }
    }

    // ---- ④ 最终回退: meSpeak.js 纯 JS 合成 WAV, 缓存并播放 ----
    if(!ok){
      const blob = ME.synthesize(textNorm, langId, rate);
      if(blob && blob.size > 200){
        if(cacheable) AUD.blobPut('mespeak::' + baseKey, blob).catch(()=>{});
        try{ ok = await ME.playBlob(blob, 1); }catch(e){ ok=false; }
      }
    }

    return !!ok;
  }catch(e){
    return false;
  }finally{
    setTimeout(()=>{ _speaking = false; }, 200);
  }
}

/* __ttsReady 回调保留空实现(兼容旧安卓端, 不再依赖) */
window.__ttsReady = function(){};
/* 确保首次交互时 ME WebAudio 解锁 (安卓WebView首次必须用户手势才能播) */
document.addEventListener('click', ()=>{ try{ ME.ensure(); }catch(_){} }, {once:true, capture:true});
document.addEventListener('touchstart', ()=>{ try{ ME.ensure(); }catch(_){} }, {once:true, capture:true});

/* 网络状态监听 (保留作UI提示, 不影响TTS) */
try{
  window.addEventListener('online',  ()=>{ AUD.netMode = true;  }, {passive:true});
  window.addEventListener('offline', ()=>{ AUD.netMode = false; }, {passive:true});
  AUD.netMode = navigator.onLine !== false;
}catch(e){ AUD.netMode = true; }

try{ AUD.openDB().catch(()=>{}); }catch(e){}

/* ---------- 导航 ---------- */
let tab = 'home';
let courseView = null;
let ob = null;
let courseLangTab = null;

function go(t){ tab = t; courseView = null; render(); }
function openCourse(l, lv){ courseView = {lang:l, level:lv}; render(); }

/* ---------- 渲染入口 ---------- */
function render(){
  if(!U){ renderOnboard(); return; }
  if(!courseLangTab) courseLangTab = U.lang;
  const tb = $('#tabbar');
  if(tb) tb.hidden = false;
  $$('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  const app = $('#app');
  if(!app) return;
  if(courseView){ app.innerHTML = renderCourseDetail(); }
  else if(tab === 'home')    app.innerHTML = renderHome();
  else if(tab === 'courses') app.innerHTML = renderCourses();
  else if(tab === 'review')  app.innerHTML = renderReview();
  else if(tab === 'me')      app.innerHTML = renderMe();
  app.scrollTop = 0;
  bindCommon();
  const page = app.firstElementChild;
  if(page){ page.classList.add('fade-slide-in'); }
}

function bindCommon(){
  $$('.tab').forEach(b => {
    b.onclick = () => { haptic('light'); go(b.dataset.tab); };
  });
  // 词书 pill 切换语言
  $$('.pill[data-lang]').forEach(b=>{
    b.onclick = ()=>{ haptic('light'); courseLangTab = b.dataset.lang; render(); };
  });
}

/* ============================================================
   引导 · 创建本地账号 (三步 · 澎湃美学大卡片)
   ============================================================ */
function startOnboard(){
  ob = { step:1, name:'', avatar:AVATARS[Math.floor(Math.random()*AVATARS.length)],
         lang:'en', level:'cet4', goal:20 };
  renderOnboard();
}
function renderOnboard(){
  const tb = $('#tabbar');
  if(tb) tb.hidden = true;
  const el = $('#app');
  if(!el) return;
  const total = 3;
  const stepBar = Array.from({length:total},(_,i)=>`<span class="step-dot ${i<ob.step?'on':''} ${i===ob.step-1?'cur':''}"></span>`).join('');

  let html = `<div class="onboard hyper">
    <div class="ob-head">
      <div class="ob-logo-card"><span class="ob-logo">🌏</span></div>
      <div class="stepbar">${stepBar}</div>
    </div>`;

  if(ob.step === 1){
    html += `
    <div class="ob-hero">
      <h1 class="display">推开语言的大门<span class="accent">.</span></h1>
      <p class="subtle">四六级 · 日语 · 韩语 · 不背单词式学习 · 数据全在本机</p>
    </div>
    <div class="ob-form card card-xl">
      <div class="field">
        <label class="label">怎么称呼你?</label>
        <input id="obName" class="input" placeholder="昵称 (1-12字)" maxlength="12" value="${esc(ob.name)}" autocomplete="off">
      </div>
      <div class="field">
        <label class="label">挑个头像</label>
        <div class="avatar-pick">
          ${AVATARS.map(a=>`<button class="avatar-opt ${a===ob.avatar?'on':''}" data-a="${a}">${a}</button>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary btn-xl" id="obNext">下一步 →</button>
    </div>`;
  }
  else if(ob.step === 2){
    html += `
    <div class="ob-hero">
      <h1 class="display">选一门语言<span class="accent">，</span>一起出发</h1>
      <p class="subtle">词书和等级可以随时切换</p>
    </div>
    <div class="lang-list">
      ${Object.values(LANGUAGES).map(l=>`
        <button class="lang-card ${ob.lang===l.id?'on':''}" data-l="${l.id}">
          <div class="lc-flag">${l.flag}</div>
          <div class="lc-body">
            <div class="lc-name">${l.name}<span class="lc-native"> / ${l.native}</span></div>
            <div class="lc-count">${l.levels.length} 个等级 · 适配 SRS 复习</div>
          </div>
          <div class="lc-check">${ob.lang===l.id?'✓':''}</div>
        </button>`).join('')}
    </div>
    <div class="ob-form">
      <label class="label" style="display:block;margin:18px 0 10px;">当前语言等级</label>
      <div class="pill-row">
        ${(LANGUAGES[ob.lang].levels||[]).map(lv=>`
          <button class="pill ${ob.level===lv.id?'on':''}" data-lv="${lv.id}">${lv.name}</button>`).join('')}
      </div>
      <div class="row-btns">
        <button class="btn btn-ghost btn-lg" id="obBack">← 上一步</button>
        <button class="btn btn-primary btn-lg" id="obNext">下一步 →</button>
      </div>
    </div>`;
  }
  else{
    const goals = [
      {n:10, tag:'轻松入门',  desc:'每天 10 个新词 + 复习'},
      {n:20, tag:'日常打卡',  desc:'推荐给备考四级的同学'},
      {n:30, tag:'进阶训练',  desc:'六级冲刺推荐 30+'},
      {n:40, tag:'学霸模式',  desc:'高强度备考 / 突击'},
    ];
    html += `
    <div class="ob-hero">
      <h1 class="display">定个小目标<span class="accent">✨</span></h1>
      <p class="subtle">每天学习 + 复习的单词总量，以后可以改</p>
    </div>
    <div class="goal-grid">
      ${goals.map(g=>`
        <button class="goal-card ${ob.goal===g.n?'on':''}" data-g="${g.n}">
          <div class="g-tag">${g.tag}</div>
          <div class="g-num">${g.n}</div>
          <div class="g-desc">${g.desc}</div>
        </button>`).join('')}
    </div>
    <div class="row-btns" style="margin-top:22px">
      <button class="btn btn-ghost btn-lg" id="obBack">← 上一步</button>
      <button class="btn btn-primary btn-lg" id="obDone">开始学习 🚀</button>
    </div>`;
  }

  html += `</div>`;
  el.innerHTML = html;

  if(ob.step===1){
    const input = $('#obName');
    setTimeout(()=>{ try{ input && input.focus(); }catch(_){} }, 120);
    $$('.avatar-opt').forEach(b => b.onclick = () => {
      if(input) ob.name = input.value.trim();
      ob.avatar = b.dataset.a; haptic('light'); renderOnboard();
    });
    $('#obNext').onclick = () => {
      const n = input ? input.value.trim() : '';
      if(!n){ toast('先给自己起个名字吧','✏️'); try{input.focus();}catch(_){} return; }
      ob.name = n; ob.step = 2; haptic('medium'); renderOnboard();
    };
  }
  else if(ob.step===2){
    $$('.lang-card').forEach(b => b.onclick = () => {
      ob.lang = b.dataset.l;
      ob.level = (LANGUAGES[ob.lang].levels && LANGUAGES[ob.lang].levels[0] && LANGUAGES[ob.lang].levels[0].id) || ob.level;
      haptic('light'); renderOnboard();
    });
    $$('.pill[data-lv]').forEach(b => b.onclick = () => { ob.level = b.dataset.lv; haptic('light'); renderOnboard(); });
    $('#obBack').onclick = () => { ob.step = 1; renderOnboard(); };
    $('#obNext').onclick = () => { ob.step = 3; haptic('medium'); renderOnboard(); };
  }
  else{
    $$('.goal-card').forEach(b => b.onclick = () => { ob.goal = +b.dataset.g; haptic('light'); renderOnboard(); });
    $('#obBack').onclick = () => { ob.step = 2; renderOnboard(); };
    $('#obDone').onclick = () => {
      U = newUser(ob.name, ob.avatar, ob.lang, ob.level, ob.goal);
      DB.users.push(U); DB.session = U.id; save();
      ob = null; tab = 'home'; render();
      confetti(); haptic('heavy'); toast('欢迎加入语界，一起加油！','🎉');
    };
  }
}

/* ============================================================
   首页 (澎湃美学 - 渐变Header / 环形进度 / 悬浮卡片)
   ============================================================ */
function todayLog(){ return U.log[today()] || {words:0,review:0,xp:0}; }

function renderHome(){
  const h = new Date().getHours();
  const lg = todayLog();
  const done = Math.min(lg.words + lg.review, U.dailyGoal);
  const pct = U.dailyGoal ? Math.round(done / U.dailyGoal * 100) : 0;
  const due = dueWords().length;
  const lv = userLevel() || {name:''};
  const quote = DAILY_QUOTES[new Date().getDate() % DAILY_QUOTES.length];
  const level = Math.floor(U.xp / 200) + 1;
  const lvlXp = U.xp - (level-1)*200;
  const lvlPct = Math.min(100, Math.round(lvlXp/200*100));
  const nxt = nextLesson();
  const badgeCount = (U.badges||[]).length;

  let cc;
  if(due > 0){
    cc = `<button class="cc-card" onclick="haptic('medium');go('review')">
      <div class="cc-ic">🔄</div>
      <div class="cc-body">
        <span class="cc-tag review">到期复习</span>
        <div class="cc-title">${due} 个单词在等你复习</div>
        <div class="cc-desc">SRS Box 到期 · 先复习再开启新课</div>
      </div>
      <div class="cc-cta">Go →</div>
    </button>`;
  } else if(nxt){
    const tm = TYPE_META[nxt.type] || {name:'', icon:'📚'};
    cc = `<button class="cc-card" onclick="haptic('medium');openLesson('${U.lang}','${U.level}','${nxt.id}')">
      <div class="cc-ic">${tm.icon}</div>
      <div class="cc-body">
        <span class="cc-tag">${tm.name} · ${esc(lv.name||'')}</span>
        <div class="cc-title">${esc(nxt.title)}</div>
        <div class="cc-desc">继续上次的学习旅程 · XP +${nxt.xp}</div>
      </div>
      <div class="cc-cta">开始 →</div>
    </button>`;
  } else {
    cc = `<button class="cc-card" onclick="haptic('medium');go('courses')">
      <div class="cc-ic">🎉</div>
      <div class="cc-body">
        <span class="cc-tag done">恭喜完成</span>
        <div class="cc-title">${esc(lv.name||'当前等级')} 全部通关</div>
        <div class="cc-desc">去词书看看其他等级或语言</div>
      </div>
      <div class="cc-cta">词书 →</div>
    </button>`;
  }

  return `
  <div class="home-view">
    <header class="home-header">
      <div class="hh-row">
        <div class="hi">
          <div class="hi-avatar" style="background:linear-gradient(135deg, ${U.color||'#2E6BFF'}, ${U.color||'#8A6BE0'}cc)">${U.avatar}</div>
          <div class="hi-text">
            <div class="hi-hi">${GREET(h)}，<b>${esc(U.name)}</b> 👋</div>
            <div class="hi-sub">${LANGUAGES[U.lang].flag} ${esc(LANGUAGES[U.lang].name)} · ${esc(lv.name||'')}</div>
          </div>
        </div>
        <div class="hi-rank">
          <div class="lv-badge">Lv.${level}</div>
          <div class="st-streak">🔥 ${U.streak.count||0}</div>
        </div>
      </div>

      <div class="goal-ring-card">
        <div class="ring-wrap">
          <svg viewBox="0 0 120 120" class="ring">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FF6A3D"/>
                <stop offset="55%" stop-color="#FF9F40"/>
                <stop offset="100%" stop-color="#FFD166"/>
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,.15)" stroke-width="12" fill="none"/>
            <circle cx="60" cy="60" r="52" stroke="url(#g1)" stroke-width="12" fill="none"
              stroke-linecap="round"
              stroke-dasharray="${2*Math.PI*52}"
              stroke-dashoffset="${2*Math.PI*52*(1 - pct/100)}"
              transform="rotate(-90 60 60)"/>
          </svg>
          <div class="ring-center">
            <div class="ring-num">${done}<span class="small">/${U.dailyGoal}</span></div>
            <div class="ring-txt">今日目标 ${pct}%</div>
          </div>
        </div>
        <div class="goal-stats">
          <div class="gs"><b>${lg.words||0}</b><span>新学</span></div>
          <div class="gs"><b>${lg.review||0}</b><span>复习</span></div>
          <div class="gs"><b>+${lg.xp||0}</b><span>XP</span></div>
        </div>
      </div>
    </header>

    ${cc}

    <section class="grid-2">
      <button class="stat-card onyx" onclick="haptic('light');go('review')">
        <div class="sc-ic">🔥</div>
        <div class="sc-val">${U.streak.count||0}</div>
        <div class="sc-lb">连续学习 天</div>
      </button>
      <button class="stat-card mint" onclick="haptic('light');go('me')">
        <div class="sc-ic">🏅</div>
        <div class="sc-val">${badgeCount}</div>
        <div class="sc-lb">解锁成就 枚</div>
      </button>
    </section>

    <section class="section">
      <div class="sec-title"><h3>📚 今日推荐</h3><a class="more" onclick="haptic('light');go('courses')">更多 ›</a></div>
      <div class="rec-list">
        ${recommendNextLessons().map(l=>{
          const t=TYPE_META[l.type]||{icon:'📚',name:''};
          return `<button class="rec-card" onclick="haptic('light');openLesson('${U.lang}','${U.level}','${l.id}')">
            <span class="rc-ic">${t.icon}</span>
            <div class="rc-body">
              <div class="rc-name">${esc(l.title)}</div>
              <div class="rc-meta">${t.name} · XP +${l.xp}</div>
            </div>
            <span class="rc-arrow">›</span>
          </button>`;
        }).join('') || emptyTile('暂无推荐，去词书看看吧')}
      </div>
    </section>

    <section class="section">
      <div class="sec-title"><h3>🏆 成就进度</h3><a class="more" onclick="haptic('light');go('me')">全部 ›</a></div>
      <div class="badge-row">
        ${(ACHIEVEMENTS||[]).slice(0, 6).map(a=>{
          const got = (U.badges||[]).includes(a.id);
          let cur=0, tot=1;
          try{ if(typeof a.prog === 'function'){ [cur,tot] = a.prog(U); } }catch(_){}
          return `<div class="badge-card ${got?'on':''}">
            <div class="b-ic">${a.icon}</div>
            <div class="b-name">${esc(a.name)}</div>
            <div class="b-prog">
              <div class="b-bar"><i style="width:${Math.min(100,Math.round(cur/Math.max(1,tot)*100))}%"></i></div>
              <span>${cur}/${tot}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>

    <section class="section">
      <div class="daily-quote">
        <div class="dq-en">"${esc(quote.en)}"</div>
        <div class="dq-cn">— ${esc(quote.cn)}</div>
        <button class="dq-speak" onclick="event.stopPropagation();haptic('light');speak(${JSON.stringify(quote.en)},'en',1,{source:'word'})" aria-label="朗读">🔊</button>
      </div>
    </section>

    <section class="section">
      <div class="lvl-card">
        <div class="lv-head"><span>等级进度</span><span class="xp">XP ${U.xp}</span></div>
        <div class="lvl-row">
          <span>Lv.${level}</span>
          <div class="lvl-bar"><i style="width:${lvlPct}%"></i></div>
          <span>Lv.${level+1}</span>
        </div>
        <div class="lv-sub">再获得 ${200 - lvlXp} XP 升级</div>
      </div>
    </section>

    <div style="height:24px"></div>
  </div>`;
}

function emptyTile(msg){
  return `<div class="empty-card">
    <div class="empty-ic">📭</div>
    <div class="empty-txt">${esc(msg)}</div>
  </div>`;
}

function recommendNextLessons(){
  const ls = COURSES[U.lang] && COURSES[U.lang][U.level];
  if(!ls) return [];
  const rec = [];
  for(const u of ls){
    for(const l of u.lessons){
      if(!U.lessons[l.id] || !U.lessons[l.id].done) rec.push(l);
      if(rec.length >= 3) return rec;
    }
  }
  return rec;
}

function nextLesson(){
  const ls = COURSES[U.lang] && COURSES[U.lang][U.level];
  if(!ls) return null;
  for(const u of ls) for(const l of u.lessons)
    if(!U.lessons[l.id] || !U.lessons[l.id].done) return l;
  return null;
}

/* ============================================================
   词书 Tab
   ============================================================ */
function renderCourses(){
  const langs = Object.values(LANGUAGES);
  if(!courseLangTab) courseLangTab = U.lang;
  return `
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">词书</h1>
      <p class="page-sub">选择语言和等级，开启 SRS 记忆之旅</p>
      <div class="pill-row">
        ${langs.map(l=>`
          <button class="pill ${courseLangTab===l.id?'on':''}" data-lang="${l.id}">
            ${l.flag} ${l.name}
          </button>`).join('')}
      </div>
    </div>
    <div class="level-grid">
      ${(LANGUAGES[courseLangTab].levels||[]).map(lv=>{
        const units = (COURSES[courseLangTab] && COURSES[courseLangTab][lv.id])||[];
        const totalLessons = units.reduce((n,u)=>n+(u.lessons?u.lessons.length:0),0);
        const doneLessons = units.reduce((n,u)=>n+(u.lessons?u.lessons.filter(l=>U.lessons[l.id] && U.lessons[l.id].done).length:0),0);
        const pct = totalLessons ? Math.round(doneLessons/totalLessons*100) : 0;
        return `<button class="level-card" onclick="haptic('medium');openCourse('${courseLangTab}','${lv.id}')">
          <div class="lv-tag ${courseLangTab}">${LANGUAGES[courseLangTab].flag}</div>
          <div class="lv-card-body">
            <h3>${esc(lv.name)}</h3>
            <p>${esc(lv.desc)}</p>
            <div class="progress">
              <div class="pbar"><i style="width:${pct}%"></i></div>
              <span>${doneLessons}/${totalLessons} · ${pct}%</span>
            </div>
          </div>
        </button>`;
      }).join('')}
    </div>
  </div>`;
}

/* ============================================================
   词书详情
   ============================================================ */
function renderCourseDetail(){
  const {lang, level} = courseView;
  const lv = levelOf(lang, level);
  const units = (COURSES[lang] && COURSES[lang][level]) || [];
  return `
  <div class="page">
    <div class="page-head compact">
      <button class="back-btn" onclick="haptic('light');backToLevels()">‹</button>
      <div class="ph-info">
        <h1 class="page-title">${esc(lv.name)}</h1>
        <p class="page-sub">${LANGUAGES[lang].flag} ${LANGUAGES[lang].name} · ${esc(lv.desc||'')}</p>
      </div>
    </div>
    <div class="unit-list">
      ${units.map((u,i)=>{
        const all = (u.lessons||[]).length;
        const dn = (u.lessons||[]).filter(l => U.lessons[l.id] && U.lessons[l.id].done).length;
        const pct = all? Math.round(dn/all*100) : 0;
        return `<section class="unit-card">
          <div class="unit-head">
            <div class="unit-index">UNIT ${String(i+1).padStart(2,'0')}</div>
            <div class="unit-body">
              <h3>${esc(u.title)}</h3>
              <p>${esc(u.desc||'')}</p>
            </div>
            <div class="unit-pill">${dn}/${all}</div>
          </div>
          <div class="progress unit-prog"><div class="pbar"><i style="width:${pct}%"></i></div></div>
          <div class="lesson-list">
            ${(u.lessons||[]).map(l=>{
              const t=TYPE_META[l.type]||{icon:'📚',name:''};
              const done = U.lessons[l.id] && U.lessons[l.id].done;
              const score = done && U.lessons[l.id].score;
              return `<button class="lesson-card ${done?'done':''}" onclick="haptic('light');openLesson('${lang}','${level}','${l.id}')">
                <span class="lc-ic">${t.icon}</span>
                <div class="lc-body">
                  <div class="lc-name">${esc(l.title)}</div>
                  <div class="lc-meta">${t.name} · XP +${l.xp}${done?` · ★${score}`:''}</div>
                </div>
                <span class="lc-check">${done?'✓':'›'}</span>
              </button>`;
            }).join('')}
          </div>
        </section>`;
      }).join('')}
    </div>
  </div>`;
}
function backToLevels(){ courseView = null; tab='courses'; render(); }

/* ============================================================
   复习 Tab
   ============================================================ */
function dueWords(){
  const t = today();
  const due = [];
  try{
    const langLevels = (LANGUAGES[U.lang].levels||[]).map(l=>l.id);
    for(const ll of langLevels){
      const units = (COURSES[U.lang] && COURSES[U.lang][ll])||[];
      for(const u of units){
        for(const l of (u.lessons||[])){
          const words = lessonWords(l.id);
          for(const w of words){
            const s = (U.srs[l.id]||{})[w.w];
            if(!s || !s.seen){
              // 新词: 不进"复习"Tab，避免用户困惑
            } else if(s.due <= t){
              due.push({lesson:l.id, w, due:s.due});
            }
          }
        }
      }
    }
  }catch(e){}
  return due;
}
function renderReview(){
  const list = dueWords();
  const cnt = list.length;
  return `
  <div class="page">
    <div class="page-head">
      <h1 class="page-title">复习</h1>
      <p class="page-sub">SRS 间隔到期 · 记得牢才是真学会</p>
    </div>

    <div class="review-hero">
      <div class="rh-left">
        <div class="rh-num">${cnt}</div>
        <div class="rh-txt">${cnt>0?'今天待复习单词':'今天没有到期词 🎉'}</div>
      </div>
      <div class="rh-right">
        <div class="rh-ic">🔁</div>
      </div>
    </div>

    ${cnt>0? `
    <div class="srs-boxes">
      ${[1,2,4,7,15,30].map((d,i)=>{
        const count = list.filter(x=>{ try{ return (U.srs[x.lesson][x.w.w||x.w]||{}).box===i+1;}catch(_){return false;} }).length;
        return `<div class="srs-box">
          <span class="sb-day">${d}天</span>
          <span class="sb-n">${count}</span>
        </div>`;
      }).join('')}
    </div>
    <button class="btn btn-primary btn-xl wide" onclick="haptic('heavy');startReview()">🎯 开始复习 (${cnt})</button>` : emptyTile('先学完一组单词，明后天它们会出现在这里')}

    <section class="section" style="margin-top:22px">
      <div class="sec-title"><h3>🧠 SRS Box 记忆系统</h3></div>
      <div class="srs-info">
        <div class="srs-line">✅ 认识 → 进入下一个 Box · ❌ 不认识 → 退一格稍后重现</div>
        <div class="srs-line">Box 间隔: 1天 → 2天 → 4天 → 7天 → 15天 → 30天(掌握)</div>
      </div>
    </section>
  </div>`;
}

/* ============================================================
   我的 Tab
   ============================================================ */
function renderMe(){
  const level = Math.floor(U.xp/200)+1;
  const lvlXp = U.xp-(level-1)*200;
  const s = U.stats;
  const total = (s.words||0) + (s.reviews||0) + (s.grammar||0) + (s.listen||0) + (s.speak||0);
  return `
  <div class="page">
    <header class="me-hero">
      <div class="me-row">
        <div class="me-avatar" style="background:linear-gradient(135deg, ${U.color||'#2E6BFF'}, ${U.color||'#A855F7'}cc)">${U.avatar}</div>
        <div class="me-info">
          <div class="me-name">${esc(U.name)} <span class="me-lv">Lv.${level}</span></div>
          <div class="me-sub">${LANGUAGES[U.lang].flag} ${LANGUAGES[U.lang].name} · ${(userLevel()||{}).name||''}</div>
          <div class="me-xpbar"><i style="width:${Math.min(100, lvlXp/2)}%"></i><span>XP ${U.xp}</span></div>
        </div>
        <button class="me-menu" onclick="haptic('light');toggleUserMenu(event)">⋯</button>
      </div>

      <div class="stats-grid">
        <div class="sg"><b>${s.words||0}</b><span>新学单词</span></div>
        <div class="sg"><b>${s.reviews||0}</b><span>复习次数</span></div>
        <div class="sg"><b>${s.decks||0}</b><span>课时完成</span></div>
        <div class="sg"><b>${total||0}</b><span>总计练习</span></div>
      </div>
    </header>

    <div class="streak-card">
      <div class="st-ic">🔥</div>
      <div class="st-body">
        <div class="st-num">${U.streak.count||0} <span>天连续学习</span></div>
        <div class="st-desc">坚持是最好的学习方式 · 已打卡 ${Math.round(Object.keys(U.streak.days||{}).length)} 天</div>
      </div>
    </div>

    <section class="section">
      <div class="sec-title"><h3>🏅 我的成就 (${(U.badges||[]).length}/${(ACHIEVEMENTS||[]).length})</h3></div>
      <div class="badge-grid">
        ${(ACHIEVEMENTS||[]).map(a=>{
          const got = (U.badges||[]).includes(a.id);
          let cur=0, tot=1;
          try{ if(typeof a.prog === 'function'){ [cur,tot] = a.prog(U); } }catch(_){}
          return `<div class="badge-card lg ${got?'on':''}">
            <div class="b-ic">${a.icon}</div>
            <div class="b-name">${esc(a.name)}</div>
            <div class="b-desc">${esc(a.desc||'')}</div>
            <div class="b-prog">
              <div class="b-bar"><i style="width:${Math.min(100,Math.round(cur/Math.max(1,tot)*100))}%"></i></div>
              <span>${cur}/${tot}</span>
            </div>
          </div>`;
        }).join('')}
      </div>
    </section>

    <section class="section">
      <div class="sec-title"><h3>⚙️ 设置</h3></div>
      <div class="set-group">
        <button class="set-row" onclick="haptic('light');showGoalModal()">
          <span class="set-ic">🎯</span>
          <div class="set-body"><div class="set-name">每日目标</div><div class="set-sub">当前每天 ${U.dailyGoal} 词</div></div>
          <span class="set-arr">›</span>
        </button>
        <button class="set-row" onclick="haptic('light');showRateModal()">
          <span class="set-ic">🔊</span>
          <div class="set-body"><div class="set-name">朗读语速</div><div class="set-sub">当前 ${U.ttsRate}x</div></div>
          <span class="set-arr">›</span>
        </button>
        <div class="set-row" onclick="haptic('light');toggleTtsOnline()">
          <span class="set-ic">🌐</span>
          <div class="set-body"><div class="set-name">在线发音</div><div class="set-sub">${(DB.prefs.ttsOnline!==false) ? '开启 · 微软自然语音，需联网' : '关闭 · 使用内置离线合成引擎'}</div></div>
          <label class="switch" onclick="event.stopPropagation()"><input type="checkbox" ${(DB.prefs.ttsOnline!==false)?'checked':''} onchange="haptic('light');toggleTtsOnline(this.checked)"><span class="slider"></span></label>
        </div>
        <div class="set-row" style="cursor:default">
          <span class="set-ic">🔈</span>
          <div class="set-body"><div class="set-name">自动朗读</div><div class="set-sub">新词卡进入时自动发音</div></div>
          <label class="switch"><input type="checkbox" ${DB.prefs.autoSpeak?'checked':''} onchange="toggleAutoSpeak(this.checked)"><span class="slider"></span></label>
        </div>
        <button class="set-row" onclick="haptic('light');switchAccount()">
          <span class="set-ic">👥</span>
          <div class="set-body"><div class="set-name">切换 / 管理账号</div><div class="set-sub">当前 ${DB.users.length} 个本地账号</div></div>
          <span class="set-arr">›</span>
        </button>
        <button class="set-row" onclick="haptic('light');exportData()">
          <span class="set-ic">⬆️</span>
          <div class="set-body"><div class="set-name">导出学习数据</div><div class="set-sub">备份为 JSON，可跨设备导入</div></div>
          <span class="set-arr">›</span>
        </button>
        <button class="set-row" onclick="haptic('light');importData()">
          <span class="set-ic">⬇️</span>
          <div class="set-body"><div class="set-name">导入学习数据</div><div class="set-sub">从 JSON 备份中合并恢复</div></div>
          <span class="set-arr">›</span>
        </button>
        <button class="set-row warn" onclick="haptic('medium');confirmClear()">
          <span class="set-ic">🧹</span>
          <div class="set-body"><div class="set-name">清空本地记录</div><div class="set-sub">本用户 SRS / 课时 / XP 将清零</div></div>
          <span class="set-arr">›</span>
        </button>
      </div>
    </section>

    <div class="foot-note">语界 LinguaVerse v3.0 · 纯本地 · 开源 MIT</div>
    <div style="height:36px"></div>
  </div>`;
}

function toggleAutoSpeak(v){ DB.prefs.autoSpeak = !!v; save(); toast(DB.prefs.autoSpeak?'自动朗读已开启':'自动朗读已关闭','🔈'); }

function toggleTtsOnline(v){
  if(!DB.prefs) DB.prefs = {};
  DB.prefs.ttsOnline = (v === undefined) ? (DB.prefs.ttsOnline === false) : !!v;
  save();
  toast(DB.prefs.ttsOnline!==false ? '在线发音已开启 · 微软自然语音' : '已切换为内置离线发音','🔊');
  render();
}

function toggleUserMenu(e){
  try{
    if(e) e.stopPropagation();
    let m = document.getElementById('userMenu');
    if(m){ try{m.remove();}catch(_){} return; }
    m = document.createElement('div');
    m.id = 'userMenu'; m.className = 'user-menu';
    m.innerHTML = `
      <button onclick="haptic('light');switchAccount(); this.closest('.user-menu').remove();">👥 切换账号</button>
      <button onclick="haptic('light');exportData(); this.closest('.user-menu').remove();">⬆️ 导出备份</button>
      <button onclick="document.getElementById('userMenu').remove(); DB.users=[]; DB.session=null; save(); location.reload();" class="warn">🏳️ 退出登录</button>
    `;
    document.body.appendChild(m);
    const rc = e.currentTarget.getBoundingClientRect();
    m.style.right = (window.innerWidth - rc.right + 14) + 'px';
    m.style.top   = (rc.bottom + 8) + 'px';
    setTimeout(()=>document.addEventListener('click', function h(){ try{m.remove();}catch(_){} document.removeEventListener('click',h); }), 0);
  }catch(_){}
}

/* ============================================================
   设置弹窗
   ============================================================ */
function showGoalModal(){
  showModal('每日目标', `
    <div class="goal-grid small">
      ${[10,15,20,25,30,40].map(n=>`
        <button class="goal-card ${U.dailyGoal===n?'on':''}" onclick="haptic('light');setGoal(${n}); closeModalMask();">
          <div class="g-num">${n}</div>
          <div class="g-desc">${n} / 天</div>
        </button>`).join('')}
    </div>
  `);
}
function setGoal(n){ U.dailyGoal = +n; save(); toast(`每日目标 ${n} 词`,'🎯'); render(); }

function showRateModal(){
  showModal('朗读语速', `
    <div class="rate-row">
      ${[0.5,0.75,1,1.25,1.5].map(r=>`
        <button class="pill ${U.ttsRate===r?'on':''}" onclick="haptic('light');setRate(${r})">${r}x</button>`).join('')}
    </div>
    <div class="hint">
      试听（联网时为微软自然语音，离线自动回退内置引擎）：
      <button class="pill" onclick="haptic('light');speak('Hello, this is a pronunciation test for your dictionary learning.', 'en', ${U.ttsRate||1}, {source:'word'})">🔊 English</button>
      <button class="pill" style="margin-top:6px" onclick="haptic('light');speak('こんにちは、日本語の発音テストです。', 'ja', ${U.ttsRate||1})">🔊 日本語</button>
    </div>
  `);
}
function setRate(r){ U.ttsRate = r; save(); toast(`语速 ${r}x`,'🔊'); closeModalMask(); render(); }

/* ---------- 通用模态框 ---------- */
function showModal(title, html){
  try{
    let mask = $('#modalMask');
    if(!mask){
      mask = document.createElement('div');
      mask.id='modalMask'; mask.className='modal-mask';
      mask.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
          <div class="modal-head">
            <h3 id="modalTitle"></h3>
            <button class="icon-btn" onclick="closeModalMask()">×</button>
          </div>
          <div class="modal-body" id="modalBody"></div>
        </div>`;
      mask.onclick = e => { if(e.target === mask) closeModalMask(); };
      document.body.appendChild(mask);
    }
    $('#modalTitle').textContent = title;
    $('#modalBody').innerHTML = html;
    mask.classList.add('in');
  }catch(_){}
}
function closeModalMask(){ try{ const m = $('#modalMask'); if(m) m.classList.remove('in'); }catch(_){} }

/* ============================================================
   本地账号: 切换 / 导入导出 / 清空
   ============================================================ */
function switchAccount(){
  const users = DB.users || [];
  showModal('切换 / 管理账号', `
    <div class="user-list">
      ${users.map(u=>`
        <button class="user-row ${u.id===U.id?'on':''}" onclick="haptic('light');selectAccount('${u.id}')">
          <span class="ur-av" style="background:linear-gradient(135deg, ${u.color||'#2E6BFF'}, ${u.color||'#A855F7'}cc)">${u.avatar}</span>
          <div class="ur-body">
            <div class="ur-name">${esc(u.name)}</div>
            <div class="ur-sub">${LANGUAGES[u.lang].flag} ${LANGUAGES[u.lang].name} · Lv.${Math.floor((u.xp||0)/200)+1} · XP ${u.xp||0}</div>
          </div>
          ${u.id===U.id?'<span class="ur-cur">当前</span>':'<span class="ur-go">›</span>'}
        </button>`).join('')}
    </div>
    <button class="btn btn-ghost btn-lg wide" onclick="haptic('light');closeModalMask(); DB.session=null; U=null; save(); startOnboard();">＋ 创建新账号</button>
  `);
}
function selectAccount(id){
  const u = (DB.users||[]).find(x=>x.id===id); if(!u) return;
  DB.session = id; U = u; save(); closeModalMask(); toast(`已切换到 ${u.name}`,'👤'); go('home');
}

function exportData(){
  try{
    const data = { users: DB.users, session: DB.session, prefs: DB.prefs,
                   exportedAt: new Date().toISOString(), appVersion:'3.0.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yujie-export-${today()}.json`;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ try{a.remove(); URL.revokeObjectURL(url);}catch(_){} }, 400);
    toast('数据已导出 JSON','📦');
  }catch(e){ toast('导出失败','❌'); }
}
function importData(){
  try{
    const input = document.createElement('input');
    input.type = 'file'; input.accept='application/json,.json';
    input.onchange = () => {
      const f = input.files && input.files[0]; if(!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const o = JSON.parse(reader.result);
          if(!o.users || !Array.isArray(o.users)) throw new Error('格式错误');
          let merged = 0, added = 0;
          o.users.forEach(nu=>{
            const i = DB.users.findIndex(x=>x.id===nu.id);
            if(i>=0){ if((nu.xp||0) > (DB.users[i].xp||0)){ DB.users[i] = nu; merged++; } }
            else { DB.users.push(nu); added++; }
          });
          if(o.prefs && typeof o.prefs === 'object') DB.prefs = Object.assign({}, DB.prefs, o.prefs);
          save();
          toast(`导入成功 · 新增 ${added} · 合并 ${merged}`,'📥');
          if(!DB.users.find(u=>u.id===DB.session)) DB.session = DB.users[0] && DB.users[0].id;
          U = DB.users.find(u=>u.id===DB.session) || DB.users[0] || null;
          render(); closeModalMask();
        }catch(e){
          toast('导入失败: '+(e.message||'未知错误'),'❌');
        }
      };
      reader.onerror = ()=>toast('读取文件失败','❌');
      reader.readAsText(f);
    };
    input.click();
  }catch(e){ toast('导入失败','❌'); }
}
function confirmClear(){
  showModal('⚠️ 清空学习记录', `
    <p class="warn-text">本操作会将 <b>${esc(U.name)}</b> 的所有学习数据（SRS记录/课时完成/XP/成就）清零，无法恢复。</p>
    <div class="row-btns">
      <button class="btn btn-ghost btn-lg" onclick="haptic('light');closeModalMask()">取消</button>
      <button class="btn btn-danger btn-lg" onclick="haptic('heavy');doClear()">确认清空</button>
    </div>
  `);
}
function doClear(){
  try{
    U.srs = {}; U.lessons = {}; U.badges = [];
    U.stats = {decks:0,words:0,reviews:0,grammar:0,listen:0,speak:0};
    U.log = {}; U.xp = 0; U.streak = {count:0, last:'', days:{}};
    save(); closeModalMask(); toast('已清零，重新开始吧','🧹'); render();
  }catch(_){}
}

/* ============================================================
   成就系统
   ============================================================ */
function checkBadges(){
  try{
    const before = (U.badges||[]).length;
    (ACHIEVEMENTS||[]).forEach(a => {
      try{
        if(!(U.badges||[]).includes(a.id) && typeof a.check === 'function' && a.check(U)){
          if(!U.badges) U.badges = [];
          U.badges.push(a.id);
          setTimeout(()=>toast(`解锁成就「${a.name}」`, a.icon), U.badges.length*400);
        }
      }catch(_){}
    });
    if((U.badges||[]).length > before) setTimeout(confetti, 500);
    save();
  }catch(_){}
}

/* ---------- 连续打卡 ---------- */
function touchStreak(){
  try{
    const t = today();
    const last = U.streak.last;
    const days = U.streak.days || {};
    days[t] = true;
    if(!last){ U.streak.count = 1; }
    else if(last === t){ /* 同一天 */ }
    else {
      const y = dateKey(-1);
      if(last === y) U.streak.count++;
      else U.streak.count = 1;
    }
    U.streak.last = t;
    U.streak.days = days;
  }catch(_){}
}

/* ============================================================
   学习播放器 - 词汇卡 (不背单词式)
   ============================================================ */
let P = null;
function openLesson(lang, level, id){
  let found = null;
  const units = COURSES[lang] && COURSES[lang][level];
  outer:
  for(const u of units || []){
    for(const l of (u.lessons||[])){ if(l.id===id){ found = l; break outer; } }
  }
  if(!found){ toast('课时不存在','❓'); return; }
  if(found.type === 'vocab') startVocabSession(lang, level, found);
  else startQuizSession(lang, level, found);
}
function startVocabSession(lang, level, lesson){
  const words = lessonWords(lesson.id);
  if(!words.length){ toast('这节课暂时没有单词','📭'); return; }
  const newW = [], dueW = [];
  for(const w of words){
    const s = (U.srs[lesson.id]||{})[w.w];
    if(!s || !s.seen) newW.push({lesson:lesson.id, w});
    else if(s.due <= today()) dueW.push({lesson:lesson.id, w});
  }
  const queue = shuffle(newW).concat(shuffle(dueW));
  if(!queue.length){
    showModal('✅ 本课已完成', `
      <div class="done-tile">
        <div class="done-ic">🎉</div>
        <div class="done-title">「${esc(lesson.title)}」没有新词或到期词</div>
        <div class="done-sub">已掌握 ${words.length} 个 · 过几天再来复习吧！</div>
        <button class="btn btn-primary btn-lg" onclick="haptic('light');closeModalMask(); go('courses')">返回词书</button>
      </div>`);
    return;
  }
  P = { mode:'vocab', id:lesson.id, lesson, lang, level,
        queue, idx:0, flip:false, newWords:0, reviews:0, total: queue.length };
  renderPlayer();
}
function startReview(){
  const list = dueWords();
  if(!list.length){ toast('没有到期词','📭'); return; }
  P = { mode:'review', id:'review', lesson:null, lang:U.lang, level:U.level,
        queue: shuffle(list), idx:0, flip:false, newWords:0, reviews:0, total: list.length };
  renderPlayer();
}

function renderPlayer(){
  if(!P){ try{ $('#player').hidden = true; }catch(_){} return; }
  const player = $('#player'); if(player) player.hidden = false;
  const item = P.queue[P.idx];
  if(!item){ finishVocabSession(); return; }
  const lessonId = P.mode==='review' ? item.lesson : P.id;
  const wObj = (typeof item.w === 'string')
    ? normWord(lessonId, (CONTENT[lessonId] && CONTENT[lessonId].words || []).find(x=>x && x[0]===item.w))
    : item.w;
  const w = wObj && wObj.w ? wObj : {w:'',ph:'',def:'',root:'',ex:[]};
  const isNew = !(U.srs[lessonId] && U.srs[lessonId][w.w] && U.srs[lessonId][w.w].seen);
  const srs = (U.srs[lessonId]||{})[w.w] || {box:0};
  const prog = P.total ? Math.round(P.idx/P.total*100) : 0;
  const box = srs.box|0;
  if(player){
    player.innerHTML = `
    <div class="player-wrap">
      <div class="pl-top">
        <button class="pl-close" onclick="haptic('light');askClosePlayer()">×</button>
        <div class="pl-progress"><i style="width:${prog}%"></i></div>
        <div class="pl-count">${P.idx+1}/${P.total}</div>
      </div>
      <div class="pl-title-row">
        <span class="pl-type ${isNew?'new':'due'}">${isNew?'新学':'复习'}</span>
        <span class="pl-course">${P.mode==='review'?'复习任务':esc((P.lesson&&P.lesson.title)||'')}</span>
        ${box?`<span class="pl-box">Box ${box} · ${SRS_INTERVALS[Math.min(box-1,SRS_INTERVALS.length-1)]||1}天</span>`:''}
      </div>

      <div class="word-card ${P.flip?'flip':''}" id="wordCard"
           oncontextmenu="return false"
           onmousedown="cardMouseDown(event)"
           ontouchstart="cardTouchStart(event)"
           ontouchend="cardTouchEnd(event)"
           ontouchmove="cardTouchMove(event)">
        <div class="wc-face wc-front">
          <button class="speak-big" onclick="event.stopPropagation();haptic('medium');speakCur(event)" aria-label="朗读">🔊</button>
          <div class="wc-word">${esc(w.w)}</div>
          <div class="wc-phonetic">${esc(w.ph||'')}</div>
          <div class="wc-flip-tip">${P.flip?'':'点击卡片 / 下滑 查看释义 ↓'}</div>
        </div>
        <div class="wc-face wc-back">
          <div class="wc-word small">${esc(w.w)} <span class="wc-phon small">${esc(w.ph||'')}</span>
            <button class="speak-inline" onclick="event.stopPropagation();haptic('light');speakCur(event)" aria-label="朗读">🔊</button>
          </div>
          ${w.def?`<div class="wc-def">${esc(w.def)}</div>`:''}
          ${w.root?`<div class="wc-root">🧩 ${esc(w.root)}</div>`:''}
          <div class="wc-ex">
            ${(w.ex||[]).slice(0,3).filter(e=>e.t||e.m).map((e,i)=>`
              <div class="ex-item">
                ${e.tag?`<span class="ex-tag tag-${e.tag}">${e.tag}</span>`:''}
                <div class="ex-sent">${esc(e.t||'')}
                  ${e.t?`<button class="ex-speak" onclick="event.stopPropagation();haptic('light');speakEx(${i}, event)" aria-label="读例句">🔊</button>`:''}
                </div>
                ${e.m?`<div class="ex-cn">${esc(e.m)}</div>`:''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="pl-actions">
        <button class="pl-btn unknown" onclick="haptic('heavy');gradeWord(false)">
          <span class="pb-ic">✕</span>
          <span class="pb-lb">不认识</span>
          <span class="pb-sub">${SRS_INTERVALS[Math.max(0,box-1)]||1}天后重现</span>
        </button>
        <button class="pl-btn known" onclick="haptic('medium');gradeWord(true)">
          <span class="pb-ic">✓</span>
          <span class="pb-lb">认识</span>
          <span class="pb-sub">${SRS_INTERVALS[Math.min(box,SRS_INTERVALS.length-1)]||30}天后到期</span>
        </button>
      </div>
      <div class="pl-sw-hint">← 左滑=不认识 · 右滑=认识 · 上/下滑查看释义 · 长按发音</div>
    </div>`;
  }
  if(!P.flip && DB.prefs.autoSpeak){
    setTimeout(()=>speak(w.w, P.lang, U.ttsRate, {source:'word'}), 220);
  }
}

/* ------ 词卡事件: 点击翻面/滑动评分/长按发音 ------ */
function flipCard(){
  if(!P) return;
  P.flip = !P.flip;
  haptic(P.flip?'medium':'light');
  renderPlayer();
}
function speakCur(e){ try{ if(e) e.stopPropagation(); }catch(_){}
  if(!P) return;
  const it = P.queue[P.idx]; if(!it) return;
  const w = (typeof it.w==='string')? it.w : (it.w && it.w.w);
  speak(w, P.lang, U.ttsRate, {source:'word'});
}
function speakEx(i,e){
  try{ if(e) e.stopPropagation(); }catch(_){}
  if(!P) return;
  const it = P.queue[P.idx]; if(!it) return;
  const lessonId = P.mode==='review'? it.lesson : P.id;
  const wObj = (typeof it.w==='string')
    ? normWord(lessonId, (CONTENT[lessonId] && CONTENT[lessonId].words || []).find(x=>x && x[0]===it.w))
    : it.w;
  const ex = wObj && wObj.ex && wObj.ex[i]; if(!ex) return;
  speak(ex.t, P.lang, U.ttsRate, {source:'sentence'});
}
/* 左右滑动 */
let _sd = null;
function cardTouchStart(e){
  try{
    const t = e.touches && e.touches[0]; if(!t) return;
    _sd = {x:t.clientX, y:t.clientY, t:Date.now(), hold:null, moved:false};
    _sd.hold = setTimeout(()=>{ speakCur(e); haptic('medium'); if(_sd) _sd.hold=null; }, 500);
  }catch(_){}
}
function cardTouchMove(e){
  if(!_sd) return;
  const t = e.touches && e.touches[0]; if(!t) return;
  const dx = t.clientX - _sd.x, dy = t.clientY - _sd.y;
  if(_sd.hold && (Math.abs(dx)>8 || Math.abs(dy)>8)){
    clearTimeout(_sd.hold); _sd.hold = null; _sd.moved = true;
  }
}
function cardTouchEnd(e){
  if(!_sd) return;
  if(_sd.hold){ clearTimeout(_sd.hold); _sd.hold=null; }
  const t = (e.changedTouches && e.changedTouches[0]) || {};
  const dx = (t.clientX||0) - _sd.x, dy = (t.clientY||0) - _sd.y;
  const dt = Date.now() - _sd.t;
  // 点击: 位移<12px 且 时长<260ms → 翻面
  if(dx*dx+dy*dy < 144 && dt < 260){
    flipCard(); _sd = null; return;
  }
  handleSwipe(t.clientX, t.clientY, dt, dx, dy);
  _sd = null;
}
function cardMouseDown(e){
  _sd = {x:e.clientX, y:e.clientY, t:Date.now(), hold:setTimeout(()=>{speakCur();haptic('medium');if(_sd)_sd.hold=null;},500), moved:false};
  const move = ev=>{
    if(_sd && _sd.hold && Math.hypot(ev.clientX-_sd.x,ev.clientY-_sd.y)>8){
      clearTimeout(_sd.hold); _sd.hold=null; _sd.moved=true;
    }
  };
  const up = ev=>{
    try{ document.removeEventListener('mousemove',move); }catch(_){}
    try{ document.removeEventListener('mouseup',up); }catch(_){}
    if(_sd && _sd.hold){ clearTimeout(_sd.hold); _sd.hold=null; }
    if(!_sd) return;
    const d = Date.now()-_sd.t;
    const dx = ev.clientX-_sd.x, dy = ev.clientY-_sd.y;
    if(dx*dx+dy*dy < 144 && d < 260){ flipCard(); _sd=null; return; }
    handleSwipe(ev.clientX, ev.clientY, d, dx, dy);
    _sd = null;
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
}
function handleSwipe(x, y, dt, dx, dy){
  if(!_sd) return;
  dx = dx != null ? dx : ((x||0) - _sd.x);
  dy = dy != null ? dy : ((y||0) - _sd.y);
  if(dt > 900) return;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  // 纵向滑动: 上滑/下滑 → 翻面查看释义 (与卡片提示"下滑查看释义"一致)
  if(ady >= 48 && ady > adx){
    haptic('medium');
    flipCard();
    return;
  }
  // 横向滑动: 左滑=不认识, 右滑=认识
  if(adx < 60 || adx <= ady) return;
  haptic(dx<0?'heavy':'medium');
  if(dx < 0) gradeWord(false);
  else      gradeWord(true);
}

/* ------ 认识 / 不认识 分级 ------ */
function gradeWord(known){
  if(!P) return;
  const item = P.queue[P.idx]; if(!item) return;
  const lessonId = P.mode==='review' ? item.lesson : P.id;
  const word = (typeof item.w==='string') ? item.w : (item.w && item.w.w);
  if(!word) return;
  if(!U.srs[lessonId]) U.srs[lessonId] = {};
  const s = U.srs[lessonId][word] || {box:0, due:today(), reps:0, seen:false};

  if(known){
    s.box = Math.min(s.box+1, SRS_INTERVALS.length);
    s.due = dateKey(SRS_INTERVALS[Math.min(s.box-1, SRS_INTERVALS.length-1)]);
    if(!s.seen){ s.seen = true; P.newWords++; U.stats.words++; }
    P.reviews++;
    P.idx++;
  } else {
    s.box = Math.max(0, s.box-1);
    s.due = dateKey(SRS_INTERVALS[Math.max(s.box, 0)] || 1);
    const reinsert = P.queue[P.idx];
    // 间隔2~3个位置后重现
    P.queue.splice(Math.min(P.idx + 3, P.queue.length), 0, reinsert);
    P.total = P.queue.length;
    if(!s.seen){ s.seen = true; P.newWords++; U.stats.words++; }
    P.reviews++;
    P.idx++;
  }
  s.reps = (s.reps||0) + 1;
  U.srs[lessonId][word] = s;
  P.flip = false;

  const lg = todayLog();
  lg.words = (lg.words||0) + (known ? 1 : 0);
  lg.review = (lg.review||0) + (known ? 0 : 1);
  U.log[today()] = lg;

  if(P.idx >= P.queue.length){ finishVocabSession(); return; }
  save();
  renderPlayer();
}

function finishVocabSession(){
  try{
    const xp = Math.max(1, Math.round((P.newWords||0)*2.5 + (P.reviews||0)*0.8));
    U.xp += xp;
    if(P.mode === 'vocab'){
      U.lessons[P.id] = {done:true, at:Date.now(), xp, score: Math.min(100, Math.round((P.reviews||0)/Math.max(1,P.total)*95 + 5))};
      U.stats.decks++;
    }
    const t = todayLog(); t.xp = (t.xp||0) + xp; U.log[today()] = t;
    touchStreak();
    checkBadges();
    save();
    const doneRate = P.total? Math.round(P.reviews/Math.max(1,P.total)*100) : 0;
    showModal('🎉 本节完成', `
      <div class="finish-tile">
        <div class="ft-ring">
          <svg viewBox="0 0 120 120">
            <defs><linearGradient id="gg2" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#00B578"/><stop offset="100%" stop-color="#2E6BFF"/>
            </linearGradient></defs>
            <circle cx="60" cy="60" r="52" stroke="rgba(0,0,0,.06)" stroke-width="12" fill="none"/>
            <circle cx="60" cy="60" r="52" stroke="url(#gg2)" stroke-width="12" fill="none"
                    stroke-linecap="round" stroke-dasharray="${2*Math.PI*52}"
                    stroke-dashoffset="${2*Math.PI*52*(1 - Math.min(1,doneRate/100))}"
                    transform="rotate(-90 60 60)"/>
          </svg>
          <div class="ft-c">
            <div class="ft-n">+${xp}</div>
            <div class="ft-t">XP</div>
          </div>
        </div>
        <h2 class="ft-title">${P.mode==='review'?'复习完成！':'课程完成！🎊'}</h2>
        <div class="ft-stats">
          <div class="ft-s"><b>${P.newWords||0}</b><span>新学</span></div>
          <div class="ft-s"><b>${P.reviews||0}</b><span>练习</span></div>
          <div class="ft-s"><b>${doneRate}%</b><span>正确率</span></div>
        </div>
        <div class="row-btns" style="margin-top:20px">
          <button class="btn btn-ghost btn-lg" onclick="haptic('light');closePlayer(); closeModalMask();">返回</button>
          <button class="btn btn-primary btn-lg" onclick="haptic('light');closeModalMask(); go('home');">去首页 →</button>
        </div>
      </div>`);
    P = null;
    try{ $('#player').hidden = true; }catch(_){}
  }catch(e){ try{ $('#player').hidden = true; }catch(_){} }
}

function askClosePlayer(){
  if(!P){ closePlayer(); return; }
  showModal('退出学习？',`
    <p>当前进度 <b>${P.idx}/${P.total}</b>，未保存的当前组会重新开始。</p>
    <div class="row-btns">
      <button class="btn btn-ghost btn-lg" onclick="haptic('light');closeModalMask()">继续学习</button>
      <button class="btn btn-danger btn-lg" onclick="haptic('heavy');closeModalMask(); closePlayer();">确认退出</button>
    </div>`);
}
function closePlayer(){ P = null; try{ $('#player').hidden = true; }catch(_){} render(); }

/* ============================================================
   语法 / 听力 / 口语 通用 Quiz 播放器
   ============================================================ */
function startQuizSession(lang, level, lesson){
  const content = CONTENT[lesson.id];
  if(!content){ toast('课时内容缺失','❌'); return; }
  const type = lesson.type;
  const t = TYPE_META[type] || {icon:'📚',name:''};
  P = { mode:'quiz', id:lesson.id, lesson, lang, level, type,
        content, idx:0, score:0, userAns:[], listeningCount:0, speakingCount:0 };
  if(type==='listening') P.questions = content.dialogs || [];
  else if(type==='speaking') P.questions = content.topics || [];
  else P.questions = content.questions || [];
  if(!P.questions.length){ toast('这节课还在准备中','⏳'); P=null; return; }
  renderQuiz();
}
function renderQuiz(){
  if(!P){ try{ $('#player').hidden = true; }catch(_){} return; }
  try{ $('#player').hidden = false; }catch(_){}
  const q = P.questions[P.idx];
  const total = P.questions.length;
  const prog = total? Math.round(P.idx/total*100) : 0;
  const t = TYPE_META[P.type] || {icon:'📚',name:''};
  let body = '';
  if(P.type==='grammar'){
    body = `
      <div class="q-head">
        <div class="q-num">Q ${P.idx+1} / ${total}</div>
        <div class="q-type-tag">✏️ 语法</div>
      </div>
      <div class="q-stem">${q.q||''}</div>
      <div class="q-options">
        ${(q.o||[]).map((op,i)=>`<button class="q-opt" data-i="${i}" onclick="answerQuiz(${i})">
          <span class="qo-idx">${String.fromCharCode(65+i)}</span>
          <span>${esc(op)}</span>
        </button>`).join('')}
      </div>`;
  } else if(P.type==='listening'){
    body = `
      <div class="q-head">
        <div class="q-num">Q ${P.idx+1} / ${total}</div>
        <div class="q-type-tag">🎧 听力</div>
      </div>
      <div class="listen-card">
        <button class="listen-btn" id="replayListenBtn" onclick="haptic('medium');replayListen()">
          <span class="lb-play">▶</span>
          <div class="lb-text">
            <div class="lb-1">点击播放对话</div>
            <div class="lb-2">TTS ${P.lang==='en'?'English':P.lang==='ja'?'Japanese':'Korean'} · 语速 ${U.ttsRate}x</div>
          </div>
        </button>
      </div>
      <div class="q-stem">${q.q||''}</div>
      <div class="q-options">
        ${(q.o||[]).map((op,i)=>`<button class="q-opt" data-i="${i}" onclick="answerQuiz(${i})">
          <span class="qo-idx">${String.fromCharCode(65+i)}</span><span>${esc(op)}</span>
        </button>`).join('')}
      </div>`;
  } else if(P.type==='speaking'){
    body = `
      <div class="q-head">
        <div class="q-num">Q ${P.idx+1} / ${total}</div>
        <div class="q-type-tag">🎤 口语跟读</div>
      </div>
      <div class="q-stem">话题：<b>${esc(q.topic||q.t||'')}</b></div>
      <div class="speak-area">
        <div class="speak-model">
          <div class="sm-label">🗣️ 示范</div>
          <div class="sm-sent">${esc(q.sentence||q.demo||'')}</div>
          <button class="btn btn-ghost btn-sm" onclick="haptic('light');speak(${JSON.stringify(q.sentence||q.demo||'')},'${P.lang}', U.ttsRate)">🔊 听示范</button>
        </div>
        <div class="speak-your">
          <div class="sm-label">🎙️ 你的跟读</div>
          <button class="btn btn-primary rec-btn" id="recBtn" onclick="haptic('medium');startRecognize('${P.lang}')">▶ 开始录音</button>
          <div class="rec-result" id="recResult"></div>
          <button class="btn btn-ghost btn-sm" onclick="haptic('light');speakSelf()">🔈 自听回放</button>
        </div>
        <div class="speak-score" id="speakScore"></div>
      </div>
      <div class="row-btns" style="margin-top:16px">
        <button class="btn btn-ghost btn-lg" onclick="haptic('light');nextQuiz(0)">跳过</button>
        <button class="btn btn-primary btn-lg" onclick="haptic('medium');nextQuiz(1)">我已完成 →</button>
      </div>`;
  }
  const host = $('#player');
  if(host){
    host.innerHTML = `
    <div class="player-wrap">
      <div class="pl-top">
        <button class="pl-close" onclick="haptic('light');askClosePlayer()">×</button>
        <div class="pl-progress"><i style="width:${prog}%"></i></div>
        <div class="pl-count">${P.idx+1}/${total}</div>
      </div>
      <div class="pl-title-row">
        <span class="pl-type new">${t.icon} ${t.name}</span>
        <span class="pl-course">${esc((P.lesson&&P.lesson.title)||'')} · XP +${(P.lesson&&P.lesson.xp)||0}</span>
      </div>
      <div class="quiz-body">${body}</div>
    </div>`;
  }
  if(P.type==='listening') setTimeout(()=>replayListen(), 300);
}
function replayListen(){
  if(!P || P.type!=='listening') return;
  const q = P.questions[P.idx];
  if(!q) return;
  const lines = [q.dialog1, q.dialog2, q.dialog3, q.d].filter(Boolean);
  let i=0;
  const next = () => {
    if(i >= lines.length) return;
    speak(lines[i], P.lang, U.ttsRate, {source:'sentence'}).then(()=>{ i++; setTimeout(next, 360); }).catch(()=>{});
  };
  next();
}
function answerQuiz(i){
  if(!P || (P.type!=='grammar' && P.type!=='listening')) return;
  const q = P.questions[P.idx];
  const correct = i === q.a;
  P.userAns.push(i);
  if(correct) P.score++;
  if(P.type==='grammar') U.stats.grammar++;
  if(P.type==='listening') U.stats.listen++;
  $$('.q-opt').forEach((b,idx)=>{
    b.classList.remove('ok','bad');
    if(idx === q.a) b.classList.add('ok');
    if(idx === i && !correct) b.classList.add('bad');
    b.onclick = null;
  });
  haptic(correct?'light':'heavy');
  setTimeout(()=>nextQuiz(correct?1:0), 850);
}
/* 语音识别 (口语跟读) */
let _recBuf = '';
function startRecognize(lang){
  try{
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    const el = $('#recResult'), btn = $('#recBtn'), score = $('#speakScore');
    if(el) el.textContent = '';
    if(score) score.textContent = '';
    _recBuf = '';
    if(!Rec){
      if(el) el.innerHTML = `<span class="hint-warn">⚠️ 当前浏览器/WebView不支持语音识别，请在 Chrome 中使用。但你依然可以直接跟读完成练习。</span>`;
      return;
    }
    const r = new Rec();
    r.lang = (LANGUAGES[lang] && LANGUAGES[lang].ttsLang) || 'en-US';
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = ev => {
      let s=''; try{
        for(let i=ev.resultIndex;i<ev.results.length;i++) s += ev.results[i][0].transcript;
      }catch(_){}
      _recBuf += s;
      if(el) el.textContent = _recBuf;
    };
    r.onerror = e => {
      if(el) el.textContent = '识别提示: '+(e.error||'请允许麦克风权限');
      if(btn) btn.textContent = '▶ 开始录音';
    };
    r.onend = () => {
      if(btn) btn.textContent = '▶ 开始录音';
      scoreSelf(); U.stats.speak++;
    };
    if(btn){ btn.textContent = '⏺ 录音中 · 点击停止';
      btn.onclick = () => { try{ r.stop(); }catch(_){} };
    }
    try{ r.start(); }catch(e2){ if(el) el.textContent='启动失败:'+(e2.message||''); }
    setTimeout(()=>{ try{ r.stop(); }catch(_){} }, 9000);
  }catch(e){}
}
function scoreSelf(){
  if(!P) return;
  try{
    const q = P.questions[P.idx];
    const demo = ((q.sentence || q.demo || '')+'').toLowerCase().replace(/[^a-z\u4e00-\u9fa5ぁ-ゞァ-ヾ가-힣0-9 ]/g,' ');
    const got = (_recBuf||'').toLowerCase().replace(/[^a-z\u4e00-\u9fa5ぁ-ゞァ-ヾ가-힣0-9 ]/g,' ');
    const A = demo.split(/\s+/).filter(Boolean);
    const B = got.split(/\s+/).filter(Boolean);
    let hit = 0;
    A.forEach(w=>{ if(B.includes(w)) hit++; });
    const acc = A.length ? Math.round(hit/A.length*100) : 0;
    const bar = document.getElementById('speakScore');
    if(!bar) return;
    bar.innerHTML = `
      <div class="score-card">
        <div class="sc-title">跟读评分</div>
        <div class="sc-num">${acc}<span>分</span></div>
        <div class="sc-bar"><i style="width:${acc}%"></i></div>
        <div class="sc-desc">${acc>=85?'⭐️⭐️⭐️⭐️⭐️ 非常棒！':acc>=60?'⭐️⭐️⭐️ 不错，继续加油':'⭐️⭐️ 多听几遍再试试'}</div>
      </div>`;
  }catch(_){}
}
function speakSelf(){
  if(!_recBuf){ toast('先录音吧','🎙️'); return; }
  speak(_recBuf, P && P.lang, U && U.ttsRate, {forceNative:false, source:'sentence'});
}
function nextQuiz(point){
  if(!P) return;
  P.idx++;
  P.score += (point||0);
  if(P.idx >= P.questions.length){ finishQuizSession(); return; }
  save(); renderQuiz();
}
function finishQuizSession(){
  try{
    const total = P.questions.length;
    const rate = total ? Math.round(P.score/total*100) : 0;
    const xpBase = (P.lesson && P.lesson.xp) || 20;
    const xp = Math.max(1, Math.round(xpBase * (rate/100)));
    U.xp += xp;
    U.lessons[P.id] = {done:true, at:Date.now(), xp, score:rate};
    U.stats.decks++;
    const t = todayLog(); t.xp = (t.xp||0)+xp; U.log[today()] = t;
    touchStreak(); checkBadges(); save();
    showModal('🎉 课时完成', `
      <div class="finish-tile">
        <h2 class="ft-title">${esc((P.lesson&&P.lesson.title)||'')} · 得分 ${rate}</h2>
        <div class="ft-stats">
          <div class="ft-s"><b>${P.score}/${total}</b><span>答对/题数</span></div>
          <div class="ft-s"><b>+${xp}</b><span>XP</span></div>
          <div class="ft-s"><b>${Math.max(0,rate)}</b><span>得分</span></div>
        </div>
        <div class="row-btns" style="margin-top:18px">
          <button class="btn btn-ghost btn-lg" onclick="haptic('light');closeModalMask(); go('courses');">词书</button>
          <button class="btn btn-primary btn-lg" onclick="haptic('light');closeModalMask(); go('home');">首页 →</button>
        </div>
      </div>`);
    P = null; try{ $('#player').hidden = true; }catch(_){}
  }catch(e){ try{ $('#player').hidden = true; }catch(_){} }
}

/* ============================================================
   每日一句 (数据在 data.js 的 DAILY_QUOTES 中定义, 此处不再重复声明)
   ============================================================ */

/* ============================================================
   全局初始化 + 应用外壳注入 (唯一一次 DOM 创建)
   ============================================================ */
function exposeAPI(){
  try{
    const w = window;
    w.speak=speak; w.flipCard=flipCard; w.gradeWord=gradeWord;
    w.answerQuiz=answerQuiz; w.nextQuiz=nextQuiz;
    w.startRecognize=startRecognize; w.speakSelf=speakSelf; w.replayListen=replayListen;
    w.closePlayer=closePlayer; w.askClosePlayer=askClosePlayer;
    w.speakCur=speakCur; w.speakEx=speakEx;
    w.setGoal=setGoal; w.setRate=setRate; w.switchAccount=switchAccount;
    w.exportData=exportData; w.confirmClear=confirmClear; w.render=render;
    w.backToLevels=backToLevels; w.openLesson=openLesson;
    w.startReview=startReview; w.go=go; w.openCourse=openCourse;
    w.toggleAutoSpeak=toggleAutoSpeak; w.toggleTtsOnline=toggleTtsOnline; w.doClear=doClear; w.selectAccount=selectAccount;
    w.showModal=showModal; w.closeModalMask=closeModalMask; w.importData=importData;
    w.showGoalModal=showGoalModal; w.showRateModal=showRateModal;
    w.toggleUserMenu=toggleUserMenu;
    w.cardMouseDown=cardMouseDown; w.cardTouchStart=cardTouchStart;
    w.cardTouchEnd=cardTouchEnd; w.cardTouchMove=cardTouchMove;
  }catch(_){}
}
exposeAPI();

document.addEventListener('DOMContentLoaded', () => {
  try{
    // --- 应用外壳（唯一一次创建）---
    const phone = document.createElement('div');
    phone.className = 'phone hyper-layout';
    phone.innerHTML = `
      <div class="statusbar"><span class="sb-time" id="sbTime"></span><span class="sb-right">📶 📊 🔋</span></div>
      <main id="app" class="app-scroll" aria-live="polite"></main>
      <div id="player" class="player-root" hidden></div>
      <div id="toasts" class="toasts" aria-live="polite"></div>
      <nav id="tabbar" class="tabbar hyper" hidden>
        <button class="tab" data-tab="home">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.3 3 11h2v9h5v-6h4v6h5v-9h2L12 3.3z"/></svg>
          <span>首页</span>
        </button>
        <button class="tab" data-tab="courses">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 4h13a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V4zm2 2v14h11V6H6zm2 3h8v2H8V9zm0 4h8v2H8v-2z"/></svg>
          <span>词书</span>
        </button>
        <button class="tab" data-tab="review">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17 3a7 7 0 1 0 6.9 8h-2.4A5 5 0 1 1 17 5v4l5-5-5-5v4zm0 9.5-3.5 3.5 1.4 1.4 1.1-1.1V21h2v-5.2l1.1 1.1 1.4-1.4L17 12.5z"/></svg>
          <span>复习</span>
        </button>
        <button class="tab" data-tab="me">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6z"/></svg>
          <span>我的</span>
        </button>
      </nav>
    `;
    document.body.appendChild(phone);

    // 状态栏时间
    const setT = () => {
      try{
        const n = new Date();
        const el = document.getElementById('sbTime');
        if(el) el.textContent = String(n.getHours()).padStart(2,'0')+':'+String(n.getMinutes()).padStart(2,'0');
      }catch(_){}
    };
    setT(); setInterval(setT, 30000);

    // 初始渲染
    try{
      if(U) render(); else startOnboard();
    }catch(err){
      console.error('[LinguaVerse] init fail:', err);
      try{ startOnboard(); }catch(e2){}
    }

    // Service Worker (仅 http(s) 协议下注册)
    try{
      if('serviceWorker' in navigator && (location.protocol === 'http:' || location.protocol === 'https:')){
        navigator.serviceWorker.register('sw.js').catch(()=>{});
      }
    }catch(_){}

  }catch(err){
    console.error('[LinguaVerse] shell init fatal:', err);
    // 兜底: 至少渲染引导
    try{
      document.body.innerHTML = '<div id="app"></div><div id="toasts" class="toasts"></div>';
      startOnboard();
    }catch(_){}
  }
});

/* 全局错误兜底 (避免白屏) */
window.addEventListener('error', e => {
  try{ console.error('[LinguaVerse] onerror:', e.message||e); }catch(_){}
  return true;
}, true);
