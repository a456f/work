import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useAdmin } from '../context/AdminContext';
import '../styles/admin.css';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  const { isAuthenticated } = useAdmin();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  return (
    <div className="adm-root adm-layout">
      <div className="adm-sidebar-area">
        <Sidebar />
      </div>
      <div className="adm-topbar-area">
        <Topbar title={title} subtitle={subtitle} />
      </div>
      <main className="adm-content-area">
        {children}
      </main>
    </div>
  );
};
