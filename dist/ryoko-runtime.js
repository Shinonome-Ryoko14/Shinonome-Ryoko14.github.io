"use strict";
(() => {
  // src/fx/plugins/spotlight.ts
  var spotlightPlugin = {
    id: "spotlight",
    start(_intensity, context) {
      const existing = context.loops._sp;
      if (existing) return;
      let cx = -9999;
      let cy = -9999;
      let tx = -9999;
      let ty = -9999;
      const handler = (event) => {
        tx = event.clientX;
        ty = event.clientY;
      };
      document.addEventListener("mousemove", handler);
      context.onCleanup("spotlight-handler", () => {
        document.removeEventListener("mousemove", handler);
      });
      const frame = () => {
        cx += (tx - cx) * 0.04;
        cy += (ty - cy) * 0.04;
        document.getElementById("spotlight")?.style.setProperty("--sx", cx + "px");
        document.getElementById("spotlight")?.style.setProperty("--sy", cy + "px");
        document.getElementById("dot-grid")?.style.setProperty("--sx", cx + "px");
        document.getElementById("dot-grid")?.style.setProperty("--sy", cy + "px");
        context.setLoop("_sp", requestAnimationFrame(frame));
      };
      context.setLoop("_sp", requestAnimationFrame(frame));
    },
    stop(context) {
      context.cancelLoop("_sp");
      context.runCleanup("spotlight-handler");
      ["spotlight", "dot-grid"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.style.setProperty("--sx", "-9999px");
          element.style.setProperty("--sy", "-9999px");
        }
      });
    }
  };

  // src/fx/plugins/aurora.ts
  var auroraPlugin = {
    id: "aurora",
    start(intensity, _context) {
      const auroraWrap = document.getElementById("aurora-wrap");
      if (auroraWrap) {
        auroraWrap.style.opacity = ((intensity || 5) / 10 * 1.6).toString();
      }
    },
    stop(_context) {
      const auroraWrap = document.getElementById("aurora-wrap");
      if (auroraWrap) {
        auroraWrap.style.opacity = "0";
      }
    }
  };

  // src/fx/plugins/particles.ts
  var COLORS = ["79,156,249", "34,211,238", "249,115,22", "244,114,182"];
  var particlesPlugin = {
    id: "particles",
    start(intensity, context) {
      const canvas = context.makeCanvas("cv-particles");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const makeParticle = () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        a: Math.random(),
        da: (Math.random() * 6e-3 + 2e-3) * (Math.random() < 0.5 ? 1 : -1),
        c: COLORS[Math.floor(Math.random() * COLORS.length)]
      });
      const points = Array.from({ length: Math.round(intensity * 14) }, makeParticle);
      const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points.forEach((point) => {
          if (context.mouse.still && context.mouse.x > -9999) {
            const dx = context.mouse.x - point.x;
            const dy = context.mouse.y - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5 && dist < 300) {
              const force = Math.min(0.4, 80 / dist);
              point.vx += dx / dist * force * 0.12;
              point.vy += dy / dist * force * 0.12;
            }
            point.vx *= 0.94;
            point.vy *= 0.94;
          }
          point.x += point.vx;
          point.y += point.vy;
          point.a += point.da;
          if (point.a > 1 || point.a < 0) point.da *= -1;
          if (point.x < 0) point.x = canvas.width;
          if (point.x > canvas.width) point.x = 0;
          if (point.y < 0) point.y = canvas.height;
          if (point.y > canvas.height) point.y = 0;
          ctx.beginPath();
          ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${point.c},${point.a * 0.65})`;
          ctx.fill();
        });
        for (let i = 0; i < points.length; i += 1) {
          for (let j = i + 1; j < points.length; j += 1) {
            const distance = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
            if (distance < 90) {
              ctx.beginPath();
              ctx.moveTo(points[i].x, points[i].y);
              ctx.lineTo(points[j].x, points[j].y);
              ctx.strokeStyle = `rgba(79,156,249,${(1 - distance / 90) * 0.1})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
        context.setLoop("particles", requestAnimationFrame(frame));
      };
      frame();
    },
    stop(context) {
      context.cancelLoop("particles");
      context.hideCanvas("particles");
    }
  };

  // src/fx/plugins/stars.ts
  var starsPlugin = {
    id: "stars",
    start(intensity, context) {
      const canvas = context.makeCanvas("cv-stars");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const stars = Array.from({ length: Math.round(intensity * 70) }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 0.9 + 0.2,
        a: Math.random(),
        da: Math.random() * 4e-3 + 1e-3 * (Math.random() < 0.5 ? 1 : -1)
      }));
      const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        stars.forEach((star) => {
          star.a += star.da;
          if (star.a > 1 || star.a < 0.05) star.da *= -1;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,185,220,${star.a * 0.7})`;
          ctx.fill();
        });
        context.setLoop("stars", requestAnimationFrame(frame));
      };
      frame();
    },
    stop(context) {
      context.cancelLoop("stars");
      context.hideCanvas("stars");
    }
  };

  // src/fx/plugins/trail.ts
  var trailPlugin = {
    id: "trail",
    start(intensity, context) {
      const canvas = context.makeCanvas("cv-trail");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let points = [];
      context.runCleanup("trail-handler");
      const handler = (event) => {
        points.push({ x: event.clientX, y: event.clientY, a: 1 });
      };
      document.addEventListener("mousemove", handler);
      context.onCleanup("trail-handler", () => {
        document.removeEventListener("mousemove", handler);
      });
      const max = Math.round(intensity * 18);
      const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points.forEach((point) => {
          point.a -= 0.03;
        });
        points = points.filter((point) => point.a > 0);
        if (points.length > max) {
          points = points.slice(-max);
        }
        for (let i = 1; i < points.length; i += 1) {
          const point = points[i];
          const previous = points[i - 1];
          ctx.beginPath();
          ctx.moveTo(previous.x, previous.y);
          ctx.lineTo(point.x, point.y);
          ctx.strokeStyle = `rgba(79,156,249,${point.a * 0.55})`;
          ctx.lineWidth = 2.5 * point.a;
          ctx.lineCap = "round";
          ctx.shadowBlur = 6;
          ctx.shadowColor = `rgba(34,211,238,${point.a * 0.35})`;
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        context.setLoop("trail", requestAnimationFrame(frame));
      };
      frame();
    },
    stop(context) {
      context.cancelLoop("trail");
      context.runCleanup("trail-handler");
      context.hideCanvas("trail");
    }
  };

  // src/fx/plugins/snow.ts
  var snowPlugin = {
    id: "snow",
    start(intensity, context) {
      const canvas = context.makeCanvas("cv-snow");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const makeFlake = () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * -canvas.height,
        r: Math.random() * 2.5 + 0.8,
        vy: Math.random() * 0.7 + 0.3,
        vx: (Math.random() - 0.5) * 0.5,
        a: Math.random() * 0.5 + 0.3,
        sw: Math.random() * Math.PI * 2,
        ss: Math.random() * 0.015 + 5e-3
      });
      const flakes = Array.from({ length: Math.round(intensity * 30) }, () => {
        const flake = makeFlake();
        flake.y = Math.random() * canvas.height;
        return flake;
      });
      const frame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        flakes.forEach((flake) => {
          flake.y += flake.vy;
          flake.sw += flake.ss;
          flake.x += Math.sin(flake.sw) * 0.7 + flake.vx;
          if (flake.y > canvas.height + 10) {
            Object.assign(flake, makeFlake());
          }
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200,210,255,${flake.a})`;
          ctx.fill();
        });
        context.setLoop("snow", requestAnimationFrame(frame));
      };
      frame();
    },
    stop(context) {
      context.cancelLoop("snow");
      context.hideCanvas("snow");
    }
  };

  // src/fx/plugins/glass.ts
  var glassPlugin = {
    id: "glass",
    start(intensity, _context) {
      document.body.classList.add("fx-glass-on");
      document.documentElement.style.setProperty("--glass-intensity", String(Math.max(1, intensity || 5)));
    },
    stop(_context) {
      document.body.classList.remove("fx-glass-on");
    }
  };

  // src/fx/plugins/reveal.ts
  var SELECTOR = [
    ".hero-badge",
    ".hero-title",
    ".hero-sub",
    ".post-card",
    ".widget",
    ".section-title",
    ".about-text p",
    ".skill-item"
  ].join(",");
  function readNumber(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }
  var revealPlugin = {
    id: "reveal",
    start(intensity, context) {
      const distance = readNumber("--reveal-distance", 18);
      const stagger = readNumber("--reveal-stagger", 70);
      const duration = Math.max(220, Math.round((intensity || 5) * 95));
      const nodes = Array.from(document.querySelectorAll(SELECTOR));
      const timers = [];
      document.body.classList.add("fx-reveal-on");
      nodes.forEach((node, index) => {
        node.classList.add("fx-reveal-item");
        node.style.opacity = "0";
        node.style.transform = `translateY(${distance}px)`;
        node.style.transition = `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(.16,1,.3,1)`;
        timers.push(window.setTimeout(() => {
          node.style.opacity = "1";
          node.style.transform = "translateY(0)";
        }, index * stagger));
      });
      context.onCleanup("reveal", () => {
        timers.forEach((timer) => window.clearTimeout(timer));
      });
    },
    stop(context) {
      context.runCleanup("reveal");
      document.body.classList.remove("fx-reveal-on");
      document.querySelectorAll(SELECTOR).forEach((node) => {
        node.classList.remove("fx-reveal-item");
        node.style.opacity = "";
        node.style.transform = "";
        node.style.transition = "";
      });
    }
  };

  // src/fx/engine.ts
  var plugins = {
    spotlight: spotlightPlugin,
    aurora: auroraPlugin,
    particles: particlesPlugin,
    stars: starsPlugin,
    trail: trailPlugin,
    snow: snowPlugin,
    glass: glassPlugin,
    reveal: revealPlugin
  };
  function createMouseState() {
    const mouse = { x: -9999, y: -9999, still: false };
    let stillTimer;
    document.addEventListener("mousemove", (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      mouse.still = false;
      if (stillTimer !== void 0) {
        window.clearTimeout(stillTimer);
      }
      stillTimer = window.setTimeout(() => {
        mouse.still = true;
      }, 800);
    });
    return mouse;
  }
  function createContext() {
    const loops = {};
    const cleanups = /* @__PURE__ */ new Map();
    const mouse = createMouseState();
    return {
      loops,
      mouse,
      setLoop(name, id) {
        loops[name] = id;
      },
      cancelLoop(name) {
        const id = loops[name];
        if (id !== void 0) {
          cancelAnimationFrame(id);
          delete loops[name];
        }
      },
      makeCanvas(id) {
        const canvas = document.getElementById(id);
        if (!canvas) {
          throw new Error(`Missing canvas: ${id}`);
        }
        canvas.style.display = "block";
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        return canvas;
      },
      hideCanvas(name) {
        const canvas = document.getElementById(`cv-${name}`);
        if (canvas) {
          canvas.style.display = "none";
        }
      },
      onCleanup(key, cleanup) {
        cleanups.set(key, cleanup);
      },
      runCleanup(key) {
        const cleanup = cleanups.get(key);
        if (cleanup) {
          cleanup();
          cleanups.delete(key);
        }
      }
    };
  }
  function createFxApi() {
    const context = createContext();
    const stopCanvasEffects = () => {
      ["particles", "stars", "trail", "snow"].forEach((name) => {
        plugins[name].stop(context);
      });
    };
    const applyDomEffects = (fx) => {
      document.documentElement.style.setProperty("--glass-blur", `${Number(fx.glassBlur ?? 18)}px`);
      document.documentElement.style.setProperty("--glass-opacity", String(Number(fx.glassOpacity ?? 0.18)));
      document.documentElement.style.setProperty("--reveal-distance", String(Number(fx.revealDistance ?? 18)));
      document.documentElement.style.setProperty("--reveal-stagger", String(Number(fx.revealStagger ?? 70)));
      if (fx.glass) plugins.glass.start(Number(fx.glassInt ?? 5), context);
      else plugins.glass.stop(context);
      if (fx.reveal) plugins.reveal.start(Number(fx.revealInt ?? 5), context);
      else plugins.reveal.stop(context);
    };
    return {
      applyAll(fx) {
        stopCanvasEffects();
        if (fx.spotlight) plugins.spotlight.start(Number(fx.spotlightInt ?? 5), context);
        else plugins.spotlight.stop(context);
        if (fx.aurora) plugins.aurora.start(Number(fx.auroraInt ?? 5), context);
        else plugins.aurora.stop(context);
        if (fx.particles) plugins.particles.start(Number(fx.particlesInt ?? 4), context);
        if (fx.stars) plugins.stars.start(Number(fx.starsInt ?? 4), context);
        if (fx.trail) plugins.trail.start(Number(fx.trailInt ?? 5), context);
        if (fx.snow) plugins.snow.start(Number(fx.snowInt ?? 3), context);
        applyDomEffects(fx);
      },
      toggle(name, on, intensity) {
        const plugin = plugins[name];
        if (!plugin) return;
        if (on) {
          plugin.stop(context);
          plugin.start(Number(intensity ?? 5), context);
        } else {
          plugin.stop(context);
        }
      }
    };
  }

  // src/fx/definitions.ts
  var EFFECT_DEFS = [
    { key: "spotlight", icon: "\u{1F526}", name: "\u805A\u5149\u706F", desc: "\u9F20\u6807\u8DDF\u968F\u5149\u6655+\u70B9\u9635", ik: "spotlightInt" },
    { key: "aurora", icon: "\u{1F30C}", name: "\u6781\u5149\u80CC\u666F", desc: "Hero \u6D41\u52A8\u5F69\u8272\u5149\u7403", ik: "auroraInt" },
    { key: "particles", icon: "\u2726", name: "\u6D6E\u52A8\u7C92\u5B50", desc: "\u5168\u9875\u7C92\u5B50+\u9F20\u6807\u5438\u9644(O001)", ik: "particlesInt" },
    { key: "stars", icon: "\u{1F320}", name: "\u661F\u5C18\u80CC\u666F", desc: "\u7EC6\u5BC6\u95EA\u70C1\u661F\u70B9", ik: "starsInt" },
    { key: "trail", icon: "\u{1F30A}", name: "\u9F20\u6807\u62D6\u5C3E", desc: "\u9F20\u6807\u5212\u8FC7\u53D1\u5149\u8F68\u8FF9", ik: "trailInt" },
    { key: "snow", icon: "\u2744\uFE0F", name: "\u98D8\u843D\u96EA\u82B1", desc: "\u8F7B\u67D4\u98D8\u843D\u7C92\u5B50", ik: "snowInt" },
    {
      key: "glass",
      icon: "\u{1FAE7}",
      name: "\u78E8\u7802\u73BB\u7483",
      desc: "\u4E3A\u5361\u7247\u548C\u4FA7\u680F\u542F\u7528\u73BB\u7483\u6A21\u7CCA\u5C42",
      ik: "glassInt",
      params: [
        { key: "glassBlur", label: "\u6A21\u7CCA\u5F3A\u5EA6", type: "range", min: 4, max: 32, step: 1 },
        { key: "glassOpacity", label: "\u900F\u660E\u5EA6", type: "range", min: 0.08, max: 0.45, step: 0.01 }
      ]
    },
    {
      key: "reveal",
      icon: "\u270D\uFE0F",
      name: "\u624B\u5199\u663E\u73B0",
      desc: "\u6807\u9898\u4E0E\u5361\u7247\u4EE5\u8F7B\u91CF\u7B14\u89E6\u5F0F\u52A8\u6548\u51FA\u73B0",
      ik: "revealInt",
      params: [
        { key: "revealDistance", label: "\u4F4D\u79FB\u8DDD\u79BB", type: "range", min: 4, max: 48, step: 1 },
        { key: "revealStagger", label: "\u9519\u5CF0\u65F6\u957F", type: "range", min: 20, max: 220, step: 10 }
      ]
    }
  ];

  // src/compat/globals.ts
  function installGlobals() {
    window.__RYOKO_FX__ = createFxApi();
    window.__RYOKO_FX_DEFS__ = EFFECT_DEFS;
  }

  // src/app-runtime.ts
  var Store = /* @__PURE__ */ (() => {
    const P = "ry3_";
    const get = (k, d) => {
      try {
        const v = localStorage.getItem(P + k);
        return v !== null ? JSON.parse(v) : d;
      } catch {
        return d;
      }
    };
    const set = (k, v) => {
      try {
        localStorage.setItem(P + k, JSON.stringify(v));
      } catch {
      }
    };
    const del = (k) => {
      try {
        localStorage.removeItem(P + k);
      } catch {
      }
    };
    return { get, set, del };
  })();
  var Config = /* @__PURE__ */ (() => {
    const CACHE_KEY = "site_config_cache";
    const DEFAULTS = {
      site: { title: "Ryoko", description: "\u4E2A\u4EBA\u535A\u5BA2", url: "", author: "Ryoko", avatar: "R", bio: "\u70ED\u7231\u6280\u672F\u4E0E\u8BBE\u8BA1\u7684\u72EC\u7ACB\u521B\u4F5C\u8005\u3002", lang: "zh-CN", since: "2025" },
      hero: { line1: "Ryoko's", line2: "Personal Blog", subtitle: "\u8BB0\u5F55\u6280\u672F\u3001\u8BBE\u8BA1\u4E0E\u751F\u6D3B\u7684\u4EA4\u6C47\u5904", badge: "Personal Blog \xB7 Code and Record", btn1: "\u5F00\u59CB\u9605\u8BFB", btn2: "\u4E86\u89E3\u6211", bgImage: "", bgOpacity: 0.5, showCode: true },
      theme: { preset: "geek", font: "inter", blue: "#4f9cf9", cyan: "#22d3ee" },
      social: [],
      effects: { spotlight: false, spotlightInt: 5, aurora: true, auroraInt: 6, particles: false, particlesInt: 4, stars: true, starsInt: 4, trail: false, trailInt: 5, snow: false, snowInt: 3, glass: false, glassInt: 5, glassBlur: 18, glassOpacity: 0.18, reveal: false, revealInt: 5, revealDistance: 18, revealStagger: 70 },
      about: { p1: "\u6211\u76F8\u4FE1\uFF0C\u6700\u597D\u7684\u6587\u7AE0\u5E94\u8BE5\u50CF\u8BD7\u6B4C\u4E00\u6837\u2014\u2014\u7CBE\u51C6\u3001\u6709\u529B\u3001\u7559\u6709\u4F59\u5473\u3002", p2: "\u8FD9\u91CC\u662F\u6211\u4E0E\u4E16\u754C\u5BF9\u8BDD\u7684\u5730\u65B9\u3002" },
      skills: [{ label: "\u524D\u7AEF\u5F00\u53D1", pct: 92 }, { label: "UI/UX \u8BBE\u8BA1", pct: 84 }, { label: "\u5185\u5BB9\u521B\u4F5C", pct: 88 }, { label: "\u7CFB\u7EDF\u67B6\u6784", pct: 76 }],
      footer: { copy: "\xA9 2025 Ryoko. All rights reserved.", sub: "Built with \u2726 and curiosity" },
      auth: { adminEmail: "", adminPath: "manage-ryoko" },
      firebase: { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" }
    };
    let cfg = {};
    let lastSync = { local: false, remote: false, reason: "init" };
    const deep = (a, b) => {
      const o = { ...a };
      if (!b) return o;
      for (const k of Object.keys(b)) {
        if (b[k] && typeof b[k] === "object" && !Array.isArray(b[k])) o[k] = deep(a[k] || {}, b[k]);
        else o[k] = b[k];
      }
      return o;
    };
    const cacheLocal = () => {
      Store.set(CACHE_KEY, cfg);
      lastSync = { local: true, remote: false, reason: "local-cache" };
    };
    const load = async () => {
      let fileCfg = {};
      const cachedCfg = Store.get(CACHE_KEY, {});
      try {
        const r = await fetch("./config.json?t=" + Date.now());
        if (r.ok) fileCfg = await r.json();
      } catch {
      }
      cfg = deep(DEFAULTS, fileCfg);
      cfg = deep(cfg, cachedCfg);
      return cfg;
    };
    const hydrateRemote = async () => {
      if (!FB.isReady()) return cfg;
      try {
        const snap = await FB.docRef("site_config", "main").get();
        if (snap.exists) {
          cfg = deep(cfg, snap.data());
          Store.set(CACHE_KEY, cfg);
          lastSync = { local: true, remote: true, reason: "remote-hydrate" };
        }
      } catch (err) {
        console.warn("Config remote hydrate failed:", err);
      }
      return cfg;
    };
    const persist = async () => {
      cacheLocal();
      if (!FB.isReady()) return { ...lastSync, reason: "firebase-not-ready" };
      if (!Auth.isLoggedIn()) return { ...lastSync, reason: "not-logged-in" };
      if (!Auth.isAdmin()) return { ...lastSync, reason: "not-admin" };
      try {
        await FB.docRef("site_config", "main").set({ ...cfg }, { merge: true });
        lastSync = { local: true, remote: true, reason: "ok" };
      } catch (err) {
        console.error("Config persist failed:", err);
        lastSync = { local: true, remote: false, reason: err?.code || err?.message || "remote-write-failed" };
      }
      return lastSync;
    };
    const get = (path) => {
      let v = cfg;
      for (const p of path.split(".")) v = v?.[p];
      return v;
    };
    const save = (path, val) => {
      const parts = path.split(".");
      let node = cfg;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!node[parts[i]] || typeof node[parts[i]] !== "object") node[parts[i]] = {};
        node = node[parts[i]];
      }
      node[parts[parts.length - 1]] = val;
      return persist();
    };
    const saveSection = (sec, obj) => {
      cfg[sec] = obj;
      return persist();
    };
    const all = () => cfg;
    const status = () => lastSync;
    return { load, hydrateRemote, persist, get, save, saveSection, all, status };
  })();
  var Posts = /* @__PURE__ */ (() => {
    let posts = [];
    const load = async () => {
      let base = [];
      try {
        const r = await fetch("./posts.json?t=" + Date.now());
        if (r.ok) base = await r.json();
      } catch {
      }
      const saved = Store.get("posts", null);
      if (saved && Array.isArray(saved) && saved.length > 0) {
        const savedIds = new Set(saved.map((p) => p.id));
        posts = [...saved, ...base.filter((p) => !savedIds.has(p.id))];
      } else {
        posts = base;
      }
      return posts;
    };
    const save = () => Store.set("posts", posts);
    const all = () => posts;
    const byId = (id) => posts.find((p) => p.id === id);
    const search = (q) => {
      if (!q) return [];
      q = q.toLowerCase();
      return posts.filter((p) => p.title.toLowerCase().includes(q) || (p.excerpt || "").toLowerCase().includes(q) || (p.tags || []).some((t) => t.toLowerCase().includes(q)));
    };
    const add = (p) => {
      posts.unshift(p);
      save();
    };
    const update = (p) => {
      const i = posts.findIndex((x) => x.id === p.id);
      if (i !== -1) posts[i] = p;
      else posts.unshift(p);
      save();
    };
    const remove = (id) => {
      posts = posts.filter((p) => p.id !== id);
      save();
    };
    const slugify = (s) => s.toLowerCase().replace(/[\s\W]+/g, "-").replace(/^-|-$/g, "").slice(0, 55) + "-" + Date.now().toString(36);
    return { load, all, byId, search, add, update, remove, save, slugify };
  })();
  var Stats = /* @__PURE__ */ (() => {
    const today = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const data = () => Store.get("stats", { visits: {}, opens: {} });
    const recordVisit = () => {
      const s = data(), d = today();
      s.visits[d] = (s.visits[d] || 0) + 1;
      Store.set("stats", s);
    };
    const recordOpen = (id) => {
      const s = data();
      s.opens[id] = (s.opens[id] || 0) + 1;
      Store.set("stats", s);
    };
    const getVisits = () => data().visits;
    const getOpens = () => data().opens;
    const total = () => Object.values(data().visits).reduce((a, b) => a + b, 0);
    const last7 = () => Array.from({ length: 7 }, (_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - 6 + i);
      const k = d.toISOString().slice(0, 10);
      return { date: k, day: ["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"][d.getDay()], count: data().visits[k] || 0 };
    });
    const clear = () => Store.del("stats");
    return { recordVisit, recordOpen, getVisits, getOpens, total, last7, clear };
  })();
  var FB = /* @__PURE__ */ (() => {
    let _app = null, _auth = null, _db = null;
    const isReady = () => !!_app;
    const auth = () => _auth;
    const db = () => _db;
    const TS = () => firebase.firestore.FieldValue.serverTimestamp();
    const arrUnion = (v) => firebase.firestore.FieldValue.arrayUnion(v);
    const arrRemove = (v) => firebase.firestore.FieldValue.arrayRemove(v);
    const incr = (n) => firebase.firestore.FieldValue.increment(n);
    const col = (path) => _db.collection(path);
    const docRef = (col2, id) => _db.collection(col2).doc(id);
    const init = (fbCfg) => {
      if (!fbCfg?.apiKey || fbCfg.apiKey === "YOUR_API_KEY") return false;
      try {
        if (!firebase.apps.length) _app = firebase.initializeApp(fbCfg);
        else _app = firebase.app();
        _auth = firebase.auth();
        _db = firebase.firestore();
        return true;
      } catch (e) {
        console.warn("Firebase init:", e);
        return false;
      }
    };
    return { init, isReady, auth, db, col, docRef, TS, arrUnion, arrRemove, incr };
  })();
  var Auth = /* @__PURE__ */ (() => {
    let _user = null;
    const _listeners = [];
    const onChange = (cb) => _listeners.push(cb);
    const _notify = () => _listeners.forEach((cb) => cb(_user));
    const syncUser = (fbUser) => {
      _user = fbUser ? { uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName || "\u7BA1\u7406\u5458" } : null;
      _notify();
      return _user;
    };
    const normalizeEmail = (value) => (value || "").trim().toLowerCase();
    const init = () => {
      if (!FB.isReady()) return;
      FB.auth().onAuthStateChanged(syncUser);
    };
    const login = async () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const result = await FB.auth().signInWithPopup(provider);
      return syncUser(result.user);
    };
    const logout = () => FB.auth().signOut();
    const user = () => _user;
    const uid = () => _user?.uid;
    const isAdmin = (email = _user?.email) => {
      const adminEmail = normalizeEmail(Config.get("auth.adminEmail"));
      return !!adminEmail && normalizeEmail(email) === adminEmail;
    };
    const isLoggedIn = () => !!_user;
    return { init, onChange, login, logout, user, uid, isAdmin, isLoggedIn };
  })();
  var Announce = /* @__PURE__ */ (() => {
    let _list = [];
    let _unsub = null;
    const listen = (cb) => {
      if (!FB.isReady()) return;
      _unsub = FB.col("announcements").orderBy("createdAt", "desc").limit(5).onSnapshot((snap) => {
        _list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        cb(_list);
      }, () => {
      });
    };
    const create = async (title, content, pinned = false) => {
      if (!Auth.isAdmin()) throw new Error("\u53EA\u6709\u7BA1\u7406\u5458\u53EF\u4EE5\u53D1\u516C\u544A");
      await FB.col("announcements").add({
        title,
        content,
        pinned,
        authorId: Auth.uid(),
        createdAt: FB.TS()
      });
    };
    const remove = async (id) => {
      await FB.docRef("announcements", id).delete();
    };
    const all = () => _list;
    return { listen, create, remove, all };
  })();
  var Theme = /* @__PURE__ */ (() => {
    const PRESETS = [
      { name: "\u6781\u5BA2\u84DD", blue: "#4f9cf9", cyan: "#22d3ee", label: "geek" },
      { name: "\u8D5B\u535A\u9752", blue: "#06b6d4", cyan: "#4f9cf9", label: "cyber" },
      { name: "\u9713\u8679\u7EFF", blue: "#22c55e", cyan: "#4f9cf9", label: "neon" },
      { name: "\u7D2B\u7C89", blue: "#a855f7", cyan: "#f472b6", label: "violet" },
      { name: "\u6A59\u706B", blue: "#f97316", cyan: "#eab308", label: "fire" }
    ];
    const FONTS = [
      { id: "inter", name: "Inter", preview: "Aa \u2014 Sans Serif" },
      { id: "serif", name: "Cormorant", preview: "Aa \u2014 Serif" },
      { id: "mono", name: "JetBrains Mono", preview: "Aa \u2014 Monospace" }
    ];
    const FMAP = { inter: "'Inter',system-ui,sans-serif", serif: "'Cormorant Garamond',Georgia,serif", mono: "'JetBrains Mono',monospace" };
    const apply = (t) => {
      const r = document.documentElement.style;
      if (t.blue) r.setProperty("--blue", t.blue);
      if (t.cyan) r.setProperty("--cyan", t.cyan);
      if (t.font && FMAP[t.font]) r.setProperty("--font-body", FMAP[t.font]);
    };
    const setDark = () => {
      document.documentElement.setAttribute("data-theme", "dark");
      Store.set("dark", true);
      const b = document.querySelector("#theme-toggle");
      if (b) b.textContent = "\u2600";
    };
    const setLight = () => {
      document.documentElement.setAttribute("data-theme", "light");
      Store.set("dark", false);
      const b = document.querySelector("#theme-toggle");
      if (b) b.textContent = "\u263E";
    };
    const toggle = () => document.documentElement.getAttribute("data-theme") === "dark" ? setLight() : setDark();
    const initDark = () => {
      const saved = Store.get("dark", null);
      if (saved === true) {
        setDark();
        return;
      }
      if (saved === false) {
        setLight();
        return;
      }
      const h = (/* @__PURE__ */ new Date()).getHours();
      if (h >= 21 || h < 7 || window.matchMedia("(prefers-color-scheme:dark)").matches) setDark();
      else setLight();
      window.matchMedia("(prefers-color-scheme:dark)").addEventListener("change", (e) => {
        if (Store.get("dark", null) === null) e.matches ? setDark() : setLight();
      });
    };
    return { apply, toggle, initDark, PRESETS, FONTS };
  })();
  var FX = window.__RYOKO_FX__ || createFxApi();
  window.__RYOKO_FX__ = FX;
  var FX_DEFS = window.__RYOKO_FX_DEFS__ || EFFECT_DEFS;
  window.__RYOKO_FX_DEFS__ = FX_DEFS;
  var MD = /* @__PURE__ */ (() => {
    const render = (text, format) => {
      if (!text) return "";
      if (format === "html") return text;
      if (window.marked) {
        marked.setOptions({ breaks: true, gfm: true });
        const r = new marked.Renderer();
        r.code = (code, lang) => {
          const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const l = lang || "code";
          return `<pre data-lang="${l}"><code class="language-${l}">${esc}</code></pre>`;
        };
        return marked.parse(text, { renderer: r });
      }
      return `<pre><code>${text.replace(/</g, "&lt;")}</code></pre>`;
    };
    const enhance = (container) => {
      if (!container) return;
      if (window.hljs) container.querySelectorAll("pre code").forEach((b) => {
        try {
          hljs.highlightElement(b);
        } catch {
        }
      });
      if (window.renderMathInElement) {
        try {
          renderMathInElement(container, { delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }], throwOnError: false });
        } catch {
        }
      }
    };
    const renderInto = (container, text, format) => {
      if (!container) return;
      container.innerHTML = render(text || "", format || "markdown");
      enhance(container);
    };
    return { render, enhance, renderInto };
  })();
  var TOC = /* @__PURE__ */ (() => {
    const build = (container) => {
      const hs = container.querySelectorAll("h1,h2,h3,h4");
      const te = document.getElementById("modal-toc"), tl = document.getElementById("toc-list");
      if (!te || !tl || hs.length < 3) {
        if (te) te.style.display = "none";
        return;
      }
      te.style.display = "block";
      tl.innerHTML = "";
      let idx = 0;
      hs.forEach((h) => {
        h.id = "toc-h-" + idx++;
        const a = document.createElement("a");
        a.className = "toc-item toc-" + h.tagName.toLowerCase();
        a.textContent = h.textContent;
        a.onclick = () => h.scrollIntoView({ behavior: "smooth", block: "start" });
        tl.appendChild(a);
      });
    };
    return { build };
  })();
  var SEO = /* @__PURE__ */ (() => {
    const $2 = (id) => document.getElementById(id);
    const update = (cfg) => {
      const s = cfg.site, url = s.url || location.origin;
      document.title = s.title;
      document.documentElement.lang = s.lang || "zh-CN";
      const sm = (id, a, v) => {
        const e = $2(id);
        if (e) e.setAttribute(a, v);
      };
      sm("meta-desc", "content", s.description);
      sm("meta-author", "content", s.author);
      sm("meta-canonical", "href", url);
      sm("og-site", "content", s.title);
      sm("og-title", "content", s.title);
      sm("og-desc", "content", s.description);
      sm("og-url", "content", url);
      sm("tw-title", "content", s.title);
      sm("tw-desc", "content", s.description);
      sm("rss-link", "href", (s.url || "") + "/rss.xml");
    };
    return { update };
  })();
  var Tools = /* @__PURE__ */ (() => {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const strip = (s) => s ? s.replace(/<[^>]*>/g, "") : "";
    const dl = (content, filename, type = "text/xml") => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([content], { type }));
      a.download = filename;
      a.click();
    };
    const buildRSS = () => {
      const cfg = Config.all(), u = cfg.site.url || location.origin;
      const items = Posts.all().slice(0, 20).map((p) => `
    <item>
      <title>${esc(p.title)}</title>
      <link>${u}/#${p.id}</link>
      <guid>${u}/#${p.id}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${esc(strip(p.excerpt || p.content || "").slice(0, 300))}</description>
    </item>`).join("");
      return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${esc(cfg.site.title)}</title>
    <link>${u}</link>
    <description>${esc(cfg.site.description)}</description>
    <language>${cfg.site.lang}</language>${items}
  </channel>
</rss>`;
    };
    const buildSitemap = () => {
      const u = Config.get("site.url") || location.origin;
      const urls = [{ loc: u + "/", p: "1.0", c: "weekly" }, ...Posts.all().map((p) => ({ loc: `${u}/#${p.id}`, lm: p.date, p: "0.8", c: "monthly" }))];
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u2) => `  <url>
    <loc>${u2.loc}</loc>${u2.lm ? `
    <lastmod>${u2.lm}</lastmod>` : ""}
    <changefreq>${u2.c}</changefreq>
    <priority>${u2.p}</priority>
  </url>`).join("\n")}
</urlset>`;
    };
    const downloadConfigJson2 = () => {
      const out = JSON.stringify(Config.all(), null, 2);
      dl(out, "config.json", "application/json");
      const ind = document.getElementById("sync-indicator");
      if (ind) ind.style.display = "none";
      toast("\u{1F4E5} config.json \u5DF2\u4E0B\u8F7D \u2014 \u4E0A\u4F20\u5230 GitHub \u4ED3\u5E93\u6839\u76EE\u5F55\u5168\u8BBE\u5907\u540C\u6B65", 5e3);
    };
    const downloadPostsJson2 = () => {
      dl(JSON.stringify(Posts.all(), null, 2), "posts.json", "application/json");
      toast("\u{1F4E5} posts.json \u5DF2\u4E0B\u8F7D \u2014 \u4E0A\u4F20\u5230 GitHub \u4ED3\u5E93\u6839\u76EE\u5F55", 5e3);
    };
    return {
      downloadRSS() {
        dl(buildRSS(), "rss.xml", "application/rss+xml");
        toast("\u2705 rss.xml \u5DF2\u4E0B\u8F7D");
      },
      downloadSitemap() {
        dl(buildSitemap(), "sitemap.xml", "application/xml");
        toast("\u2705 sitemap.xml \u5DF2\u4E0B\u8F7D");
      },
      downloadConfigJson: downloadConfigJson2,
      downloadPostsJson: downloadPostsJson2
    };
  })();
  var Render = /* @__PURE__ */ (() => {
    const $2 = (id) => document.getElementById(id);
    const CAT = { tech: "\u6280\u672F", design: "\u8BBE\u8BA1", life: "\u751F\u6D3B", think: "\u601D\u8003", other: "\u5176\u4ED6" };
    const fmt = (d) => d ? d.replace(/-/g, ".") : "";
    const PER = 6;
    let _currentTab = "official";
    const applyConfig = (cfg) => {
      const s = cfg.site, h = cfg.hero, f = cfg.footer;
      const tx = (id, v) => {
        const e = $2(id);
        if (e) e.textContent = v;
      };
      ["nav-logo", "footer-logo", "admin-logo-el", "admin-brand-el"].forEach((id) => tx(id, s.title));
      document.title = s.title;
      tx("hero-badge-text", h.badge);
      tx("hero-line1", h.line1);
      tx("hero-line2", h.line2);
      tx("hero-sub-text", h.subtitle);
      const b1 = $2("hero-btn1");
      if (b1) b1.textContent = h.btn1;
      const b2 = $2("hero-btn2");
      if (b2) b2.textContent = h.btn2;
      tx("code-author", `'${s.author}'`);
      const hbg = $2("hero-bg-img");
      if (hbg) {
        if (h.bgImage) {
          hbg.style.backgroundImage = `url('${h.bgImage}')`;
          hbg.style.opacity = 1 - (h.bgOpacity || 0.5);
        } else hbg.style.backgroundImage = "";
      }
      const hc = $2("hero-code");
      if (hc) hc.style.display = h.showCode ? "block" : "none";
      tx("footer-copy", f.copy);
      tx("footer-sub", f.sub);
      tx("footer-desc", s.description);
      const av = s.avatar || s.title.charAt(0);
      ["sidebar-av", "orbit-av"].forEach((id) => tx(id, av));
      tx("sidebar-name", s.author);
      tx("sidebar-bio", s.bio);
      tx("blog-about-p1", (cfg.about || {}).p1 || "");
      tx("blog-about-p2", (cfg.about || {}).p2 || "");
      renderSocial(cfg.social || []);
      renderSkills(cfg.skills || []);
    };
    const renderSocial = (links) => {
      const h = links.map((l) => `<a class="social-link" href="${l.url || "#"}" target="_blank" rel="noopener">${l.icon || "\u{1F517}"} ${l.label}</a>`).join("");
      const se = $2("sidebar-social");
      if (se) se.innerHTML = h;
      const fe = $2("footer-social");
      if (fe) fe.innerHTML = links.map((l) => `<a href="${l.url || "#"}" target="_blank" rel="noopener">${l.icon || "\u{1F517}"} ${l.label}</a>`).join("");
    };
    const renderSkills = (skills) => {
      const el = $2("skills-list");
      if (!el) return;
      el.innerHTML = skills.map((s) => `<div class="skill-item"><div class="skill-lr"><span>${s.label}</span><span>${s.pct}%</span></div><div class="skill-track"><div class="skill-fill" data-pct="${s.pct / 100}"></div></div></div>`).join("");
      const obs = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.querySelectorAll(".skill-fill").forEach((f) => {
          f.style.transform = "scaleX(1)";
          f.classList.add("v");
        });
      }), { threshold: 0.2 });
      obs.observe(el);
    };
    const renderAnnouncements = (list) => {
      const el = $2("announce-bar");
      if (!el) return;
      const pinned = list.filter((a) => a.pinned);
      const latest = pinned.length ? pinned[0] : list.length ? list[0] : null;
      if (!latest) {
        el.style.display = "none";
        return;
      }
      el.style.display = "flex";
      el.innerHTML = `
      <div class="announce-content">
        <span class="announce-badge">\u{1F4E2} \u516C\u544A</span>
        <strong>${latest.title}</strong>
        ${latest.content ? `<span class="announce-text"> \u2014 ${latest.content}</span>` : ""}
      </div>
      <button class="announce-close" onclick="document.getElementById('announce-bar').style.display='none'">\u2715</button>`;
    };
    const switchTab2 = (tab) => {
      _currentTab = tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
      const og = $2("official-section");
      if (og) og.style.display = "block";
    };
    const renderPosts = (posts, cat = "all", page = 1) => {
      const filtered = cat === "all" ? posts : posts.filter((p) => p.cat === cat);
      const pages = Math.max(1, Math.ceil(filtered.length / PER));
      const slice = filtered.slice((page - 1) * PER, page * PER);
      const grid = $2("posts-grid");
      if (!grid) return;
      if (!slice.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--muted);font-size:14px">\u6682\u65E0\u6587\u7AE0 \u2601</div>`;
      } else {
        grid.innerHTML = slice.map((p, i) => officialCard(p, i === 0 && page === 1 && cat === "all" && !!p.featured)).join("");
      }
      renderPagination(pages, page, cat, "official");
      renderSideStats(posts);
      renderCatList(posts, cat);
      renderTagCloud(posts);
      initCardTilt();
    };
    const officialCard = (p, feat) => `
    <div class="post-card${feat ? " featured" : ""}" onclick="openPost('${p.id}','official')">
      <div class="post-thumb ${(p.cover?.style || "cv1").replace("cover-", "cv")}">
        <div class="pta"></div><div class="ptg">${p.cover?.glyph || "\u2726"}</div>
      </div>
      <div class="post-body">
        <div class="post-meta"><span class="post-cat cat-${p.cat}">${CAT[p.cat] || p.cat}</span><span class="post-date">${fmt(p.date)}</span></div>
        <h3 class="post-title">${p.title}</h3>
        <p class="post-excerpt">${p.excerpt || ""}</p>
        <div class="post-tags">${(p.tags || []).map((t) => `<span class="post-tag" onclick="event.stopPropagation();filterByTag('${t}')">${t}</span>`).join("")}</div>
        <span class="read-more">\u9605\u8BFB\u5168\u6587 \u2192</span>
      </div>
    </div>`;
    const renderPagination = (pages, cur, cat) => {
      const el = $2("pagination");
      if (!el || pages <= 1) {
        if (el) el.innerHTML = "";
        return;
      }
      el.innerHTML = Array.from({ length: pages }, (_, i) => i + 1).map((p) => `<button class="page-btn${p === cur ? " active" : ""}" onclick="changePage(${p},'${cat}')">${p}</button>`).join("");
    };
    const renderSideStats = (posts) => {
      const el = $2("mini-stats");
      if (!el) return;
      el.innerHTML = [["\u6587\u7AE0", posts.length + "\u7BC7"], ["\u8BBF\u95EE", Stats.total() + "\u6B21"], ["\u5206\u7C7B", [...new Set(posts.map((p) => p.cat))].length + "\u7C7B"]].map(([l, v]) => `<div class="mini-stat-row"><span class="msl">${l}</span><span class="msv">${v}</span></div>`).join("");
    };
    const renderCatList = (posts, active) => {
      const el = $2("cat-list");
      if (!el) return;
      const cnt = {};
      posts.forEach((p) => {
        cnt[p.cat] = (cnt[p.cat] || 0) + 1;
      });
      el.innerHTML = [["all", "\u5168\u90E8", posts.length], ...Object.entries(cnt).map(([k, v]) => [k, CAT[k] || k, v])].map(([k, n, c]) => `<div class="cat-item${k === active ? " active" : ""}" onclick="filterByCat('${k}')" style="${k === active ? "color:var(--blue)" : ""}"><span>${n}</span><span class="cat-item-count">${c}</span></div>`).join("");
    };
    const renderTagCloud = (posts) => {
      const el = $2("tag-cloud");
      if (!el) return;
      el.innerHTML = [...new Set(posts.flatMap((p) => p.tags || []))].map((t) => `<span class="tag-pill" onclick="filterByTag('${t}')">${t}</span>`).join("");
    };
    const openModal = (post) => {
      const cv = (post.cover?.style || "cv1").replace("cover-", "cv");
      const mc = $2("modal-cover");
      if (mc) mc.className = `modal-cover ${cv}`;
      $2("modal-glyph").textContent = post.cover?.glyph || "\u2726";
      $2("modal-cat").textContent = CAT[post.cat] || post.cat;
      $2("modal-cat").className = `post-cat cat-${post.cat || "other"}`;
      const ts = post.createdAt?.toDate ? post.createdAt.toDate() : new Date(post.date || Date.now());
      $2("modal-date").textContent = ts.toLocaleDateString("zh-CN");
      $2("modal-title").textContent = post.title;
      const html = MD.render(post.content || "", post.format || "markdown");
      const mt = $2("modal-text");
      if (mt) MD.renderInto(mt, post.content || "", post.format || "markdown");
      if (mt) TOC.build(mt);
      $2("modal-tags").innerHTML = (post.tags || []).map((t) => `<span class="modal-tag">${t}</span>`).join("");
      $2("post-modal").classList.add("open");
      document.body.style.overflow = "hidden";
    };
    const closeModal2 = () => {
      $2("post-modal").classList.remove("open");
      document.body.style.overflow = "";
      const toc = $2("modal-toc");
      if (toc) toc.style.display = "none";
    };
    const renderSearch = (results, q) => {
      const el = $2("search-results");
      if (!el) return;
      if (!q) {
        el.style.display = "none";
        el.innerHTML = "";
        return;
      }
      el.style.display = "block";
      if (!results.length) {
        el.innerHTML = `<div class="sr-empty">\u672A\u627E\u5230"${q}"\u76F8\u5173\u6587\u7AE0</div>`;
        return;
      }
      el.innerHTML = results.slice(0, 6).map((p) => `<div class="sri" onclick="openPost('${p.id}','official');clearSearch()"><div class="sri-t">${p.title}</div><div class="sri-m"><span class="post-cat cat-${p.cat}" style="padding:1px 6px">${CAT[p.cat]}</span> ${fmt(p.date)}</div></div>`).join("");
    };
    const initCardTilt = () => {
      document.querySelectorAll(".post-card").forEach((card) => {
        if (card._tiltInit) return;
        card._tiltInit = true;
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = (e.clientX - rect.left) / rect.width - 0.5;
          const y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `perspective(700px) rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(6px) translateY(-3px)`;
          card.style.boxShadow = `0 8px 30px rgba(0,0,0,0.4),0 0 30px rgba(79,156,249,0.3),${-x * 8}px ${-y * 8}px 20px rgba(34,211,238,0.15)`;
        });
        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
          card.style.boxShadow = "";
        });
      });
    };
    return {
      applyConfig,
      renderPosts,
      renderSocial,
      renderSkills,
      renderAnnouncements,
      switchTab: switchTab2,
      renderSearch,
      openModal,
      closeModal: closeModal2,
      initCardTilt
    };
  })();
  var Admin = /* @__PURE__ */ (() => {
    const $2 = (id) => document.getElementById(id);
    let editId = null;
    let editorMode = "split";
    let previewTimer = null;
    const updateEditorModeUi = () => {
      const shell = $2("editor-shell");
      if (shell) shell.dataset.mode = editorMode;
      document.querySelectorAll("[data-editor-mode]").forEach((btn) => btn.classList.toggle("active", btn.dataset.editorMode === editorMode));
    };
    const setEditorMode2 = (mode) => {
      editorMode = mode || "split";
      updateEditorModeUi();
      refreshArticlePreview2(true);
    };
    const updateEditorFormatBadge = () => {
      const badge = $2("editor-format-badge");
      if (badge) badge.textContent = ($2("f-format")?.value || "markdown").toLowerCase();
    };
    const refreshArticlePreview2 = (immediate = false) => {
      const run = () => {
        updateEditorFormatBadge();
        const preview = $2("article-preview");
        if (!preview) return;
        const content = $2("f-content")?.value || "";
        const format = $2("f-format")?.value || "markdown";
        if (!content.trim()) {
          preview.innerHTML = '<div class="editor-empty">\u9884\u89C8\u5C06\u5728\u8FD9\u91CC\u663E\u793A</div>';
          return;
        }
        MD.renderInto(preview, content, format);
      };
      if (previewTimer) {
        clearTimeout(previewTimer);
        previewTimer = null;
      }
      if (immediate) {
        run();
        return;
      }
      previewTimer = setTimeout(run, 180);
    };
    const insertAround = (before, after = "", fallback = "") => {
      const input = $2("f-content");
      if (!input) return;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const selected = input.value.slice(start, end) || fallback;
      input.setRangeText(`${before}${selected}${after}`, start, end, "end");
      input.focus();
      refreshArticlePreview2();
    };
    const insertBlock = (text) => {
      const input = $2("f-content");
      if (!input) return;
      const start = input.selectionStart ?? 0;
      input.setRangeText(text, start, start, "end");
      input.focus();
      refreshArticlePreview2();
    };
    const insertMarkdown = (kind) => {
      if (kind === "heading") return insertAround("## ", "", "\u5C0F\u8282\u6807\u9898");
      if (kind === "bold") return insertAround("**", "**", "\u91CD\u70B9");
      if (kind === "italic") return insertAround("*", "*", "\u5F3A\u8C03");
      if (kind === "code") return insertBlock('\n```ts\nconst message = "hello";\n```\n');
      if (kind === "inlineMath") return insertAround("$", "$", "a^2+b^2=c^2");
      if (kind === "blockMath") return insertBlock("\n$$\n\\int_0^1 x^2 \\, dx\n$$\n");
      if (kind === "image") return insertBlock("\n![\u56FE\u7247\u63CF\u8FF0](https://example.com/image.png)\n");
    };
    const fxParamLabel = (value, step) => {
      const decimals = String(step || "").includes(".") ? String(step).split(".")[1].length : 0;
      return Number(value).toFixed(decimals).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
    };
    const renderFxParams = (fxDef, fx) => {
      if (!fxDef.params?.length) return '<div class="fx-note">\u5F53\u524D\u6548\u679C\u652F\u6301\u5373\u65F6\u5F00\u5173\u4E0E\u5F3A\u5EA6\u8C03\u8282\u3002</div>';
      return `<div class="fx-stack">${fxDef.params.map((param) => `<div class="fx-param"><div class="fx-param-top"><span>${param.label}</span><span class="fx-param-value" id="fx-val-${param.key}">${fxParamLabel(fx[param.key] ?? param.min ?? 0, param.step)}</span></div><input type="range" class="fx-r" id="fx-param-${param.key}" min="${param.min}" max="${param.max}" step="${param.step || 1}" value="${fx[param.key] ?? param.min ?? 0}" oninput="Admin.liveFxParam('${param.key}',this.value,'${param.step || 1}')"></div>`).join("")}</div>`;
    };
    const showLogin = () => {
      $2("admin-login").style.display = "flex";
      $2("admin-app").style.display = "none";
      updateAdminRoutePreview();
    };
    const showApp = () => {
      $2("admin-login").style.display = "none";
      $2("admin-app").style.display = "flex";
    };
    const loginErrText = (err) => {
      const code = err?.code || "";
      if (code === "auth/unauthorized-domain") return "\u5F53\u524D\u7AD9\u70B9\u57DF\u540D\u672A\u52A0\u5165 Firebase Authorized domains";
      if (code === "auth/operation-not-allowed") return "Firebase \u672A\u542F\u7528 Google \u767B\u5F55";
      if (code === "auth/popup-blocked") return "\u6D4F\u89C8\u5668\u62E6\u622A\u4E86 Google \u767B\u5F55\u5F39\u7A97";
      if (code === "auth/popup-closed-by-user") return "Google \u767B\u5F55\u7A97\u53E3\u88AB\u5173\u95ED\uFF0C\u672A\u5B8C\u6210\u767B\u5F55";
      if (code === "auth/cancelled-popup-request") return "\u4E0A\u4E00\u6B21 Google \u767B\u5F55\u5F39\u7A97\u5C1A\u672A\u5B8C\u6210\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5";
      if (code === "auth/network-request-failed") return "\u7F51\u7EDC\u8BF7\u6C42\u5931\u8D25\uFF0C\u65E0\u6CD5\u8FDE\u63A5 Firebase";
      return `Google \u767B\u5F55\u5931\u8D25${code ? `\uFF1A${code}` : ""}`;
    };
    const doLogin2 = async () => {
      if (!Config.get("auth.adminEmail")) {
        $2("login-err").textContent = "\u8BF7\u5148\u5728\u914D\u7F6E\u4E2D\u586B\u5199\u7BA1\u7406\u5458 Google \u90AE\u7BB1";
        $2("login-err").style.display = "block";
        return;
      }
      try {
        const fbUser = await Auth.login();
        if (Auth.isAdmin(fbUser?.email)) {
          showApp();
          refresh();
        } else {
          await Auth.logout();
          $2("login-err").textContent = "\u5F53\u524D Google \u8D26\u53F7\u4E0D\u662F\u7BA1\u7406\u5458";
          $2("login-err").style.display = "block";
        }
      } catch (err) {
        console.error("Google login failed:", err);
        $2("login-err").textContent = loginErrText(err);
        $2("login-err").style.display = "block";
      }
    };
    const getAdminToken = () => (Config.get("auth.adminPath") || "manage-ryoko").trim().replace(/^[/?#]+/, "");
    const getAdminAccessUrl = () => {
      const url = new URL(location.origin + location.pathname);
      url.searchParams.set("admin", getAdminToken());
      return url.toString();
    };
    const syncAdminAccessUrl = (visible) => {
      const url = new URL(location.href);
      if (visible) url.searchParams.set("admin", getAdminToken());
      else url.searchParams.delete("admin");
      history[visible ? "pushState" : "replaceState"]({}, "", `${url.pathname}${url.search}${url.hash}`);
    };
    const open = (syncUrl = true) => {
      showLogin();
      $2("admin-overlay").classList.add("vis");
      $2("login-err").style.display = "none";
      if (Auth.isAdmin()) {
        showApp();
        refresh();
      }
      if (syncUrl) syncAdminAccessUrl(true);
    };
    const openIfRouteMatches = () => {
      if (new URLSearchParams(location.search).get("admin") === getAdminToken()) {
        open(false);
        return true;
      }
      return false;
    };
    const updateAdminRoutePreview = () => {
      const path = getAdminToken();
      const el = $2("admin-route-preview");
      if (el) el.textContent = getAdminAccessUrl();
      const input = $2("admin-route");
      if (input) input.value = path;
    };
    const saveAdminAccess = async () => {
      const input = $2("admin-route");
      const raw = (input?.value || "").trim().replace(/^[/?#]+/, "");
      if (!raw) {
        toast("\u26A0\uFE0F \u8BF7\u586B\u5199\u9690\u85CF\u5165\u53E3\u6807\u8BC6");
        return;
      }
      const sync = await Config.saveSection("auth", { ...Config.get("auth"), adminEmail: Config.get("auth.adminEmail"), adminPath: raw });
      updateAdminRoutePreview();
      if ($2("admin-overlay")?.classList.contains("vis")) syncAdminAccessUrl(true);
      toast(syncToastMessage("\u2705 \u9690\u85CF\u5165\u53E3\u5DF2\u4FDD\u5B58", sync));
    };
    const goToAdminRoute = () => {
      open();
    };
    const exit = async () => {
      $2("admin-overlay").classList.remove("vis");
      syncAdminAccessUrl(false);
      await Config.persist();
      Render.applyConfig(Config.all());
      FX.applyAll(Config.get("effects") || {});
      Theme.apply(Config.get("theme") || {});
      SEO.update(Config.all());
      Render.renderPosts(Posts.all());
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    const refresh = () => switchPanel("dashboard");
    const switchPanel = (name) => {
      document.querySelectorAll(".anav").forEach((e) => e.classList.remove("active"));
      document.querySelectorAll(".apanel").forEach((e) => e.classList.remove("active"));
      const nav = document.querySelector(`.anav[data-panel="${name}"]`);
      if (nav) nav.classList.add("active");
      const pnl = $2("panel-" + name);
      if (pnl) pnl.classList.add("active");
      const m = $2("admin-main");
      if (m) m.scrollTop = 0;
      const loaders = { dashboard: loadDash, articles: loadArticles, hero: loadHero, effects: loadFxForm, contact: loadContact, profile: loadProfile, theme: loadTheme, tools: loadTools, announce: loadAnnounce, password: loadAdminAccess };
      if (loaders[name]) loaders[name]();
    };
    const loadDash = () => {
      const posts = Posts.all(), cats = [...new Set(posts.map((p) => p.cat))].length;
      $2("dash-stats").innerHTML = [["\u6587\u7AE0", posts.length, "\u7BC7"], ["\u5206\u7C7B", cats, "\u7C7B"], ["\u6807\u7B7E", [...new Set(posts.flatMap((p) => p.tags || []))].length, "\u4E2A"], ["\u8BBF\u95EE", Stats.total(), "\u6B21"]].map(([l, v, u]) => `<div class="stat-card"><div class="stat-val">${v}</div><div class="stat-label">${l} <span style="font-size:10px">${u}</span></div></div>`).join("");
      const days = Stats.last7(), max = Math.max(...days.map((d) => d.count), 1);
      $2("visit-chart").innerHTML = days.map((d) => `<div class="bw"><div class="bar" style="height:${Math.round(d.count / max * 72) + 4}px" data-val="${d.count}"></div><div class="bd">\u5468${d.day}</div></div>`).join("");
      const CC = { tech: "#4f9cf9", design: "#f472b6", life: "#4ade80", think: "#f97316", other: "#a855f7" }, CN = { tech: "\u6280\u672F", design: "\u8BBE\u8BA1", life: "\u751F\u6D3B", think: "\u601D\u8003", other: "\u5176\u4ED6" };
      const cnt = {};
      posts.forEach((p) => {
        cnt[p.cat] = (cnt[p.cat] || 0) + 1;
      });
      const tot = posts.length || 1;
      let acc = 0;
      const slices = Object.entries(cnt).map(([k, v]) => {
        const pc = v / tot * 100;
        const s = `<stop offset="${acc}%" stop-color="${CC[k] || "#aaa"}"/><stop offset="${acc + pc}%" stop-color="${CC[k] || "#aaa"}"/>`;
        acc += pc;
        return s;
      });
      $2("cat-pie").innerHTML = `<div class="pie-wrap"><svg width="80" height="80" viewBox="0 0 32 32"><defs><linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="100%">${slices.join("")}</linearGradient></defs><circle r="14" cx="16" cy="16" fill="none" stroke="url(#pg)" stroke-width="4" transform="rotate(-90 16 16)"/></svg><div class="pie-legend">${Object.entries(cnt).map(([k, v]) => `<div><span class="pie-dot" style="background:${CC[k] || "#aaa"}"></span>${CN[k] || k}(${v})</div>`).join("")}</div></div>`;
      $2("act-list").innerHTML = posts.slice(0, 5).map((p) => `<div class="act-item"><div class="act-dot"></div>\u53D1\u5E03\u4E86\u300A${p.title}\u300B \xB7 ${p.date}</div>`).join("") || '<div style="color:var(--muted);font-size:13px;padding:10px 0">\u6682\u65E0\u52A8\u6001</div>';
    };
    const loadArticles = () => {
      const posts = Posts.all();
      $2("art-count").textContent = `\u5171 ${posts.length} \u7BC7`;
      $2("art-form").style.display = "none";
      editId = null;
      $2("art-body").innerHTML = posts.map((p) => `<div class="trow"><span class="ttl">${p.title}</span><span class="tcat">${p.cat}</span><span class="tdt">${p.date || ""}</span><span class="tact"><button class="tbtn" onclick="Admin.editArt('${p.id}')">\u7F16\u8F91</button><button class="tbtn" style="color:var(--orange)" onclick="Admin.delArt('${p.id}')">\u5220\u9664</button></span></div>`).join("") || `<div style="padding:16px;color:var(--muted);font-size:13px">\u6682\u65E0\u6587\u7AE0</div>`;
    };
    const startNew2 = () => {
      editId = null;
      $2("form-mode-label").textContent = "\u65B0\u5EFA\u6587\u7AE0";
      ["f-title", "f-excerpt", "f-tags", "f-content"].forEach((id) => {
        const e = $2(id);
        if (e) e.value = "";
      });
      $2("f-cat").value = "tech";
      $2("f-date").value = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      $2("f-format").value = "markdown";
      $2("f-cover").value = "cv1";
      $2("f-glyph").value = "\u2726";
      $2("f-featured").checked = false;
      $2("art-form").style.display = "block";
      $2("admin-main").scrollTop = 0;
      setEditorMode2("split");
      refreshArticlePreview2(true);
    };
    const editArt = (id) => {
      const p = Posts.byId(id);
      if (!p) return;
      editId = id;
      $2("form-mode-label").textContent = "\u7F16\u8F91\u6587\u7AE0";
      $2("f-title").value = p.title || "";
      $2("f-cat").value = p.cat || "tech";
      $2("f-date").value = p.date || "";
      $2("f-excerpt").value = p.excerpt || "";
      $2("f-tags").value = (p.tags || []).join(",");
      $2("f-content").value = p.content || "";
      $2("f-format").value = p.format || "markdown";
      $2("f-cover").value = p.cover?.style || "cv1";
      $2("f-glyph").value = p.cover?.glyph || "\u2726";
      $2("f-featured").checked = !!p.featured;
      $2("art-form").style.display = "block";
      $2("admin-main").scrollTop = 0;
      setEditorMode2("split");
      refreshArticlePreview2(true);
    };
    const delArt = (id) => {
      if (!confirm("\u786E\u8BA4\u5220\u9664\uFF1F")) return;
      Posts.remove(id);
      loadArticles();
      Render.renderPosts(Posts.all());
      toast("\u{1F5D1} \u6587\u7AE0\u5DF2\u5220\u9664");
    };
    const saveArticle2 = () => {
      const title = $2("f-title").value.trim();
      if (!title) {
        toast("\u26A0\uFE0F \u8BF7\u586B\u5199\u6807\u9898");
        return;
      }
      const p = {
        id: editId || Posts.slugify(title),
        title,
        cat: $2("f-cat").value,
        date: $2("f-date").value,
        excerpt: $2("f-excerpt").value.trim(),
        tags: $2("f-tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        content: $2("f-content").value,
        format: $2("f-format").value,
        cover: { style: $2("f-cover").value, glyph: $2("f-glyph").value || "\u2726" },
        featured: $2("f-featured").checked
      };
      if (editId) Posts.update(p);
      else Posts.add(p);
      loadArticles();
      Render.renderPosts(Posts.all());
      toast(editId ? "\u2705 \u6587\u7AE0\u5DF2\u66F4\u65B0" : "\u2705 \u6587\u7AE0\u5DF2\u53D1\u5E03");
      editId = null;
      $2("art-form").style.display = "none";
    };
    const cancelForm2 = () => {
      $2("art-form").style.display = "none";
      editId = null;
    };
    const loadHero = () => {
      const h = Config.get("hero") || {};
      const sv = (id, v) => {
        const e = $2(id);
        if (e) e.value = v || "";
      };
      sv("h-line1", h.line1);
      sv("h-line2", h.line2);
      sv("h-sub", h.subtitle);
      sv("h-badge", h.badge);
      sv("h-btn1", h.btn1);
      sv("h-btn2", h.btn2);
      sv("h-bg", h.bgImage);
      const op = $2("h-opacity");
      if (op) {
        op.value = h.bgOpacity || 0.5;
        $2("h-opa-val").textContent = h.bgOpacity || 0.5;
      }
      const sc = $2("h-show-code");
      if (sc) sc.checked = h.showCode !== false;
      previewBg2();
    };
    const previewBg2 = () => {
      const url = $2("h-bg")?.value, pv = $2("bg-preview");
      if (!pv) return;
      if (url) {
        pv.style.backgroundImage = `url('${url}')`;
        pv.textContent = "";
      } else {
        pv.style.backgroundImage = "";
        pv.textContent = "\u6682\u65E0\u80CC\u666F\u56FE";
      }
    };
    const saveHero2 = async () => {
      const h = { line1: $2("h-line1").value.trim() || "Ryoko's", line2: $2("h-line2").value.trim() || "Personal Blog", subtitle: $2("h-sub").value.trim(), badge: $2("h-badge").value.trim(), btn1: $2("h-btn1").value.trim() || "\u5F00\u59CB\u9605\u8BFB", btn2: $2("h-btn2").value.trim() || "\u4E86\u89E3\u6211", bgImage: $2("h-bg").value.trim(), bgOpacity: +$2("h-opacity").value, showCode: $2("h-show-code").checked };
      const sync = await Config.saveSection("hero", h);
      Render.applyConfig(Config.all());
      toast(syncToastMessage("\u2705 \u4E3B\u9875\u8BBE\u7F6E\u5DF2\u4FDD\u5B58", sync));
    };
    const loadFxForm = () => {
      const fx = Config.get("effects") || {};
      $2("fx-grid").innerHTML = FX_DEFS.map((f) => `<div class="fx-card"><div class="fx-head"><div><div class="fx-name">${f.icon} ${f.name}</div><div class="fx-desc">${f.desc}</div></div><label class="tgl-label" style="flex-shrink:0"><input type="checkbox" class="tgl-cb" id="fx-${f.key}" ${fx[f.key] ? "checked" : ""} onchange="Admin.liveFx('${f.key}',this.checked)"></label></div><div class="fx-rl">\u5F3A\u5EA6</div><input type="range" class="fx-r" id="fx-int-${f.key}" min="1" max="10" value="${fx[f.ik] || 5}" oninput="Admin.liveFxInt('${f.ik}',+this.value)">${renderFxParams(f, fx)}</div>`).join("");
    };
    const liveFx = async (k, on) => {
      await Config.save("effects." + k, on);
      FX.toggle(k, on, +($2("fx-int-" + k)?.value || 5));
    };
    const liveFxInt = async (ik, v) => {
      await Config.save("effects." + ik, v);
      FX.applyAll(Config.get("effects") || {});
    };
    const liveFxParam = async (key, v, step = "1") => {
      const num = Number(v);
      const value = String(step).includes(".") ? num : num;
      const valEl = $2("fx-val-" + key);
      if (valEl) valEl.textContent = fxParamLabel(value, step);
      await Config.save("effects." + key, value);
      FX.applyAll(Config.get("effects") || {});
    };
    const saveEffects2 = async () => {
      const fx = { ...Config.get("effects") || {} };
      FX_DEFS.forEach((f) => {
        fx[f.key] = !!$2("fx-" + f.key)?.checked;
        fx[f.ik] = +($2("fx-int-" + f.key)?.value || 5);
        (f.params || []).forEach((param) => {
          fx[param.key] = String(param.step || 1).includes(".") ? Number($2("fx-param-" + param.key)?.value || 0) : +($2("fx-param-" + param.key)?.value || 0);
        });
      });
      const sync = await Config.saveSection("effects", fx);
      FX.applyAll(fx);
      toast(syncToastMessage("\u2705 \u7279\u6548\u5DF2\u4FDD\u5B58 \u2014 \u5173\u95ED\u540E\u53F0\u53EF\u5728\u535A\u5BA2\u770B\u5230\u6548\u679C", sync));
    };
    const CI = { Email: "\u2709\uFE0F", GitHub: "\u{1F419}", Twitter: "\u{1F426}", Instagram: "\u{1F4F7}", Weibo: "\u{1F310}", WeChat: "\u{1F4AC}", LinkedIn: "\u{1F4BC}", YouTube: "\u25B6\uFE0F", Bilibili: "\u{1F4FA}", \u5176\u4ED6: "\u{1F517}" };
    let contacts = [];
    const loadContact = () => {
      contacts = JSON.parse(JSON.stringify(Config.get("social") || []));
      const a = Config.get("about") || {};
      const ap1 = $2("about-p1");
      if (ap1) ap1.value = a.p1 || "";
      const ap2 = $2("about-p2");
      if (ap2) ap2.value = a.p2 || "";
      renderCE();
    };
    const renderCE = () => {
      $2("contact-list").innerHTML = contacts.map((c, i) => `<div class="crow"><select class="fi" style="padding:5px 8px;font-size:12px" onchange="Admin.setC(${i},'type',this.value)">${Object.keys(CI).map((k) => `<option value="${k}" ${c.type === k ? "selected" : ""}>${CI[k]} ${k}</option>`).join("")}</select><input class="fi" style="padding:5px 9px" value="${c.label || ""}" placeholder="\u663E\u793A\u540D\u79F0" oninput="Admin.setC(${i},'label',this.value)"><input class="fi" style="padding:5px 9px" value="${c.url || ""}" placeholder="https://..." oninput="Admin.setC(${i},'url',this.value)"><button class="dbtn" onclick="Admin.rmC(${i})">\xD7</button></div>`).join("") || '<div style="color:var(--muted);font-size:13px;padding:8px">\u6682\u65E0\u8054\u7CFB\u65B9\u5F0F\uFF0C\u70B9\u51FB\u300C\u65B0\u589E\u300D</div>';
    };
    const setC = (i, k, v) => {
      if (contacts[i]) contacts[i][k] = v;
    };
    const rmC = (i) => {
      contacts.splice(i, 1);
      renderCE();
    };
    const addContact2 = () => {
      contacts.push({ type: "\u5176\u4ED6", label: "\u65B0\u94FE\u63A5", url: "https://", icon: "\u{1F517}" });
      renderCE();
    };
    const saveContact2 = async () => {
      contacts.forEach((c) => {
        c.icon = CI[c.type] || "\u{1F517}";
      });
      const syncSocial = await Config.saveSection("social", contacts);
      const p1val = $2("about-p1")?.value || "", p2val = $2("about-p2")?.value || "";
      const syncAbout = await Config.saveSection("about", { p1: p1val, p2: p2val });
      const bp1 = document.getElementById("blog-about-p1"), bp2 = document.getElementById("blog-about-p2");
      if (bp1) bp1.textContent = p1val;
      if (bp2) bp2.textContent = p2val;
      Render.applyConfig(Config.all());
      Render.renderPosts(Posts.all());
      toast(syncToastMessage("\u2705 \u8054\u7CFB\u65B9\u5F0F\u5DF2\u4FDD\u5B58", syncAbout?.remote ? syncAbout : syncSocial));
    };
    let skills = [];
    const loadProfile = () => {
      const s = Config.get("site") || {}, f = Config.get("footer") || {};
      const sv = (id, v) => {
        const e = $2(id);
        if (e) e.value = v || "";
      };
      sv("p-av", s.avatar);
      sv("p-name", s.author);
      sv("p-bio", s.bio);
      sv("p-blog-name", s.title);
      sv("p-blog-sub", s.description);
      sv("p-site-url", s.url);
      sv("p-footer-copy", f.copy);
      sv("p-footer-sub", f.sub);
      const ap = $2("admin-av-preview");
      if (ap) ap.textContent = s.avatar || "R";
      skills = JSON.parse(JSON.stringify(Config.get("skills") || []));
      renderSE();
    };
    const renderSE = () => {
      $2("skills-editor").innerHTML = skills.map((s, i) => `<div class="sked-row"><input class="fi" style="padding:5px 9px" value="${s.label}" placeholder="\u6280\u80FD\u540D\u79F0" oninput="Admin.setSk(${i},'label',this.value)"><input type="number" class="fi" style="padding:5px 9px" min="0" max="100" value="${s.pct}" oninput="Admin.setSk(${i},'pct',+this.value)"><button class="dbtn" onclick="Admin.rmSk(${i})">\xD7</button></div>`).join("");
    };
    const setSk = (i, k, v) => {
      if (skills[i]) skills[i][k] = v;
    };
    const rmSk = (i) => {
      skills.splice(i, 1);
      renderSE();
    };
    const addSkill2 = () => {
      skills.push({ label: "\u65B0\u6280\u80FD", pct: 80 });
      renderSE();
    };
    const saveSkills2 = async () => {
      const sync = await Config.saveSection("skills", skills);
      Render.renderSkills(skills);
      toast(syncToastMessage("\u2705 \u6280\u80FD\u6761\u5DF2\u4FDD\u5B58", sync));
    };
    const saveProfile2 = async () => {
      const syncSite = await Config.saveSection("site", { ...Config.get("site"), avatar: $2("p-av").value.trim() || "R", author: $2("p-name").value.trim(), bio: $2("p-bio").value.trim(), title: $2("p-blog-name").value.trim() || "Ryoko", description: $2("p-blog-sub").value.trim(), url: $2("p-site-url").value.trim() });
      const syncFooter = await Config.saveSection("footer", { copy: $2("p-footer-copy").value.trim(), sub: $2("p-footer-sub").value.trim() });
      SEO.update(Config.all());
      Render.applyConfig(Config.all());
      toast(syncToastMessage("\u2705 \u535A\u4E3B\u4FE1\u606F\u5DF2\u4FDD\u5B58", syncFooter?.remote ? syncFooter : syncSite));
    };
    let pFont = null;
    const loadTheme = () => {
      const t = Config.get("theme") || {};
      $2("t-c1").value = t.blue || "#4f9cf9";
      $2("t-c2").value = t.cyan || "#22d3ee";
      $2("preset-swatches").innerHTML = Theme.PRESETS.map((p) => `<div class="swatch ${t.preset === p.label ? "active" : ""}" style="background:linear-gradient(135deg,${p.blue},${p.cyan})" title="${p.name}" onclick="Admin.applyPreset('${p.label}','${p.blue}','${p.cyan}',this)"></div>`).join("");
      $2("font-opts").innerHTML = Theme.FONTS.map((f) => `<div class="font-opt ${t.font === f.id ? "sel" : ""}" onclick="Admin.pickFont('${f.id}',this)"><div class="for"></div><span class="fon">${f.name}</span><span class="fop">${f.preview}</span></div>`).join("");
    };
    const applyPreset = (label, blue, cyan, el) => {
      document.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
      el.classList.add("active");
      $2("t-c1").value = blue;
      $2("t-c2").value = cyan;
      previewColor("blue", blue);
      previewColor("cyan", cyan);
      Config.save("theme.preset", label);
    };
    const pickFont = (id, el) => {
      pFont = id;
      document.querySelectorAll(".font-opt").forEach((f) => f.classList.remove("sel"));
      el.classList.add("sel");
    };
    const previewColor = (k, v) => document.documentElement.style.setProperty("--" + k, v);
    const saveTheme2 = async () => {
      const t = { ...Config.get("theme"), blue: $2("t-c1").value, cyan: $2("t-c2").value };
      const sync = await Config.saveSection("theme", t);
      Theme.apply(t);
      Render.applyConfig(Config.all());
      toast(syncToastMessage("\u2705 \u914D\u8272\u5DF2\u4FDD\u5B58", sync));
    };
    const saveFont2 = async () => {
      if (!pFont) {
        toast("\u26A0\uFE0F \u8BF7\u5148\u9009\u62E9\u5B57\u4F53");
        return;
      }
      const t = { ...Config.get("theme"), font: pFont };
      const sync = await Config.saveSection("theme", t);
      Theme.apply(t);
      toast(syncToastMessage("\u2705 \u5B57\u4F53\u5DF2\u5E94\u7528", sync));
    };
    const loadAnnounce = () => {
      if (!FB.isReady()) {
        $2("announce-panel-content").innerHTML = '<div style="color:var(--muted);font-size:13px">\u9700\u8981\u914D\u7F6E Firebase \u624D\u80FD\u4F7F\u7528\u516C\u544A\u529F\u80FD</div>';
        return;
      }
      const list = Announce.all();
      $2("announce-panel-content").innerHTML = list.map((a) => `
      <div class="acard" style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start">
          <div>
            <strong style="color:var(--text)">${a.title}</strong>
            ${a.pinned ? '<span style="color:var(--orange);font-size:11px;margin-left:8px">\u{1F4CC} \u7F6E\u9876</span>' : ""}
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${a.content || ""}</div>
          </div>
          <button class="dbtn" onclick="Admin.delAnnounce('${a.id}')">\xD7</button>
        </div>
      </div>`).join("") || '<div style="color:var(--muted);font-size:13px">\u6682\u65E0\u516C\u544A</div>';
    };
    const saveAnnounce = async () => {
      const title = $2("ann-title")?.value.trim(), content = $2("ann-content")?.value.trim();
      if (!title) {
        toast("\u26A0\uFE0F \u8BF7\u586B\u5199\u516C\u544A\u6807\u9898");
        return;
      }
      const pinned = $2("ann-pinned")?.checked || false;
      try {
        await Announce.create(title, content, pinned);
        ["ann-title", "ann-content"].forEach((id) => {
          const e = $2(id);
          if (e) e.value = "";
        });
        const ap = $2("ann-pinned");
        if (ap) ap.checked = false;
        loadAnnounce();
        toast("\u2705 \u516C\u544A\u5DF2\u53D1\u5E03");
      } catch (e) {
        toast("\u26A0\uFE0F " + e.message);
      }
    };
    const delAnnounce = async (id) => {
      if (!confirm("\u786E\u8BA4\u5220\u9664\u516C\u544A\uFF1F")) return;
      try {
        await Announce.remove(id);
        loadAnnounce();
        toast("\u{1F5D1} \u516C\u544A\u5DF2\u5220\u9664");
      } catch (e) {
        toast("\u26A0\uFE0F " + e.message);
      }
    };
    const loadTools = () => {
      const sd = $2("stats-detail");
      if (sd) {
        const v = Stats.getVisits(), o = Stats.getOpens(), posts = Posts.all();
        const tp = Object.entries(o).sort((a, b) => b[1] - a[1])[0];
        sd.innerHTML = `<div>\u{1F4C5} \u4ECA\u65E5\uFF1A${v[(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)] || 0} \u6B21</div><div>\u{1F4CA} \u603B\u8BA1\uFF1A${Stats.total()} \u6B21</div><div>\u{1F525} \u6700\u70ED\uFF1A${tp ? (posts.find((p) => p.id === tp[0])?.title || tp[0]) + "(" + tp[1] + "\u6B21)" : "\u2014"}</div><div>\u{1F4DD} \u6587\u7AE0\uFF1A${posts.length} \u7BC7</div>`;
      }
    };
    const clearStats2 = () => {
      if (!confirm("\u786E\u8BA4\u6E05\u9664\uFF1F")) return;
      Stats.clear();
      loadTools();
      toast("\u{1F5D1} \u7EDF\u8BA1\u5DF2\u6E05\u9664");
    };
    const loadAdminAccess = () => {
      updateAdminRoutePreview();
    };
    return {
      doLogin: doLogin2,
      open,
      openIfRouteMatches,
      exit,
      switchPanel,
      startNew: startNew2,
      editArt,
      delArt,
      saveArticle: saveArticle2,
      cancelForm: cancelForm2,
      setEditorMode: setEditorMode2,
      refreshArticlePreview: refreshArticlePreview2,
      insertMarkdown,
      loadHero,
      previewBg: previewBg2,
      saveHero: saveHero2,
      loadFxForm,
      liveFx,
      liveFxInt,
      liveFxParam,
      saveEffects: saveEffects2,
      addContact: addContact2,
      setC,
      rmC,
      saveContact: saveContact2,
      loadProfile,
      setSk,
      rmSk,
      addSkill: addSkill2,
      saveSkills: saveSkills2,
      saveProfile: saveProfile2,
      loadTheme,
      applyPreset,
      pickFont,
      previewColor,
      saveTheme: saveTheme2,
      saveFont: saveFont2,
      loadTools,
      clearStats: clearStats2,
      loadAnnounce,
      saveAnnounce,
      delAnnounce,
      saveAdminAccess,
      goToAdminRoute
    };
  })();
  function toast(msg, ms = 2800) {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), ms);
  }
  function syncToastMessage(base, sync) {
    if (!sync) return base;
    if (sync.remote) return base;
    if (sync.reason === "firebase-not-ready") return `${base}\uFF08\u4EC5\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF1AFirebase \u672A\u521D\u59CB\u5316\uFF09`;
    if (sync.reason === "not-logged-in") return `${base}\uFF08\u4EC5\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF1A\u5C1A\u672A\u767B\u5F55\uFF09`;
    if (sync.reason === "not-admin") return `${base}\uFF08\u4EC5\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF1A\u5F53\u524D\u8D26\u53F7\u4E0D\u662F\u7BA1\u7406\u5458\uFF09`;
    if (String(sync.reason).includes("permission")) return `${base}\uFF08\u4EC5\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF1AFirestore \u89C4\u5219\u672A\u653E\u884C site_config\uFF09`;
    return `${base}\uFF08\u4EC5\u5F53\u524D\u6D4F\u89C8\u5668\u4FDD\u5B58\uFF1A\u4E91\u7AEF\u540C\u6B65\u5931\u8D25\uFF09`;
  }
  function $(id) {
    return document.getElementById(id);
  }
  var curCat = "all";
  var curPage = 1;
  function exitAdmin() {
    Admin.exit();
  }
  function doLogin() {
    Admin.doLogin();
  }
  function toggleTheme() {
    Theme.toggle();
  }
  function doLogout() {
    Auth.logout().then(() => toast("\u5DF2\u9000\u51FA\u767B\u5F55"));
  }
  function closeModal() {
    Render.closeModal();
  }
  function closeModalBg(e) {
    if (e.target.id === "post-modal") Render.closeModal();
  }
  function scrollTo2(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }
  function filterByCat(cat) {
    curCat = cat;
    curPage = 1;
    document.querySelectorAll(".fbtn").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
    Render.renderPosts(Posts.all(), cat, 1);
  }
  function changePage(p, cat) {
    curPage = p;
    curCat = cat;
    Render.renderPosts(Posts.all(), cat, p);
    scrollTo2("posts-section");
  }
  var _st = null;
  function doSearch(q) {
    clearTimeout(_st);
    _st = setTimeout(() => Render.renderSearch(Posts.search(q), q), 200);
  }
  function clearSearch() {
    const si = $("search-input"), sr = $("search-results");
    if (si) si.value = "";
    if (sr) {
      sr.style.display = "none";
      sr.innerHTML = "";
    }
  }
  function searchByTag(t) {
    const si = $("search-input");
    if (si) {
      si.value = t;
      doSearch(t);
      si.focus();
    }
  }
  function doSubscribe() {
    const e = $("email-input")?.value;
    if (!e || !e.includes("@")) {
      toast("\u26A0\uFE0F \u8BF7\u8F93\u5165\u6709\u6548\u90AE\u7BB1");
      return;
    }
    toast("\u2705 \u8BA2\u9605\u6210\u529F\uFF01\u611F\u8C22\u5173\u6CE8 \u2726");
    $("email-input").value = "";
  }
  function logoClick() {
    Admin.goToAdminRoute();
  }
  function saveHero() {
    Admin.saveHero();
  }
  function saveEffects() {
    Admin.saveEffects();
  }
  function saveContact() {
    Admin.saveContact();
  }
  function saveProfile() {
    Admin.saveProfile();
  }
  function saveSkills() {
    Admin.saveSkills();
  }
  function saveTheme() {
    Admin.saveTheme();
  }
  function saveFont() {
    Admin.saveFont();
  }
  function clearStats() {
    Admin.clearStats();
  }
  function startNew() {
    Admin.startNew();
  }
  function cancelForm() {
    Admin.cancelForm();
  }
  function saveArticle() {
    Admin.saveArticle();
  }
  function setEditorMode(mode) {
    Admin.setEditorMode(mode);
  }
  function refreshArticlePreview() {
    Admin.refreshArticlePreview();
  }
  function mdInsert(kind) {
    Admin.insertMarkdown(kind);
  }
  function addContact() {
    Admin.addContact();
  }
  function addSkill() {
    Admin.addSkill();
  }
  function previewBg() {
    Admin.previewBg();
  }
  function downloadRSS() {
    Tools.downloadRSS();
  }
  function downloadSitemap() {
    Tools.downloadSitemap();
  }
  function downloadConfigJson() {
    Tools.downloadConfigJson();
  }
  function downloadPostsJson() {
    Tools.downloadPostsJson();
  }
  function switchTab(tab) {
    Render.switchTab(tab);
  }
  function openPost(id) {
    const p = Posts.byId(id);
    if (!p) return;
    Stats.recordOpen(id);
    Render.openModal(p);
  }
  window.Admin = Admin;
  Object.assign(window, {
    exitAdmin,
    doLogin,
    toggleTheme,
    doLogout,
    closeModal,
    closeModalBg,
    scrollTo2,
    filterByCat,
    changePage,
    doSearch,
    clearSearch,
    searchByTag,
    doSubscribe,
    logoClick,
    saveHero,
    saveEffects,
    saveContact,
    saveProfile,
    saveSkills,
    saveTheme,
    saveFont,
    clearStats,
    startNew,
    cancelForm,
    saveArticle,
    setEditorMode,
    refreshArticlePreview,
    mdInsert,
    addContact,
    addSkill,
    previewBg,
    downloadRSS,
    downloadSitemap,
    downloadConfigJson,
    downloadPostsJson,
    switchTab,
    openPost
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrap")) clearSearch();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if ($("post-modal")?.classList.contains("open")) Render.closeModal();
      if ($("admin-overlay")?.classList.contains("vis")) Admin.exit();
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".anav").forEach((el) => el.addEventListener("click", () => Admin.switchPanel(el.dataset.panel)));
    document.querySelectorAll(".fbtn").forEach((btn) => btn.addEventListener("click", () => filterByCat(btn.dataset.cat)));
    document.querySelectorAll(".tab-btn").forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
    const format = $("f-format");
    if (format) format.addEventListener("change", () => Admin.refreshArticlePreview(true));
  });
  window.addEventListener("load", () => {
    const grid = $("posts-grid");
    if (grid && (!grid.children.length || grid.querySelector('[style*="\u6682\u65E0"]')) && Posts.all().length > 0) {
      Render.renderPosts(Posts.all(), curCat, curPage);
    }
  });
  (async () => {
    let cfg = await Config.load();
    const posts = await Posts.load();
    Theme.initDark();
    const fbReady = FB.init(cfg.firebase);
    if (fbReady) {
      Auth.init();
      cfg = await Config.hydrateRemote();
    }
    Theme.apply(cfg.theme || {});
    SEO.update(cfg);
    Render.applyConfig(cfg);
    FX.applyAll(cfg.effects || {});
    Render.renderPosts(posts);
    Stats.recordVisit();
    if (window.hljs) hljs.configure({ ignoreUnescapedHTML: true });
    if (fbReady) {
      Announce.listen((list) => {
        Render.renderAnnouncements(list);
      });
    } else {
      const fbNotice = $("firebase-notice");
      if (fbNotice) fbNotice.style.display = "block";
    }
    Admin.openIfRouteMatches();
    Render.initCardTilt();
    console.log("%c\u2726 Ryoko Blog TS runtime loaded", "color:#4f9cf9;font-weight:bold;font-size:14px");
  })();

  // src/main.ts
  installGlobals();
})();
