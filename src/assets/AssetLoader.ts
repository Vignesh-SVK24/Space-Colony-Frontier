import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_MANIFEST, AssetEntry } from './assetManifest';
import { createLogger } from '../utils/logger';

const logger = createLogger('AssetLoader');

export interface AssetResult {
  key: string;
  kind: 'glb' | 'procedural';
  url?: string;
  config?: AssetEntry;
  status: 'ready' | 'fallback' | 'loading' | 'error';
  gltf?: THREE.Group;
}

const gltfCache = new Map<string, THREE.Group>();
const warnedKeys = new Set<string>();
const gltfLoader = new GLTFLoader();

/**
 * Synchronous resolver that checks cache or returns procedural fallback info.
 */
export function getAsset(key: string): AssetResult {
  const entry = ASSET_MANIFEST.assets[key];
  const baseUrl = import.meta.env?.BASE_URL || './';

  if (!entry) {
    if (!warnedKeys.has(key)) {
      warnedKeys.add(key);
      logger.warn(`Asset key '${key}' not declared in manifest. Using procedural fallback.`);
    }
    return {
      key,
      kind: 'procedural',
      status: 'fallback'
    };
  }

  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
  const fullUrl = `${cleanBase}${cleanPath}`;

  if (gltfCache.has(key)) {
    return {
      key,
      kind: 'glb',
      url: fullUrl,
      config: entry,
      status: 'ready',
      gltf: gltfCache.get(key)
    };
  }

  return {
    key,
    kind: 'procedural',
    url: fullUrl,
    config: entry,
    status: 'fallback'
  };
}

/**
 * Asynchronous GLB loader with fallback guarantee.
 */
export async function loadGLBAsset(key: string): Promise<THREE.Group | null> {
  const entry = ASSET_MANIFEST.assets[key];
  if (!entry) return null;

  if (gltfCache.has(key)) {
    return gltfCache.get(key)!.clone();
  }

  const baseUrl = import.meta.env?.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
  const fullUrl = `${cleanBase}${cleanPath}`;

  return new Promise((resolve) => {
    gltfLoader.load(
      fullUrl,
      (gltf) => {
        logger.info(`Successfully loaded external GLB for '${key}'.`);
        const scene = gltf.scene;

        if (entry.scale) {
          scene.scale.set(...entry.scale);
        }
        if (entry.rotationCorrection) {
          scene.rotation.set(...entry.rotationCorrection);
        }

        gltfCache.set(key, scene);
        resolve(scene.clone());
      },
      undefined,
      () => {
        if (!warnedKeys.has(key)) {
          warnedKeys.add(key);
          logger.warn(`Model '${key}' not found at '${fullUrl}'. Seamlessly engaging procedural PBR fallback.`);
        }
        resolve(null);
      }
    );
  });
}

export function logMissingAsset(key: string, path: string) {
  if (!warnedKeys.has(key)) {
    warnedKeys.add(key);
    logger.warn(`Missing model '${key}' at '${path}'. Gracefully using procedural fallback.`);
  }
}
