import type { EffectPlugin, FxRuntimeContext } from '../runtime';

export const snowPlugin: EffectPlugin = {
  id: 'snow',
  start(intensity: number, context: FxRuntimeContext) {
    const canvas = context.makeCanvas('cv-snow');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const makeFlake = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      r: Math.random() * 2.5 + 0.8,
      vy: Math.random() * 0.7 + 0.3,
      vx: (Math.random() - 0.5) * 0.5,
      a: Math.random() * 0.5 + 0.3,
      sw: Math.random() * Math.PI * 2,
      ss: Math.random() * 0.015 + 0.005
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
      context.setLoop('snow', requestAnimationFrame(frame));
    };

    frame();
  },
  stop(context: FxRuntimeContext) {
    context.cancelLoop('snow');
    context.hideCanvas('snow');
  }
};
