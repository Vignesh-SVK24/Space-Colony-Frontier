import { z } from 'zod';

const finiteNumber = z.number().refine(val => Number.isFinite(val), {
  message: 'Number must be finite'
});

export const Vector3TupleSchema = z.tuple([
  finiteNumber.min(-350).max(350),
  finiteNumber.min(-350).max(350),
  finiteNumber.min(-350).max(350)
]);

export const RotationTupleSchema = z.tuple([
  finiteNumber.min(-20).max(20),
  finiteNumber.min(-20).max(20),
  finiteNumber.min(-20).max(20)
]);

export const VelocityTupleSchema = z.tuple([
  finiteNumber.min(-200).max(200),
  finiteNumber.min(-200).max(200),
  finiteNumber.min(-200).max(200)
]);

export const Vector3ObjectSchema = z.object({
  x: finiteNumber.min(-350).max(350),
  y: finiteNumber.min(-350).max(350),
  z: finiteNumber.min(-350).max(350)
});

export const Vector3InputSchema = z.union([
  Vector3ObjectSchema,
  z.tuple([finiteNumber.min(-350).max(350), finiteNumber.min(-350).max(350), finiteNumber.min(-350).max(350)]).transform(([x, y, z]) => ({ x, y, z }))
]);

/**
 * Validates incoming flight movement packets.
 */
export const InputMessageSchema = z.object({
  position: Vector3TupleSchema.optional(),
  rotation: RotationTupleSchema.optional(),
  velocity: VelocityTupleSchema.optional(),
  throttle: finiteNumber.min(-1).max(1).optional(),
  pitch: finiteNumber.min(-1).max(1).optional(),
  yaw: finiteNumber.min(-1).max(1).optional(),
  roll: finiteNumber.min(-1).max(1).optional(),
  boost: z.boolean().optional(),
  drift: z.boolean().optional()
});

/**
 * Validates incoming weapon firing requests (Bullets, Lasers, Solar Beams).
 */
export const FireWeaponSchema = z.object({
  origin: Vector3InputSchema,
  direction: Vector3InputSchema,
  weaponType: z.enum(['bullet', 'laser', 'solar', 'BULLET', 'LASER', 'SOLAR']).optional(),
  attackId: z.string().max(64).optional(),
  timestamp: z.number().optional()
});

/**
 * Validates team selection messages.
 */
export const SetTeamSchema = z.object({
  team: z.enum(['A', 'B'])
});

/**
 * Validates player room join and creation options.
 */
export const JoinRoomOptionsSchema = z.object({
  playerName: z.string().max(30).optional(),
  playerColor: z.enum(['yellow', 'blue', 'red', 'green']).optional(),
  mode: z.enum(['1v1', '2v2', 'FFA']).optional(),
  roomCode: z.string().max(10).optional(),
  team: z.enum(['A', 'B', 'NONE']).optional(),
  authToken: z.string().max(1024).optional()
});

/**
 * Validates account registration payloads.
 */
export const AuthRegisterSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Username may only contain letters, numbers, hyphens, and underscores'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(64, 'Password must not exceed 64 characters'),
  preferredColor: z.enum(['yellow', 'blue', 'red', 'green']).optional()
});

/**
 * Validates account login payloads.
 */
export const AuthLoginSchema = z.object({
  username: z.string().min(2).max(32),
  password: z.string().min(1).max(64)
});
