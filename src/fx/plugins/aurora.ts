import type { EffectPlugin, FxRuntimeContext } from '../runtime';

export const auroraPlugin: EffectPlugin = {
  id: 'aurora',
  start(intensity: number, _context: FxRuntimeContext) {
    const auroraWrap = document.getElementById('aurora-wrap');
    if (auroraWrap) {
      auroraWrap.style.opacity = (((intensity || 5) / 10) * 1.6).toString();
    }
  },
  stop(_context: FxRuntimeContext) {
    const auroraWrap = document.getElementById('aurora-wrap');
    if (auroraWrap) {
      auroraWrap.style.opacity = '0';
    }
  }
};
