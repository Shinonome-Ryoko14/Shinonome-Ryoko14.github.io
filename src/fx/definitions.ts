import type { FxDefinition } from '../core/types';

export const EFFECT_DEFS: FxDefinition[] = [
  { key: 'spotlight', icon: '🔦', name: '聚光灯', desc: '鼠标跟随光晕+点阵', ik: 'spotlightInt' },
  { key: 'aurora', icon: '🌌', name: '极光背景', desc: 'Hero 流动彩色光球', ik: 'auroraInt' },
  { key: 'particles', icon: '✦', name: '浮动粒子', desc: '全页粒子+鼠标吸附(O001)', ik: 'particlesInt' },
  { key: 'stars', icon: '🌠', name: '星尘背景', desc: '细密闪烁星点', ik: 'starsInt' },
  { key: 'trail', icon: '🌊', name: '鼠标拖尾', desc: '鼠标划过发光轨迹', ik: 'trailInt' },
  { key: 'snow', icon: '❄️', name: '飘落雪花', desc: '轻柔飘落粒子', ik: 'snowInt' },
  {
    key: 'glass',
    icon: '🫧',
    name: '磨砂玻璃',
    desc: '为卡片和侧栏启用玻璃模糊层',
    ik: 'glassInt',
    params: [
      { key: 'glassBlur', label: '模糊强度', type: 'range', min: 4, max: 32, step: 1 },
      { key: 'glassOpacity', label: '透明度', type: 'range', min: 0.08, max: 0.45, step: 0.01 }
    ]
  },
  {
    key: 'reveal',
    icon: '✍️',
    name: '手写显现',
    desc: '标题与卡片以轻量笔触式动效出现',
    ik: 'revealInt',
    params: [
      { key: 'revealDistance', label: '位移距离', type: 'range', min: 4, max: 48, step: 1 },
      { key: 'revealStagger', label: '错峰时长', type: 'range', min: 20, max: 220, step: 10 }
    ]
  }
];

