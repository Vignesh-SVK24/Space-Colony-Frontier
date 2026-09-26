import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { RoomManager } from './RoomManager.js';
import { CombatSystem } from './CombatSystem.js';
import { CollisionSystem } from './CollisionSystem.js';
import { GameLoop } from './GameLoop.js';
import { PlayerInput } from './types.js';

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
    console.log(`Player connected: ${socket.id}`);

    socket.on('create_room', (data: { playerName: string, playerColor: string }) => {
        roomManager.createRoom(socket, data.playerName, data.playerColor);
    });

    socket.on('join_room', (data: { roomCode: string, playerName: string, playerColor: string }) => {
        roomManager.joinRoom(socket, data.roomCode, data.playerName, data.playerColor);
    });

    socket.on('player_input', (input: PlayerInput) => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room && room.state === 'BATTLE') {
            const player = room.players.get(socket.id);
            if (player) {
                player.lastInput = input;
            }
        }
    });

    socket.on('shoot', () => {
        const room = roomManager.getRoomForPlayer(socket.id);
        if (room) {
            combatSystem.shoot(room, socket.id);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Player disconnected: ${socket.id}`);
        roomManager.handleDisconnect(socket);
    });
});

gameLoop.start();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Space Colony Server running on port ${PORT}`);
});
