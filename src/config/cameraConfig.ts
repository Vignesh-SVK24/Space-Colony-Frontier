export type CameraMode =
  | 'colony_overview'
  | 'planet_exploration'
  | 'ship_chase'
  | 'ship_cockpit'
  | 'object_inspect';

export const CAMERA_CONFIG = {
  defaultMode: 'colony_overview' as CameraMode,
  fov: 60,
  near: 0.1,
  far: 25000,
  transitionDuration: 0.8, // seconds
  colonyOverview: {
    position: [0, 45, 60] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    minDistance: 15,
    maxDistance: 180,
    maxPolarAngle: Math.PI / 2.1
  },
  shipChase: {
    offset: [0, 5, -14] as [number, number, number],
    fovBoostKick: 10
  }
} as const;
