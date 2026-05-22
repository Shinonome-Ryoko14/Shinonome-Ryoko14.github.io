import type { EffectPlugin, FxRuntimeContext } from '../runtime';

const SELECTOR = [
  '.hero-badge',
  '.hero-title',
  '.hero-sub',
  '.post-card',
  '.widget',
  '.section-title',
  '.about-text p',
  '.skill-item'
].join(',');

function readNumber(name: string, fallback: number): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const revealPlugin: EffectPlugin = {
  id: 'reveal',
  start(intensity: number, context: FxRuntimeContext) {
    const distance = readNumber('--reveal-distance', 18);
    const stagger = readNumber('--reveal-stagger', 70);
    const duration = Math.max(220, Math.round((intensity || 5) * 95));
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
    const timers: number[] = [];

    document.body.classList.add('fx-reveal-on');

    nodes.forEach((node, index) => {
      node.classList.add('fx-reveal-item');
      node.style.opacity = '0';
      node.style.transform = `translateY(${distance}px)`;
      node.style.transition = `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(.16,1,.3,1)`;
      timers.push(window.setTimeout(() => {
        node.style.opacity = '1';
        node.style.transform = 'translateY(0)';
      }, index * stagger));
    });

    context.onCleanup('reveal', () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    });
  },
  stop(context: FxRuntimeContext) {
    context.runCleanup('reveal');
    document.body.classList.remove('fx-reveal-on');
    document.querySelectorAll<HTMLElement>(SELECTOR).forEach((node) => {
      node.classList.remove('fx-reveal-item');
      node.style.opacity = '';
      node.style.transform = '';
      node.style.transition = '';
    });
  }
};
