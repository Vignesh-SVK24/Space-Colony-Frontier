import { describe, it, expect, beforeEach } from 'vitest';
import { GAME_CONFIG } from '../src/shared/gameConfig';
import { COMBAT_CONFIG } from '../src/config/combatConfig';
import { useMultiplayerStore } from '../src/multiplayer/useMultiplayerStore';
import { ARENA_OBSTACLES, checkObstacleRaycast } from '../src/config/arenaObstacles';
import { DamageSystem } from '../server/src/simulation/DamageSystem';
import { BattleStateSchema, PlayerSchema } from '../server/src/schema/BattleState';

describe('Space Colony: Frontier - Full Authoritative Combat & 4-Player/2v2 Suite', () => {
  let damageSystem: DamageSystem;
  let battleState: BattleStateSchema;

  beforeEach(() => {
    useMultiplayerStore.getState().reset();
    damageSystem = new DamageSystem();
    battleState = new BattleStateSchema();
  });

  describe('1. Authoritative Vitals & Weapon Balance Parameters', () => {
    it('should mandate 250 HP base for all vessels across client and server configs', () => {
      expect(GAME_CONFIG.MAX_HP).toBe(250);
      expect(GAME_CONFIG.INITIAL_HP).toBe(250);
      expect(COMBAT_CONFIG.MAX_HP).toBe(250);
      expect(COMBAT_CONFIG.INITIAL_HP).toBe(250);
    });

    it('should configure Weapon 1: Rapid Plasma Bullet (2 HP, 0.1s rate, 30 mag, 2.0s reload)', () => {
      expect(GAME_CONFIG.BULLET_DAMAGE).toBe(2);
      expect(GAME_CONFIG.BULLET_FIRE_INTERVAL_MS).toBe(100);
      expect(GAME_CONFIG.BULLET_MAGAZINE_SIZE).toBe(30);
      expect(GAME_CONFIG.BULLET_RELOAD_MS).toBe(2000);
      expect(COMBAT_CONFIG.BULLET_DAMAGE).toBe(2);
      expect(COMBAT_CONFIG.BULLET_FIRE_INTERVAL).toBe(0.1);
      expect(COMBAT_CONFIG.BULLET_MAGAZINE_SIZE).toBe(30);
      expect(COMBAT_CONFIG.BULLET_RELOAD_TIME).toBe(2.0);
    });

    it('should configure Weapon 2: Directed Laser Beam (12 HP, 3.0s recharge)', () => {
      expect(GAME_CONFIG.LASER_DAMAGE).toBe(12);
      expect(GAME_CONFIG.LASER_RECHARGE_MS).toBe(3000);
      expect(COMBAT_CONFIG.LASER_DAMAGE).toBe(12);
      expect(COMBAT_CONFIG.LASER_COOLDOWN).toBe(3.0);
    });

    it('should configure Weapon 3: Special High-Yield Solar Beam (30 HP, 10.0s recharge)', () => {
      expect(GAME_CONFIG.SOLAR_DAMAGE).toBe(30);
      expect(GAME_CONFIG.SOLAR_RECHARGE_MS).toBe(10000);
      expect(COMBAT_CONFIG.SOLAR_DAMAGE).toBe(30);
      expect(COMBAT_CONFIG.SOLAR_COOLDOWN).toBe(10.0);
    });
  });

  describe('2. Authoritative Sequential Damage Pipeline (250 -> 248 -> 236 -> 206 HP)', () => {
    it('should sequentially apply Bullet (2 HP), Laser (12 HP), and Solar (30 HP) damage in Server DamageSystem', () => {
      const p1 = new PlayerSchema('p1', 'Viper', 'blue', 'NONE', 1);
      const p2 = new PlayerSchema('p2', 'Cobra', 'red', 'NONE', 2);
      battleState.players.set('p1', p1);
      battleState.players.set('p2', p2);

      expect(p2.hp).toBe(250);

      // 1. Bullet hit: 250 -> 248 HP
      const bulletResult = damageSystem.applyDamage(battleState, {
        attackId: 'atk_bullet_1',
        attackerId: 'p1',
        defenderId: 'p2',
        weaponType: 'BULLET',
        damage: GAME_CONFIG.BULLET_DAMAGE
      });
      expect(bulletResult.applied).toBe(true);
      expect(bulletResult.damage).toBe(2);
      expect(bulletResult.remainingHp).toBe(248);
      expect(p2.hp).toBe(248);

      // 2. Laser hit: 248 -> 236 HP
      const laserResult = damageSystem.applyDamage(battleState, {
        attackId: 'atk_laser_1',
        attackerId: 'p1',
        defenderId: 'p2',
        weaponType: 'LASER',
        damage: GAME_CONFIG.LASER_DAMAGE
      });
      expect(laserResult.applied).toBe(true);
      expect(laserResult.damage).toBe(12);
      expect(laserResult.remainingHp).toBe(236);
      expect(p2.hp).toBe(236);

      // 3. Solar Beam hit: 236 -> 206 HP
      const solarResult = damageSystem.applyDamage(battleState, {
        attackId: 'atk_solar_1',
        attackerId: 'p1',
        defenderId: 'p2',
        weaponType: 'SOLAR_BEAM',
        damage: GAME_CONFIG.SOLAR_DAMAGE
      });
      expect(solarResult.applied).toBe(true);
      expect(solarResult.damage).toBe(30);
      expect(solarResult.remainingHp).toBe(206);
      expect(p2.hp).toBe(206);
    });

    it('should enforce strict attack deduplication (re-sent packet ignored)', () => {
      const p1 = new PlayerSchema('p1', 'Viper', 'blue', 'NONE', 1);
      const p2 = new PlayerSchema('p2', 'Cobra', 'red', 'NONE', 2);
      battleState.players.set('p1', p1);
      battleState.players.set('p2', p2);

      // First application
      const first = damageSystem.applyDamage(battleState, {
        attackId: 'unique_bullet_100',
        attackerId: 'p1',
        defenderId: 'p2',
        weaponType: 'BULLET',
        damage: 2
      });
      expect(first.applied).toBe(true);
      expect(p2.hp).toBe(248);

      // Duplicate attackId
      const duplicate = damageSystem.applyDamage(battleState, {
        attackId: 'unique_bullet_100',
        attackerId: 'p1',
        defenderId: 'p2',
        weaponType: 'BULLET',
        damage: 2
      });
      expect(duplicate.applied).toBe(false);
      expect(duplicate.reason).toBe('DUPLICATE_ATTACK');
      // HP remains 248, never drops to 246
      expect(p2.hp).toBe(248);
    });
  });

  describe('3. 2v2 Team Battle & Friendly Fire Immunity', () => {
    it('should block friendly fire when attacker and defender are on the same team', () => {
      battleState.gameMode = '2v2';

      const pA1 = new PlayerSchema('pA1', 'Alpha-1', 'blue', 'TEAM_A', 1);
      const pA2 = new PlayerSchema('pA2', 'Alpha-2', 'blue', 'TEAM_A', 2);
      const pB1 = new PlayerSchema('pB1', 'Beta-1', 'red', 'TEAM_B', 3);

      battleState.players.set('pA1', pA1);
      battleState.players.set('pA2', pA2);
      battleState.players.set('pB1', pB1);

      // Friendly Fire Test: pA1 shoots teammate pA2 with 30 damage Solar Beam
      const friendlyFireResult = damageSystem.applyDamage(battleState, {
        attackId: 'ff_solar_test',
        attackerId: 'pA1',
        defenderId: 'pA2',
        weaponType: 'SOLAR_BEAM',
        damage: 30
      });

      expect(friendlyFireResult.applied).toBe(false);
      expect(friendlyFireResult.reason).toBe('FRIENDLY_FIRE_BLOCKED');
      expect(pA2.hp).toBe(250); // Immune to friendly fire

      // Enemy Fire Test: pA1 shoots enemy pB1
      const enemyFireResult = damageSystem.applyDamage(battleState, {
        attackId: 'enemy_solar_test',
        attackerId: 'pA1',
        defenderId: 'pB1',
        weaponType: 'SOLAR_BEAM',
        damage: 30
      });

      expect(enemyFireResult.applied).toBe(true);
      expect(pB1.hp).toBe(220); // Takes full 30 damage
    });
  });

  describe('4. Obstacle Cover & Line-of-Sight Occlusion', () => {
    it('should block laser or solar beam when an arena obstacle is between shooter and target', () => {
      const obstacle = ARENA_OBSTACLES[0]; // Titan Alpha asteroid
      const [ox, oy, oz] = obstacle.position;

      // Shooter on one side (-30m x), target on the other side (+30m x)
      const raycast = checkObstacleRaycast(
        ox - 40, oy, oz,
        ox + 40, oy, oz
      );

      expect(raycast.blocked).toBe(true);
      expect(raycast.obstacle).toBeDefined();
      expect(raycast.obstacle?.id).toBe(obstacle.id);
    });

    it('should clear line-of-sight when trajectory is unimpeded by obstacles', () => {
      // Clear flight path in upper arena
      const raycast = checkObstacleRaycast(
        0, 100, 0,
        0, 100, 80
      );

      expect(raycast.blocked).toBe(false);
      expect(raycast.obstacle).toBeNull();
    });
  });

  describe('5. Client Magazine & Weapon State Management', () => {
    it('should start with full 30 ammo and replenish upon reload', () => {
      const store = useMultiplayerStore.getState();
      expect(store.ammo).toBe(30);
      expect(store.isReloading).toBe(false);

      // Decrement ammo
      store.setAmmo(0);
      store.setIsReloading(true);
      store.setReloadTimeRemaining(2.0);

      expect(useMultiplayerStore.getState().ammo).toBe(0);
      expect(useMultiplayerStore.getState().isReloading).toBe(true);
      expect(useMultiplayerStore.getState().reloadTimeRemaining).toBe(2.0);

      // Complete reload
      store.setAmmo(30);
      store.setIsReloading(false);
      store.setReloadTimeRemaining(0);

      expect(useMultiplayerStore.getState().ammo).toBe(30);
      expect(useMultiplayerStore.getState().isReloading).toBe(false);
    });
  });

  describe('6. Solo Practice Mode Parity with Multiplayer Rules', () => {
    it('should initialize solo practice mode with identical 250 HP base and weapon values', () => {
      const store = useMultiplayerStore.getState();
      store.startSoloGame();

      const state = useMultiplayerStore.getState();
      expect(state.isSolo).toBe(true);
      expect(state.selfState?.hp).toBe(250);
      expect(state.selfState?.maxHp).toBe(250);
      expect(state.opponentState?.hp).toBe(250);
      expect(state.opponentState?.maxHp).toBe(250);

      // Damage player by 2 (Bullet)
      store.applyDamageToSoloPlayer(GAME_CONFIG.BULLET_DAMAGE);
      expect(useMultiplayerStore.getState().selfState?.hp).toBe(248);

      // Damage drone by 12 (Laser)
      store.applyDamageToSoloOpponent(GAME_CONFIG.LASER_DAMAGE);
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(238);

      // Damage drone by 30 (Solar Beam)
      store.applyDamageToSoloOpponent(GAME_CONFIG.SOLAR_DAMAGE);
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(208);
    });

    it('should never revert or overwrite damaged HP during standard movement updates in solo mode', () => {
      const store = useMultiplayerStore.getState();
      store.startSoloGame();

      // Deal 12 HP Laser damage to opponent
      store.applyDamageToSoloOpponent(12);
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(238);

      // Simulate 60FPS AI movement ticks with stale 250 HP passed
      for (let i = 0; i < 10; i++) {
        store.updateSoloOpponent(
          [0, 10 + i, 80],
          [0, Math.PI, 0],
          [0, 0, 15],
          250, // Stale closure value that previously reverted HP!
          false,
          0.5
        );
      }

      // HP MUST remain 238 and must NOT revert to 250!
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(238);
      expect(useMultiplayerStore.getState().opponentState?.alive).toBe(true);

      // Deal 2 HP Bullet damage
      store.applyDamageToSoloOpponent(2);
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(236);

      // Deal 30 HP Solar damage
      store.applyDamageToSoloOpponent(30);
      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(206);

      // Simulate player movement update with stale HP
      store.applyDamageToSoloPlayer(2);
      expect(useMultiplayerStore.getState().selfState?.hp).toBe(248);

      store.updateSoloSelf([0, 0, -80], [0, 0, 0], [0, 0, 0], 250, false, 0);
      expect(useMultiplayerStore.getState().selfState?.hp).toBe(248);
    });

    it('should eliminate solo opponent when HP reaches 0 and trigger hit confirmation', () => {
      const store = useMultiplayerStore.getState();
      store.startSoloGame();

      expect(useMultiplayerStore.getState().opponentState?.hp).toBe(250);

      // Deal 250 total damage
      store.applyDamageToSoloOpponent(250);

      const opp = useMultiplayerStore.getState().opponentState;
      expect(opp?.hp).toBe(0);
      expect(opp?.alive).toBe(false);
      expect(useMultiplayerStore.getState().hitConfirmActive).toBe(true);
    });
  });
});
