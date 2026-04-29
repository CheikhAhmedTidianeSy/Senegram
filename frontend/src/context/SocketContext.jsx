import { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({}); // { userId: 'online' | 'offline' }

  useEffect(() => {
    if (!token || !user) return;
    const s = connectSocket(token);
    setSocket(s);

    s.on("connect",    () => console.log("🟢 socket connected", s.id));
    s.on("disconnect", () => console.log("🔴 socket disconnected"));

    s.on("presence:update", ({ user_id, status }) => {
      setOnlineUsers((prev) => ({ ...prev, [user_id]: status }));
    });

    return () => {
      s.off("presence:update");
      disconnectSocket();
      setSocket(null);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}
