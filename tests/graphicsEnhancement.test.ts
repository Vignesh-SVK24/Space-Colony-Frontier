import { describe, it, expect, beforeEach } from 'vitest';
import { useNexusGameStore } from '../src/state/useNexusGameStore';
import { GRAPHICS_PRESETS, getShadowMapResolution, getViewDistanceFar } from '../src/config/graphicsConfig';
import {
  getBrushedMetalNormal,
  getTerrainRegolithNormal,
  getFabricWeaveNormal,
  getAsteroidFacetNormal,
  getMoonCraterNormal,
  getRoughnessNoiseMap,
  generateSpaceCubeEnvironment
} from '../src/utils/pbrTextureGenerator';
import * as THREE from 'three';

describe('Ultra-Realistic Graphics & Settings Pipeline', () => {
  beforeEach(() => {
    useNexusGameStore.setState({
      graphicsSettings: { ...GRAPHICS_PRESETS.high }
    });
  });

  it('defines valid graphics presets with escalating visual fidelity', () => {
    expect(GRAPHICS_PRESETS.low.shadows).toBe(false);
    expect(GRAPHICS_PRESETS.low.bloom).toBe(false);

    expect(GRAPHICS_PRESETS.medium.shadows).toBe(true);
    expect(GRAPHICS_PRESETS.medium.bloom).toBe(true);

    expect(GRAPHICS_PRESETS.high.shadowQuality).toBe('high');
    expect(GRAPHICS_PRESETS.high.starCount).toBeGreaterThan(12000);

    expect(GRAPHICS_PRESETS.ultra.shadowQuality).toBe('ultra');
    expect(GRAPHICS_PRESETS.ultra.starCount).toBe(24000);
    expect(GRAPHICS_PRESETS.ultra.viewDistance).toBe('ultra');
  });

  it('calculates proper shadow map resolutions and view distance planes', () => {
    expect(getShadowMapResolution('off')).toBe(0);
    expect(getShadowMapResolution('low')).toBe(1024);
    expect(getShadowMapResolution('high')).toBe(2048);
    expect(getShadowMapResolution('ultra')).toBe(4096);

    expect(getViewDistanceFar('low')).toBe(800);
    expect(getViewDistanceFar('medium')).toBe(1400);
    expect(getViewDistanceFar('high')).toBe(2200);
    expect(getViewDistanceFar('ultra')).toBe(3500);
  });

  it('allows switching quality presets in the game store', () => {
    const store = useNexusGameStore.getState();
    store.setGraphicsQuality('ultra');

    const updated = useNexusGameStore.getState();
    expect(updated.graphicsSettings.preset).toBe('ultra');
    expect(updated.graphicsSettings.shadowQuality).toBe('ultra');
    expect(updated.graphicsSettings.starCount).toBe(24000);
  });

  it('allows granular overriding of graphics parameters', () => {
    const store = useNexusGameStore.getState();
    store.updateGraphicsSettings({ bloom: false, atmosphere: 'low' });

    const updated = useNexusGameStore.getState();
    expect(updated.graphicsSettings.bloom).toBe(false);
    expect(updated.graphicsSettings.atmosphere).toBe('low');
  });

  it('toggles developer debug mode and wireframe overlays', () => {
    const store = useNexusGameStore.getState();
    expect(store.graphicsSettings.debugMode).toBe(false);
    expect(store.graphicsSettings.wireframe).toBe(false);

    store.toggleGraphicsDebug();
    store.toggleWireframe();

    const updated = useNexusGameStore.getState();
    expect(updated.graphicsSettings.debugMode).toBe(true);
    expect(updated.graphicsSettings.wireframe).toBe(true);
  });
});

describe('Procedural PBR Textures & Specular Environment Generation', () => {
  it('generates brushed metal normal texture with repeat wrapping', () => {
    const tex = getBrushedMetalNormal();
    expect(tex).toBeInstanceOf(THREE.Texture);
    expect(tex.wrapS).toBe(THREE.RepeatWrapping);
    expect(tex.wrapT).toBe(THREE.RepeatWrapping);
  });

  it('generates planetary terrain regolith normal texture', () => {
    const tex = getTerrainRegolithNormal();
    expect(tex).toBeInstanceOf(THREE.Texture);
    expect(tex.generateMipmaps).toBe(true);
  });

  it('generates astronaut fabric weave normal map', () => {
    const tex = getFabricWeaveNormal();
    expect(tex).toBeInstanceOf(THREE.Texture);
  });

  it('generates asteroid faceted normal map', () => {
    const tex = getAsteroidFacetNormal();
    expect(tex).toBeInstanceOf(THREE.Texture);
  });

  it('generates moon cratered regolith normal map', () => {
    const tex = getMoonCraterNormal();
    expect(tex).toBeInstanceOf(THREE.Texture);
  });

  it('generates roughness variation noise map', () => {
    const tex = getRoughnessNoiseMap();
    expect(tex).toBeInstanceOf(THREE.Texture);
  });

  it('generates procedural HDR space cube environment map for PBR specular reflections', () => {
    const cubeTex = generateSpaceCubeEnvironment();
    expect(cubeTex).toBeInstanceOf(THREE.CubeTexture);
    expect(cubeTex.image.length).toBe(6);
  });
});
