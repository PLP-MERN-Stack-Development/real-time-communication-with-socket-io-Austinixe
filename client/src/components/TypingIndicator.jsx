import './TypingIndicator.css';

function TypingIndicator({ users }) {
  if (users.length === 0) return null;

  const typingText = users.length === 1
    ? `${users[0].username} is typing...`
    : users.length === 2
    ? `${users[0].username} and ${users[1].username} are typing...`
    : `${users.length} people are typing...`;

  return (
    <div className="typing-indicator">
      <div className="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="typing-text">{typingText}</span>
    </div>
  );
}

export default TypingIndicator;