// socket.js - UPDATED VERSION
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

let socket = null;

// Initialize socket with authentication token
export const initializeSocket = (token) => {
  // Disconnect existing socket if any
  if (socket) {
    socket.disconnect();
  }

  // Create new socket with token
  socket = io(SERVER_URL, {
    auth: {
      token: token  // Backend requires this!
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  return socket;
};

// Get the current socket instance
export const getSocket = () => socket;

// Disconnect and cleanup
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// For backward compatibility
export default socket;