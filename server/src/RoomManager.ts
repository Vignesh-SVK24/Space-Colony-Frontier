import { Server, Socket } from 'socket.io';
import { Room, RoomState, PlayerState, Vector3, COMBAT } from './types.js';
import { v4 as uuidv4 } from 'uuid';

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

        if (room.players.size >= 2) {
            socket.emit('error', { message: 'Room is full' });
            return false;
        }

        if (room.state !== RoomState.WAITING && room.state !== RoomState.FINISHED) {
            socket.emit('error', { message: 'Game already in progress' });
            return false;
        }

        // Spawn Zone A (Player 1) vs Spawn Zone B (Player 2)
        // Clean spawn corridors with 60m+ obstacle clearance
        const isHost = room.players.size === 0;
        const startPos: Vector3 = isHost 
            ? { x: -140, y: 20, z: 0 }
            : { x: 140, y: 20, z: 0 };
            
        const startRot = isHost
            ? { x: 0, y: Math.PI / 2, z: 0 }     // Facing +X (towards opponent)
            : { x: 0, y: -Math.PI / 2, z: 0 };   // Facing -X (towards opponent)

        const playerState: PlayerState = {
            id: socket.id,
            name: playerName || (isHost ? 'Host Pilot' : 'Guest Pilot'),
            color: playerColor,
            position: startPos,
            rotation: startRot,
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
        socket.to(room.id).emit('player_joined', {
            playerName: playerState.name,
            playerColor: playerState.color
        });

        if (room.players.size === 2) {
            this.startCountdown(room);
        }

        return true;
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
                
                // Set spawn protection for both players
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

        // Reset players to their respective spawn zones
        let isFirst = true;
        for (const player of room.players.values()) {
            player.hp = COMBAT.MAX_HP;
            player.position = isFirst ? { x: -140, y: 20, z: 0 } : { x: 140, y: 20, z: 0 };
            player.rotation = isFirst ? { x: 0, y: Math.PI / 2, z: 0 } : { x: 0, y: -Math.PI / 2, z: 0 };
            player.velocity = { x: 0, y: 0, z: 0 };
            player.lastInput = { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false };
            player.lastShootTime = 0;
            player.lastLaserTime = 0;
            isFirst = false;
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
            room.players.delete(socket.id);
            this.io.to(roomId).emit('opponent_disconnected', {});
            
            if (room.players.size === 0) {
                this.rooms.delete(roomId);
            } else {
                room.state = RoomState.WAITING;
                room.projectiles = [];
                // Reset remaining player
                for (let player of room.players.values()) {
                    player.hp = COMBAT.MAX_HP;
                    player.position = { x: 0, y: 15, z: -120 };
                    player.rotation = { x: 0, y: 0, z: 0 };
                    player.velocity = { x: 0, y: 0, z: 0 };
                }
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
