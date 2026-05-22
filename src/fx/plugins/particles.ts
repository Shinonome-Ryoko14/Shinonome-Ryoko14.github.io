import type { EffectPlugin, FxRuntimeContext } from '../runtime';

const COLORS = ['79,156,249', '34,211,238', '249,115,22', '244,114,182'];

export const particlesPlugin: EffectPlugin = {
  id: 'particles',
  start(intensity: number, context: FxRuntimeContext) {
    const canvas = context.makeCanvas('cv-particles');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const makeParticle = () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      a: Math.random(),
      da: (Math.random() * 0.006 + 0.002) * (Math.random() < 0.5 ? 1 : -1),
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
            point.vx += (dx / dist) * force * 0.12;
            point.vy += (dy / dist) * force * 0.12;
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
      context.setLoop('particles', requestAnimationFrame(frame));
    };

    frame();
  },
  stop(context: FxRuntimeContext) {
    context.cancelLoop('particles');
    context.hideCanvas('particles');
  }
};
