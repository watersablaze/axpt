import ChatFeed from './ChatFeed';
import ChatControls from './ChatControls';

export default function ChatPage() {
  return (
    <div className="chatPage">
      <h1>Live Chat</h1>

      <div className="chatLayout">
        <ChatFeed />
        <ChatControls />
      </div>
    </div>
  );
}