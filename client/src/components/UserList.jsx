import './UserList.css';

function UserList({ users, currentUserId, onClose }) {
  return (
    <div className="user-list-sidebar">
      <div className="sidebar-header">
        <h3>Online Users ({users.length})</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="user-list">
        {users.length === 0 ? (
          <p className="no-users">No users online</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-item">
              <img
                src={user.avatar}
                alt={user.username}
                className="user-item-avatar"
              />
              <div className="user-item-info">
                <span className="user-item-name">
                  {user.username}
                  {user.id === currentUserId && <span className="you-badge">(You)</span>}
                </span>
                <span className={`user-status ${user.status}`}>
                  {user.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserList;