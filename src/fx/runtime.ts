import type { EffectKey } from '../core/types';

export interface MouseState {
  x: number;
  y: number;
  still: boolean;
}

export interface FxRuntimeContext {
  loops: Partial<Record<string, number>>;
  mouse: MouseState;
  setLoop(name: string, id: number): void;
  cancelLoop(name: string): void;
  makeCanvas(id: string): HTMLCanvasElement;
  hideCanvas(name: EffectKey): void;
  onCleanup(key: string, cleanup: () => void): void;
  runCleanup(key: string): void;
}

export interface EffectPlugin {
  id: EffectKey;
  start(intensity: number, context: FxRuntimeContext): void;
  stop(context: FxRuntimeContext): void;
}
