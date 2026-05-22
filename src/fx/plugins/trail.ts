import type { EffectPlugin, FxRuntimeContext } from '../runtime';

export const trailPlugin: EffectPlugin = {
  id: 'trail',
  start(intensity: number, context: FxRuntimeContext) {
    const canvas = context.makeCanvas('cv-trail');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let points: Array<{ x: number; y: number; a: number }> = [];
    context.runCleanup('trail-handler');

    const handler = (event: MouseEvent) => {
      points.push({ x: event.clientX, y: event.clientY, a: 1 });
    };

    document.addEventListener('mousemove', handler);
    context.onCleanup('trail-handler', () => {
      document.removeEventListener('mousemove', handler);
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
        ctx.lineCap = 'round';
        ctx.shadowBlur = 6;
        ctx.shadowColor = `rgba(34,211,238,${point.a * 0.35})`;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      context.setLoop('trail', requestAnimationFrame(frame));
    };

    frame();
  },
  stop(context: FxRuntimeContext) {
    context.cancelLoop('trail');
    context.runCleanup('trail-handler');
    context.hideCanvas('trail');
  }
};
