import config, { listen } from '@colyseus/tools';
import { WebSocketTransport } from '@colyseus/ws-transport';
import express from 'express';
import { BattleRoom } from './rooms/BattleRoom.js';
import { SERVER_KEYS, validateServerAdminKey } from './config/serverKeys.js';
import { configureSecurityHeaders, configureCors } from './security/httpHeaders.js';
import { authRateLimiter } from './security/rateLimiter.js';
import { AuthService } from './security/authService.js';
import { AuthRegisterSchema, AuthLoginSchema } from './security/schemas.js';
import { SecurityLogger } from './security/securityLogger.js';

listen(config({
  initializeTransport: (options) => new WebSocketTransport(options),
  initializeExpress: (app) => {
    // 1. Production HTTP Security Headers (Helmet, CSP, HSTS, frame protection)
    app.use(configureSecurityHeaders());

    // 2. Strict CORS Origin Policy
    app.use(configureCors());

    // 3. Request Payload Size Protection (Prevents memory exhaustion attacks)
    app.use(express.json({ limit: '15kb' }));
    app.use(express.urlencoded({ extended: false, limit: '15kb' }));

    // 4. Public Health Check Endpoint
    app.get('/health', (_req, res) => {
      res.json({
        status: 'ok',
        version: '2.1.0-hardened',
        environment: SERVER_KEYS.NODE_ENV,
        serverTime: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime())
      });
    });

    // 5. Account Registration (Rate Limited & Bcrypt Hashed)
    app.post('/api/auth/register', authRateLimiter, async (req, res) => {
      const parse = AuthRegisterSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          error: 'Registration validation failed',
          details: parse.error.issues.map(i => i.message)
        });
      }

      try {
        const { username, password, preferredColor } = parse.data;
        const result = await AuthService.register(username, password, preferredColor);
        res.status(201).json({
          status: 'success',
          user: result.user,
          token: result.token
        });
      } catch (err: any) {
        res.status(409).json({ error: err.message || 'Registration failed' });
      }
    });

    // 6. Account Login (Rate Limited with Brute Force Protection)
    app.post('/api/auth/login', authRateLimiter, async (req, res) => {
      const parse = AuthLoginSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ error: 'Callsign and password are required' });
      }

      try {
        const { username, password } = parse.data;
        const result = await AuthService.login(username, password);
        res.json({
          status: 'success',
          user: result.user,
          token: result.token
        });
      } catch (err: any) {
        res.status(401).json({ error: err.message || 'Invalid callsign or security password' });
      }
    });

    // 7. Instant Guest Session Generation
    app.post('/api/auth/guest', (req, res) => {
      const callsign = typeof req.body?.callsign === 'string' ? req.body.callsign : undefined;
      const guest = AuthService.generateGuestSession(callsign);
      res.json({
        status: 'success',
        userId: guest.userId,
        username: guest.username,
        token: guest.token
      });
    });

    // 8. Session Invalidation / Logout
    app.post('/api/auth/logout', (req, res) => {
      const authHeader = req.headers['authorization'];
      AuthService.revokeToken(authHeader);
      res.json({ status: 'success', message: 'Session successfully invalidated' });
    });

    // 9. Authenticated Pilot Verification & Profile
    app.get('/api/auth/me', (req, res) => {
      const authHeader = req.headers['authorization'];
      const payload = AuthService.verifyToken(authHeader);

      if (!payload) {
        return res.status(401).json({ error: 'Unauthorized: Session invalid or expired' });
      }

      const user = AuthService.getUserProfile(payload.userId);
      res.json({
        status: 'authenticated',
        user: user || {
          id: payload.userId,
          username: payload.username,
          role: payload.role,
          isGuest: payload.isGuest
        }
      });
    });

    // 10. Protected Administrative Status Endpoint
    app.get('/api/admin/status', (req, res) => {
      const authHeader = req.headers['authorization'] || req.headers['x-server-key'];
      const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : null;

      const isAdminKey = validateServerAdminKey(token);
      const isAuthAdmin = token ? AuthService.verifyToken(token)?.role === 'admin' : false;

      if (!isAdminKey && !isAuthAdmin) {
        SecurityLogger.logAccessDenied('Unauthorized access to /api/admin/status', req.ip);
        return res.status(401).json({ error: 'Unauthorized: Admin privileges required' });
      }

      res.json({
        status: 'authenticated',
        nodeEnv: SERVER_KEYS.NODE_ENV,
        activeUptime: process.uptime(),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        timestamp: Date.now()
      });
    });

    // Centralized Safe Error Handling Middleware
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error('[SERVER_ERROR]', err?.message || err);
      res.status(500).json({ error: 'Internal server security error' });
    });
  },
  initializeGameServer: (gameServer) => {
    gameServer.define('battle', BattleRoom).filterBy(['roomCode']);
  }
}), SERVER_KEYS.PORT);
