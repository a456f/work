import { createContext, useContext, useState, type ReactNode } from 'react';

interface AdminUser { name: string; }

interface AdminContextType {
  adminUser: AdminUser | null;
  login:  (user: AdminUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const s = localStorage.getItem('adminUser');
    return s ? JSON.parse(s) : null;
  });

  const login  = (user: AdminUser) => { setAdminUser(user); localStorage.setItem('adminUser', JSON.stringify(user)); };
  const logout = () => { setAdminUser(null); localStorage.removeItem('adminUser'); };

  return (
    <AdminContext.Provider value={{ adminUser, login, logout, isAuthenticated: !!adminUser }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};
