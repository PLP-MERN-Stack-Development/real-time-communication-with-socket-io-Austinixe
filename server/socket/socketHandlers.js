const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { users: registeredUsers } = require('../controllers/authController');

// In-memory storage
const activeUsers = new Map(); // socketId -> user data
const rooms = new Map();
const messages = new Map();
const typingUsers = new Map();

// Initialize default global room
rooms.set('global', {
  id: 'global',
  name: 'Global Chat',
  users: new Set()
});
messages.set('global', []);

module.exports = (io) => {
  // Middleware to verify token
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.username);

    // Get user from registered users
    const registeredUser = registeredUsers.get(socket.userId);

    if (!registeredUser) {
      socket.disconnect();
      return;
    }

    const user = {
      id: registeredUser.id,
      socketId: socket.id,
      username: registeredUser.username,
      avatar: registeredUser.avatar,
      status: 'online',
      currentRoom: 'global'
    };

    activeUsers.set(socket.id, user);
    socket.join('global');
    rooms.get('global').users.add(user.id);

    // Send user data back
    socket.emit('registered', {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      }
    });

    // Send existing messages from global room
    const globalMessages = messages.get('global') || [];
    socket.emit('previous-messages', globalMessages);

    // Broadcast user joined to room
    io.to('global').emit('user-joined', {
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar
      },
      message: `${user.username} joined the chat`
    });

    // Send updated online users list
    broadcastOnlineUsers(io, 'global');

    // Handle sending messages
    socket.on('send-message', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const message = {
        id: uuidv4(),
        userId: user.id,
        username: user.username,
        avatar: user.avatar,
        text: data.text,
        roomId: data.roomId || 'global',
        timestamp: new Date().toISOString(),
        reactions: {},
        read: false
      };

      // Store message
      const roomMessages = messages.get(message.roomId) || [];
      roomMessages.push(message);
      messages.set(message.roomId, roomMessages);

      // Broadcast message to room
      io.to(message.roomId).emit('new-message', message);

      // Send delivery acknowledgment
      socket.emit('message-delivered', { messageId: message.id });

      // Stop typing indicator for this user
      stopTyping(socket, user, message.roomId);
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const roomId = data.roomId || 'global';
      
      if (!typingUsers.has(roomId)) {
        typingUsers.set(roomId, new Set());
      }
      
      typingUsers.get(roomId).add(user.id);

      socket.to(roomId).emit('user-typing', {
        userId: user.id,
        username: user.username,
        roomId
      });
    });

    socket.on('stop-typing', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      stopTyping(socket, user, data.roomId || 'global');
    });

    // Handle joining rooms
    socket.on('join-room', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const { roomId } = data;

      // Leave current room
      if (user.currentRoom) {
        socket.leave(user.currentRoom);
        const currentRoom = rooms.get(user.currentRoom);
        if (currentRoom) {
          currentRoom.users.delete(user.id);
          broadcastOnlineUsers(io, user.currentRoom);
        }
      }

      // Join new room
      socket.join(roomId);
      user.currentRoom = roomId;

      if (!rooms.has(roomId)) {
        rooms.set(roomId, {
          id: roomId,
          name: data.roomName || roomId,
          users: new Set()
        });
        messages.set(roomId, []);
      }

      rooms.get(roomId).users.add(user.id);

      // Send previous messages
      const roomMessages = messages.get(roomId) || [];
      socket.emit('previous-messages', roomMessages);

      // Notify room
      io.to(roomId).emit('user-joined', {
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar
        },
        message: `${user.username} joined ${rooms.get(roomId).name}`
      });

      broadcastOnlineUsers(io, roomId);
    });

    // Handle creating new rooms
    socket.on('create-room', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const roomId = uuidv4();
      const room = {
        id: roomId,
        name: data.name,
        users: new Set([user.id]),
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };

      rooms.set(roomId, room);
      messages.set(roomId, []);

      socket.emit('room-created', room);
      
      // Broadcast new room to all users
      io.emit('new-room', {
        id: room.id,
        name: room.name,
        userCount: room.users.size
      });
    });

    // Handle getting rooms list
    socket.on('get-rooms', () => {
      const roomsList = Array.from(rooms.values()).map(room => ({
        id: room.id,
        name: room.name,
        userCount: room.users.size
      }));

      socket.emit('rooms-list', roomsList);
    });

    // Handle message reactions
    socket.on('add-reaction', (data) => {
      const user = activeUsers.get(socket.id);
      if (!user) return;

      const { messageId, emoji, roomId } = data;
      const roomMessages = messages.get(roomId || 'global');

      if (roomMessages) {
        const message = roomMessages.find(m => m.id === messageId);
        if (message) {
          if (!message.reactions[emoji]) {
            message.reactions[emoji] = [];
          }
          if (!message.reactions[emoji].includes(user.id)) {
            message.reactions[emoji].push(user.id);
          }

          io.to(roomId || 'global').emit('reaction-added', {
            messageId,
            emoji,
            userId: user.id,
            reactions: message.reactions
          });
        }
      }
    });

    // Handle private messages
    socket.on('private-message', (data) => {
      const sender = activeUsers.get(socket.id);
      if (!sender) return;

      const recipient = Array.from(activeUsers.values()).find(u => u.id === data.recipientId);

      if (recipient) {
        const message = {
          id: uuidv4(),
          senderId: sender.id,
          senderName: sender.username,
          senderAvatar: sender.avatar,
          recipientId: recipient.id,
          text: data.text,
          timestamp: new Date().toISOString(),
          private: true
        };

        // Send to recipient
        io.to(recipient.socketId).emit('private-message', message);
        
        // Send confirmation to sender
        socket.emit('private-message-sent', message);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = activeUsers.get(socket.id);
      
      if (user) {
        console.log('User disconnected:', user.username);

        // Remove from room
        if (user.currentRoom && rooms.has(user.currentRoom)) {
          rooms.get(user.currentRoom).users.delete(user.id);
          
          io.to(user.currentRoom).emit('user-left', {
            user: {
              id: user.id,
              username: user.username
            },
            message: `${user.username} left the chat`
          });

          broadcastOnlineUsers(io, user.currentRoom);
        }

        // Remove user
        activeUsers.delete(socket.id);
      }
    });
  });

  // Helper function to broadcast online users
  function broadcastOnlineUsers(io, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    const onlineUsers = Array.from(room.users)
      .map(userId => {
        const user = Array.from(activeUsers.values()).find(u => u.id === userId);
        return user ? {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          status: user.status
        } : null;
      })
      .filter(Boolean);

    io.to(roomId).emit('online-users', onlineUsers);
  }

  // Helper function to stop typing
  function stopTyping(socket, user, roomId) {
    if (typingUsers.has(roomId)) {
      typingUsers.get(roomId).delete(user.id);

      socket.to(roomId).emit('user-stopped-typing', {
        userId: user.id,
        username: user.username,
        roomId
      });
    }
  }
};