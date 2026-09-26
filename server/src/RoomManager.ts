import { Server, Socket } from 'socket.io';
import { Room, RoomState, PlayerState, Vector3 } from './types.js';
import { v4 as uuidv4 } from 'uuid';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();
    private playerToRoom: Map<string, string> = new Map();
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    private generateRoomCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        do {
            code = '';
            for (let i = 0; i < 4; i++) {
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

        if (room.state !== RoomState.WAITING) {
            socket.emit('error', { message: 'Game already in progress' });
            return false;
        }

        const startPos: Vector3 = room.players.size === 0 
            ? { x: 0, y: 0, z: -100 }
            : { x: 0, y: 0, z: 100 };
            
        const startRot = room.players.size === 0
            ? { x: 0, y: 0, z: 0 }
            : { x: 0, y: Math.PI, z: 0 };

        const playerState: PlayerState = {
            id: socket.id,
            name: playerName,
            color: playerColor,
            position: startPos,
            rotation: startRot,
            velocity: { x: 0, y: 0, z: 0 },
            hp: 100,
            score: 0,
            lastInput: { thrust: 0, yaw: 0, pitch: 0, roll: 0, vertical: 0, boost: false, brake: false },
            lastShootTime: 0
        };

        room.players.set(socket.id, playerState);
        this.playerToRoom.set(socket.id, room.id);
        socket.join(room.id);

        const roomInfo = {
            code: room.code,
            players: Array.from(room.players.values())
        };

        socket.emit('room_joined', { roomInfo });
        socket.to(room.id).emit('player_joined', { playerName, playerColor });

        if (room.players.size === 2) {
            this.startCountdown(room);
        }

        return true;
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
                // Reset remaining player
                for (let player of room.players.values()) {
                    player.hp = 100;
                    player.position = { x: 0, y: 0, z: -100 };
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

    private startCountdown(room: Room) {
        room.state = RoomState.COUNTDOWN;
        let seconds = 3;
        
        const interval = setInterval(() => {
            if (seconds > 0) {
                this.io.to(room.id).emit('countdown', { seconds });
                seconds--;
            } else {
                clearInterval(interval);
                room.state = RoomState.BATTLE;
                this.io.to(room.id).emit('countdown', { seconds: 0 });
            }
        }, 1000);
    }
    
    getRooms(): Room[] {
        return Array.from(this.rooms.values());
    }
}
