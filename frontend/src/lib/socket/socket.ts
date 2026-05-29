import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createSocket = (token: string) => {
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
    transports: ["websocket"],
    auth: { token },
    path: process.env.NEXT_PUBLIC_WS_PATH || "/ws",
  });

  return socket;
};

export const getSocket = () => socket;

export const destroySocket = () => {
  socket?.disconnect();
  socket = null;
};