/**
 * RYOKO BLOG app.js v3
 * Fixes: hero-text clip | admin scroll | settings persistence | light-mode colors
 * Features: Markdown+LaTeX | IDE code blocks | auto TOC | Giscus | pagination | RSS | sitemap
 */
'use strict';

/* ── STORE (unified localStorage prefix: ry3_) ── */
const Store = (() => {
  const P = 'ry3_';
  const get = (k, d) => { try { const v = localStorage.getItem(P+k); return v!==null ? JSON.parse(v) : d; } catch { return d; } };
  const set = (k, v) => { try { localStorage.setItem(P+k, JSON.stringify(v)); } catch {} };
  const del = (k) => { try { localStorage.removeItem(P+k); } catch {} };
  return { get, set, del };
})();

/* ── CONFIG ──
   FIX A: in-memory cfg = single source of truth.
   save() / saveSection() always write from cfg, never re-read stale localStorage.
   FIX G: Store.set writes the FULL cfg so all fields (checkbox + slider) persist atomically. */
const Config = (() => {
  const DEFAULTS = {
    site:     { title:'Ryoko', description:'个人博客', url:'', author:'Ryoko', avatar:'R', bio:'热爱技术与设计的独立创作者。', lang:'zh-CN', since:'2025' },
    hero:     { line1:"Ryoko's", line2:'Personal Blog', subtitle:'记录技术、设计与生活的交汇处，在文字中寻找秩序与美感的平衡', badge:'Personal Blog · Code and Record', btn1:'开始阅读', btn2:'了解我', bgImage:'', bgOpacity:0.5, showCode:true },
    theme:    { preset:'geek', font:'inter', blue:'#4f9cf9', cyan:'#22d3ee' },
    social:   [{ type:'GitHub', label:'GitHub', url:'https://github.com', icon:'🐙' }, { type:'Twitter', label:'Twitter', url:'https://twitter.com', icon:'🐦' }],
    effects:  { spotlight:false, spotlightInt:5, aurora:true, auroraInt:5, particles:false, particlesInt:4, stars:false, starsInt:4, trail:false, trailInt:5, snow:false, snowInt:3 },
    comments: { enabled:false, provider:'giscus', repo:'', repoId:'', category:'General', categoryId:'', mapping:'pathname', reactionsEnabled:'1', inputPosition:'top', theme:'dark_dimmed' },
    about:    { p1:'我相信，最好的文章应该像诗歌一样——精准、有力、留有余味。', p2:'从前端架构到用户体验设计，这里是我与世界对话的地方。' },
    skills:   [{ label:'前端开发', pct:92 }, { label:'UI/UX 设计', pct:84 }, { label:'内容创作', pct:88 }, { label:'系统架构', pct:76 }],
    footer:   { copy:'© 2025 Ryoko. All rights reserved.', sub:'Built with ✦ and curiosity' },
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

  // Persist the FULL in-memory cfg to localStorage (atomic, no staleness)
  const _persist = () => Store.set('cfg', cfg);

  const load = async () => {
    let fileCfg = {};
    try { const r = await fetch('./config.json?t='+Date.now()); if (r.ok) fileCfg = await r.json(); } catch {}
    // Priority: localStorage saved cfg > config.json > DEFAULTS
    const stored = Store.get('cfg', null);
    if (stored) {
      // Merge: keep stored values but fill in any new DEFAULTS keys
      cfg = deep(deep(DEFAULTS, fileCfg), stored);
    } else {
      cfg = deep(DEFAULTS, fileCfg);
    }
    return cfg;
  };

  // Read a dot-path from in-memory cfg (e.g. 'site.url')
  const get = (path) => { let v = cfg; for (const p of path.split('.')) v = v?.[p]; return v; };

  // FIX A: write a single value into in-memory cfg, then persist the whole cfg
  const save = (path, val) => {
    const parts = path.split('.');
    let node = cfg;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!node[parts[i]] || typeof node[parts[i]] !== 'object') node[parts[i]] = {};
      node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = val;
    _persist(); // write full cfg — no staleness possible
  };

  // Replace an entire section, then persist
  const saveSection = (sec, obj) => {
    cfg[sec] = obj;
    _persist();
  };

  const all = () => cfg;
  return { load, get, save, saveSection, all };
})();

/* ── POSTS ── */
const Posts = (() => {
  let posts = [];
  const load = async () => {
    const saved = Store.get('posts', null);
    if (saved) { posts = saved; return posts; }
    try { const r = await fetch('./posts.json?t='+Date.now()); if (r.ok) posts = await r.json(); } catch {}
    return posts;
  };
  const save   = () => Store.set('posts', posts);
  const all    = () => posts;
  const byId   = id  => posts.find(p => p.id === id);
  const byCat  = cat => cat==='all' ? posts : posts.filter(p => p.cat===cat);
  const search = (q) => { if (!q) return []; q=q.toLowerCase(); return posts.filter(p => p.title.toLowerCase().includes(q)||(p.excerpt||'').toLowerCase().includes(q)||(p.tags||[]).some(t=>t.toLowerCase().includes(q))); };
  const add    = p => { posts.unshift(p); save(); };
  const update = p => { const i = posts.findIndex(x=>x.id===p.id); if (i!==-1) posts[i]=p; else posts.unshift(p); save(); };
  const remove = id => { posts = posts.filter(p=>p.id!==id); save(); };
  const slugify = s => s.toLowerCase().replace(/[\s\W]+/g,'-').replace(/^-|-$/g,'').slice(0,55)+'-'+Date.now().toString(36);
  return { load, all, byId, byCat, search, add, update, remove, save, slugify };
})();

/* ── STATS ── */
const Stats = (() => {
  const today = () => new Date().toISOString().slice(0,10);
  const data  = () => Store.get('stats', { visits:{}, opens:{} });
  const recordVisit = () => { const s=data(); const d=today(); s.visits[d]=(s.visits[d]||0)+1; Store.set('stats',s); };
  const recordOpen  = id => { const s=data(); s.opens[id]=(s.opens[id]||0)+1; Store.set('stats',s); };
  const getVisits   = () => data().visits;
  const getOpens    = () => data().opens;
  const total       = () => Object.values(data().visits).reduce((a,b)=>a+b,0);
  const last7 = () => Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); const k=d.toISOString().slice(0,10); return {date:k,day:['日','一','二','三','四','五','六'][d.getDay()],count:data().visits[k]||0}; });
  const clear = () => Store.del('stats');
  return { recordVisit, recordOpen, getVisits, getOpens, total, last7, clear };
})();

/* ── THEME ── */
const Theme = (() => {
  const PRESETS = [
    { name:'极客蓝', blue:'#4f9cf9', cyan:'#22d3ee', label:'geek' },
    { name:'赛博青', blue:'#06b6d4', cyan:'#4f9cf9', label:'cyber' },
    { name:'霓虹绿', blue:'#22c55e', cyan:'#4f9cf9', label:'neon' },
    { name:'紫粉', blue:'#a855f7', cyan:'#f472b6', label:'violet' },
    { name:'橙火', blue:'#f97316', cyan:'#eab308', label:'fire' },
  ];
  const FONTS = [
    { id:'inter',   name:'Inter',           preview:'Aa — Sans Serif' },
    { id:'serif',   name:'Cormorant',        preview:'Aa — Serif' },
    { id:'mono',    name:'JetBrains Mono',   preview:'Aa — Monospace' },
  ];
  const FMAP = { inter:"'Inter',system-ui,sans-serif", serif:"'Cormorant Garamond',Georgia,serif", mono:"'JetBrains Mono',monospace" };
  const apply = t => {
    const r = document.documentElement.style;
    if (t.blue) r.setProperty('--blue', t.blue);
    if (t.cyan) r.setProperty('--cyan', t.cyan);
    if (t.font && FMAP[t.font]) r.setProperty('--font-body', FMAP[t.font]);
  };
  const setDark  = () => { document.documentElement.setAttribute('data-theme','dark'); Store.set('dark',true); document.querySelector('#theme-toggle').textContent='☀'; };
  const setLight = () => { document.documentElement.setAttribute('data-theme','light'); Store.set('dark',false); document.querySelector('#theme-toggle').textContent='☾'; };
  const toggle   = () => document.documentElement.getAttribute('data-theme')==='dark' ? setLight() : setDark();
  const initDark = () => {
    const saved = Store.get('dark', null);
    if (saved===true) { setDark(); return; }
    if (saved===false) { setLight(); return; }
    const h = new Date().getHours();
    if (h>=21 || h<7 || window.matchMedia('(prefers-color-scheme:dark)').matches) setDark(); else setLight();
    window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', e => { if (Store.get('dark',null)===null) e.matches?setDark():setLight(); });
  };
  return { apply, setDark, setLight, toggle, initDark, PRESETS, FONTS };
})();

/* ── EFFECTS ── */
const FX = (() => {
  const loops = {};
  // FIX C: track the mousemove handler so we can remove it; guard against double-init
  let _spHandler = null;
  const initSpotlight = () => {
    if (_spHandler) return; // already running — don't add another listener
    let cx=-9999,cy=-9999,tx=-9999,ty=-9999;
    _spHandler = e => { tx=e.clientX; ty=e.clientY; };
    document.addEventListener('mousemove', _spHandler);
    const fr = () => {
      cx+=(tx-cx)*.04; cy+=(ty-cy)*.04;
      document.getElementById('spotlight').style.setProperty('--sx',cx+'px');
      document.getElementById('spotlight').style.setProperty('--sy',cy+'px');
      document.getElementById('dot-grid').style.setProperty('--sx',cx+'px');
      document.getElementById('dot-grid').style.setProperty('--sy',cy+'px');
      loops._sp = requestAnimationFrame(fr);
    };
    loops._sp = requestAnimationFrame(fr);
  };
  const stopSpotlight = () => {
    cancelAnimationFrame(loops._sp);
    if (_spHandler) { document.removeEventListener('mousemove', _spHandler); _spHandler = null; }
    ['spotlight','dot-grid'].forEach(id=>{ const e=document.getElementById(id); if(e){e.style.setProperty('--sx','-9999px');e.style.setProperty('--sy','-9999px');} });
  };
  const makeCv = id => { const cv=document.getElementById(id); cv.style.display='block'; cv.width=innerWidth; cv.height=innerHeight; return cv; };
  const stopFx = name => {
    cancelAnimationFrame(loops[name]); delete loops[name];
    // FIX D: remove trail mousemove listener when trail is stopped
    if (name === 'trail' && _trailHandler) {
      document.removeEventListener('mousemove', _trailHandler); _trailHandler = null;
    }
    const cv=document.getElementById('cv-'+name); if(cv)cv.style.display='none';
  };

  const startParticles = (int=5) => {
    const cv=makeCv('cv-particles'),ctx=cv.getContext('2d'),C=['79,156,249','34,211,238','249,115,22','244,114,182'];
    const mk=()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*2+.5,vx:(Math.random()-.5)*.45,vy:(Math.random()-.5)*.45,a:Math.random(),da:(Math.random()*.006+.002)*(Math.random()<.5?1:-1),c:C[Math.floor(Math.random()*C.length)]});
    const pts=Array.from({length:Math.round(int*14)},mk);
    const fr=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=p.da;if(p.a>1||p.a<0)p.da*=-1;if(p.x<0)p.x=cv.width;if(p.x>cv.width)p.x=0;if(p.y<0)p.y=cv.height;if(p.y>cv.height)p.y=0;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${p.c},${p.a*.6})`;ctx.fill();});
      for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);if(d<90){ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.strokeStyle=`rgba(79,156,249,${(1-d/90)*.1})`;ctx.lineWidth=.5;ctx.stroke();}}
      loops.particles=requestAnimationFrame(fr);
    };
    fr();
  };
  const startStars = (int=4) => {
    const cv=makeCv('cv-stars'),ctx=cv.getContext('2d');
    const stars=Array.from({length:Math.round(int*70)},()=>({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*.9+.2,a:Math.random(),da:Math.random()*.004+.001*(Math.random()<.5?1:-1)}));
    const fr=()=>{ctx.clearRect(0,0,cv.width,cv.height);stars.forEach(s=>{s.a+=s.da;if(s.a>1||s.a<.05)s.da*=-1;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(180,185,220,${s.a*.7})`;ctx.fill();});loops.stars=requestAnimationFrame(fr);};
    fr();
  };
  // FIX D: trail listener also tracked for cleanup on stopFx
  let _trailHandler = null;
  const startTrail = (int=5) => {
    if (_trailHandler) { document.removeEventListener('mousemove', _trailHandler); _trailHandler = null; }
    const cv=makeCv('cv-trail'),ctx=cv.getContext('2d'); let pts=[];
    _trailHandler = e => pts.push({x:e.clientX,y:e.clientY,a:1});
    document.addEventListener('mousemove', _trailHandler);
    const max=Math.round(int*18);
    const fr=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      pts.forEach(p=>p.a-=.03);pts=pts.filter(p=>p.a>0);if(pts.length>max)pts=pts.slice(-max);
      for(let i=1;i<pts.length;i++){const p=pts[i],pp=pts[i-1];ctx.beginPath();ctx.moveTo(pp.x,pp.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle=`rgba(79,156,249,${p.a*.55})`;ctx.lineWidth=2.5*p.a;ctx.lineCap='round';ctx.shadowBlur=6;ctx.shadowColor=`rgba(34,211,238,${p.a*.35})`;ctx.stroke();}
      ctx.shadowBlur=0;loops.trail=requestAnimationFrame(fr);
    };
    fr();
  };
  const startSnow = (int=3) => {
    const cv=makeCv('cv-snow'),ctx=cv.getContext('2d');
    const mk=()=>({x:Math.random()*cv.width,y:Math.random()*-cv.height,r:Math.random()*2.5+.8,vy:Math.random()*.7+.3,vx:(Math.random()-.5)*.5,a:Math.random()*.5+.3,sw:Math.random()*Math.PI*2,ss:Math.random()*.015+.005});
    const fl=Array.from({length:Math.round(int*30)},f=>{const o=mk();o.y=Math.random()*cv.height;return o;});
    const fr=()=>{ctx.clearRect(0,0,cv.width,cv.height);fl.forEach(f=>{f.y+=f.vy;f.sw+=f.ss;f.x+=Math.sin(f.sw)*.7+f.vx;if(f.y>cv.height+10)Object.assign(f,mk());ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,Math.PI*2);ctx.fillStyle=`rgba(200,210,255,${f.a})`;ctx.fill();});loops.snow=requestAnimationFrame(fr);};
    fr();
  };
  // FIX E: stop ALL canvas effects before restarting to prevent double animation loops
  const applyAll = fx => {
    // Always stop canvas effects first
    ['particles','stars','trail','snow'].forEach(n => stopFx(n));
    // Spotlight
    if (fx.spotlight) initSpotlight(); else stopSpotlight();
    // Aurora opacity
    const aw = document.getElementById('aurora-wrap');
    if (aw) aw.style.opacity = fx.aurora ? ((fx.auroraInt||5)/10)*1.6 : 0;
    // Canvas effects — safe to start fresh since we stopped above
    if (fx.particles) startParticles(fx.particlesInt||4);
    if (fx.stars)     startStars(fx.starsInt||4);
    if (fx.trail)     startTrail(fx.trailInt||5);
    if (fx.snow)      startSnow(fx.snowInt||3);
  };
  const toggle = (name, on, int) => {
    if(name==='spotlight'){on?initSpotlight():stopSpotlight();return;}
    if(name==='aurora'){const aw=document.getElementById('aurora-wrap');if(aw)aw.style.opacity=on?((int||5)/10)*1.6:0;return;}
    if(on){if(loops[name])stopFx(name);({particles:startParticles,stars:startStars,trail:startTrail,snow:startSnow})[name]?.(int||5);}else stopFx(name);
  };
  return { applyAll, toggle };
})();

/* ── MARKDOWN RENDERER ── */
const MD = (() => {
  const render = (text, format) => {
    if (!text) return '';
    if (format === 'html') return text;
    // Configure marked
    if (window.marked) {
      marked.setOptions({ breaks: true, gfm: true });
      // Custom renderer: add data-lang to pre for IDE bar
      const renderer = new marked.Renderer();
      renderer.code = (code, lang) => {
        const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const label = lang || 'code';
        return `<pre data-lang="${label}"><code class="language-${label}">${escaped}</code></pre>`;
      };
      return marked.parse(text, { renderer });
    }
    // fallback: just wrap in pre
    return `<pre><code>${text.replace(/</g,'&lt;')}</code></pre>`;
  };
  return { render };
})();

/* ── AUTO TOC ── */
const TOC = (() => {
  const build = (container) => {
    const headings = container.querySelectorAll('h1,h2,h3,h4');
    const tocEl = document.getElementById('modal-toc');
    const tocList = document.getElementById('toc-list');
    if (!tocEl || !tocList || headings.length < 3) { if (tocEl) tocEl.style.display='none'; return; }
    tocEl.style.display = 'block';
    tocList.innerHTML = '';
    let idx = 0;
    headings.forEach(h => {
      const id = 'toc-h-'+(idx++);
      h.id = id;
      const tag = h.tagName.toLowerCase();
      const a = document.createElement('a');
      a.className = 'toc-item toc-'+tag;
      a.textContent = h.textContent;
      a.onclick = () => h.scrollIntoView({ behavior:'smooth', block:'start' });
      tocList.appendChild(a);
    });
  };
  return { build };
})();

/* ── SEO ── */
const SEO = (() => {
  const $ = id => document.getElementById(id);
  const update = cfg => {
    const s = cfg.site; const url = s.url || location.origin;
    document.title = s.title; document.documentElement.lang = s.lang||'zh-CN';
    const sm = (id,a,v) => { const e=$(id); if(e) e.setAttribute(a,v); };
    sm('meta-desc','content',s.description); sm('meta-author','content',s.author); sm('meta-canonical','href',url);
    sm('og-site','content',s.title); sm('og-title','content',s.title); sm('og-desc','content',s.description); sm('og-url','content',url);
    sm('tw-title','content',s.title); sm('tw-desc','content',s.description);
    sm('rss-link','href',(s.url||'')+'/rss.xml');
  };
  return { update };
})();

/* ── TOOLS ── */
const Tools = (() => {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const strip = s => s ? s.replace(/<[^>]*>/g,'') : '';
  const dl = (content, filename, type='text/xml') => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=filename; a.click(); };

  const buildRSS = () => {
    const cfg=Config.all(), u=cfg.site.url||location.origin;
    const items=Posts.all().slice(0,20).map(p=>`\n    <item>\n      <title>${esc(p.title)}</title>\n      <link>${u}/#${p.id}</link>\n      <guid>${u}/#${p.id}</guid>\n      <pubDate>${new Date(p.date).toUTCString()}</pubDate>\n      <description>${esc(strip(p.excerpt||p.content||'').slice(0,300))}</description>\n    </item>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>${esc(cfg.site.title)}</title>\n    <link>${u}</link>\n    <description>${esc(cfg.site.description)}</description>\n    <language>${cfg.site.lang}</language>${items}\n  </channel>\n</rss>`;
  };
  const buildSitemap = () => {
    const u=Config.get('site.url')||location.origin;
    const urls=[{loc:u+'/',p:'1.0',c:'weekly'},...Posts.all().map(p=>({loc:`${u}/#${p.id}`,lm:p.date,p:'0.8',c:'monthly'}))];
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u=>`  <url>\n    <loc>${u.loc}</loc>${u.lm?`\n    <lastmod>${u.lm}</lastmod>`:''}\n    <changefreq>${u.c}</changefreq>\n    <priority>${u.p}</priority>\n  </url>`).join('\n')}\n</urlset>`;
  };
  return {
    downloadRSS()     { dl(buildRSS(),    'rss.xml',    'application/rss+xml'); toast('✅ rss.xml 已下载'); },
    downloadSitemap() { dl(buildSitemap(),'sitemap.xml','application/xml');     toast('✅ sitemap.xml 已下载'); },
  };
})();

/* ── RENDER ── */
const Render = (() => {
  const $ = id => document.getElementById(id);
  const CAT = { tech:'技术', design:'设计', life:'生活', think:'思考' };
  const fmt = d => d ? d.replace(/-/g,'.') : '';
  const PER = 6;

  const applyConfig = cfg => {
    const s=cfg.site, h=cfg.hero, f=cfg.footer;
    const tx = (id,v) => { const e=$(id); if(e) e.textContent=v; };
    ['nav-logo','footer-logo','admin-logo-el','admin-brand-el'].forEach(id=>tx(id,s.title));
    document.title = s.title;
    tx('hero-badge-text', h.badge);
    tx('hero-line1', h.line1);
    tx('hero-line2', h.line2);
    tx('hero-sub-text', h.subtitle);
    const b1=$('hero-btn1'); if(b1) b1.textContent=h.btn1;
    const b2=$('hero-btn2'); if(b2) b2.textContent=h.btn2;
    tx('code-author', `'${s.author}'`);
    const hbg=$('hero-bg-img');
    if(hbg){if(h.bgImage){hbg.style.backgroundImage=`url('${h.bgImage}')`;hbg.style.opacity=1-(h.bgOpacity||.5);}else{hbg.style.backgroundImage='';}}
    const hc=$('hero-code'); if(hc) hc.style.display=h.showCode?'block':'none';
    tx('footer-copy', f.copy); tx('footer-sub', f.sub); tx('footer-desc', s.description);
    const av=s.avatar||s.title.charAt(0);
    ['sidebar-av','orbit-av'].forEach(id=>tx(id,av));
    tx('sidebar-name', s.author); tx('sidebar-bio', s.bio);
    tx('about-p1', (cfg.about||{}).p1||''); tx('about-p2', (cfg.about||{}).p2||'');
    renderSocial(cfg.social||[]);
    renderSkills(cfg.skills||[]);
  };

  const renderSocial = links => {
    const h = links.map(l=>`<a class="social-link" href="${l.url||'#'}" target="_blank" rel="noopener">${l.icon||'🔗'} ${l.label}</a>`).join('');
    const se=$('sidebar-social'); if(se) se.innerHTML=h;
    const fe=$('footer-social'); if(fe) fe.innerHTML=links.map(l=>`<a href="${l.url||'#'}" target="_blank" rel="noopener">${l.icon||'🔗'} ${l.label}</a>`).join('');
  };

  const renderSkills = skills => {
    const el=$('skills-list'); if(!el) return;
    el.innerHTML=skills.map(s=>`<div class="skill-item"><div class="skill-lr"><span>${s.label}</span><span>${s.pct}%</span></div><div class="skill-track"><div class="skill-fill" data-pct="${s.pct/100}"></div></div></div>`).join('');
    const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.querySelectorAll('.skill-fill').forEach(f=>{f.style.transform='scaleX(1)';f.classList.add('v')});}),{threshold:.2});
    obs.observe(el);
  };

  const renderPosts = (posts, cat='all', page=1) => {
    const filtered = cat==='all' ? posts : posts.filter(p=>p.cat===cat);
    const pages = Math.max(1, Math.ceil(filtered.length/PER));
    const slice = filtered.slice((page-1)*PER, page*PER);
    const grid=$('posts-grid'); if(!grid) return;
    if(!slice.length) { grid.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);font-size:14px">暂无文章 ☁</div>`; }
    else              { grid.innerHTML=slice.map((p,i)=>card(p,i===0&&page===1&&cat==='all'&&!!p.featured)).join(''); }
    renderPagination(pages, page, cat);
    renderSideStats(posts);
    renderCatList(posts, cat);
    renderTagCloud(posts);
  };

  const card = (p, feat) => `
    <div class="post-card${feat?' featured':''}" onclick="openPost('${p.id}')">
      <div class="post-thumb ${p.cover?.style||'cv1'}">
        <div class="pta"></div><div class="ptg">${p.cover?.glyph||'✦'}</div>
      </div>
      <div class="post-body">
        <div class="post-meta"><span class="post-cat cat-${p.cat}">${CAT[p.cat]||p.cat}</span><span class="post-date">${fmt(p.date)}</span></div>
        <h3 class="post-title">${p.title}</h3>
        <p class="post-excerpt">${p.excerpt||''}</p>
        <div class="post-tags">${(p.tags||[]).map(t=>`<span class="post-tag">${t}</span>`).join('')}</div>
        <span class="read-more">阅读全文 →</span>
      </div>
    </div>`;

  const renderPagination = (pages, cur, cat) => {
    const el=$('pagination'); if(!el||pages<=1){if(el)el.innerHTML='';return;}
    el.innerHTML=Array.from({length:pages},(_,i)=>i+1).map(p=>`<button class="page-btn${p===cur?' active':''}" onclick="changePage(${p},'${cat}')">${p}</button>`).join('');
  };

  const renderSideStats = posts => {
    const el=$('mini-stats'); if(!el) return;
    el.innerHTML=[['文章',posts.length+'篇'],['访问',Stats.total()+'次'],['分类',[...new Set(posts.map(p=>p.cat))].length+'类']].map(([l,v])=>`<div class="mini-stat-row"><span class="msl">${l}</span><span class="msv">${v}</span></div>`).join('');
  };

  const renderCatList = (posts, active) => {
    const el=$('cat-list'); if(!el) return;
    const cnt={}; posts.forEach(p=>{cnt[p.cat]=(cnt[p.cat]||0)+1;});
    el.innerHTML=[['all','全部',posts.length],...Object.entries(cnt).map(([k,v])=>[k,CAT[k]||k,v])].map(([k,n,c])=>`<div class="cat-item${k===active?' active':''}" onclick="filterByCat('${k}')" style="${k===active?'color:var(--blue)':''}"><span>${n}</span><span class="cat-item-count">${c}</span></div>`).join('');
  };

  const renderTagCloud = posts => {
    const el=$('tag-cloud'); if(!el) return;
    el.innerHTML=[...new Set(posts.flatMap(p=>p.tags||[]))].map(t=>`<span class="tag-pill" onclick="searchByTag('${t}')">${t}</span>`).join('');
  };

  /* Modal */
  const openModal = post => {
    const cv=post.cover?.style||'cv1';
    const mc=$('modal-cover'); if(mc) mc.className=`modal-cover ${cv}`;
    const mca=mc?.querySelector('.mc-aurora'); if(mca) mca.style='';
    $('modal-glyph').textContent = post.cover?.glyph||'✦';
    $('modal-cat').textContent   = CAT[post.cat]||post.cat;
    $('modal-cat').className     = `post-cat cat-${post.cat}`;
    $('modal-date').textContent  = fmt(post.date);
    $('modal-title').textContent = post.title;

    // Render Markdown / HTML
    const html = MD.render(post.content||'', post.format||'markdown');
    const mt = $('modal-text'); if(mt) mt.innerHTML = html;

    // Syntax highlight
    if(mt && window.hljs) mt.querySelectorAll('pre code').forEach(b=>{ try{hljs.highlightElement(b);}catch{} });

    // KaTeX math
    if(mt && window.renderMathInElement) {
      try { renderMathInElement(mt, { delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}], throwOnError:false }); } catch {}
    }

    // Auto TOC
    if(mt) TOC.build(mt);

    // Tags
    $('modal-tags').innerHTML = (post.tags||[]).map(t=>`<span class="modal-tag">${t}</span>`).join('');

    // Giscus
    renderGiscus(post.id);

    $('post-modal').classList.add('open');
    document.body.style.overflow='hidden';
  };

  const closeModal = () => {
    $('post-modal').classList.remove('open');
    document.body.style.overflow='';
    const gc=$('giscus-container'); if(gc) gc.innerHTML='';
    const toc=$('modal-toc'); if(toc) toc.style.display='none';
  };

  const renderGiscus = id => {
    const gc=$('giscus-container'); if(!gc){gc&&(gc.innerHTML='');return;} gc.innerHTML='';
    const c=Config.get('comments')||{};
    if(!c.enabled||!c.repo||!c.repoId) return;
    const s=document.createElement('script');
    s.src='https://giscus.app/client.js';
    Object.entries({
      'data-repo':c.repo,'data-repo-id':c.repoId,'data-category':c.category||'General',
      'data-category-id':c.categoryId||'','data-mapping':c.mapping||'pathname',
      'data-reactions-enabled':c.reactionsEnabled||'1','data-input-position':c.inputPosition||'top',
      'data-theme':c.theme||'dark_dimmed','data-lang':'zh-CN',
    }).forEach(([k,v])=>s.setAttribute(k,v));
    s.crossOrigin='anonymous'; s.async=true; gc.appendChild(s);
  };

  const renderSearch = (results, q) => {
    const el=$('search-results'); if(!el) return;
    if(!q){el.style.display='none';el.innerHTML='';return;}
    el.style.display='block';
    if(!results.length){el.innerHTML=`<div class="sr-empty">未找到"${q}"相关文章</div>`;return;}
    el.innerHTML=results.slice(0,6).map(p=>`<div class="sri" onclick="openPost('${p.id}');clearSearch()"><div class="sri-t">${p.title}</div><div class="sri-m"><span class="post-cat cat-${p.cat}" style="padding:1px 6px">${CAT[p.cat]}</span> ${fmt(p.date)}</div></div>`).join('');
  };

  return { applyConfig, renderPosts, renderSocial, renderSkills, openModal, closeModal, renderSearch };
})();

/* ── ADMIN ── */
const Admin = (() => {
  const $ = id => document.getElementById(id);
  const DEFAULT_PWD = 'ryoko2025';
  const getPwd = () => Store.get('pwd', DEFAULT_PWD);
  let editId = null;

  /* Login — FIX: explicit state control for absolute-positioned panels */
  const showLogin = () => {
    $('admin-login').style.display = 'flex';
    $('admin-app').style.display   = 'none';
  };
  const showApp = () => {
    $('admin-login').style.display = 'none';
    $('admin-app').style.display   = 'flex';
  };

  const doLogin = () => {
    if ($('pwd-input').value === getPwd()) {
      showApp();
      refresh();
    } else {
      $('login-err').style.display = 'block';
      $('pwd-input').value = '';
    }
  };
  const open = () => {
    // Always reset to login state when opening
    showLogin();
    $('admin-overlay').classList.add('vis');
    $('pwd-input').value = '';
    $('login-err').style.display = 'none';
  };
  const exit = () => {
    $('admin-overlay').classList.remove('vis');
    // ── Re-apply ALL settings to the live blog DOM after admin closes ──
    // This ensures whatever was saved is immediately visible.
    Render.applyConfig(Config.all());
    FX.applyAll(Config.get('effects') || {});
    Theme.apply(Config.get('theme') || {});
    SEO.update(Config.all());
    // Scroll to top so user can see hero changes (aurora, title, etc.)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const refresh = () => switchPanel('dashboard');

  /* Switch panel — BUG FIX: scrollTop reset prevents title hiding */
  const switchPanel = name => {
    document.querySelectorAll('.anav').forEach(e=>e.classList.remove('active'));
    document.querySelectorAll('.apanel').forEach(e=>e.classList.remove('active'));
    const nav=document.querySelector(`.anav[data-panel="${name}"]`); if(nav)nav.classList.add('active');
    const pnl=$('panel-'+name); if(pnl)pnl.classList.add('active');
    const m=$('admin-main'); if(m)m.scrollTop=0; // BUG FIX
    const loaders={dashboard:loadDash,articles:loadArticles,hero:loadHero,effects:loadFxForm,contact:loadContact,profile:loadProfile,theme:loadTheme,tools:loadTools,password:()=>{}};
    if(loaders[name]) loaders[name]();
  };

  /* Dashboard */
  const loadDash = () => {
    const posts=Posts.all(), cats=[...new Set(posts.map(p=>p.cat))].length;
    $('dash-stats').innerHTML=[['文章',posts.length,'篇'],['分类',cats,'类'],['标签',[...new Set(posts.flatMap(p=>p.tags||[]))].length,'个'],['访问',Stats.total(),'次']].map(([l,v,u])=>`<div class="stat-card"><div class="stat-val">${v}</div><div class="stat-label">${l} <span style="font-size:10px">${u}</span></div></div>`).join('');
    const days=Stats.last7(), max=Math.max(...days.map(d=>d.count),1);
    $('visit-chart').innerHTML=days.map(d=>`<div class="bw"><div class="bar" style="height:${Math.round((d.count/max)*72)+4}px" data-val="${d.count}"></div><div class="bd">周${d.day}</div></div>`).join('');
    const CC={tech:'#4f9cf9',design:'#f472b6',life:'#4ade80',think:'#f97316'},CN={tech:'技术',design:'设计',life:'生活',think:'思考'};
    const cnt={};posts.forEach(p=>{cnt[p.cat]=(cnt[p.cat]||0)+1;});const tot=posts.length||1;
    let acc=0; const slices=Object.entries(cnt).map(([k,v])=>{const pc=(v/tot)*100;const s=`<stop offset="${acc}%" stop-color="${CC[k]||'#aaa'}"/><stop offset="${acc+pc}%" stop-color="${CC[k]||'#aaa'}"/>`;acc+=pc;return s;});
    $('cat-pie').innerHTML=`<div class="pie-wrap"><svg width="80" height="80" viewBox="0 0 32 32"><defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">${slices.join('')}</linearGradient></defs><circle r="14" cx="16" cy="16" fill="none" stroke="url(#pg)" stroke-width="4" transform="rotate(-90 16 16)"/></svg><div class="pie-legend">${Object.entries(cnt).map(([k,v])=>`<div><span class="pie-dot" style="background:${CC[k]||'#aaa'}"></span>${CN[k]||k}(${v})</div>`).join('')}</div></div>`;
    $('act-list').innerHTML=posts.slice(0,5).map(p=>`<div class="act-item"><div class="act-dot"></div>发布了《${p.title}》 · ${p.date}</div>`).join('')||'<div style="color:var(--muted);font-size:13px;padding:10px 0">暂无动态</div>';
  };

  /* Articles */
  const loadArticles = () => {
    const posts=Posts.all(); $('art-count').textContent=`共 ${posts.length} 篇`;
    $('art-form').style.display='none'; editId=null;
    $('art-body').innerHTML=posts.map(p=>`<div class="trow"><span class="ttl">${p.title}</span><span class="tcat">${p.cat}</span><span class="tdt">${p.date||''}</span><span class="tact"><button class="tbtn" onclick="Admin.editArt('${p.id}')">编辑</button><button class="tbtn" style="color:var(--orange)" onclick="Admin.delArt('${p.id}')">删除</button></span></div>`).join('')||`<div style="padding:16px;color:var(--muted);font-size:13px">暂无文章，点击「新建文章」开始</div>`;
  };
  const startNew = () => {
    editId=null; $('form-mode-label').textContent='新建文章';
    ['f-title','f-excerpt','f-tags','f-content'].forEach(id=>{const e=$(id);if(e)e.value='';});
    $('f-cat').value='tech'; $('f-date').value=new Date().toISOString().slice(0,10);
    $('f-format').value='markdown'; $('f-cover').value='cv1';
    $('f-glyph').value='✦'; $('f-featured').checked=false;
    $('art-form').style.display='block'; $('admin-main').scrollTop=0;
  };
  const editArt = id => {
    const p=Posts.byId(id); if(!p) return; editId=id;
    $('form-mode-label').textContent='编辑文章';
    $('f-title').value=p.title||''; $('f-cat').value=p.cat||'tech';
    $('f-date').value=p.date||''; $('f-excerpt').value=p.excerpt||'';
    $('f-tags').value=(p.tags||[]).join(','); $('f-content').value=p.content||'';
    $('f-format').value=p.format||'markdown'; $('f-cover').value=p.cover?.style||'cv1';
    $('f-glyph').value=p.cover?.glyph||'✦'; $('f-featured').checked=!!p.featured;
    $('art-form').style.display='block'; $('admin-main').scrollTop=0;
  };
  const delArt = id => {
    if(!confirm('确认删除这篇文章？')) return;
    Posts.remove(id); loadArticles(); Render.renderPosts(Posts.all()); toast('🗑 文章已删除');
  };
  const saveArticle = () => {
    const title=$('f-title').value.trim(); if(!title){toast('⚠️ 请填写标题');return;}
    const p={
      id: editId || Posts.slugify(title),
      title, cat:$('f-cat').value, date:$('f-date').value,
      excerpt:$('f-excerpt').value.trim(),
      tags:$('f-tags').value.split(',').map(t=>t.trim()).filter(Boolean),
      content:$('f-content').value,
      format:$('f-format').value,
      cover:{ style:$('f-cover').value, glyph:$('f-glyph').value||'✦' },
      featured:$('f-featured').checked,
    };
    if(editId) Posts.update(p); else Posts.add(p);
    loadArticles(); Render.renderPosts(Posts.all());
    toast(editId?'✅ 文章已更新':'✅ 文章已发布');
    editId=null; $('art-form').style.display='none';
  };
  const cancelForm = () => { $('art-form').style.display='none'; editId=null; };

  /* Hero */
  const loadHero = () => {
    const h=Config.get('hero')||{};
    const sv=(id,v)=>{ const e=$(id);if(e)e.value=v||''; };
    sv('h-line1',h.line1); sv('h-line2',h.line2); sv('h-sub',h.subtitle);
    sv('h-badge',h.badge); sv('h-btn1',h.btn1); sv('h-btn2',h.btn2); sv('h-bg',h.bgImage);
    const op=$('h-opacity'); if(op){op.value=h.bgOpacity||.5;$('h-opa-val').textContent=h.bgOpacity||.5;}
    const sc=$('h-show-code'); if(sc) sc.checked=h.showCode!==false;
    previewBg();
  };
  const previewBg = () => {
    const url=$('h-bg')?.value, pv=$('bg-preview'); if(!pv) return;
    if(url){pv.style.backgroundImage=`url('${url}')`;pv.textContent='';}else{pv.style.backgroundImage='';pv.textContent='暂无背景图';}
  };
  const saveHero = () => {
    const h={line1:$('h-line1').value.trim()||"Ryoko's",line2:$('h-line2').value.trim()||'Personal Blog',subtitle:$('h-sub').value.trim(),badge:$('h-badge').value.trim(),btn1:$('h-btn1').value.trim()||'开始阅读',btn2:$('h-btn2').value.trim()||'了解我',bgImage:$('h-bg').value.trim(),bgOpacity:+($('h-opacity').value),showCode:$('h-show-code').checked};
    Config.saveSection('hero',h); Render.applyConfig(Config.all()); toast('✅ 主页设置已保存');
  };

  /* Effects */
  const FX_DEFS=[
    {key:'spotlight',icon:'🔦',name:'聚光灯',desc:'鼠标跟随光晕+点阵',ik:'spotlightInt'},
    {key:'aurora',icon:'🌌',name:'极光背景',desc:'Hero 流动彩色光球',ik:'auroraInt'},
    {key:'particles',icon:'✦',name:'浮动粒子',desc:'全页发光粒子+连线',ik:'particlesInt'},
    {key:'stars',icon:'🌠',name:'星尘背景',desc:'细密闪烁星点',ik:'starsInt'},
    {key:'trail',icon:'🌊',name:'鼠标拖尾',desc:'鼠标划过发光轨迹',ik:'trailInt'},
    {key:'snow',icon:'❄️',name:'飘落雪花',desc:'轻柔飘落粒子',ik:'snowInt'},
  ];
  const loadFxForm = () => {
    const fx=Config.get('effects')||{};
    // Show hint about how to see effects
    const hint = document.getElementById('fx-hint');
    if (hint) hint.style.display = 'block';
    $('fx-grid').innerHTML=FX_DEFS.map(f=>`<div class="fx-card"><div class="fx-head"><div><div class="fx-name">${f.icon} ${f.name}</div><div class="fx-desc">${f.desc}</div></div><label class="tgl-label" style="flex-shrink:0"><input type="checkbox" class="tgl-cb" id="fx-${f.key}" ${fx[f.key]?'checked':''} onchange="Admin.liveFx('${f.key}',this.checked)"></label></div><div class="fx-rl">强度</div><input type="range" class="fx-r" id="fx-int-${f.key}" min="1" max="10" value="${fx[f.ik]||5}" oninput="Admin.liveFxInt('${f.ik}',+this.value)"></div>`).join('');
  };
  // FIX B+G: update cfg immediately so re-opening panel doesn't reset state;
  // auto-persist so closing without "保存" still keeps the change.
  const liveFx = (k, on) => {
    Config.save('effects.' + k, on);          // persist checkbox state NOW
    FX.toggle(k, on, +($('fx-int-'+k)?.value||5));
  };
  const liveFxInt = (ik, v) => {
    Config.save('effects.' + ik, v);           // already persisted — no change needed
  };
  const saveEffects = () => {
    const fx={};
    FX_DEFS.forEach(f=>{fx[f.key]=!!$('fx-'+f.key)?.checked;fx[f.ik]=+($('fx-int-'+f.key)?.value||5);});
    Config.saveSection('effects',fx); FX.applyAll(fx); Render.applyConfig(Config.all()); toast('✅ 特效已保存 — 关闭后台后可在博客看到效果');
  };

  /* Contact */
  const CI={Email:'✉️',GitHub:'🐙',Twitter:'🐦',Instagram:'📷',Weibo:'🌐',WeChat:'💬',LinkedIn:'💼',YouTube:'▶️',Bilibili:'📺',其他:'🔗'};
  let contacts=[];
  const loadContact = () => {
    contacts=JSON.parse(JSON.stringify(Config.get('social')||[]));
    const a=Config.get('about')||{};
    const ap1=$('about-p1');if(ap1)ap1.value=a.p1||'';
    const ap2=$('about-p2');if(ap2)ap2.value=a.p2||'';
    renderCE();
  };
  const renderCE = () => {
    $('contact-list').innerHTML=contacts.map((c,i)=>`<div class="crow"><select class="fi" style="padding:5px 8px;font-size:12px" onchange="Admin.setC(${i},'type',this.value)">${Object.keys(CI).map(k=>`<option value="${k}" ${c.type===k?'selected':''}>${CI[k]} ${k}</option>`).join('')}</select><input class="fi" style="padding:5px 9px" value="${c.label||''}" placeholder="显示名称" oninput="Admin.setC(${i},'label',this.value)"><input class="fi" style="padding:5px 9px" value="${c.url||''}" placeholder="https://..." oninput="Admin.setC(${i},'url',this.value)"><button class="dbtn" onclick="Admin.rmC(${i})">×</button></div>`).join('')||'<div style="color:var(--muted);font-size:13px;padding:8px">暂无联系方式，点击「新增」</div>';
  };
  const setC=(i,k,v)=>{if(contacts[i])contacts[i][k]=v;};
  const rmC=i=>{contacts.splice(i,1);renderCE();};
  const addContact=()=>{contacts.push({type:'其他',label:'新链接',url:'https://',icon:'🔗'});renderCE();};
  const saveContact=()=>{
    contacts.forEach(c=>{c.icon=CI[c.type]||'🔗';});
    Config.saveSection('social',contacts);
    Config.saveSection('about',{p1:$('about-p1')?.value||'',p2:$('about-p2')?.value||''});
    Render.applyConfig(Config.all()); Render.renderPosts(Posts.all()); toast('✅ 联系方式已保存');
  };

  /* Profile */
  let skills=[];
  const loadProfile = () => {
    const s=Config.get('site')||{}, f=Config.get('footer')||{};
    const sv=(id,v)=>{const e=$(id);if(e)e.value=v||'';};
    sv('p-av',s.avatar); sv('p-name',s.author); sv('p-bio',s.bio);
    sv('p-blog-name',s.title); sv('p-blog-sub',s.description);
    sv('p-site-url',s.url);   // FIX F: populate URL field
    sv('p-footer-copy',f.copy); sv('p-footer-sub',f.sub);
    const ap=$('admin-av-preview'); if(ap) ap.textContent=s.avatar||'R';
    skills=JSON.parse(JSON.stringify(Config.get('skills')||[])); renderSE();
  };
  const renderSE = () => {
    $('skills-editor').innerHTML=skills.map((s,i)=>`<div class="sked-row"><input class="fi" style="padding:5px 9px" value="${s.label}" placeholder="技能名称" oninput="Admin.setSk(${i},'label',this.value)"><input type="number" class="fi" style="padding:5px 9px" min="0" max="100" value="${s.pct}" oninput="Admin.setSk(${i},'pct',+this.value)"><button class="dbtn" onclick="Admin.rmSk(${i})">×</button></div>`).join('');
  };
  const setSk=(i,k,v)=>{if(skills[i])skills[i][k]=v;};
  const rmSk=i=>{skills.splice(i,1);renderSE();};
  const addSkill=()=>{skills.push({label:'新技能',pct:80});renderSE();};
  const saveSkills=()=>{Config.saveSection('skills',skills);Render.renderSkills(skills);toast('✅ 技能条已保存');};
  const saveProfile=()=>{
    Config.saveSection('site',{
      ...Config.get('site'),
      avatar:      $('p-av').value.trim()||'R',
      author:      $('p-name').value.trim(),
      bio:         $('p-bio').value.trim(),
      title:       $('p-blog-name').value.trim()||'Ryoko',
      description: $('p-blog-sub').value.trim(),
      url:         $('p-site-url').value.trim(), // FIX F: save URL
    });
    Config.saveSection('footer',{copy:$('p-footer-copy').value.trim(),sub:$('p-footer-sub').value.trim()});
    SEO.update(Config.all()); Render.applyConfig(Config.all()); toast('✅ 博主信息已保存');
  };

  /* Theme */
  let pFont=null;
  const loadTheme = () => {
    const t=Config.get('theme')||{};
    $('t-c1').value=t.blue||'#4f9cf9'; $('t-c2').value=t.cyan||'#22d3ee';
    $('preset-swatches').innerHTML=Theme.PRESETS.map(p=>`<div class="swatch ${t.preset===p.label?'active':''}" style="background:linear-gradient(135deg,${p.blue},${p.cyan})" title="${p.name}" onclick="Admin.applyPreset('${p.label}','${p.blue}','${p.cyan}',this)"></div>`).join('');
    $('font-opts').innerHTML=Theme.FONTS.map(f=>`<div class="font-opt ${t.font===f.id?'sel':''}" onclick="Admin.pickFont('${f.id}',this)"><div class="for"></div><span class="fon">${f.name}</span><span class="fop">${f.preview}</span></div>`).join('');
  };
  const applyPreset=(label,blue,cyan,el)=>{document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('active'));el.classList.add('active');$('t-c1').value=blue;$('t-c2').value=cyan;previewColor('blue',blue);previewColor('cyan',cyan);Config.save('theme.preset',label);};
  const pickFont=(id,el)=>{pFont=id;document.querySelectorAll('.font-opt').forEach(f=>f.classList.remove('sel'));el.classList.add('sel');};
  const previewColor=(k,v)=>document.documentElement.style.setProperty('--'+k,v);
  const saveTheme=()=>{const t={...Config.get('theme'),blue:$('t-c1').value,cyan:$('t-c2').value};Config.saveSection('theme',t);Theme.apply(t);Render.applyConfig(Config.all());toast('✅ 配色已保存');};
  const saveFont=()=>{if(!pFont){toast('⚠️ 请先选择字体');return;}const t={...Config.get('theme'),font:pFont};Config.saveSection('theme',t);Theme.apply(t);toast('✅ 字体已应用');};

  /* Tools */
  const loadTools = () => {
    const c=Config.get('comments')||{};
    const sv=(id,v)=>{const e=$(id);if(e)e.value=v||'';};
    sv('g-repo',c.repo);sv('g-repo-id',c.repoId);sv('g-cat',c.category);sv('g-cat-id',c.categoryId);
    const ge=$('g-enabled'); if(ge) ge.checked=!!c.enabled;
    const sd=$('stats-detail');
    if(sd){const v=Stats.getVisits(),o=Stats.getOpens(),posts=Posts.all();const tp=Object.entries(o).sort((a,b)=>b[1]-a[1])[0];sd.innerHTML=`<div>📅 今日：${v[new Date().toISOString().slice(0,10)]||0} 次</div><div>📊 总计：${Stats.total()} 次</div><div>🔥 最热：${tp?(posts.find(p=>p.id===tp[0])?.title||tp[0])+'('+tp[1]+'次)':'—'}</div><div>📝 文章：${posts.length} 篇</div>`;}
  };
  const saveGiscus=()=>{const c={...Config.get('comments'),enabled:!!$('g-enabled').checked,repo:$('g-repo').value.trim(),repoId:$('g-repo-id').value.trim(),category:$('g-cat').value.trim()||'General',categoryId:$('g-cat-id').value.trim()};Config.saveSection('comments',c);toast('✅ Giscus 配置已保存');};
  const clearStats=()=>{if(!confirm('确认清除所有统计？'))return;Stats.clear();loadTools();toast('🗑 统计数据已清除');};

  /* Password */
  const changePassword=()=>{const cur=$('pwd-cur').value,nw=$('pwd-new').value,cf=$('pwd-cfm').value;if(cur!==getPwd()){toast('⚠️ 当前密码错误');return;}if(nw.length<6){toast('⚠️ 新密码至少6位');return;}if(nw!==cf){toast('⚠️ 两次不一致');return;}Store.set('pwd',nw);['pwd-cur','pwd-new','pwd-cfm'].forEach(id=>{const e=$(id);if(e)e.value='';});toast('✅ 密码已更新');};

  return {
    doLogin, open, exit, switchPanel,
    startNew, editArt, delArt, saveArticle, cancelForm,
    loadHero, previewBg, saveHero,
    loadFxForm, liveFx, liveFxInt, saveEffects,
    addContact, setC, rmC, saveContact,
    loadProfile, setSk, rmSk, addSkill, saveSkills, saveProfile,
    loadTheme, applyPreset, pickFont, previewColor, saveTheme, saveFont,
    loadTools, saveGiscus, clearStats,
    changePassword,
  };
})();

/* ── MARKDOWN HELPERS ── */
function mdHelper(type) {
  const ta = document.getElementById('f-content');
  if (!ta) return;
  const pos = ta.selectionStart, sel = ta.value.substring(ta.selectionStart, ta.selectionEnd);
  const inserts = {
    bold:  `**${sel||'粗体文字'}**`,
    code:  `\`\`\`javascript\n${sel||'// 代码'}\n\`\`\``,
    math:  `$$\n${sel||'E = mc^2'}\n$$`,
    link:  `[${sel||'链接文字'}](https://)`,
    table: `| 列1 | 列2 | 列3 |\n|-----|-----|-----|\n| 数据 | 数据 | 数据 |`,
  };
  const txt = inserts[type] || '';
  ta.setRangeText(txt, pos, ta.selectionEnd, 'end');
  ta.focus();
}

/* ── TOAST ── */
function toast(msg, ms=2800) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(()=>el.classList.remove('show'), ms);
}

/* ── GLOBALS ── */
function $(id) { return document.getElementById(id); }
let curCat='all', curPage=1;

function openAdmin()   { Admin.open(); }
function exitAdmin()   { Admin.exit(); }
function doLogin()     { Admin.doLogin(); }
function toggleTheme() { Theme.toggle(); }
function openPost(id)  { const p=Posts.byId(id); if(!p) return; Stats.recordOpen(id); Render.openModal(p); }
function closeModal()  { Render.closeModal(); }
function closeModalBg(e) { if(e.target.id==='post-modal') Render.closeModal(); }
function scrollTo2(id) { document.getElementById(id)?.scrollIntoView({behavior:'smooth'}); }
function filterByCat(cat) {
  curCat=cat; curPage=1;
  document.querySelectorAll('.fbtn').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  Render.renderPosts(Posts.all(), cat, 1);
}
function changePage(p, cat) { curPage=p; curCat=cat; Render.renderPosts(Posts.all(),cat,p); scrollTo2('posts-section'); }

let _st=null;
function doSearch(q) { clearTimeout(_st); _st=setTimeout(()=>Render.renderSearch(Posts.search(q),q),200); }
function clearSearch() { const si=$('search-input'),sr=$('search-results'); if(si)si.value=''; if(sr){sr.style.display='none';sr.innerHTML='';} }
function searchByTag(t) { const si=$('search-input'); if(si){si.value=t;doSearch(t);si.focus();} }
function doSubscribe() { const e=$('email-input')?.value; if(!e||!e.includes('@')){toast('⚠️ 请输入有效邮箱');return;} toast('✅ 订阅成功！感谢关注 ✦'); $('email-input').value=''; }

function logoClick() {
  logoClick._c=(logoClick._c||0)+1; clearTimeout(logoClick._t);
  logoClick._t=setTimeout(()=>{logoClick._c=0;},1500);
  if(logoClick._c>=5){logoClick._c=0;Admin.open();}
}

/* Admin global proxies */
window.Admin = Admin;
function saveHero()        { Admin.saveHero(); }
function saveEffects()     { Admin.saveEffects(); }
function saveContact()     { Admin.saveContact(); }
function saveProfile()     { Admin.saveProfile(); }
function saveSkills()      { Admin.saveSkills(); }
function saveTheme()       { Admin.saveTheme(); }
function saveFont()        { Admin.saveFont(); }
function saveGiscus()      { Admin.saveGiscus(); }
function clearStats()      { Admin.clearStats(); }
function changePassword()  { Admin.changePassword(); }
function startNew()        { Admin.startNew(); }
function cancelForm()      { Admin.cancelForm(); }
function saveArticle()     { Admin.saveArticle(); }
function addContact()      { Admin.addContact(); }
function addSkill()        { Admin.addSkill(); }
function previewBg()       { Admin.previewBg(); }
function downloadRSS()     { Tools.downloadRSS(); }
function downloadSitemap() { Tools.downloadSitemap(); }

/* Keyboard nav */
document.addEventListener('click', e=>{ if(!e.target.closest('.search-wrap')) clearSearch(); });
document.addEventListener('keydown', e=>{
  if(e.key==='Escape'){
    if($('post-modal')?.classList.contains('open')) Render.closeModal();
    if($('admin-overlay')?.classList.contains('vis')) Admin.exit();
  }
});

/* Admin panel nav wiring */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.anav').forEach(el=>el.addEventListener('click',()=>Admin.switchPanel(el.dataset.panel)));
  document.querySelectorAll('.fbtn').forEach(btn=>btn.addEventListener('click',()=>filterByCat(btn.dataset.cat)));
});

/* ── INIT ── */
(async () => {
  const [cfg, posts] = await Promise.all([Config.load(), Posts.load()]);
  Theme.initDark();
  Theme.apply(cfg.theme||{});
  SEO.update(cfg);
  Render.applyConfig(cfg);
  Render.renderPosts(posts);
  FX.applyAll(cfg.effects||{});
  Stats.recordVisit();
  if(window.hljs) hljs.configure({ignoreUnescapedHTML:true});
  console.log('%c✦ Ryoko Blog v3 loaded','color:#4f9cf9;font-weight:bold;font-size:14px');


/* ── CARD SPOTLIGHT GLOW (mouse position tracked per card) ── */
(function initCardGlow() {
  document.addEventListener('mousemove', e => {
    document.querySelectorAll('.post-card').forEach(card => {
      const rect  = card.getBoundingClientRect();
      const x     = e.clientX - rect.left;
      const y     = e.clientY - rect.top;
      const inside = x >= -8 && x <= rect.width+8 && y >= -8 && y <= rect.height+8;
      if (inside) {
        card.style.setProperty('--mx', x + 'px');
        card.style.setProperty('--my', y + 'px');
        card.classList.add('card-lit');
      } else {
        card.classList.remove('card-lit');
      }
    });
  });
})();

})();
