import { describe, it, expect } from 'vitest';
import { VISUAL_THEME } from '../src/config/visualTheme';

describe('Visual Theme & 3D Materials Tests', () => {
  it('should define all required planetary biomes', () => {
    const biomes = VISUAL_THEME.planet.biomes;
    expect(biomes.rocky.baseColor).toBeDefined();
    expect(biomes.desert.baseColor).toBeDefined();
    expect(biomes.frozen.baseColor).toBeDefined();
    expect(biomes.volcanic.emissiveColor).toBeDefined();
    expect(biomes.alien.baseColor).toBeDefined();
  });

  it('should configure distinct PBR resource materials', () => {
    const res = VISUAL_THEME.resources;
    expect(res.iron.metalness).toBeGreaterThan(0.6);
    expect(res.titanium.color).toBeDefined();
    expect(res.ice.transmission).toBeGreaterThan(0);
    expect(res.uranium.emissiveIntensity).toBeGreaterThan(0.5);
    expect(res.rare.emissiveIntensity).toBeGreaterThan(0.5);
  });

  it('should configure spaceship paint schemes including battle variants', () => {
    const schemes = VISUAL_THEME.spaceshipPaintSchemes;
    expect(Object.keys(schemes).length).toBeGreaterThanOrEqual(5);
    expect(schemes.default.primaryHull).toBeDefined();
    expect(schemes.stealth.primaryHull).toBeDefined();
    expect(schemes.explorer.engineGlow).toBeDefined();
    expect(schemes.mining.primaryHull).toBeDefined();
    expect(schemes.command.primaryHull).toBeDefined();
    expect(schemes.battle_yellow.primaryHull).toBeDefined();
    expect(schemes.battle_blue.primaryHull).toBeDefined();
    expect(schemes.battle_red.primaryHull).toBeDefined();
    expect(schemes.battle_green.primaryHull).toBeDefined();
  });
});
