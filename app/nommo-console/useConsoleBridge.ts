// useConsoleBridge.ts
export function useConsoleBridge() {
  const socket = new WebSocket("wss://live.axpt.io/overlay-bridge");

  return (action: string, id: string, value?: any) => {
    socket.send(JSON.stringify({ action, id, value }));
  };
}