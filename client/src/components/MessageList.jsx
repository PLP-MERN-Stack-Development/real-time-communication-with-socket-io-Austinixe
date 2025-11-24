import { format } from 'date-fns';
import './MessageList.css';

function MessageList({ messages, currentUserId, onReaction }) {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.userId === currentUserId ? 'own-message' : 'other-message'}`}
          >
            {message.userId !== currentUserId && (
              <img
                src={message.avatar}
                alt={message.username}
                className="message-avatar"
              />
            )}
            
            <div className="message-content">
              {message.userId !== currentUserId && (
                <span className="message-username">{message.username}</span>
              )}
              
              <div className="message-bubble">
                <p className="message-text">{message.text}</p>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>

              {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div className="message-reactions">
                  {Object.entries(message.reactions).map(([emoji, users]) => (
                    <span key={emoji} className="reaction-badge">
                      {emoji} {users.length}
                    </span>
                  ))}
                </div>
              )}

              <div className="reaction-picker">
                {emojis.map(emoji => (
                  <button
                    key={emoji}
                    className="reaction-btn"
                    onClick={() => onReaction(message.id, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {message.userId === currentUserId && (
              <img
                src={message.avatar}
                alt={message.username}
                className="message-avatar"
              />
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default MessageList;