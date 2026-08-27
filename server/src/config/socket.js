const { Server } = require('socket.io');

let io = null;

const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user room for targeted notifications
    socket.on('join_user', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket ${socket.id} joined user:${userId}`);
      }
    });

    // Join admin room for document ingestion updates & analytics
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log(`🛡️ Socket ${socket.id} joined admin_room`);
    });

    // Join specific conversation room for streaming
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        console.log(`💬 Socket ${socket.id} joined conversation:${conversationId}`);
      }
    });

    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Helper to emit document ingestion status
 */
const emitDocumentStatus = (documentId, status, payload = {}) => {
  if (!io) return;
  io.to('admin_room').emit('document:status', {
    documentId,
    status,
    timestamp: new Date().toISOString(),
    ...payload,
  });
  console.log(`📡 [Socket] Document ${documentId} status: ${status}`);
};

/**
 * Helper to stream answer tokens to conversation room
 */
const streamAnswerToken = (conversationId, token) => {
  if (!io || !conversationId) return;
  io.to(`conversation:${conversationId}`).emit('chat:token', {
    conversationId,
    token,
  });
};

/**
 * Helper to emit complete answer message
 */
const streamAnswerComplete = (conversationId, data) => {
  if (!io || !conversationId) return;
  io.to(`conversation:${conversationId}`).emit('chat:complete', {
    conversationId,
    ...data,
  });
};

/**
 * Helper to emit admin notification
 */
const emitNotification = (notification) => {
  if (!io) return;
  io.to('admin_room').emit('notification:new', notification);
};

module.exports = {
  initSocket,
  getIO,
  emitDocumentStatus,
  streamAnswerToken,
  streamAnswerComplete,
  emitNotification,
};
