import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';
import { CombatSystem } from './CombatSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { GameLoop } from './GameLoop.js';
import { PlayerInput, RoomState } from './types.js';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const roomManager = new RoomManager(io);
const combatSystem = new CombatSystem(io);
const collisionSystem = new CollisionSystem();
const gameLoop = new GameLoop(io, roomManager, combatSystem, collisionSystem);

io.on('connection', (socket) => {
    console.log(`[Server] Player connected: ${socket.id}`);

    socket.on('create_room', (data: { playerName: string; playerColor: string }) => {
        roomManager.createRoom(socket, data.playerName, data.playerColor);
    });

    socket.on('join_room', (data: { roomCode: string; playerName: string; playerColor: string }) => {
        roomManager.joinRoom(socket, data.roomCode, data.playerName, data.playerColor);
    });

    socket.on('player_input', (input: PlayerInput) => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room && room.state === RoomState.BATTLE) {
            const player = room.players.get(socket.id);
            if (player && player.hp > 0) {
                player.lastInput = input;
            }
        }
    });

    // Authoritative Bullet Firing
    socket.on('shoot', (data?: { origin?: { x: number; y: number; z: number }; direction?: { x: number; y: number; z: number }; attackId?: string }) => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room) {
            combatSystem.shoot(room, socket.id, data?.origin, data?.direction, data?.attackId);
        }
    });

    socket.on('fire_bullet', (data?: { origin?: { x: number; y: number; z: number }; direction?: { x: number; y: number; z: number }; attackId?: string }) => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room) {
            combatSystem.shoot(room, socket.id, data?.origin, data?.direction, data?.attackId);
        }
    });

    // Authoritative Laser Beam (5-Second Recharge)
    socket.on('fire_laser', (data?: { origin?: { x: number; y: number; z: number }; direction?: { x: number; y: number; z: number }; attackId?: string }) => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room) {
            combatSystem.fireLaser(room, socket.id, data?.origin, data?.direction, data?.attackId);
        }
    });

    // Host Launches Match
    socket.on('start_match', () => {
        roomManager.startMatch(socket.id);
    });

    // Instant Rematch Request
    socket.on('request_rematch', () => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room) {
            console.log(`[Server] Rematch requested in room ${room.code}`);
            roomManager.resetMatch(room.id);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[Server] Player disconnected: ${socket.id}`);
        roomManager.handleDisconnect(socket);
    });
});

gameLoop.start();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Space Colony Server running on port ${PORT}`);
});
