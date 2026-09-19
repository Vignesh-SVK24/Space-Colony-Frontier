import { ASSET_MANIFEST, AssetEntry } from './assetManifest';
import { createLogger } from '../utils/logger';

const logger = createLogger('Assets');

export interface AssetResult {
  key: string;
  kind: 'glb' | 'procedural';
  url?: string;
  config?: AssetEntry;
  status: 'ready' | 'fallback' | 'loading' | 'error';
}

const warnedKeys = new Set<string>();

/**
 * Returns asset resolution info with guaranteed procedural fallback.
 * Derives URLs from import.meta.env.BASE_URL for clean deployment.
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

  // Combine base URL with asset path safely
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const cleanPath = entry.path.startsWith('/') ? entry.path.slice(1) : entry.path;
  const fullUrl = `${cleanBase}${cleanPath}`;

  return {
    key,
    kind: 'procedural', // Default to procedural fallback while external assets are optional
    url: fullUrl,
    config: entry,
    status: 'fallback'
  };
}

export function logMissingAsset(key: string, path: string) {
  if (!warnedKeys.has(key)) {
    warnedKeys.add(key);
    logger.warn(`Missing model '${key}' at '${path}'. Gracefully using procedural fallback.`);
  }
}
