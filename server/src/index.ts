import config, { listen } from '@colyseus/tools';
import { WebSocketTransport } from '@colyseus/ws-transport';
import cors from 'cors';
import { BattleRoom } from './rooms/BattleRoom.js';
import { SERVER_KEYS, validateServerAdminKey } from './config/serverKeys.js';

listen(config({
  initializeTransport: (options) => new WebSocketTransport(options),
  initializeExpress: (app) => {
    app.use(cors({ origin: SERVER_KEYS.CORS_ORIGIN }));

    // Public health check endpoint
    app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        version: '2.0.0',
        environment: SERVER_KEYS.NODE_ENV,
        serverTime: new Date().toISOString(),
        uptimeSeconds: process.uptime()
      });
    });

    // Protected administrative endpoint verified via backend key alone
    app.get('/api/admin/status', (req, res) => {
      const authHeader = req.headers['authorization'] || req.headers['x-server-key'];
      const key = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;

      if (!validateServerAdminKey(key)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid backend server key' });
      }

      res.json({
        status: 'authenticated',
        nodeEnv: SERVER_KEYS.NODE_ENV,
        serverApiKeyConfigured: Boolean(SERVER_KEYS.SERVER_API_KEY),
        roomSecretConfigured: Boolean(SERVER_KEYS.ROOM_SECRET_KEY),
        activeSessionsSecretConfigured: Boolean(SERVER_KEYS.SESSION_SECRET),
        timestamp: Date.now()
      });
    });
  },
  initializeGameServer: (gameServer) => {
    gameServer.define('battle', BattleRoom).filterBy(['roomCode']);
  }
}), SERVER_KEYS.PORT);
