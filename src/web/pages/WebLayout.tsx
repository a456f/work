import { useEffect } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useWebNotification } from '../context/WebNotificationContext';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './WebLayout.css';

export const WebLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();
  const { notify } = useWebNotification();

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message?: string) => {
      notify('Aviso', String(message || ''), 'success');
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [notify]);

  return (
    <div className="web-layout">
      <div className="market-topbar">
        <div className="container market-topbar-content">
          <span>Marketplace creativo para libros, cursos y servicios digitales</span>
          <div className="market-topbar-badges">
            <span>Profesionales verificados</span>
            <span>Chat en tiempo real</span>
            <span>Entrega simple</span>
          </div>
        </div>
      </div>

      <div className="global-nav">
        <div className="global-nav-container">
          <NavLink to="/books" className="global-tab">Libros</NavLink>
          <NavLink to="/services" className="global-tab">Servicios</NavLink>
          <NavLink to="/courses" className="global-tab">Cursos</NavLink>
          <NavLink to="/auctions" className="global-tab">Subastas</NavLink>
          <NavLink to="/points" className="global-tab"><i className="fa-solid fa-coins"></i> Mis Puntos</NavLink>
        </div>
      </div>

      <header className="main-header">
        <div className="container header-content">
          <Link to="/" className="logo">
            <span className="logo-mark">
              <i className="fa-solid fa-compass-drafting"></i>
            </span>
            <span className="logo-copy">
              <strong>WorkProject</strong>
              <small>Design Marketplace</small>
            </span>
          </Link>

          <div className="search-container">
            <i className="fa-solid fa-magnifying-glass search-icon"></i>
            <input className="search-input" placeholder="Busca servicios, cursos o recursos creativos..." />
            <button className="search-btn">Explorar</button>
          </div>

          <div className="header-icons">
            <Link to="/chat" className="icon-item">
              <i className="fa-solid fa-robot"></i>
              <span>IA</span>
            </Link>

            <Link to="/favorites" className="icon-item icon-pill">
              <div className="icon-wrapper">
                <i className="fa-regular fa-heart"></i>
                {favoritesCount > 0 && <span className="cart-count accent-pink">{favoritesCount}</span>}
              </div>
              <span>Favoritos</span>
            </Link>

            <Link to="/client-requests" className="icon-item icon-pill">
              <i className="fa-solid fa-list-check"></i>
              <span>Solicitudes</span>
            </Link>

            <Link to="/cart" className="icon-item icon-pill">
              <div className="icon-wrapper">
                <i className="fa-solid fa-cart-shopping"></i>
                <span className="cart-count">{cartCount}</span>
              </div>
              <span>Carrito</span>
            </Link>

            {user ? (
              <button type="button" className="icon-item account-chip" onClick={logout}>
                <i className="fa-solid fa-user-check"></i>
                <span>{user.name}</span>
              </button>
            ) : (
              <Link to="/login/client" className="icon-item account-chip">
                <i className="fa-regular fa-user"></i>
                <span>Cuenta</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className="main-nav">
        <div className="container nav-shell">
          <ul className="nav-list">
            <li><NavLink to="/">Inicio</NavLink></li>
            <li><NavLink to="/services">Marketplace creativo</NavLink></li>
            <li><NavLink to="/books">Biblioteca digital</NavLink></li>
            <li><NavLink to="/courses">Aprendizaje online</NavLink></li>
            <li><NavLink to="/auctions">Subastas en vivo</NavLink></li>
          </ul>
          <div className="nav-highlight">
            <i className="fa-solid fa-bolt"></i>
            <span>Experiencia visual mas limpia para clientes</span>
          </div>
        </div>
      </nav>

      <main className="web-content">
        {children}
        <Outlet />
      </main>

      <footer className="web-footer">
        <div className="container footer-grid">
          <div>
            <h4>WorkProject</h4>
            <p>Servicios, formacion y recursos digitales para marcas, estudios y equipos creativos.</p>
          </div>
          <div>
            <h4>Explorar</h4>
            <Link to="/services">Servicios</Link>
            <Link to="/books">Libros</Link>
            <Link to="/courses">Cursos</Link>
            <Link to="/auctions">Subastas</Link>
            <Link to="/points">Mis Puntos</Link>
          </div>
          <div>
            <h4>Cuenta</h4>
            <Link to="/favorites">Favoritos</Link>
            <Link to="/cart">Carrito</Link>
            <Link to="/client-requests">Solicitudes</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 WorkProject. Marketplace digital para diseño y aprendizaje.</p>
        </div>
      </footer>
    </div>
  );
};
