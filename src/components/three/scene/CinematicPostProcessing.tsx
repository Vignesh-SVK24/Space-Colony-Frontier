import { useEffect, useRef, type FC } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { useNexusGameStore } from '../../../state/useNexusGameStore';

// Subtle cinematic vignette shader
const VignetteShader = {
  name: 'CinematicVignette',
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: 1.05 },
    darkness: { value: 1.15 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float offset;
    uniform float darkness;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec2 uv = (vUv - vec2(0.5)) * vec2(offset);
      float vig = clamp(1.0 - dot(uv, uv) * darkness, 0.0, 1.0);
      gl_FragColor = vec4(texel.rgb * vig, texel.a);
    }
  `
};

export const CinematicPostProcessing: FC = () => {
  const { gl, scene, camera, size } = useThree();
  const { graphicsSettings } = useNexusGameStore();
  const composerRef = useRef<EffectComposer | null>(null);

  const isEnabled = graphicsSettings.postProcessing !== 'off';

  useEffect(() => {
    if (!isEnabled) {
      if (composerRef.current) {
        composerRef.current.dispose();
        composerRef.current = null;
      }
      return;
    }

    const composer = new EffectComposer(gl);
    composer.setSize(size.width, size.height);

    // 1. Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // 2. Controlled Selective Bloom (Emphasizes thrusters & weapon cores without washing out hulls/terrain)
    if (graphicsSettings.bloom) {
      const bloomStrength = graphicsSettings.preset === 'ultra' ? 0.36 : 0.26;
      const bloomRadius = 0.28;
      const bloomThreshold = 0.88; // High threshold preserves sharp dark hull edges and terrain definition
      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(size.width, size.height),
        bloomStrength,
        bloomRadius,
        bloomThreshold
      );
      composer.addPass(bloomPass);
    }

    // 3. Cinematic Vignette Pass
    if (graphicsSettings.vignette) {
      const vignettePass = new ShaderPass(VignetteShader);
      vignettePass.uniforms.offset.value = 1.05;
      vignettePass.uniforms.darkness.value = graphicsSettings.preset === 'low' ? 0.8 : 1.15;
      composer.addPass(vignettePass);
    }

    // 4. Color Management & Output Pass
    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera, size.width, size.height, isEnabled, graphicsSettings.bloom, graphicsSettings.vignette, graphicsSettings.preset]);

  // Priority 1 renders the composer instead of R3F's default pass
  useFrame(() => {
    if (isEnabled && composerRef.current) {
      composerRef.current.render();
    }
  }, 1);

  return null;
};
