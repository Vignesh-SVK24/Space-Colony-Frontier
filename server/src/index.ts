import config, { listen } from '@colyseus/tools';
import { WebSocketTransport } from '@colyseus/ws-transport';
import cors from 'cors';
import { BattleRoom } from './rooms/BattleRoom.js';

const PORT = Number(process.env.PORT || 3001);

listen(config({
  initializeTransport: (options) => new WebSocketTransport(options),
  initializeExpress: (app) => {
    app.use(cors());

    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        version: '2.0.0',
        serverTime: new Date().toISOString(),
        uptimeSeconds: process.uptime()
      });
    });
  },
  initializeGameServer: (gameServer) => {
    gameServer.define('battle', BattleRoom);
  }
}), PORT);
