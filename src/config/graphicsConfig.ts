export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsSettings {
  preset: QualityPreset;
  shadows: boolean;
  bloom: boolean;
  vignette: boolean;
  filmGrain: boolean;
  dof: boolean;
  starCount: number;
  asteroidCount: number;
  antiAliasing: boolean;
}

export const GRAPHICS_PRESETS: Record<QualityPreset, GraphicsSettings> = {
  low: {
    preset: 'low',
    shadows: false,
    bloom: false,
    vignette: false,
    filmGrain: false,
    dof: false,
    starCount: 4000,
    asteroidCount: 400,
    antiAliasing: false
  },
  medium: {
    preset: 'medium',
    shadows: true,
    bloom: true,
    vignette: true,
    filmGrain: false,
    dof: false,
    starCount: 10000,
    asteroidCount: 800,
    antiAliasing: true
  },
  high: {
    preset: 'high',
    shadows: true,
    bloom: true,
    vignette: true,
    filmGrain: true,
    dof: false,
    starCount: 16000,
    asteroidCount: 1200,
    antiAliasing: true
  },
  ultra: {
    preset: 'ultra',
    shadows: true,
    bloom: true,
    vignette: true,
    filmGrain: true,
    dof: true,
    starCount: 22000,
    asteroidCount: 1800,
    antiAliasing: true
  }
};
