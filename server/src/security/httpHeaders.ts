import helmet from 'helmet';
import cors from 'cors';
import { type RequestHandler } from 'express';
import { SERVER_KEYS, isOriginAllowed } from '../config/serverKeys.js';

/**
 * Helmet Security Headers Middleware tuned specifically for WebGL, Three.js,
 * background video playback, and Colyseus WebSocket connectivity.
 */
export const configureSecurityHeaders = (): RequestHandler => {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Required for Three.js shader compiles & Vite bundles
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        mediaSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'http:', 'https:', 'ws:', 'wss:'],
        fontSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        upgradeInsecureRequests: SERVER_KEYS.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false, // Required for WebGL textures & video assets
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: SERVER_KEYS.NODE_ENV === 'production' ? {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    } : false,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'sameorigin' }
  });
};

/**
 * Production-hardened CORS Middleware with explicit origin allowlist.
 */
export const configureCors = (): RequestHandler => {
  return cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || isOriginAllowed(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${requestOrigin} rejected by Space Colony security policy.`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Server-Key']
  });
};
