export type EffectKey = 'spotlight' | 'aurora' | 'particles' | 'stars' | 'trail' | 'snow' | 'glass' | 'reveal';

export type EffectIntensityKey =
  | 'spotlightInt'
  | 'auroraInt'
  | 'particlesInt'
  | 'starsInt'
  | 'trailInt'
  | 'snowInt'
  | 'glassInt'
  | 'revealInt';

export interface EffectsConfig {
  spotlight: boolean;
  spotlightInt: number;
  aurora: boolean;
  auroraInt: number;
  particles: boolean;
  particlesInt: number;
  stars: boolean;
  starsInt: number;
  trail: boolean;
  trailInt: number;
  snow: boolean;
  snowInt: number;
  glass: boolean;
  glassInt: number;
  glassBlur: number;
  glassOpacity: number;
  reveal: boolean;
  revealInt: number;
  revealDistance: number;
  revealStagger: number;
}

export interface SiteConfig {
  site: Record<string, unknown>;
  hero: Record<string, unknown>;
  theme: Record<string, unknown>;
  social: Array<Record<string, unknown>>;
  effects: EffectsConfig;
  about: Record<string, unknown>;
  skills: Array<Record<string, unknown>>;
  footer: Record<string, unknown>;
  auth: Record<string, unknown>;
  firebase: Record<string, unknown>;
  comments?: Record<string, unknown>;
}

export interface FxControlOption {
  label: string;
  value: string | number;
}

export interface FxControlDef {
  key: string;
  label: string;
  type: 'range' | 'color' | 'select' | 'toggle';
  min?: number;
  max?: number;
  step?: number;
  options?: FxControlOption[];
}

export interface FxDefinition {
  key: EffectKey;
  icon: string;
  name: string;
  desc: string;
  ik: EffectIntensityKey;
  params?: FxControlDef[];
}

export interface FxPublicApi {
  applyAll(fx: Partial<EffectsConfig>): void;
  toggle(name: EffectKey, on: boolean, intensity?: number): void;
}

declare global {
  interface Window {
    __RYOKO_FX__?: FxPublicApi;
    __RYOKO_FX_DEFS__?: FxDefinition[];
  }
}
