import { Server, Socket } from 'socket.io';
import { Room, RoomState, PlayerState, Vector3, COMBAT } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export const MAX_PLAYERS = 4;

export const SPAWN_SLOTS: { pos: Vector3; rot: { x: number; y: number; z: number }; defaultColor: string }[] = [
    { pos: { x: -140, y: 20, z: 0 }, rot: { x: 0, y: Math.PI / 2, z: 0 }, defaultColor: 'yellow' }, // Slot 1: West
    { pos: { x: 140, y: 20, z: 0 }, rot: { x: 0, y: -Math.PI / 2, z: 0 }, defaultColor: 'blue' },   // Slot 2: East
    { pos: { x: 0, y: 20, z: -140 }, rot: { x: 0, y: 0, z: 0 }, defaultColor: 'red' },             // Slot 3: South
    { pos: { x: 0, y: 20, z: 140 }, rot: { x: 0, y: Math.PI, z: 0 }, defaultColor: 'green' }        // Slot 4: North
];

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerToRoom: Map<string, string> = new Map();
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    private generateRoomCode(): string {
        // 6-character unambiguous alphanumeric code (no O/0, I/1 confusion)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        do {
            code = '';
            for (let i = 0; i < 6; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
        } while (Array.from(this.rooms.values()).some(r => r.code === code));
        return code;
    }

    createRoom(socket: Socket, playerName: string, playerColor: string): Room {
        const code = this.generateRoomCode();
        const roomId = uuidv4();
        
        const room: Room = {
            id: roomId,
            code,
            state: RoomState.WAITING,
            players: new Map(),
            projectiles: [],
            processedAttacks: new Set<string>(),
            tickCount: 0,
            createdAt: Date.now()
        };

        this.rooms.set(roomId, room);
        this.joinRoom(socket, code, playerName, playerColor);
        
        socket.emit('room_created', { roomCode: code, playerId: socket.id });
        return room;
    }

    joinRoom(socket: Socket, code: string, playerName: string, playerColor: string): boolean {
        const room = Array.from(this.rooms.values()).find(r => r.code === code);
        
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return false;
        }

        if (room.players.size >= MAX_PLAYERS) {
            socket.emit('error', { message: `Room is full (Max ${MAX_PLAYERS} pilots)` });
            return false;
        }

        if (room.state !== RoomState.WAITING && room.state !== RoomState.FINISHED) {
            socket.emit('error', { message: 'Game already in progress' });
            return false;
        }

        // Assign spawn slot (supports up to 4 players)
        const slotIndex = room.players.size;
        const slot = SPAWN_SLOTS[slotIndex % SPAWN_SLOTS.length];
        const isHost = slotIndex === 0;

        // Auto-assign unique color if requested color is taken
        const takenColors = new Set(Array.from(room.players.values()).map(p => p.color));
        let assignedColor = playerColor;
        if (takenColors.has(assignedColor)) {
            const available = ['yellow', 'blue', 'red', 'green'].find(c => !takenColors.has(c));
            if (available) assignedColor = available;
        }

        const playerState: PlayerState = {
            id: socket.id,
            name: playerName || (isHost ? 'Host Pilot' : `Pilot-${slotIndex + 1}`),
            color: assignedColor,
            position: { ...slot.pos },
            rotation: { ...slot.rot },
            velocity: { x: 0, y: 0, z: 0 },
            hp: COMBAT.MAX_HP,
            maxHp: COMBAT.MAX_HP,
            score: 0,
            lastInput: { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false },
            lastShootTime: 0,
            lastLaserTime: 0,
            spawnTime: Date.now(),
            ready: true
        };

        room.players.set(socket.id, playerState);
        this.playerToRoom.set(socket.id, room.id);
        socket.join(room.id);

        const roomInfo = {
            code: room.code,
            players: Array.from(room.players.values())
        };

        socket.emit('room_joined', { roomInfo });
        this.io.to(room.id).emit('room_players_updated', {
            players: Array.from(room.players.values())
        });
        socket.to(room.id).emit('player_joined', {
            playerName: playerState.name,
            playerColor: playerState.color
        });

        // Automatically start countdown if full with 4 players
        if (room.players.size === MAX_PLAYERS) {
            this.startCountdown(room);
        }

        return true;
    }

    startMatch(socketId: string): boolean {
        const roomId = this.playerToRoom.get(socketId);
        if (!roomId) return false;
        const room = this.rooms.get(roomId);
        if (!room) return false;

        // Check if sender is host (first joined player)
        const hostId = room.players.keys().next().value;
        if (hostId !== socketId) {
            const socket = this.io.sockets.sockets.get(socketId);
            socket?.emit('error', { message: 'Only the room host can launch battle' });
            return false;
        }

        if (room.players.size < 2) {
            const socket = this.io.sockets.sockets.get(socketId);
            socket?.emit('error', { message: 'At least 2 players are required to start battle' });
            return false;
        }

        if (room.state === RoomState.WAITING || room.state === RoomState.FINISHED) {
            this.startCountdown(room);
            return true;
        }
        return false;
    }

    startCountdown(room: Room) {
        room.state = RoomState.COUNTDOWN;
        let seconds = COMBAT.COUNTDOWN_SECONDS;
        
        const interval = setInterval(() => {
            if (seconds > 0) {
                this.io.to(room.id).emit('countdown', { seconds });
                seconds--;
            } else {
                clearInterval(interval);
                room.state = RoomState.BATTLE;
                room.battleStartTime = Date.now();
                
                // Set spawn protection for all players
                for (const player of room.players.values()) {
                    player.spawnTime = Date.now();
                }

                this.io.to(room.id).emit('countdown', { seconds: 0 });
                this.io.to(room.id).emit('match_start', {
                    startTime: room.battleStartTime
                });
            }
        }, 1000);
    }

    resetMatch(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room || room.players.size < 2) return;

        room.projectiles = [];
        room.winnerId = undefined;
        room.processedAttacks.clear();
        room.tickCount = 0;

        // Reset all players to their respective 4-way spawn zones
        let slotIdx = 0;
        for (const player of room.players.values()) {
            const slot = SPAWN_SLOTS[slotIdx % SPAWN_SLOTS.length];
            player.hp = COMBAT.MAX_HP;
            player.position = { ...slot.pos };
            player.rotation = { ...slot.rot };
            player.velocity = { x: 0, y: 0, z: 0 };
            player.lastInput = { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false };
            player.lastShootTime = 0;
            player.lastLaserTime = 0;
            slotIdx++;
        }

        this.io.to(room.id).emit('rematch_started', {
            players: Array.from(room.players.values())
        });

        this.startCountdown(room);
    }

    handleDisconnect(socket: Socket) {
        const roomId = this.playerToRoom.get(socket.id);
        if (!roomId) return;

        const room = this.rooms.get(roomId);
        if (room) {
            const leavingPlayer = room.players.get(socket.id);
            room.players.delete(socket.id);

            this.io.to(roomId).emit('opponent_disconnected', { playerId: socket.id });
            this.io.to(roomId).emit('player_left', { playerId: socket.id, playerName: leavingPlayer?.name });
            this.io.to(roomId).emit('room_players_updated', {
                players: Array.from(room.players.values())
            });
            
            if (room.players.size === 0) {
                this.rooms.delete(roomId);
            } else if (room.state === RoomState.BATTLE) {
                // If match in progress, check remaining alive players
                const alive = Array.from(room.players.values()).filter(p => p.hp > 0);
                if (alive.length <= 1) {
                    const winner = alive[0];
                    if (winner) {
                        room.state = RoomState.FINISHED;
                        room.winnerId = winner.id;
                        this.io.to(room.id).emit('match_end', {
                            winnerId: winner.id,
                            winnerName: winner.name,
                            stats: { damageDealt: 100, matchDuration: 30 }
                        });
                    }
                }
            } else if (room.state === RoomState.COUNTDOWN && room.players.size < 2) {
                room.state = RoomState.WAITING;
                this.io.to(roomId).emit('countdown_cancelled', { message: 'Waiting for players' });
            }
        }
        
        this.playerToRoom.delete(socket.id);
    }

    getRoomForPlayer(socketId: string): Room | undefined {
        const roomId = this.playerToRoom.get(socketId);
        return roomId ? this.rooms.get(roomId) : undefined;
    }
    
    getRooms(): Room[] {
        return Array.from(this.rooms.values());
    }
}
