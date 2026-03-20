import { NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

const NAV = [
  {
    section: 'Principal',
    items: [
      { to: '/admin/dashboard',  icon: 'fa-solid fa-gauge',       label: 'Dashboard'   },
    ]
  },
  {
    section: 'Contenido',
    items: [
      { to: '/admin/products', icon: 'fa-solid fa-box',   label: 'Productos' },
      { to: '/admin/auctions', icon: 'fa-solid fa-gavel', label: 'Subastas'  },
    ]
  },
  {
    section: 'Gestión',
    items: [
      { to: '/admin/users',  icon: 'fa-solid fa-users', label: 'Usuarios' },
    ]
  }
];

export const Sidebar = () => {
  const { adminUser, logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <aside className="adm-sidebar">
      <div className="adm-sidebar-logo">
        <div className="adm-sidebar-logo-icon"><i className="fa-solid fa-shield-halved"></i></div>
        <div className="adm-sidebar-logo-text">
          <span className="adm-sidebar-logo-name">WorkProject</span>
          <span className="adm-sidebar-logo-sub">Panel Admin</span>
        </div>
      </div>

      {NAV.map(group => (
        <div key={group.section} className="adm-sidebar-section">
          <div className="adm-sidebar-section-label">{group.section}</div>
          {group.items.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `adm-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="adm-nav-icon"><i className={item.icon}></i></span>
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="adm-sidebar-footer">
        <div className="adm-sidebar-footer-user">
          <div className="adm-footer-avatar">{(adminUser?.name || 'A').substring(0, 2).toUpperCase()}</div>
          <div>
            <div className="adm-footer-name">{adminUser?.name || 'Admin'}</div>
            <div className="adm-footer-role">Administrador</div>
          </div>
        </div>
        <button className="adm-logout-btn" onClick={handleLogout}>
          <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
        </button>
      </div>
    </aside>
  );
};
