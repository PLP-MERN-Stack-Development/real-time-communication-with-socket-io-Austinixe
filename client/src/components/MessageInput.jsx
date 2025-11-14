import { useState } from 'react';
import './MessageInput.css';

function MessageInput({ onSendMessage, onTyping }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    onTyping();
  };

  return (
    <form className="message-input-container" onSubmit={handleSubmit}>
      <input
        type="text"
        className="message-input"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
        maxLength={500}
      />
      <button type="submit" className="send-button" disabled={!message.trim()}>
        <span className="send-icon">📤</span>
      </button>
    </form>
  );
}

export default MessageInput;