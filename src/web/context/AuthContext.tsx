import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { AUTH_CHANGED_EVENT } from "./SocketContext";

interface User {
  id: number;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const syncUserFromStorage = () => {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        setUser(null);
        return;
      }

      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        console.error("Error parsing user", e);
        setUser(null);
      }
    };

    syncUserFromStorage();
    window.addEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncUserFromStorage);
    };
  }, []);

  const login = (userData: User) => {
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setUser(userData);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  const logout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
};
