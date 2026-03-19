import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SystemLayout.css';

interface SystemLayoutProps {
  children: ReactNode;
}

export const SystemLayout = ({ children }: SystemLayoutProps) => {
  const navigate = useNavigate();
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
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  return (
    <div className="system-layout">
      <header className="system-header">
        <div className="system-brand">
          <i className="fa-solid fa-layer-group"></i> Panel Profesional
        </div>
        <nav className="system-nav">
          <Link to="/admin" className="nav-link">Mis Servicios</Link>
          <Link to="/admin/catalog" className="nav-link">Mi Portafolio</Link>
          <Link to="/admin/services/new" className="nav-link">Crear Servicio</Link>
          <Link to="/admin/requests" className="nav-link">Solicitudes</Link>
          <Link to="/admin/orders" className="nav-link">Ventas</Link>
          <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', marginRight: '10px' }}>
            <i className="fa-solid fa-user" style={{ marginRight: '5px' }}></i> {userName}
          </span>
          <button onClick={handleLogout} className="logout-btn">
            Salir
          </button>
        </nav>
      </header>
      <main className="system-main">
        {children}
      </main>
    </div>
  );
};