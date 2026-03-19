import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../../config';

// Extraer solo la URL base (sin /api) para el socket
const SOCKET_URL = API_URL.replace('/api', '');
export const AUTH_CHANGED_EVENT = 'auth-changed';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    const joinUserRoom = () => {
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      if (user?.id) {
        newSocket.emit('join_user_room', user.id);
      }
    };

    const reconnectSocket = () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      newSocket.connect();
    };

    newSocket.on('connect', joinUserRoom);
    window.addEventListener(AUTH_CHANGED_EVENT, reconnectSocket);

    return () => {
      newSocket.off('connect', joinUserRoom);
      window.removeEventListener(AUTH_CHANGED_EVENT, reconnectSocket);
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};
