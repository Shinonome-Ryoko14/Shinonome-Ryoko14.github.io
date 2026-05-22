import { createFxApi } from '../fx/engine';
import { EFFECT_DEFS } from '../fx/definitions';

export function installGlobals(): void {
  window.__RYOKO_FX__ = createFxApi();
  window.__RYOKO_FX_DEFS__ = EFFECT_DEFS;
}
