import type { FxRuntimeContext, EffectPlugin } from '../runtime';

export const spotlightPlugin: EffectPlugin = {
  id: 'spotlight',
  start(_intensity: number, context: FxRuntimeContext) {
    const existing = context.loops._sp;
    if (existing) return;

    let cx = -9999;
    let cy = -9999;
    let tx = -9999;
    let ty = -9999;
    const handler = (event: MouseEvent) => {
      tx = event.clientX;
      ty = event.clientY;
    };

    document.addEventListener('mousemove', handler);
    context.onCleanup('spotlight-handler', () => {
      document.removeEventListener('mousemove', handler);
    });

    const frame = () => {
      cx += (tx - cx) * 0.04;
      cy += (ty - cy) * 0.04;
      document.getElementById('spotlight')?.style.setProperty('--sx', cx + 'px');
      document.getElementById('spotlight')?.style.setProperty('--sy', cy + 'px');
      document.getElementById('dot-grid')?.style.setProperty('--sx', cx + 'px');
      document.getElementById('dot-grid')?.style.setProperty('--sy', cy + 'px');
      context.setLoop('_sp', requestAnimationFrame(frame));
    };

    context.setLoop('_sp', requestAnimationFrame(frame));
  },
  stop(context: FxRuntimeContext) {
    context.cancelLoop('_sp');
    context.runCleanup('spotlight-handler');
    ['spotlight', 'dot-grid'].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.style.setProperty('--sx', '-9999px');
        element.style.setProperty('--sy', '-9999px');
      }
    });
  }
};
