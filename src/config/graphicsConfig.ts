export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra';
export type ShadowQuality = 'off' | 'low' | 'high' | 'ultra';
export type PostProcessingTier = 'off' | 'low' | 'high';
export type QualityTier = 'low' | 'medium' | 'high';
export type ViewDistanceTier = 'low' | 'medium' | 'high' | 'ultra';

export interface GraphicsSettings {
  preset: QualityPreset;
  shadows: boolean;
  shadowQuality: ShadowQuality;
  postProcessing: PostProcessingTier;
  bloom: boolean;
  atmosphere: 'low' | 'high';
  reflections: 'low' | 'high';
  vegetationDensity: QualityTier;
  viewDistance: ViewDistanceTier;
  particleQuality: QualityTier;
  antiAliasing: boolean;
  vignette: boolean;
  filmGrain: boolean;
  dof: boolean;
  starCount: number;
  asteroidCount: number;
  debugMode: boolean;
  wireframe: boolean;
}

export const GRAPHICS_PRESETS: Record<QualityPreset, GraphicsSettings> = {
  low: {
    preset: 'low',
    shadows: false,
    shadowQuality: 'off',
    postProcessing: 'off',
    bloom: false,
    atmosphere: 'low',
    reflections: 'low',
    vegetationDensity: 'low',
    viewDistance: 'low',
    particleQuality: 'low',
    antiAliasing: false,
    vignette: false,
    filmGrain: false,
    dof: false,
    starCount: 4000,
    asteroidCount: 400,
    debugMode: false,
    wireframe: false
  },
  medium: {
    preset: 'medium',
    shadows: true,
    shadowQuality: 'low',
    postProcessing: 'low',
    bloom: true,
    atmosphere: 'low',
    reflections: 'low',
    vegetationDensity: 'medium',
    viewDistance: 'medium',
    particleQuality: 'medium',
    antiAliasing: true,
    vignette: true,
    filmGrain: false,
    dof: false,
    starCount: 10000,
    asteroidCount: 800,
    debugMode: false,
    wireframe: false
  },
  high: {
    preset: 'high',
    shadows: true,
    shadowQuality: 'high',
    postProcessing: 'high',
    bloom: true,
    atmosphere: 'high',
    reflections: 'high',
    vegetationDensity: 'high',
    viewDistance: 'high',
    particleQuality: 'high',
    antiAliasing: true,
    vignette: true,
    filmGrain: true,
    dof: false,
    starCount: 16000,
    asteroidCount: 1200,
    debugMode: false,
    wireframe: false
  },
  ultra: {
    preset: 'ultra',
    shadows: true,
    shadowQuality: 'ultra',
    postProcessing: 'high',
    bloom: true,
    atmosphere: 'high',
    reflections: 'high',
    vegetationDensity: 'high',
    viewDistance: 'ultra',
    particleQuality: 'high',
    antiAliasing: true,
    vignette: true,
    filmGrain: true,
    dof: true,
    starCount: 24000,
    asteroidCount: 1800,
    debugMode: false,
    wireframe: false
  }
};

/**
 * Return shadow map resolution corresponding to shadow quality.
 */
export function getShadowMapResolution(quality: ShadowQuality): number {
  switch (quality) {
    case 'off':
      return 0;
    case 'low':
      return 1024;
    case 'high':
      return 2048;
    case 'ultra':
      return 4096;
  }
}

/**
 * Return far clipping plane for view distance tier.
 */
export function getViewDistanceFar(distance: ViewDistanceTier): number {
  switch (distance) {
    case 'low':
      return 800;
    case 'medium':
      return 1400;
    case 'high':
      return 2200;
    case 'ultra':
      return 3500;
  }
}

import { isMobileDevice } from '../utils/mobileOptimization';

/**
 * Return default graphics settings dynamically tuned to the platform.
 * Mobile (iOS / Android) automatically uses optimized settings (no multi-pass bloom,
 * no shadow map calculation, clamped star count) to ensure locked 60 FPS without thermal throttling.
 */
export function getDefaultGraphicsSettings(): GraphicsSettings {
  if (isMobileDevice()) {
    return GRAPHICS_PRESETS.low;
  }
  return GRAPHICS_PRESETS.high;
}


