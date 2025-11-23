import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Chat from './pages/Chat';
import socket from './socket/socket';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnected(false);
    });

    socket.on('registered', (data) => {
      setUser(data.user);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error.message);
      if (error.message === 'Invalid token' || error.message === 'Authentication required') {
        handleLogout();
      }
    });

    // Cleanup
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('registered');
      socket.off('connect_error');
    };
  }, []);

  // Check for saved token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('chatToken');
      const savedUser = localStorage.getItem('chatUser');

      if (token && savedUser) {
        try {
          // Verify token with backend
          const response = await fetch(`${API_URL}/api/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          const data = await response.json();

          if (data.success) {
            setUser(data.user);
            
            // Connect socket with token
            socket.auth = { token };
            socket.connect();
          } else {
            // Invalid token, clear storage
            localStorage.removeItem('chatToken');
            localStorage.removeItem('chatUser');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('chatToken');
          localStorage.removeItem('chatUser');
        }
      }

      setLoading(false);
    };

    verifyToken();
  }, []);

  const handleLogin = (token, userData) => {
    setUser(userData);
    
    // Connect socket with token
    socket.auth = { token };
    socket.connect();
  };

  const handleLogout = () => {
    socket.disconnect();
    setUser(null);
    setConnected(false);
    localStorage.removeItem('chatToken');
    localStorage.removeItem('chatUser');
  };

  if (loading) {
    return (
      <div className="App">
        <div style={{ color: 'white', fontSize: '1.2rem' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Chat user={user} connected={connected} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;