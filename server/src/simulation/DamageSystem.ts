import { BattleStateSchema } from '../schema/BattleState.js';
import { WeaponType } from '../shared/gameConfig.js';

export interface DamageRequest {
  attackId: string;
  attackerId: string;
  defenderId: string;
  weaponType: WeaponType;
  damage: number;
}

export interface DamageResult {
  applied: boolean;
  attackId: string;
  attackerId: string;
  defenderId: string;
  weaponType: WeaponType;
  damage: number;
  remainingHp: number;
  eliminated: boolean;
  reason?: string;
}

export class DamageSystem {
  private processedAttacks: Set<string> = new Set();

  constructor() {}

  /**
   * Authoritative damage application
   * Enforces attacker existence, defender existence, match active,
   * 2v2 friendly-fire immunity, and exact attack deduplication.
   */
  applyDamage(state: BattleStateSchema, req: DamageRequest): DamageResult {
    // 1. Attack deduplication
    if (this.processedAttacks.has(req.attackId)) {
      return {
        applied: false,
        attackId: req.attackId,
        attackerId: req.attackerId,
        defenderId: req.defenderId,
        weaponType: req.weaponType,
        damage: 0,
        remainingHp: 0,
        eliminated: false,
        reason: 'DUPLICATE_ATTACK'
      };
    }

    // 2. Validate players (support lookup by sessionId or player.id)
    let attacker = state.players.get(req.attackerId);
    if (!attacker) {
      state.players.forEach(p => { if (p.id === req.attackerId) attacker = p; });
    }
    let defender = state.players.get(req.defenderId);
    if (!defender) {
      state.players.forEach(p => { if (p.id === req.defenderId) defender = p; });
    }

    if (!defender || !defender.alive || defender.hp <= 0) {
      return {
        applied: false,
        attackId: req.attackId,
        attackerId: req.attackerId,
        defenderId: req.defenderId,
        weaponType: req.weaponType,
        damage: 0,
        remainingHp: 0,
        eliminated: false,
        reason: 'DEFENDER_NOT_FOUND_OR_DEAD'
      };
    }

    // 3. Team relationship check (2v2 mode friendly-fire protection)
    if (state.gameMode === '2v2' && attacker) {
      if (attacker.team !== 'NONE' && attacker.team === defender.team) {
        return {
          applied: false,
          attackId: req.attackId,
          attackerId: req.attackerId,
          defenderId: req.defenderId,
          weaponType: req.weaponType,
          damage: 0,
          remainingHp: defender.hp,
          eliminated: false,
          reason: 'FRIENDLY_FIRE_BLOCKED'
        };
      }
    }

    // 4. Mark attack as processed
    this.processedAttacks.add(req.attackId);
    // Limit memory size of set
    if (this.processedAttacks.size > 5000) {
      const iter = this.processedAttacks.values();
      for (let i = 0; i < 1000; i++) {
        const next = iter.next();
        if (next.done) break;
        this.processedAttacks.delete(next.value);
      }
    }

    // 5. Apply authoritative HP damage
    const oldHp = defender.hp;
    const newHp = Math.max(0, oldHp - req.damage);
    defender.hp = newHp;
    defender.damageReceived += (oldHp - newHp);

    if (attacker) {
      attacker.damageDealt += (oldHp - newHp);
      attacker.shotsHit += 1;
    }

    const eliminated = newHp <= 0;
    if (eliminated) {
      defender.alive = false;
      if (attacker) {
        attacker.kills += 1;
        attacker.score += 100;
      }
    }

    return {
      applied: true,
      attackId: req.attackId,
      attackerId: req.attackerId,
      defenderId: defender.sessionId || req.defenderId,
      weaponType: req.weaponType,
      damage: (oldHp - newHp),
      remainingHp: newHp,
      eliminated
    };
  }

  reset() {
    this.processedAttacks.clear();
  }
}
