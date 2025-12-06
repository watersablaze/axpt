'use client';

import { useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import type { ChatMessageType } from './chat-types';

export default function ChatFeed() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);

  const load = async () => {
    const res = await fetch('/api/owncast/chat');
    const json = await res.json();
    setMessages(json);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="chatFeed">
      {messages.map((m) => (
        <ChatMessage key={m.id} msg={m} />
      ))}
    </div>
  );
}