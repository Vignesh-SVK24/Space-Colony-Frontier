import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { GAME_CONFIG } from '../shared/gameConfig.js';

export class Vector3Schema extends Schema {
  @type('number') x: number = 0;
  @type('number') y: number = 0;
  @type('number') z: number = 0;

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

export class PlayerSchema extends Schema {
  @type('string') id: string = '';
  @type('string') sessionId: string = '';
  @type('string') name: string = 'Pilot';
  @type('string') color: string = 'yellow';
  @type('string') team: string = 'NONE'; // 'A', 'B', 'NONE'
  @type('number') slot: number = 1;

  @type(Vector3Schema) position = new Vector3Schema();
  @type(Vector3Schema) rotation = new Vector3Schema(); // pitch (x), yaw (y), roll (z)
  @type(Vector3Schema) velocity = new Vector3Schema();

  @type('number') hp: number = GAME_CONFIG.MAX_HP;
  @type('number') maxHp: number = GAME_CONFIG.MAX_HP;
  @type('boolean') alive: boolean = true;
  @type('boolean') ready: boolean = false;
  @type('boolean') isHost: boolean = false;
  @type('boolean') connected: boolean = true;

  @type('number') ammo: number = GAME_CONFIG.BULLET_MAGAZINE_SIZE;
  @type('boolean') isReloading: boolean = false;
  @type('number') reloadTimeRemaining: number = 0;
  @type('number') laserCooldownRemaining: number = 0;
  @type('number') solarCooldownRemaining: number = 0;

  @type('number') ping: number = 0;
  @type('number') score: number = 0;
  @type('number') kills: number = 0;
  @type('number') damageDealt: number = 0;
  @type('number') damageReceived: number = 0;
  @type('number') shotsFired: number = 0;
  @type('number') shotsHit: number = 0;

  constructor(id?: string, name?: string, color?: string, team?: string, slot?: number) {
    super();
    if (id) {
      this.id = id;
      this.sessionId = id;
    }
    if (name) this.name = name;
    if (color) this.color = color;
    if (team) this.team = team;
    if (slot) this.slot = slot;
  }
}

export class ProjectileSchema extends Schema {
  @type('string') id: string = '';
  @type('string') attackId: string = '';
  @type('string') ownerId: string = '';
  @type('string') weaponType: string = 'BULLET';
  @type('string') color: string = 'yellow';
  @type('string') team: string = 'NONE';

  @type(Vector3Schema) position = new Vector3Schema();
  @type(Vector3Schema) direction = new Vector3Schema();
  @type('number') speed: number = GAME_CONFIG.BULLET_SPEED;
  @type('number') damage: number = GAME_CONFIG.BULLET_DAMAGE;
  @type('number') spawnTime: number = 0;
}

export class BattleStateSchema extends Schema {
  @type('string') roomCode: string = '';
  @type('string') roomStatus: string = 'WAITING'; // 'WAITING', 'LOBBY', 'READY', 'COUNTDOWN', 'BATTLE', 'FINISHED', 'CLOSED'
  @type('string') gameMode: string = '1v1'; // '1v1', 'FFA', '2v2'
  @type('number') countdown: number = 0;
  @type('number') serverTick: number = 0;
  @type('number') matchDuration: number = 0;
  @type('string') winnerId: string = '';
  @type('string') winnerName: string = '';
  @type('string') winnerTeam: string = '';

  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type([ ProjectileSchema ]) projectiles = new ArraySchema<ProjectileSchema>();
}
