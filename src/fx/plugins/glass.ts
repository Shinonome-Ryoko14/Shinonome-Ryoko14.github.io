import type { EffectPlugin, FxRuntimeContext } from '../runtime';

export const glassPlugin: EffectPlugin = {
  id: 'glass',
  start(intensity: number, _context: FxRuntimeContext) {
    document.body.classList.add('fx-glass-on');
    document.documentElement.style.setProperty('--glass-intensity', String(Math.max(1, intensity || 5)));
  },
  stop(_context: FxRuntimeContext) {
    document.body.classList.remove('fx-glass-on');
  }
};
