import * as colyseus from './colyseusClient';
import { BattleColor, GameMode } from './types';

export const connectToServer = () => {
  colyseus.getClient();
};

export const updateServerUrl = (url: string) => {
  colyseus.updateServerUrl(url);
};

export const createRoom = (playerName: string, playerColor: BattleColor, mode: GameMode = '1v1') => {
  return colyseus.createRoom(playerName, playerColor, mode);
};

export const joinRoom = (roomCode: string, playerName: string, playerColor: BattleColor) => {
  return colyseus.joinRoom(roomCode, playerName, playerColor);
};

export const startMatch = () => {
  colyseus.startMatch();
};

export const sendInput = (position: [number, number, number], rotation: [number, number, number], velocity: [number, number, number]) => {
  colyseus.sendInput(position, rotation, velocity);
};

export const sendShoot = (origin: [number, number, number], direction: [number, number, number], attackId?: string) => {
  colyseus.sendBullet(origin, direction, attackId);
};

export const sendFireBullet = sendShoot;

export const sendLaser = (origin: [number, number, number], direction: [number, number, number], attackId?: string) => {
  colyseus.sendLaser(origin, direction, attackId);
};

export const sendFireLaser = sendLaser;

export const requestRematch = () => {
  colyseus.requestRematch();
};

export const disconnect = () => {
  colyseus.disconnect();
};

export const socketClient = {
  connectToServer,
  updateServerUrl,
  createRoom,
  joinRoom,
  startMatch,
  sendInput,
  sendShoot,
  sendLaser,
  requestRematch,
  disconnect
};
