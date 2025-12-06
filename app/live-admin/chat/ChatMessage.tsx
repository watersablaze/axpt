'use client';

import type { ChatMessageType } from './chat-types';

export default function ChatMessage({ msg }: { msg: ChatMessageType }) {
  return (
    <div className="chatMsg">
      <strong className="chatUser">{msg.user}: </strong>
      <span className="chatText">{msg.message}</span>
      <span className="chatTime">
        {new Date(msg.timestamp).toLocaleTimeString()}
      </span>
    </div>
  );
}