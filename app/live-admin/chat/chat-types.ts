export interface ChatMessageType {
  id: string;
  user: string;
  avatar?: string;
  message: string;
  timestamp: string;
}

export interface ChatFeedProps {
  messages: ChatMessageType[];
}