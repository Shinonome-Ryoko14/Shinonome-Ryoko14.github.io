import type { EffectPlugin, FxRuntimeContext } from '../runtime';

export const starsPlugin: EffectPlugin = {
  id: 'stars',
  start(intensity: number, context: FxRuntimeContext) {
    const canvas = context.makeCanvas('cv-stars');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const stars = Array.from({ length: Math.round(intensity * 70) }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 0.9 + 0.2,
      a: Math.random(),
      da: Math.random() * 0.004 + 0.001 * (Math.random() < 0.5 ? 1 : -1)
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
      context.setLoop('stars', requestAnimationFrame(frame));
    };

    frame();
  },
  stop(context: FxRuntimeContext) {
    context.cancelLoop('stars');
    context.hideCanvas('stars');
  }
};
