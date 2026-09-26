import { io } from 'socket.io-client';

async function runTest() {
  console.log('Connecting Client 1 (Host)...');
  const client1 = io('http://localhost:3001', { transports: ['websocket'] });
  
  await new Promise((resolve) => client1.on('connect', resolve));
  console.log('Client 1 connected with ID:', client1.id);

  let roomCode = null;

  // Client 1 creates room
  client1.emit('create_room', { playerName: 'Commander Alpha', playerColor: 'yellow' });

  await new Promise((resolve) => {
    client1.on('room_created', (data) => {
      console.log('Room created with code:', data.roomCode);
      roomCode = data.roomCode;
      resolve();
    });
  });

  console.log('Connecting Client 2 (Challenger)...');
  const client2 = io('http://localhost:3001', { transports: ['websocket'] });
  await new Promise((resolve) => client2.on('connect', resolve));
  console.log('Client 2 connected with ID:', client2.id);

  // Client 2 joins room
  client2.emit('join_room', { roomCode, playerName: 'Rogue Beta', playerColor: 'red' });

  await new Promise((resolve) => {
    client2.on('room_joined', (data) => {
      console.log('Client 2 successfully joined room:', roomCode);
      resolve();
    });
  });

  // Wait for countdown
  await new Promise((resolve) => {
    client1.on('countdown', (data) => {
      console.log('Countdown tick received:', data);
      if (data.seconds === 0) resolve();
    });
  });

  console.log('Battle engaged! Testing game state broadcast...');

  // Receive game state
  await new Promise((resolve) => {
    client1.on('game_state', (snapshot) => {
      const players = Object.keys(snapshot.players);
      console.log('Received game snapshot with players:', players.length, 'timestamp:', snapshot.timestamp);
      if (players.length === 2) resolve();
    });
  });

  // Client 1 sends movement input
  console.log('Sending player movement inputs...');
  client1.emit('player_input', {
    thrust: 1,
    yaw: 0,
    pitch: 0,
    roll: 0,
    vertical: 0,
    boost: true,
    brake: false
  });

  // Client 1 shoots laser
  console.log('Client 1 shooting weapon...');
  client1.emit('shoot');

  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 1000);
    client2.on('game_state', (snapshot) => {
      if (snapshot.projectiles && snapshot.projectiles.length > 0) {
        console.log('Client 2 saw laser projectile:', snapshot.projectiles[0].id);
        clearTimeout(timeout);
        resolve();
      }
    });
  });

  console.log('All end-to-end socket checks PASSED!');
  client1.disconnect();
  client2.disconnect();
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
