import { io } from 'socket.io-client';

// On Render or local, if the frontend is served by the backend, '/' works.
// For Vite dev server, we point to the backend port (e.g., :3000 if not proxying).
// Since the Express server runs on 3000, we use it directly in dev.
// @ts-ignore
const backendUrl = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;

export const socket = io(backendUrl, {
    transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
    console.log('Connected to socket server:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Disconnected from socket server');
});
