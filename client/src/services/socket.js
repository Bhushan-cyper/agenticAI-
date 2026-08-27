import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/api\/?$/, '');
  }
  return 'http://localhost:5000';
};

let socket = null;

export const getSocket = () => {
  if (typeof window === 'undefined') return null;

  if (!socket) {
    const socketUrl = getSocketUrl();
    socket = io(socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to CampusMind WebSocket Server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from CampusMind WebSocket Server');
    });
  }

  return socket;
};

export const joinUserRoom = (userId) => {
  const s = getSocket();
  if (s && userId) {
    s.emit('join_user', userId);
  }
};

export const joinAdminRoom = () => {
  const s = getSocket();
  if (s) {
    s.emit('join_admin');
  }
};

export const joinConversationRoom = (conversationId) => {
  const s = getSocket();
  if (s && conversationId) {
    s.emit('join_conversation', conversationId);
  }
};

export const leaveConversationRoom = (conversationId) => {
  const s = getSocket();
  if (s && conversationId) {
    s.emit('leave_conversation', conversationId);
  }
};
