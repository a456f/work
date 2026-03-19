import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './SystemLayout.css';
import { useSocket } from '../../web/context/SocketContext';
import { useSystemNotification } from '../context/SystemNotificationContext';

interface SystemLayoutProps {
  children: ReactNode;
}

export const SystemLayout = ({ children }: SystemLayoutProps) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { notify } = useSystemNotification();
  const location = useLocation();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    // Verificar autenticación al cargar el layout
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      navigate('/login/provider');
      return;
    }
    const user = JSON.parse(userStr);
    // Asegurar que el usuario tenga el rol correcto
    if (user.role !== 'PROVIDER') {
      navigate('/login/provider');
    }
    setUserName(user.name);

    // Escuchar notificaciones en tiempo real
    if (socket) {
      const notificationHandler = (data: { title: string, message: string }) => {
        notify(data.title, data.message, 'success');
      };
      socket.on('new_notification', notificationHandler);

      return () => {
        socket.off('new_notification', notificationHandler);
      };
    }
  }, [navigate, socket, notify]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  // Helper para clase activa
  const isActive = (path: string) => location.pathname === path ? 'active' : '';

  return (
    <div className="system-layout">
      
      {/* SIDEBAR */}
      <aside className="system-sidebar">
        <div className="system-brand" style={{fontSize: '1.2rem'}}>
          <i className="fa-solid fa-cube"></i> ARQ. PANEL
        </div>
        
        <nav className="system-nav">
          <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
            <i className="fa-solid fa-gauge-high"></i> Dashboard
          </Link>
          <Link to="/admin/requests" className={`nav-link ${isActive('/admin/requests')}`}>
            <i className="fa-regular fa-envelope"></i> Solicitudes
          </Link>
          <Link to="/admin/services/new" className={`nav-link ${isActive('/admin/services/new')}`}>
            <i className="fa-solid fa-plus"></i> Publicar Servicio
          </Link>
          <Link to="/admin/catalog" className={`nav-link ${isActive('/admin/catalog')}`}>
            <i className="fa-regular fa-images"></i> Portafolio
          </Link>
          <Link to="/admin/orders" className={`nav-link ${isActive('/admin/orders')}`}>
            <i className="fa-solid fa-receipt"></i> Historial Ventas
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div style={{color: '#666', fontSize:'0.8rem', marginBottom:'5px', textTransform:'uppercase'}}>Conectado como</div>
          <div style={{color: 'white', fontWeight:'bold', marginBottom:'15px'}}>{userName}</div>
          <button onClick={handleLogout} className="logout-btn">
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="system-main">
        {children}
      </main>
    </div>
  );
};