import { useState } from 'react';
import './RoomList.css';

function RoomList({ rooms, currentRoom, onJoinRoom, onCreateRoom, onClose }) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim());
      setNewRoomName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="room-list-sidebar">
      <div className="sidebar-header">
        <h3>Chat Rooms</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="room-actions">
        <button
          className="create-room-btn"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '✕ Cancel' : '➕ Create Room'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-room-form" onSubmit={handleCreateRoom}>
          <input
            type="text"
            placeholder="Room name..."
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="room-input"
            maxLength={30}
            autoFocus
          />
          <button type="submit" className="submit-room-btn">
            Create
          </button>
        </form>
      )}

      <div className="room-list">
        {rooms.map((room) => (
          <div
            key={room.id}
            className={`room-item ${room.id === currentRoom ? 'active' : ''}`}
            onClick={() => onJoinRoom(room.id)}
          >
            <div className="room-icon">🏠</div>
            <div className="room-info">
              <span className="room-name">{room.name}</span>
              <span className="room-users">{room.userCount} user{room.userCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoomList;