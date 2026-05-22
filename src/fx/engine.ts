import type { EffectKey, EffectsConfig, FxPublicApi } from '../core/types';
import type { EffectPlugin, FxRuntimeContext, MouseState } from './runtime';
import { spotlightPlugin } from './plugins/spotlight';
import { auroraPlugin } from './plugins/aurora';
import { particlesPlugin } from './plugins/particles';
import { starsPlugin } from './plugins/stars';
import { trailPlugin } from './plugins/trail';
import { snowPlugin } from './plugins/snow';
import { glassPlugin } from './plugins/glass';
import { revealPlugin } from './plugins/reveal';

const plugins: Record<EffectKey, EffectPlugin> = {
  spotlight: spotlightPlugin,
  aurora: auroraPlugin,
  particles: particlesPlugin,
  stars: starsPlugin,
  trail: trailPlugin,
  snow: snowPlugin,
  glass: glassPlugin,
  reveal: revealPlugin
};


function createMouseState(): MouseState {
  const mouse: MouseState = { x: -9999, y: -9999, still: false };
  let stillTimer: number | undefined;
  document.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.still = false;
    if (stillTimer !== undefined) {
      window.clearTimeout(stillTimer);
    }
    stillTimer = window.setTimeout(() => {
      mouse.still = true;
    }, 800);
  });
  return mouse;
}

function createContext(): FxRuntimeContext {
  const loops: Partial<Record<string, number>> = {};
  const cleanups = new Map<string, () => void>();
  const mouse = createMouseState();

  return {
    loops,
    mouse,
    setLoop(name, id) {
      loops[name] = id;
    },
    cancelLoop(name) {
      const id = loops[name];
      if (id !== undefined) {
        cancelAnimationFrame(id);
        delete loops[name];
      }
    },
    makeCanvas(id) {
      const canvas = document.getElementById(id) as HTMLCanvasElement | null;
      if (!canvas) {
        throw new Error(`Missing canvas: ${id}`);
      }
      canvas.style.display = 'block';
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      return canvas;
    },
    hideCanvas(name) {
      const canvas = document.getElementById(`cv-${name}`) as HTMLCanvasElement | null;
      if (canvas) {
        canvas.style.display = 'none';
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

const effectIntensityKey: Record<EffectKey, keyof EffectsConfig> = {
  spotlight: 'spotlightInt',
  aurora: 'auroraInt',
  particles: 'particlesInt',
  stars: 'starsInt',
  trail: 'trailInt',
  snow: 'snowInt',
  glass: 'glassInt',
  reveal: 'revealInt'
};

export function createFxApi(): FxPublicApi {
  const context = createContext();

  const stopCanvasEffects = () => {
    (['particles', 'stars', 'trail', 'snow'] as EffectKey[]).forEach((name) => {
      plugins[name].stop(context);
    });
  };

  const applyDomEffects = (fx: Partial<EffectsConfig>) => {
    document.documentElement.style.setProperty('--glass-blur', `${Number(fx.glassBlur ?? 18)}px`);
    document.documentElement.style.setProperty('--glass-opacity', String(Number(fx.glassOpacity ?? 0.18)));
    document.documentElement.style.setProperty('--reveal-distance', String(Number(fx.revealDistance ?? 18)));
    document.documentElement.style.setProperty('--reveal-stagger', String(Number(fx.revealStagger ?? 70)));

    if (fx.glass) plugins.glass.start(Number(fx.glassInt ?? 5), context);
    else plugins.glass.stop(context);

    if (fx.reveal) plugins.reveal.start(Number(fx.revealInt ?? 5), context);
    else plugins.reveal.stop(context);
  };

  return {
    applyAll(fx: Partial<EffectsConfig>) {
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
    toggle(name: EffectKey, on: boolean, intensity?: number) {
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

export function getDefaultIntensity(name: EffectKey, fx: Partial<EffectsConfig>): number {
  const key = effectIntensityKey[name];
  const value = fx[key];
  return typeof value === 'number' ? value : 5;
}
