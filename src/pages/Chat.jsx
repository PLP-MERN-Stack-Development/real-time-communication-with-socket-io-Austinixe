import { useState, useEffect, useRef } from 'react';
import socket from '../socket/socket';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import UserList from '../components/UserList';
import RoomList from '../components/RoomList';
import Header from '../components/Header';
import TypingIndicator from '../components/TypingIndicator';
import './Chat.css';

function Chat({ user, connected, onLogout }) {
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('global');
  const [showUserList, setShowUserList] = useState(true);
  const [showRoomList, setShowRoomList] = useState(false);
  const [notification, setNotification] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    // Receive previous messages
    socket.on('previous-messages', (msgs) => {
      setMessages(msgs);
    });

    // Receive new message
    socket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
      
      // Play sound and show notification if not from current user
      if (message.userId !== user.id) {
        playNotificationSound();
        showNotification(`${message.username}: ${message.text}`);
        
        // Increment unread count if window is not focused
        if (document.hidden) {
          setUnreadCount(prev => prev + 1);
        }
      }
    });

    // User joined
    socket.on('user-joined', (data) => {
      showNotification(data.message, 'info');
    });

    // User left
    socket.on('user-left', (data) => {
      showNotification(data.message, 'info');
    });

    // Online users update
    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    // Typing indicator
    socket.on('user-typing', (data) => {
      setTypingUsers(prev => {
        if (!prev.find(u => u.userId === data.userId)) {
          return [...prev, data];
        }
        return prev;
      });
    });

    socket.on('user-stopped-typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
    });

    // Rooms list
    socket.on('rooms-list', (roomsList) => {
      setRooms(roomsList);
    });

    // New room created
    socket.on('new-room', (room) => {
      setRooms(prev => [...prev, room]);
    });

    // Message reactions
    socket.on('reaction-added', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, reactions } : msg
      ));
    });

    // Cleanup
    return () => {
      socket.off('previous-messages');
      socket.off('new-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('online-users');
      socket.off('user-typing');
      socket.off('user-stopped-typing');
      socket.off('rooms-list');
      socket.off('new-room');
      socket.off('reaction-added');
    };
  }, [user.id]);

  // Get rooms list on mount
  useEffect(() => {
    socket.emit('get-rooms');
  }, []);

  // Reset unread count when window is focused
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUnreadCount(0);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Update page title with unread count
  useEffect(() => {
    document.title = unreadCount > 0 
      ? `(${unreadCount}) Real-Time Chat` 
      : 'Real-Time Chat';
  }, [unreadCount]);

  const handleSendMessage = (text) => {
    socket.emit('send-message', {
      text,
      roomId: currentRoom
    });
  };

  const handleTyping = () => {
    socket.emit('typing', { roomId: currentRoom });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { roomId: currentRoom });
    }, 2000);
  };

  const handleJoinRoom = (roomId) => {
    setCurrentRoom(roomId);
    setMessages([]);
    socket.emit('join-room', { roomId });
    setShowRoomList(false);
  };

  const handleCreateRoom = (roomName) => {
    socket.emit('create-room', { name: roomName });
  };

  const handleReaction = (messageId, emoji) => {
    socket.emit('add-reaction', {
      messageId,
      emoji,
      roomId: currentRoom
    });
  };

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZQQ0PVKzo8LJXFQ1Ln+Lyu3AeBjKI0/TWfiwGIHXD7+OVPw4NUavo6bJYFA5HnuL1u3AhBzOK1PTZfS8GInXE7uSWPg8PVKjn6bNaExBJn+PzvnEfBzWM1fTbfzAFI3bE7OWYPg8RVajm6LRcExFKoOPyv3IfB');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  };

  const showNotification = (message, type = 'message') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);

    // Browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Message', {
        body: message,
        icon: '/chat-icon.png'
      });
    }
  };

  const requestNotificationPermission = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const currentRoomData = rooms.find(r => r.id === currentRoom) || { name: 'Global Chat' };

  return (
    <div className="chat-container">
      <Header 
        user={user}
        connected={connected}
        currentRoom={currentRoomData.name}
        onLogout={onLogout}
        onToggleUsers={() => setShowUserList(!showUserList)}
        onToggleRooms={() => setShowRoomList(!showRoomList)}
      />

      <div className="chat-body">
        {showRoomList && (
          <RoomList
            rooms={rooms}
            currentRoom={currentRoom}
            onJoinRoom={handleJoinRoom}
            onCreateRoom={handleCreateRoom}
            onClose={() => setShowRoomList(false)}
          />
        )}

        <div className="chat-main">
          <MessageList
            messages={messages}
            currentUserId={user.id}
            onReaction={handleReaction}
          />
          <div ref={messagesEndRef} />
          
          {typingUsers.length > 0 && (
            <TypingIndicator users={typingUsers} />
          )}

          <MessageInput
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
          />
        </div>

        {showUserList && (
          <UserList
            users={onlineUsers}
            currentUserId={user.id}
            onClose={() => setShowUserList(false)}
          />
        )}
      </div>

      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default Chat;