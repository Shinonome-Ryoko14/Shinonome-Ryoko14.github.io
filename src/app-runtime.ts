// @ts-nocheck

/**
 * RYOKO BLOG — app runtime
 * Compatibility port from app.js to TypeScript bundle.
 */

/* ── STORE ── */
const Store = (() => {
  const P = 'ry3_';
  const get = (k, d) => { try { const v = localStorage.getItem(P+k); return v!==null ? JSON.parse(v) : d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(P+k, JSON.stringify(v)); } catch {} };
  const del = (k)   => { try { localStorage.removeItem(P+k); } catch {} };
  return { get, set, del };
})();

/* ── CONFIG ── */
const Config = (() => {
  const DEFAULTS = {
    site:     { title:'Ryoko', description:'个人博客', url:'', author:'Ryoko', avatar:'R', bio:'热爱技术与设计的独立创作者。', lang:'zh-CN', since:'2025' },
    hero:     { line1:"Ryoko's", line2:'Personal Blog', subtitle:'记录技术、设计与生活的交汇处', badge:'Personal Blog · Code and Record', btn1:'开始阅读', btn2:'了解我', bgImage:'', bgOpacity:0.5, showCode:true },
    theme:    { preset:'geek', font:'inter', blue:'#4f9cf9', cyan:'#22d3ee' },
    social:   [],
    effects:  { spotlight:false,spotlightInt:5,aurora:true,auroraInt:6,particles:false,particlesInt:4,stars:true,starsInt:4,trail:false,trailInt:5,snow:false,snowInt:3,glass:false,glassInt:5,glassBlur:18,glassOpacity:0.18,reveal:false,revealInt:5,revealDistance:18,revealStagger:70 },
    about:    { p1:'我相信，最好的文章应该像诗歌一样——精准、有力、留有余味。', p2:'这里是我与世界对话的地方。' },
    skills:   [{label:'前端开发',pct:92},{label:'UI/UX 设计',pct:84},{label:'内容创作',pct:88},{label:'系统架构',pct:76}],
    footer:   { copy:'© 2025 Ryoko. All rights reserved.', sub:'Built with ✦ and curiosity' },
    auth:     { adminEmail:'', adminPath:'manage-ryoko' },
    firebase: { apiKey:'', authDomain:'', projectId:'', storageBucket:'', messagingSenderId:'', appId:'' },
  };
  let cfg = {};
  const deep = (a, b) => {
    const o = {...a}; if (!b) return o;
    for (const k of Object.keys(b)) {
      if (b[k] && typeof b[k]==='object' && !Array.isArray(b[k])) o[k] = deep(a[k]||{}, b[k]);
      else o[k] = b[k];
    }
    return o;
  };
  const load = async () => {
    let fileCfg = {};
    try { const r = await fetch('./config.json?t='+Date.now()); if (r.ok) fileCfg = await r.json(); } catch {}
    cfg = deep(DEFAULTS, fileCfg);
    return cfg;
  };
  const hydrateRemote = async () => {
    if (!FB.isReady()) return cfg;
    try {
      const snap = await FB.docRef('site_config', 'main').get();
      if (snap.exists) cfg = deep(cfg, snap.data());
    } catch {}
    return cfg;
  };
  const persist = async () => {
    if (!FB.isReady() || !Auth.isLoggedIn() || !Auth.isAdmin()) return false;
    await FB.docRef('site_config', 'main').set({ ...cfg }, { merge: true });
    return true;
  };
  const get = path => { let v = cfg; for (const p of path.split('.')) v = v?.[p]; return v; };
  const save = (path, val) => {
    const parts = path.split('.');
    let node = cfg;
    for (let i = 0; i < parts.length-1; i++) { if (!node[parts[i]]||typeof node[parts[i]]!=='object') node[parts[i]]= {}; node = node[parts[i]]; }
    node[parts[parts.length-1]] = val;
    return persist();
  };
  const saveSection = (sec, obj) => { cfg[sec] = obj; return persist(); };
  const all  = () => cfg;
  return { load, hydrateRemote, persist, get, save, saveSection, all };
})();

/* ── POSTS ── */
const Posts = (() => {
  let posts = [];
  const load = async () => {
    let base = [];
    try { const r = await fetch('./posts.json?t='+Date.now()); if (r.ok) base = await r.json(); } catch {}
    const saved = Store.get('posts', null);
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const savedIds = new Set(saved.map(p => p.id));
      posts = [...saved, ...base.filter(p => !savedIds.has(p.id))];
    } else {
      posts = base;
    }
    return posts;
  };
  const save    = () => Store.set('posts', posts);
  const all     = () => posts;
  const byId    = id  => posts.find(p => p.id === id);
  const search  = q  => { if(!q) return []; q=q.toLowerCase(); return posts.filter(p=>p.title.toLowerCase().includes(q)||(p.excerpt||'').toLowerCase().includes(q)||(p.tags||[]).some(t=>t.toLowerCase().includes(q))); };
  const add     = p  => { posts.unshift(p); save(); };
  const update  = p  => { const i=posts.findIndex(x=>x.id===p.id); if(i!==-1) posts[i]=p; else posts.unshift(p); save(); };
  const remove  = id => { posts=posts.filter(p=>p.id!==id); save(); };
  const slugify = s  => s.toLowerCase().replace(/[\s\W]+/g,'-').replace(/^-|-$/g,'').slice(0,55)+'-'+Date.now().toString(36);
  return { load, all, byId, search, add, update, remove, save, slugify };
})();

/* ── STATS ── */
const Stats = (() => {
  const today = () => new Date().toISOString().slice(0,10);
  const data  = () => Store.get('stats', {visits:{},opens:{}});
  const recordVisit = () => { const s=data(),d=today(); s.visits[d]=(s.visits[d]||0)+1; Store.set('stats',s); };
  const recordOpen  = id => { const s=data(); s.opens[id]=(s.opens[id]||0)+1; Store.set('stats',s); };
  const getVisits   = () => data().visits;
  const getOpens    = () => data().opens;
  const total       = () => Object.values(data().visits).reduce((a,b)=>a+b,0);
  const last7 = () => Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const k=d.toISOString().slice(0,10); return {date:k,day:['日','一','二','三','四','五','六'][d.getDay()],count:data().visits[k]||0}; });
  const clear = () => Store.del('stats');
  return { recordVisit, recordOpen, getVisits, getOpens, total, last7, clear };
})();

/* ── FIREBASE ── */
const FB = (() => {
  let _app=null, _auth=null, _db=null;
  const isReady    = () => !!_app;
  const auth       = () => _auth;
  const db         = () => _db;
  const TS         = () => firebase.firestore.FieldValue.serverTimestamp();
  const arrUnion   = v => firebase.firestore.FieldValue.arrayUnion(v);
  const arrRemove  = v => firebase.firestore.FieldValue.arrayRemove(v);
  const incr       = n => firebase.firestore.FieldValue.increment(n);
  const col  = path => _db.collection(path);
  const docRef = (col,id) => _db.collection(col).doc(id);

  const init = fbCfg => {
    if (!fbCfg?.apiKey || fbCfg.apiKey === 'YOUR_API_KEY') return false;
    try {
      if (!firebase.apps.length) _app = firebase.initializeApp(fbCfg);
      else _app = firebase.app();
      _auth = firebase.auth();
      _db   = firebase.firestore();
      return true;
    } catch(e) { console.warn('Firebase init:', e); return false; }
  };

  return { init, isReady, auth, db, col, docRef, TS, arrUnion, arrRemove, incr };
})();

/* ── AUTH ── */
const Auth = (() => {
  let _user = null;
  const _listeners = [];
  const onChange = cb => _listeners.push(cb);
  const _notify  = () => _listeners.forEach(cb => cb(_user));
  const syncUser = fbUser => {
    _user = fbUser ? { uid:fbUser.uid, email:fbUser.email, displayName:fbUser.displayName||'管理员' } : null;
    _notify();
    return _user;
  };
  const normalizeEmail = value => (value || '').trim().toLowerCase();

  const init = () => {
    if (!FB.isReady()) return;
    FB.auth().onAuthStateChanged(syncUser);
  };

  const login = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt:'select_account' });
    const result = await FB.auth().signInWithPopup(provider);
    return syncUser(result.user);
  };
  const logout  = () => FB.auth().signOut();
  const user    = () => _user;
  const uid     = () => _user?.uid;
  const isAdmin = (email=_user?.email) => {
    const adminEmail = normalizeEmail(Config.get('auth.adminEmail'));
    return !!adminEmail && normalizeEmail(email) === adminEmail;
  };
  const isLoggedIn = () => !!_user;

  return { init, onChange, login, logout, user, uid, isAdmin, isLoggedIn };
})();

/* ── ANNOUNCEMENTS ── */
const Announce = (() => {
  let _list = [];
  let _unsub = null;

  const listen = cb => {
    if (!FB.isReady()) return;
    _unsub = FB.col('announcements')
      .orderBy('createdAt','desc')
      .limit(5)
      .onSnapshot(snap => {
        _list = snap.docs.map(d => ({id:d.id,...d.data()}));
        cb(_list);
      }, () => {});
  };

  const create = async (title, content, pinned=false) => {
    if (!Auth.isAdmin()) throw new Error('只有管理员可以发公告');
    await FB.col('announcements').add({
      title, content, pinned, authorId: Auth.uid(),
      createdAt: FB.TS()
    });
  };

  const remove = async id => { await FB.docRef('announcements', id).delete(); };
  const all    = () => _list;
  return { listen, create, remove, all };
})();

/* ── THEME ── */
const Theme = (() => {
  const PRESETS = [
    {name:'极客蓝',blue:'#4f9cf9',cyan:'#22d3ee',label:'geek'},
    {name:'赛博青',blue:'#06b6d4',cyan:'#4f9cf9',label:'cyber'},
    {name:'霓虹绿',blue:'#22c55e',cyan:'#4f9cf9',label:'neon'},
    {name:'紫粉',  blue:'#a855f7',cyan:'#f472b6',label:'violet'},
    {name:'橙火',  blue:'#f97316',cyan:'#eab308',label:'fire'},
  ];
  const FONTS = [
    {id:'inter',  name:'Inter',         preview:'Aa — Sans Serif'},
    {id:'serif',  name:'Cormorant',      preview:'Aa — Serif'},
    {id:'mono',   name:'JetBrains Mono', preview:'Aa — Monospace'},
  ];
  const FMAP = {inter:"'Inter',system-ui,sans-serif",serif:"'Cormorant Garamond',Georgia,serif",mono:"'JetBrains Mono',monospace"};
  const apply = t => {
    const r = document.documentElement.style;
    if (t.blue) r.setProperty('--blue', t.blue);
    if (t.cyan) r.setProperty('--cyan', t.cyan);
    if (t.font && FMAP[t.font]) r.setProperty('--font-body', FMAP[t.font]);
  };
  const setDark  = () => { document.documentElement.setAttribute('data-theme','dark'); Store.set('dark',true); const b=document.querySelector('#theme-toggle'); if(b)b.textContent='☀'; };
  const setLight = () => { document.documentElement.setAttribute('data-theme','light'); Store.set('dark',false); const b=document.querySelector('#theme-toggle'); if(b)b.textContent='☾'; };
  const toggle   = () => document.documentElement.getAttribute('data-theme')==='dark' ? setLight() : setDark();
  const initDark = () => {
    const saved = Store.get('dark', null);
    if (saved===true) { setDark(); return; }
    if (saved===false) { setLight(); return; }
    const h = new Date().getHours();
    if (h>=21||h<7||window.matchMedia('(prefers-color-scheme:dark)').matches) setDark(); else setLight();
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => { if(Store.get('dark',null)===null) e.matches?setDark():setLight(); });
  };
  return { apply, toggle, initDark, PRESETS, FONTS };
})();

const FX = window.__RYOKO_FX__;
const FX_DEFS = window.__RYOKO_FX_DEFS__ || [
  {key:'spotlight',icon:'🔦',name:'聚光灯',desc:'鼠标跟随光晕+点阵',ik:'spotlightInt'},
  {key:'aurora',icon:'🌌',name:'极光背景',desc:'Hero 流动彩色光球',ik:'auroraInt'},
  {key:'particles',icon:'✦',name:'浮动粒子',desc:'全页粒子+鼠标吸附(O001)',ik:'particlesInt'},
  {key:'stars',icon:'🌠',name:'星尘背景',desc:'细密闪烁星点',ik:'starsInt'},
  {key:'trail',icon:'🌊',name:'鼠标拖尾',desc:'鼠标划过发光轨迹',ik:'trailInt'},
  {key:'snow',icon:'❄️',name:'飘落雪花',desc:'轻柔飘落粒子',ik:'snowInt'},
  {key:'glass',icon:'🫧',name:'磨砂玻璃',desc:'为卡片和侧栏启用玻璃模糊层',ik:'glassInt',params:[{key:'glassBlur',label:'模糊强度',type:'range',min:4,max:32,step:1},{key:'glassOpacity',label:'透明度',type:'range',min:0.08,max:0.45,step:0.01}]},
  {key:'reveal',icon:'✍️',name:'手写显现',desc:'标题与卡片以轻量笔触式动效出现',ik:'revealInt',params:[{key:'revealDistance',label:'位移距离',type:'range',min:4,max:48,step:1},{key:'revealStagger',label:'错峰时长',type:'range',min:20,max:220,step:10}]}
];

/* ── MD / TOC / SEO / Tools ── */
const MD = (() => {
  const render = (text, format) => {
    if(!text) return '';
    if(format==='html') return text;
    if(window.marked){
      marked.setOptions({breaks:true,gfm:true});
      const r=new marked.Renderer();
      r.code=(code,lang)=>{const esc=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');const l=lang||'code';return `<pre data-lang="${l}"><code class="language-${l}">${esc}</code></pre>`;};
      return marked.parse(text,{renderer:r});
    }
    return `<pre><code>${text.replace(/</g,'&lt;')}</code></pre>`;
  };
  const enhance = container => {
    if(!container) return;
    if(window.hljs)container.querySelectorAll('pre code').forEach(b=>{try{hljs.highlightElement(b);}catch{}});
    if(window.renderMathInElement){try{renderMathInElement(container,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});}catch{}}
  };
  const renderInto = (container, text, format) => {
    if(!container) return;
    container.innerHTML = render(text || '', format || 'markdown');
    enhance(container);
  };
  return {render, enhance, renderInto};
})();

const TOC = (() => {
  const build = container => {
    const hs=container.querySelectorAll('h1,h2,h3,h4');
    const te=document.getElementById('modal-toc'),tl=document.getElementById('toc-list');
    if(!te||!tl||hs.length<3){if(te)te.style.display='none';return;}
    te.style.display='block'; tl.innerHTML=''; let idx=0;
    hs.forEach(h=>{h.id='toc-h-'+(idx++);const a=document.createElement('a');a.className='toc-item toc-'+h.tagName.toLowerCase();a.textContent=h.textContent;a.onclick=()=>h.scrollIntoView({behavior:'smooth',block:'start'});tl.appendChild(a);});
  };
  return {build};
})();

const SEO = (() => {
  const $=id=>document.getElementById(id);
  const update=cfg=>{
    const s=cfg.site,url=s.url||location.origin;
    document.title=s.title; document.documentElement.lang=s.lang||'zh-CN';
    const sm=(id,a,v)=>{const e=$(id);if(e)e.setAttribute(a,v);};
    sm('meta-desc','content',s.description);sm('meta-author','content',s.author);sm('meta-canonical','href',url);
    sm('og-site','content',s.title);sm('og-title','content',s.title);sm('og-desc','content',s.description);sm('og-url','content',url);
    sm('tw-title','content',s.title);sm('tw-desc','content',s.description);
    sm('rss-link','href',(s.url||'')+'/rss.xml');
  };
  return {update};
})();

const Tools = (() => {
  const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const strip=s=>s?s.replace(/<[^>]*>/g,''):'';
  const dl=(content,filename,type='text/xml')=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=filename;a.click();};

  const buildRSS=()=>{
    const cfg=Config.all(),u=cfg.site.url||location.origin;
    const items=Posts.all().slice(0,20).map(p=>`\n    <item>\n      <title>${esc(p.title)}</title>\n      <link>${u}/#${p.id}</link>\n      <guid>${u}/#${p.id}</guid>\n      <pubDate>${new Date(p.date).toUTCString()}</pubDate>\n      <description>${esc(strip(p.excerpt||p.content||'').slice(0,300))}</description>\n    </item>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${esc(cfg.site.title)}</title>\n    <link>${u}</link>\n    <description>${esc(cfg.site.description)}</description>\n    <language>${cfg.site.lang}</language>${items}\n  </channel>\n</rss>`;
  };
  const buildSitemap=()=>{
    const u=Config.get('site.url')||location.origin;
    const urls=[{loc:u+'/',p:'1.0',c:'weekly'},...Posts.all().map(p=>({loc:`${u}/#${p.id}`,lm:p.date,p:'0.8',c:'monthly'}))];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url>\n    <loc>${u.loc}</loc>${u.lm?`\n    <lastmod>${u.lm}</lastmod>`:''}\n    <changefreq>${u.c}</changefreq>\n    <priority>${u.p}</priority>\n  </url>`).join('\n')}\n</urlset>`;
  };
  const downloadConfigJson=()=>{
    const out=JSON.stringify(Config.all(),null,2);
    dl(out,'config.json','application/json');
    const ind=document.getElementById('sync-indicator');if(ind)ind.style.display='none';
    toast('📥 config.json 已下载 — 上传到 GitHub 仓库根目录全设备同步',5000);
  };
  const downloadPostsJson=()=>{
    dl(JSON.stringify(Posts.all(),null,2),'posts.json','application/json');
    toast('📥 posts.json 已下载 — 上传到 GitHub 仓库根目录',5000);
  };
  return {
    downloadRSS(){dl(buildRSS(),'rss.xml','application/rss+xml');toast('✅ rss.xml 已下载');},
    downloadSitemap(){dl(buildSitemap(),'sitemap.xml','application/xml');toast('✅ sitemap.xml 已下载');},
    downloadConfigJson, downloadPostsJson
  };
})();

/* ── RENDER ── */
const Render = (() => {
  const $=id=>document.getElementById(id);
  const CAT={tech:'技术',design:'设计',life:'生活',think:'思考',other:'其他'};
  const fmt=d=>d?d.replace(/-/g,'.'):'';
  const PER=6;
  let _currentTab='official';

  const applyConfig=cfg=>{
    const s=cfg.site,h=cfg.hero,f=cfg.footer;
    const tx=(id,v)=>{const e=$(id);if(e)e.textContent=v;};
    ['nav-logo','footer-logo','admin-logo-el','admin-brand-el'].forEach(id=>tx(id,s.title));
    document.title=s.title;
    tx('hero-badge-text',h.badge); tx('hero-line1',h.line1); tx('hero-line2',h.line2);
    tx('hero-sub-text',h.subtitle);
    const b1=$('hero-btn1');if(b1)b1.textContent=h.btn1;
    const b2=$('hero-btn2');if(b2)b2.textContent=h.btn2;
    tx('code-author',`'${s.author}'`);
    const hbg=$('hero-bg-img');
    if(hbg){if(h.bgImage){hbg.style.backgroundImage=`url('${h.bgImage}')`;hbg.style.opacity=1-(h.bgOpacity||.5);}else hbg.style.backgroundImage='';}
    const hc=$('hero-code');if(hc)hc.style.display=h.showCode?'block':'none';
    tx('footer-copy',f.copy);tx('footer-sub',f.sub);tx('footer-desc',s.description);
    const av=s.avatar||s.title.charAt(0);
    ['sidebar-av','orbit-av'].forEach(id=>tx(id,av));
    tx('sidebar-name',s.author);tx('sidebar-bio',s.bio);
    tx('blog-about-p1',(cfg.about||{}).p1||'');tx('blog-about-p2',(cfg.about||{}).p2||'');
    renderSocial(cfg.social||[]);
    renderSkills(cfg.skills||[]);
  };

  const renderSocial=links=>{
    const h=links.map(l=>`<a class="social-link" href="${l.url||'#'}" target="_blank" rel="noopener">${l.icon||'🔗'} ${l.label}</a>`).join('');
    const se=$('sidebar-social');if(se)se.innerHTML=h;
    const fe=$('footer-social');if(fe)fe.innerHTML=links.map(l=>`<a href="${l.url||'#'}" target="_blank" rel="noopener">${l.icon||'🔗'} ${l.label}</a>`).join('');
  };

  const renderSkills=skills=>{
    const el=$('skills-list');if(!el)return;
    el.innerHTML=skills.map(s=>`<div class="skill-item"><div class="skill-lr"><span>${s.label}</span><span>${s.pct}%</span></div><div class="skill-track"><div class="skill-fill" data-pct="${s.pct/100}"></div></div></div>`).join('');
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.querySelectorAll('.skill-fill').forEach(f=>{f.style.transform='scaleX(1)';f.classList.add('v')});}),{threshold:.2});
    obs.observe(el);
  };

  const renderAnnouncements=list=>{
    const el=$('announce-bar');if(!el)return;
    const pinned=list.filter(a=>a.pinned);
    const latest=pinned.length?pinned[0]:(list.length?list[0]:null);
    if(!latest){el.style.display='none';return;}
    el.style.display='flex';
    el.innerHTML=`
      <div class="announce-content">
        <span class="announce-badge">📢 公告</span>
        <strong>${latest.title}</strong>
        ${latest.content?`<span class="announce-text"> — ${latest.content}</span>`:''}
      </div>
      <button class="announce-close" onclick="document.getElementById('announce-bar').style.display='none'">✕</button>`;
  };

  const switchTab=tab=>{
    _currentTab=tab;
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
    const og=$('official-section');
    if(og) og.style.display='block';
  };

  const renderPosts=(posts,cat='all',page=1)=>{
    const filtered=cat==='all'?posts:posts.filter(p=>p.cat===cat);
    const pages=Math.max(1,Math.ceil(filtered.length/PER));
    const slice=filtered.slice((page-1)*PER,page*PER);
    const grid=$('posts-grid');if(!grid)return;
    if(!slice.length){grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);font-size:14px">暂无文章 ☁</div>`;}
    else{grid.innerHTML=slice.map((p,i)=>officialCard(p,i===0&&page===1&&cat==='all'&&!!p.featured)).join('');}
    renderPagination(pages,page,cat,'official');
    renderSideStats(posts); renderCatList(posts,cat); renderTagCloud(posts);
    initCardTilt();
  };

  const officialCard=(p,feat)=>`
    <div class="post-card${feat?' featured':''}" onclick="openPost('${p.id}','official')">
      <div class="post-thumb ${(p.cover?.style||'cv1').replace('cover-','cv')}">
        <div class="pta"></div><div class="ptg">${p.cover?.glyph||'✦'}</div>
      </div>
      <div class="post-body">
        <div class="post-meta"><span class="post-cat cat-${p.cat}">${CAT[p.cat]||p.cat}</span><span class="post-date">${fmt(p.date)}</span></div>
        <h3 class="post-title">${p.title}</h3>
        <p class="post-excerpt">${p.excerpt||''}</p>
        <div class="post-tags">${(p.tags||[]).map(t=>`<span class="post-tag" onclick="event.stopPropagation();filterByTag('${t}')">${t}</span>`).join('')}</div>
        <span class="read-more">阅读全文 →</span>
      </div>
    </div>`;

  const renderPagination=(pages,cur,cat)=>{
    const el=$('pagination');if(!el||pages<=1){if(el)el.innerHTML='';return;}
    el.innerHTML=Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="page-btn${p===cur?' active':''}" onclick="changePage(${p},'${cat}')">${p}</button>`).join('');
  };

  const renderSideStats=posts=>{
    const el=$('mini-stats');if(!el)return;
    el.innerHTML=[['文章',posts.length+'篇'],['访问',Stats.total()+'次'],['分类',[...new Set(posts.map(p=>p.cat))].length+'类']].map(([l,v])=>`<div class="mini-stat-row"><span class="msl">${l}</span><span class="msv">${v}</span></div>`).join('');
  };
  const renderCatList=(posts,active)=>{
    const el=$('cat-list');if(!el)return;
    const cnt={};posts.forEach(p=>{cnt[p.cat]=(cnt[p.cat]||0)+1;});
    el.innerHTML=[['all','全部',posts.length],...Object.entries(cnt).map(([k,v])=>[k,CAT[k]||k,v])].map(([k,n,c])=>`<div class="cat-item${k===active?' active':''}" onclick="filterByCat('${k}')" style="${k===active?'color:var(--blue)':''}"><span>${n}</span><span class="cat-item-count">${c}</span></div>`).join('');
  };
  const renderTagCloud=posts=>{
    const el=$('tag-cloud');if(!el)return;
    el.innerHTML=[...new Set(posts.flatMap(p=>p.tags||[]))].map(t=>`<span class="tag-pill" onclick="filterByTag('${t}')">${t}</span>`).join('');
  };

  const openModal=(post)=>{
    const cv=(post.cover?.style||'cv1').replace('cover-','cv');
    const mc=$('modal-cover');if(mc)mc.className=`modal-cover ${cv}`;
    $('modal-glyph').textContent=post.cover?.glyph||'✦';
    $('modal-cat').textContent=CAT[post.cat]||post.cat;
    $('modal-cat').className=`post-cat cat-${post.cat||'other'}`;
    const ts=post.createdAt?.toDate?post.createdAt.toDate():new Date(post.date||Date.now());
    $('modal-date').textContent=ts.toLocaleDateString('zh-CN');
    $('modal-title').textContent=post.title;

    const html=MD.render(post.content||'',post.format||'markdown');
    const mt=$('modal-text');
    if(mt)MD.renderInto(mt, post.content||'', post.format||'markdown');
    if(mt)TOC.build(mt);
    $('modal-tags').innerHTML=(post.tags||[]).map(t=>`<span class="modal-tag">${t}</span>`).join('');
    $('post-modal').classList.add('open');
    document.body.style.overflow='hidden';
  };

  const closeModal=()=>{
    $('post-modal').classList.remove('open');
    document.body.style.overflow='';
    const toc=$('modal-toc');if(toc)toc.style.display='none';
  };

  const renderSearch=(results,q)=>{
    const el=$('search-results');if(!el)return;
    if(!q){el.style.display='none';el.innerHTML='';return;}
    el.style.display='block';
    if(!results.length){el.innerHTML=`<div class="sr-empty">未找到"${q}"相关文章</div>`;return;}
    el.innerHTML=results.slice(0,6).map(p=>`<div class="sri" onclick="openPost('${p.id}','official');clearSearch()"><div class="sri-t">${p.title}</div><div class="sri-m"><span class="post-cat cat-${p.cat}" style="padding:1px 6px">${CAT[p.cat]}</span> ${fmt(p.date)}</div></div>`).join('');
  };

  const initCardTilt=()=>{
    document.querySelectorAll('.post-card').forEach(card=>{
      if(card._tiltInit) return;
      card._tiltInit=true;
      card.addEventListener('mousemove',e=>{
        const rect=card.getBoundingClientRect();
        const x=(e.clientX-rect.left)/rect.width-0.5;
        const y=(e.clientY-rect.top)/rect.height-0.5;
        card.style.transform=`perspective(700px) rotateY(${x*10}deg) rotateX(${-y*10}deg) translateZ(6px) translateY(-3px)`;
        card.style.boxShadow=`0 8px 30px rgba(0,0,0,0.4),0 0 30px rgba(79,156,249,0.3),${-x*8}px ${-y*8}px 20px rgba(34,211,238,0.15)`;
      });
      card.addEventListener('mouseleave',()=>{
        card.style.transform='';
        card.style.boxShadow='';
      });
    });
  };

  return { applyConfig, renderPosts, renderSocial, renderSkills,
           renderAnnouncements, switchTab,
           renderSearch, openModal, closeModal, initCardTilt };
})();

/* ── ADMIN ── */
const Admin = (() => {
  const $=id=>document.getElementById(id);
  let editId=null;
  let editorMode='split';
  let previewTimer=null;

  const updateEditorModeUi=()=>{
    const shell=$('editor-shell');
    if(shell)shell.dataset.mode=editorMode;
    document.querySelectorAll('[data-editor-mode]').forEach(btn=>btn.classList.toggle('active',btn.dataset.editorMode===editorMode));
  };
  const setEditorMode=mode=>{editorMode=mode||'split';updateEditorModeUi();refreshArticlePreview(true);};
  const updateEditorFormatBadge=()=>{
    const badge=$('editor-format-badge');
    if(badge)badge.textContent=($('f-format')?.value||'markdown').toLowerCase();
  };
  const refreshArticlePreview=(immediate=false)=>{
    const run=()=>{
      updateEditorFormatBadge();
      const preview=$('article-preview');
      if(!preview)return;
      const content=$('f-content')?.value||'';
      const format=$('f-format')?.value||'markdown';
      if(!content.trim()){
        preview.innerHTML='<div class="editor-empty">预览将在这里显示</div>';
        return;
      }
      MD.renderInto(preview, content, format);
    };
    if(previewTimer){clearTimeout(previewTimer);previewTimer=null;}
    if(immediate){run();return;}
    previewTimer=setTimeout(run,180);
  };
  const insertAround=(before,after='',fallback='')=>{
    const input=$('f-content');
    if(!input)return;
    const start=input.selectionStart??0;
    const end=input.selectionEnd??0;
    const selected=input.value.slice(start,end) || fallback;
    input.setRangeText(`${before}${selected}${after}`,start,end,'end');
    input.focus();
    refreshArticlePreview();
  };
  const insertBlock=(text)=>{
    const input=$('f-content');
    if(!input)return;
    const start=input.selectionStart??0;
    input.setRangeText(text,start,start,'end');
    input.focus();
    refreshArticlePreview();
  };
  const insertMarkdown=(kind)=>{
    if(kind==='heading') return insertAround('## ','','小节标题');
    if(kind==='bold') return insertAround('**','**','重点');
    if(kind==='italic') return insertAround('*','*','强调');
    if(kind==='code') return insertBlock('\n```ts\nconst message = "hello";\n```\n');
    if(kind==='inlineMath') return insertAround('$','$','a^2+b^2=c^2');
    if(kind==='blockMath') return insertBlock('\n$$\n\\int_0^1 x^2 \\, dx\n$$\n');
    if(kind==='image') return insertBlock('\n![图片描述](https://example.com/image.png)\n');
  };
  const fxParamLabel=(value,step)=>{
    const decimals=String(step||'').includes('.') ? String(step).split('.')[1].length : 0;
    return Number(value).toFixed(decimals).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1');
  };
  const renderFxParams=(fxDef, fx)=>{
    if(!fxDef.params?.length) return '<div class="fx-note">当前效果支持即时开关与强度调节。</div>';
    return `<div class="fx-stack">${fxDef.params.map(param=>`<div class="fx-param"><div class="fx-param-top"><span>${param.label}</span><span class="fx-param-value" id="fx-val-${param.key}">${fxParamLabel(fx[param.key] ?? param.min ?? 0,param.step)}</span></div><input type="range" class="fx-r" id="fx-param-${param.key}" min="${param.min}" max="${param.max}" step="${param.step||1}" value="${fx[param.key] ?? param.min ?? 0}" oninput="Admin.liveFxParam('${param.key}',this.value,'${param.step||1}')"></div>`).join('')}</div>`;
  };

  const showLogin=()=>{ $('admin-login').style.display='flex'; $('admin-app').style.display='none'; updateAdminRoutePreview(); };
  const showApp=()=>{ $('admin-login').style.display='none'; $('admin-app').style.display='flex'; };

  const doLogin=async()=>{
    if(!Config.get('auth.adminEmail')){
      $('login-err').textContent='请先在配置中填写管理员 Google 邮箱';
      $('login-err').style.display='block';
      return;
    }
    try {
      const fbUser = await Auth.login();
      if(Auth.isAdmin(fbUser?.email)){showApp();refresh();}
      else{await Auth.logout();$('login-err').textContent='当前 Google 账号不是管理员';$('login-err').style.display='block';}
    } catch {
      $('login-err').textContent='Google 登录未完成或被取消';
      $('login-err').style.display='block';
    }
  };
  const getAdminToken=()=> (Config.get('auth.adminPath') || 'manage-ryoko').trim().replace(/^[/?#]+/, '');
  const getAdminAccessUrl=()=>{
    const url=new URL(location.origin + location.pathname);
    url.searchParams.set('admin',getAdminToken());
    return url.toString();
  };
  const syncAdminAccessUrl=visible=>{
    const url=new URL(location.href);
    if(visible) url.searchParams.set('admin',getAdminToken());
    else url.searchParams.delete('admin');
    history[visible?'pushState':'replaceState']({},'',`${url.pathname}${url.search}${url.hash}`);
  };
  const open=(syncUrl=true)=>{
    showLogin();
    $('admin-overlay').classList.add('vis');
    $('login-err').style.display='none';
    if(Auth.isAdmin()) { showApp(); refresh(); }
    if(syncUrl)syncAdminAccessUrl(true);
  };
  const openIfRouteMatches=()=>{
    if(new URLSearchParams(location.search).get('admin')===getAdminToken()){ open(false); return true; }
    return false;
  };
  const updateAdminRoutePreview=()=>{
    const path=getAdminToken();
    const el=$('admin-route-preview');
    if(el) el.textContent=getAdminAccessUrl();
    const input=$('admin-route');
    if(input) input.value=path;
  };
  const saveAdminAccess=async()=>{
    const input=$('admin-route');
    const raw=(input?.value || '').trim().replace(/^[/?#]+/, '');
    if(!raw){toast('⚠️ 请填写隐藏入口标识');return;}
    await Config.saveSection('auth',{...Config.get('auth'),adminEmail:Config.get('auth.adminEmail'),adminPath:raw});
    updateAdminRoutePreview();
    if($('admin-overlay')?.classList.contains('vis')) syncAdminAccessUrl(true);
    toast('✅ 隐藏入口已保存');
  };
  const goToAdminRoute=()=>{ open(); };
  const exit=async()=>{
    $('admin-overlay').classList.remove('vis');
    syncAdminAccessUrl(false);
    await Config.persist();
    Render.applyConfig(Config.all());
    FX.applyAll(Config.get('effects')||{});
    Theme.apply(Config.get('theme')||{});
    SEO.update(Config.all());
    Render.renderPosts(Posts.all());
    window.scrollTo({top:0,behavior:'smooth'});
  };
  const refresh=()=>switchPanel('dashboard');

  const switchPanel=name=>{
    document.querySelectorAll('.anav').forEach(e=>e.classList.remove('active'));
    document.querySelectorAll('.apanel').forEach(e=>e.classList.remove('active'));
    const nav=document.querySelector(`.anav[data-panel="${name}"]`);if(nav)nav.classList.add('active');
    const pnl=$('panel-'+name);if(pnl)pnl.classList.add('active');
    const m=$('admin-main');if(m)m.scrollTop=0;
    const loaders={dashboard:loadDash,articles:loadArticles,hero:loadHero,effects:loadFxForm,contact:loadContact,profile:loadProfile,theme:loadTheme,tools:loadTools,announce:loadAnnounce,password:loadAdminAccess};
    if(loaders[name])loaders[name]();
  };

  const loadDash=()=>{
    const posts=Posts.all(),cats=[...new Set(posts.map(p=>p.cat))].length;
    $('dash-stats').innerHTML=[['文章',posts.length,'篇'],['分类',cats,'类'],['标签',[...new Set(posts.flatMap(p=>p.tags||[]))].length,'个'],['访问',Stats.total(),'次']].map(([l,v,u])=>`<div class="stat-card"><div class="stat-val">${v}</div><div class="stat-label">${l} <span style="font-size:10px">${u}</span></div></div>`).join('');
    const days=Stats.last7(),max=Math.max(...days.map(d=>d.count),1);
    $('visit-chart').innerHTML=days.map(d=>`<div class="bw"><div class="bar" style="height:${Math.round((d.count/max)*72)+4}px" data-val="${d.count}"></div><div class="bd">周${d.day}</div></div>`).join('');
    const CC={tech:'#4f9cf9',design:'#f472b6',life:'#4ade80',think:'#f97316',other:'#a855f7'},CN={tech:'技术',design:'设计',life:'生活',think:'思考',other:'其他'};
    const cnt={};posts.forEach(p=>{cnt[p.cat]=(cnt[p.cat]||0)+1;});const tot=posts.length||1;
    let acc=0;const slices=Object.entries(cnt).map(([k,v])=>{const pc=(v/tot)*100;const s=`<stop offset="${acc}%" stop-color="${CC[k]||'#aaa'}"/><stop offset="${acc+pc}%" stop-color="${CC[k]||'#aaa'}"/>`;acc+=pc;return s;});
    $('cat-pie').innerHTML=`<div class="pie-wrap"><svg width="80" height="80" viewBox="0 0 32 32"><defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">${slices.join('')}</linearGradient></defs><circle r="14" cx="16" cy="16" fill="none" stroke="url(#pg)" stroke-width="4" transform="rotate(-90 16 16)"/></svg><div class="pie-legend">${Object.entries(cnt).map(([k,v])=>`<div><span class="pie-dot" style="background:${CC[k]||'#aaa'}"></span>${CN[k]||k}(${v})</div>`).join('')}</div></div>`;
    $('act-list').innerHTML=posts.slice(0,5).map(p=>`<div class="act-item"><div class="act-dot"></div>发布了《${p.title}》 · ${p.date}</div>`).join('')||'<div style="color:var(--muted);font-size:13px;padding:10px 0">暂无动态</div>';
  };

  const loadArticles=()=>{
    const posts=Posts.all();$('art-count').textContent=`共 ${posts.length} 篇`;
    $('art-form').style.display='none';editId=null;
    $('art-body').innerHTML=posts.map(p=>`<div class="trow"><span class="ttl">${p.title}</span><span class="tcat">${p.cat}</span><span class="tdt">${p.date||''}</span><span class="tact"><button class="tbtn" onclick="Admin.editArt('${p.id}')">编辑</button><button class="tbtn" style="color:var(--orange)" onclick="Admin.delArt('${p.id}')">删除</button></span></div>`).join('')||`<div style="padding:16px;color:var(--muted);font-size:13px">暂无文章</div>`;
  };
  const startNew=()=>{
    editId=null;$('form-mode-label').textContent='新建文章';
    ['f-title','f-excerpt','f-tags','f-content'].forEach(id=>{const e=$(id);if(e)e.value='';});
    $('f-cat').value='tech';$('f-date').value=new Date().toISOString().slice(0,10);
    $('f-format').value='markdown';$('f-cover').value='cv1';$('f-glyph').value='✦';$('f-featured').checked=false;
    $('art-form').style.display='block';$('admin-main').scrollTop=0;setEditorMode('split');refreshArticlePreview(true);
  };
  const editArt=id=>{
    const p=Posts.byId(id);if(!p)return;editId=id;
    $('form-mode-label').textContent='编辑文章';
    $('f-title').value=p.title||'';$('f-cat').value=p.cat||'tech';$('f-date').value=p.date||'';
    $('f-excerpt').value=p.excerpt||'';$('f-tags').value=(p.tags||[]).join(',');$('f-content').value=p.content||'';
    $('f-format').value=p.format||'markdown';$('f-cover').value=p.cover?.style||'cv1';
    $('f-glyph').value=p.cover?.glyph||'✦';$('f-featured').checked=!!p.featured;
    $('art-form').style.display='block';$('admin-main').scrollTop=0;setEditorMode('split');refreshArticlePreview(true);
  };
  const delArt=id=>{if(!confirm('确认删除？'))return;Posts.remove(id);loadArticles();Render.renderPosts(Posts.all());toast('🗑 文章已删除');};
  const saveArticle=()=>{
    const title=$('f-title').value.trim();if(!title){toast('⚠️ 请填写标题');return;}
    const p={id:editId||Posts.slugify(title),title,cat:$('f-cat').value,date:$('f-date').value,
      excerpt:$('f-excerpt').value.trim(),tags:$('f-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
      content:$('f-content').value,format:$('f-format').value,
      cover:{style:$('f-cover').value,glyph:$('f-glyph').value||'✦'},featured:$('f-featured').checked};
    if(editId)Posts.update(p);else Posts.add(p);
    loadArticles();Render.renderPosts(Posts.all());
    toast(editId?'✅ 文章已更新':'✅ 文章已发布');editId=null;$('art-form').style.display='none';
  };
  const cancelForm=()=>{$('art-form').style.display='none';editId=null;};

  const loadHero=()=>{
    const h=Config.get('hero')||{};
    const sv=(id,v)=>{const e=$(id);if(e)e.value=v||'';};
    sv('h-line1',h.line1);sv('h-line2',h.line2);sv('h-sub',h.subtitle);sv('h-badge',h.badge);sv('h-btn1',h.btn1);sv('h-btn2',h.btn2);sv('h-bg',h.bgImage);
    const op=$('h-opacity');if(op){op.value=h.bgOpacity||.5;$('h-opa-val').textContent=h.bgOpacity||.5;}
    const sc=$('h-show-code');if(sc)sc.checked=h.showCode!==false;
    previewBg();
  };
  const previewBg=()=>{const url=$('h-bg')?.value,pv=$('bg-preview');if(!pv)return;if(url){pv.style.backgroundImage=`url('${url}')`;pv.textContent='';}else{pv.style.backgroundImage='';pv.textContent='暂无背景图';}};
  const saveHero=async()=>{
    const h={line1:$('h-line1').value.trim()||"Ryoko's",line2:$('h-line2').value.trim()||'Personal Blog',subtitle:$('h-sub').value.trim(),badge:$('h-badge').value.trim(),btn1:$('h-btn1').value.trim()||'开始阅读',btn2:$('h-btn2').value.trim()||'了解我',bgImage:$('h-bg').value.trim(),bgOpacity:+($('h-opacity').value),showCode:$('h-show-code').checked};
    await Config.saveSection('hero',h);Render.applyConfig(Config.all());toast('✅ 主页设置已保存');
  };

  const loadFxForm=()=>{
    const fx=Config.get('effects')||{};
    $('fx-grid').innerHTML=FX_DEFS.map(f=>`<div class="fx-card"><div class="fx-head"><div><div class="fx-name">${f.icon} ${f.name}</div><div class="fx-desc">${f.desc}</div></div><label class="tgl-label" style="flex-shrink:0"><input type="checkbox" class="tgl-cb" id="fx-${f.key}" ${fx[f.key]?'checked':''} onchange="Admin.liveFx('${f.key}',this.checked)"></label></div><div class="fx-rl">强度</div><input type="range" class="fx-r" id="fx-int-${f.key}" min="1" max="10" value="${fx[f.ik]||5}" oninput="Admin.liveFxInt('${f.ik}',+this.value)">${renderFxParams(f, fx)}</div>`).join('');
  };
  const liveFx=async(k,on)=>{await Config.save('effects.'+k,on);FX.toggle(k,on,+($('fx-int-'+k)?.value||5));};
  const liveFxInt=async(ik,v)=>{await Config.save('effects.'+ik,v);FX.applyAll(Config.get('effects')||{});};
  const liveFxParam=async(key,v,step='1')=>{const num=Number(v);const value=String(step).includes('.')?num:num;const valEl=$('fx-val-'+key);if(valEl)valEl.textContent=fxParamLabel(value,step);await Config.save('effects.'+key,value);FX.applyAll(Config.get('effects')||{});};
  const saveEffects=async()=>{const fx={...(Config.get('effects')||{})};FX_DEFS.forEach(f=>{fx[f.key]=!!$('fx-'+f.key)?.checked;fx[f.ik]=+($('fx-int-'+f.key)?.value||5);(f.params||[]).forEach(param=>{fx[param.key]=String(param.step||1).includes('.')?Number($('fx-param-'+param.key)?.value||0):+($('fx-param-'+param.key)?.value||0);});});await Config.saveSection('effects',fx);FX.applyAll(fx);toast('✅ 特效已保存 — 关闭后台可在博客看到效果');};

  const CI={Email:'✉️',GitHub:'🐙',Twitter:'🐦',Instagram:'📷',Weibo:'🌐',WeChat:'💬',LinkedIn:'💼',YouTube:'▶️',Bilibili:'📺',其他:'🔗'};
  let contacts=[];
  const loadContact=()=>{
    contacts=JSON.parse(JSON.stringify(Config.get('social')||[]));
    const a=Config.get('about')||{};
    const ap1=$('about-p1');if(ap1)ap1.value=a.p1||'';
    const ap2=$('about-p2');if(ap2)ap2.value=a.p2||'';
    renderCE();
  };
  const renderCE=()=>{$('contact-list').innerHTML=contacts.map((c,i)=>`<div class="crow"><select class="fi" style="padding:5px 8px;font-size:12px" onchange="Admin.setC(${i},'type',this.value)">${Object.keys(CI).map(k=>`<option value="${k}" ${c.type===k?'selected':''}>${CI[k]} ${k}</option>`).join('')}</select><input class="fi" style="padding:5px 9px" value="${c.label||''}" placeholder="显示名称" oninput="Admin.setC(${i},'label',this.value)"><input class="fi" style="padding:5px 9px" value="${c.url||''}" placeholder="https://..." oninput="Admin.setC(${i},'url',this.value)"><button class="dbtn" onclick="Admin.rmC(${i})">×</button></div>`).join('')||'<div style="color:var(--muted);font-size:13px;padding:8px">暂无联系方式，点击「新增」</div>';};
  const setC=(i,k,v)=>{if(contacts[i])contacts[i][k]=v;};
  const rmC=i=>{contacts.splice(i,1);renderCE();};
  const addContact=()=>{contacts.push({type:'其他',label:'新链接',url:'https://',icon:'🔗'});renderCE();};
  const saveContact=async()=>{
    contacts.forEach(c=>{c.icon=CI[c.type]||'🔗';});
    await Config.saveSection('social',contacts);
    const p1val=$('about-p1')?.value||'',p2val=$('about-p2')?.value||'';
    await Config.saveSection('about',{p1:p1val,p2:p2val});
    const bp1=document.getElementById('blog-about-p1'),bp2=document.getElementById('blog-about-p2');
    if(bp1)bp1.textContent=p1val;if(bp2)bp2.textContent=p2val;
    Render.applyConfig(Config.all());Render.renderPosts(Posts.all());toast('✅ 联系方式已保存');
  };

  let skills=[];
  const loadProfile=()=>{
    const s=Config.get('site')||{},f=Config.get('footer')||{};
    const sv=(id,v)=>{const e=$(id);if(e)e.value=v||'';};
    sv('p-av',s.avatar);sv('p-name',s.author);sv('p-bio',s.bio);sv('p-blog-name',s.title);sv('p-blog-sub',s.description);sv('p-site-url',s.url);sv('p-footer-copy',f.copy);sv('p-footer-sub',f.sub);
    const ap=$('admin-av-preview');if(ap)ap.textContent=s.avatar||'R';
    skills=JSON.parse(JSON.stringify(Config.get('skills')||[]));renderSE();
  };
  const renderSE=()=>{$('skills-editor').innerHTML=skills.map((s,i)=>`<div class="sked-row"><input class="fi" style="padding:5px 9px" value="${s.label}" placeholder="技能名称" oninput="Admin.setSk(${i},'label',this.value)"><input type="number" class="fi" style="padding:5px 9px" min="0" max="100" value="${s.pct}" oninput="Admin.setSk(${i},'pct',+this.value)"><button class="dbtn" onclick="Admin.rmSk(${i})">×</button></div>`).join('');};
  const setSk=(i,k,v)=>{if(skills[i])skills[i][k]=v;};
  const rmSk=i=>{skills.splice(i,1);renderSE();};
  const addSkill=()=>{skills.push({label:'新技能',pct:80});renderSE();};
  const saveSkills=async()=>{await Config.saveSection('skills',skills);Render.renderSkills(skills);toast('✅ 技能条已保存');};
  const saveProfile=async()=>{
    await Config.saveSection('site',{...Config.get('site'),avatar:$('p-av').value.trim()||'R',author:$('p-name').value.trim(),bio:$('p-bio').value.trim(),title:$('p-blog-name').value.trim()||'Ryoko',description:$('p-blog-sub').value.trim(),url:$('p-site-url').value.trim()});
    await Config.saveSection('footer',{copy:$('p-footer-copy').value.trim(),sub:$('p-footer-sub').value.trim()});
    SEO.update(Config.all());Render.applyConfig(Config.all());toast('✅ 博主信息已保存');
  };

  let pFont=null;
  const loadTheme=()=>{
    const t=Config.get('theme')||{};
    $('t-c1').value=t.blue||'#4f9cf9';$('t-c2').value=t.cyan||'#22d3ee';
    $('preset-swatches').innerHTML=Theme.PRESETS.map(p=>`<div class="swatch ${t.preset===p.label?'active':''}" style="background:linear-gradient(135deg,${p.blue},${p.cyan})" title="${p.name}" onclick="Admin.applyPreset('${p.label}','${p.blue}','${p.cyan}',this)"></div>`).join('');
    $('font-opts').innerHTML=Theme.FONTS.map(f=>`<div class="font-opt ${t.font===f.id?'sel':''}" onclick="Admin.pickFont('${f.id}',this)"><div class="for"></div><span class="fon">${f.name}</span><span class="fop">${f.preview}</span></div>`).join('');
  };
  const applyPreset=(label,blue,cyan,el)=>{document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');$('t-c1').value=blue;$('t-c2').value=cyan;previewColor('blue',blue);previewColor('cyan',cyan);Config.save('theme.preset',label);};
  const pickFont=(id,el)=>{pFont=id;document.querySelectorAll('.font-opt').forEach(f=>f.classList.remove('sel'));el.classList.add('sel');};
  const previewColor=(k,v)=>document.documentElement.style.setProperty('--'+k,v);
  const saveTheme=async()=>{const t={...Config.get('theme'),blue:$('t-c1').value,cyan:$('t-c2').value};await Config.saveSection('theme',t);Theme.apply(t);Render.applyConfig(Config.all());toast('✅ 配色已保存');};
  const saveFont=async()=>{if(!pFont){toast('⚠️ 请先选择字体');return;}const t={...Config.get('theme'),font:pFont};await Config.saveSection('theme',t);Theme.apply(t);toast('✅ 字体已应用');};

  const loadAnnounce=()=>{
    if(!FB.isReady()){$('announce-panel-content').innerHTML='<div style="color:var(--muted);font-size:13px">需要配置 Firebase 才能使用公告功能</div>';return;}
    const list=Announce.all();
    $('announce-panel-content').innerHTML=list.map(a=>`
      <div class="acard" style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <strong style="color:var(--text)">${a.title}</strong>
            ${a.pinned?'<span style="color:var(--orange);font-size:11px;margin-left:8px">📌 置顶</span>':''}
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${a.content||''}</div>
          </div>
          <button class="dbtn" onclick="Admin.delAnnounce('${a.id}')">×</button>
        </div>
      </div>`).join('')||'<div style="color:var(--muted);font-size:13px">暂无公告</div>';
  };
  const saveAnnounce=async()=>{
    const title=$('ann-title')?.value.trim(),content=$('ann-content')?.value.trim();
    if(!title){toast('⚠️ 请填写公告标题');return;}
    const pinned=$('ann-pinned')?.checked||false;
    try{await Announce.create(title,content,pinned);['ann-title','ann-content'].forEach(id=>{const e=$(id);if(e)e.value='';});const ap=$('ann-pinned');if(ap)ap.checked=false;loadAnnounce();toast('✅ 公告已发布');}catch(e){toast('⚠️ '+e.message);}
  };
  const delAnnounce=async id=>{if(!confirm('确认删除公告？'))return;try{await Announce.remove(id);loadAnnounce();toast('🗑 公告已删除');}catch(e){toast('⚠️ '+e.message);}};

  const loadTools=()=>{
    const sd=$('stats-detail');
    if(sd){const v=Stats.getVisits(),o=Stats.getOpens(),posts=Posts.all();const tp=Object.entries(o).sort((a,b)=>b[1]-a[1])[0];sd.innerHTML=`<div>📅 今日：${v[new Date().toISOString().slice(0,10)]||0} 次</div><div>📊 总计：${Stats.total()} 次</div><div>🔥 最热：${tp?(posts.find(p=>p.id===tp[0])?.title||tp[0])+'('+tp[1]+'次)':'—'}</div><div>📝 文章：${posts.length} 篇</div>`;}
  };
  const clearStats=()=>{if(!confirm('确认清除？'))return;Stats.clear();loadTools();toast('🗑 统计已清除');};

  const loadAdminAccess=()=>{ updateAdminRoutePreview(); };

  return {
    doLogin, open, openIfRouteMatches, exit, switchPanel,
    startNew, editArt, delArt, saveArticle, cancelForm,
    setEditorMode, refreshArticlePreview, insertMarkdown,
    loadHero, previewBg, saveHero,
    loadFxForm, liveFx, liveFxInt, liveFxParam, saveEffects,
    addContact, setC, rmC, saveContact,
    loadProfile, setSk, rmSk, addSkill, saveSkills, saveProfile,
    loadTheme, applyPreset, pickFont, previewColor, saveTheme, saveFont,
    loadTools, clearStats,
    loadAnnounce, saveAnnounce, delAnnounce,
    saveAdminAccess, goToAdminRoute,
  };
})();

function toast(msg, ms=2800) {
  const el=document.getElementById('toast');
  if(!el)return;
  el.textContent=msg; el.classList.add('show');
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),ms);
}

function $(id){return document.getElementById(id);}
let curCat='all', curPage=1;

function exitAdmin()     { Admin.exit(); }
function doLogin()       { Admin.doLogin(); }
function toggleTheme()   { Theme.toggle(); }
function doLogout() { Auth.logout().then(()=>toast('已退出登录')); }
function closeModal()           { Render.closeModal(); }
function closeModalBg(e)        { if(e.target.id==='post-modal') Render.closeModal(); }
function scrollTo2(id)          { document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); }
function filterByCat(cat) {
  curCat=cat; curPage=1;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  Render.renderPosts(Posts.all(),cat,1);
}
function changePage(p,cat)      { curPage=p; curCat=cat; Render.renderPosts(Posts.all(),cat,p); scrollTo2('posts-section'); }
let _st=null;
function doSearch(q)      { clearTimeout(_st); _st=setTimeout(()=>Render.renderSearch(Posts.search(q),q),200); }
function clearSearch()    { const si=$('search-input'),sr=$('search-results'); if(si)si.value=''; if(sr){sr.style.display='none';sr.innerHTML='';} }
function searchByTag(t)   { const si=$('search-input'); if(si){si.value=t;doSearch(t);si.focus();} }
function doSubscribe()    { const e=$('email-input')?.value; if(!e||!e.includes('@')){toast('⚠️ 请输入有效邮箱');return;} toast('✅ 订阅成功！感谢关注 ✦'); $('email-input').value=''; }
function logoClick() { Admin.goToAdminRoute(); }
function saveHero()           { Admin.saveHero(); }
function saveEffects()        { Admin.saveEffects(); }
function saveContact()        { Admin.saveContact(); }
function saveProfile()        { Admin.saveProfile(); }
function saveSkills()         { Admin.saveSkills(); }
function saveTheme()          { Admin.saveTheme(); }
function saveFont()           { Admin.saveFont(); }
function clearStats()         { Admin.clearStats(); }
function startNew()           { Admin.startNew(); }
function cancelForm()         { Admin.cancelForm(); }
function saveArticle()        { Admin.saveArticle(); }
function setEditorMode(mode)  { Admin.setEditorMode(mode); }
function refreshArticlePreview(){ Admin.refreshArticlePreview(); }
function mdInsert(kind)       { Admin.insertMarkdown(kind); }
function addContact()         { Admin.addContact(); }
function addSkill()           { Admin.addSkill(); }
function previewBg()          { Admin.previewBg(); }
function downloadRSS()        { Tools.downloadRSS(); }
function downloadSitemap()    { Tools.downloadSitemap(); }
function downloadConfigJson() { Tools.downloadConfigJson(); }
function downloadPostsJson()  { Tools.downloadPostsJson(); }
function switchTab(tab)       { Render.switchTab(tab); }
function openPost(id)         { const p=Posts.byId(id); if(!p)return; Stats.recordOpen(id); Render.openModal(p); }

window.Admin=Admin;
Object.assign(window, {
  exitAdmin, doLogin, toggleTheme, doLogout, closeModal, closeModalBg,
  scrollTo2, filterByCat, changePage, doSearch, clearSearch, searchByTag,
  doSubscribe, logoClick, saveHero, saveEffects, saveContact, saveProfile,
  saveSkills, saveTheme, saveFont, clearStats, startNew, cancelForm,
  saveArticle, setEditorMode, refreshArticlePreview, mdInsert, addContact, addSkill, previewBg, downloadRSS,
  downloadSitemap, downloadConfigJson, downloadPostsJson, switchTab, openPost
});

document.addEventListener('click',e=>{ if(!e.target.closest('.search-wrap'))clearSearch(); });
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if($('post-modal')?.classList.contains('open'))Render.closeModal();
    if($('admin-overlay')?.classList.contains('vis'))Admin.exit();
  }
});

document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.anav').forEach(el=>el.addEventListener('click',()=>Admin.switchPanel(el.dataset.panel)));
  document.querySelectorAll('.fbtn').forEach(btn=>btn.addEventListener('click',()=>filterByCat(btn.dataset.cat)));
  document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>switchTab(btn.dataset.tab)));
  const format=$('f-format');
  if(format)format.addEventListener('change',()=>Admin.refreshArticlePreview(true));
});

window.addEventListener('load',()=>{
  const grid=$('posts-grid');
  if(grid&&(!grid.children.length||grid.querySelector('[style*="暂无"]'))&&Posts.all().length>0){
    Render.renderPosts(Posts.all(),curCat,curPage);
  }
});

(async()=>{
  let cfg = await Config.load();
  const posts = await Posts.load();
  Theme.initDark();

  const fbReady=FB.init(cfg.firebase);
  if(fbReady){
    Auth.init();
    cfg = await Config.hydrateRemote();
  }

  Theme.apply(cfg.theme||{});
  SEO.update(cfg);
  Render.applyConfig(cfg);
  FX.applyAll(cfg.effects||{});
  Render.renderPosts(posts);
  Stats.recordVisit();
  if(window.hljs)hljs.configure({ignoreUnescapedHTML:true});

  if(fbReady){
    Announce.listen(list=>{
      Render.renderAnnouncements(list);
    });
  } else {
    const fbNotice=$('firebase-notice');
    if(fbNotice)fbNotice.style.display='block';
  }

  Admin.openIfRouteMatches();
  Render.initCardTilt();

  console.log('%c✦ Ryoko Blog TS runtime loaded','color:#4f9cf9;font-weight:bold;font-size:14px');
})();
