import type { FxDefinition } from '../core/types';

export const EFFECT_DEFS: FxDefinition[] = [
  { key: 'spotlight', icon: '🔦', name: '聚光灯', desc: '鼠标跟随光晕+点阵', ik: 'spotlightInt' },
  { key: 'aurora', icon: '🌌', name: '极光背景', desc: 'Hero 流动彩色光球', ik: 'auroraInt' },
  { key: 'particles', icon: '✦', name: '浮动粒子', desc: '全页粒子+鼠标吸附(O001)', ik: 'particlesInt' },
  { key: 'stars', icon: '🌠', name: '星尘背景', desc: '细密闪烁星点', ik: 'starsInt' },
  { key: 'trail', icon: '🌊', name: '鼠标拖尾', desc: '鼠标划过发光轨迹', ik: 'trailInt' },
  { key: 'snow', icon: '❄️', name: '飘落雪花', desc: '轻柔飘落粒子', ik: 'snowInt' }
];
