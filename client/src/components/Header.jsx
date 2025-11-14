import './Header.css';

function Header({ user, connected, currentRoom, onLogout, onToggleUsers, onToggleRooms }) {
  return (
    <header className="chat-header">
      <div className="header-left">
        <button className="header-btn" onClick={onToggleRooms} title="Rooms">
          🏠
        </button>
        <div className="room-info">
          <h2>{currentRoom}</h2>
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      <div className="header-right">
        <button className="header-btn" onClick={onToggleUsers} title="Online Users">
          👥
        </button>
        <div className="user-info">
          <img src={user.avatar} alt={user.username} className="user-avatar" />
          <span className="username">{user.username}</span>
        </div>
        <button className="logout-btn" onClick={onLogout} title="Logout">
          🚪 Logout
        </button>
      </div>
    </header>
  );
}

export default Header;