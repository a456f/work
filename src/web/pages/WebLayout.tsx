import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./WebLayout.css";

export const WebLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { favoritesCount } = useFavorites();

  return (
    <div className="web-layout">

      {/* TOP BAR */}
      <div className="global-nav">
        <div className="global-nav-container">
          <NavLink to="/books" className="global-tab">Libros</NavLink>
          <NavLink to="/services" className="global-tab">Diseño Gráfico</NavLink>
          <NavLink to="/courses" className="global-tab">Cursos Online</NavLink>
        </div>
      </div>

      {/* HEADER */}
      <header className="main-header">
        <div className="container header-content">

          <Link to="/" className="logo">
            <i className="fa-solid fa-book-open"></i>
            BookStore<span>Pro</span>
          </Link>

          <div className="search-container">
            <input className="search-input" placeholder="Buscar..." />
            <button className="search-btn">
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>
          </div>

          <div className="header-icons">

            <Link to="/chat" className="icon-item">
              <i className="fa-solid fa-robot"></i>
              <span>Asistente IA</span>
            </Link>

            <Link to="/favorites" className="icon-item">
              <i className="fa-regular fa-heart"></i>
              {favoritesCount > 0 && <span className="cart-count" style={{background: '#ff4757'}}>{favoritesCount}</span>}
              <span>Favoritos</span>
            </Link>

            {user ? (
              <div className="icon-item" onClick={logout}>
                <i className="fa-solid fa-user-check"></i>
                <span>{user.name}</span>
              </div>
            ) : (
              <Link to="/login/client" className="icon-item">
                <i className="fa-regular fa-user"></i>
                <span>Cuenta</span>
              </Link>
            )}
             <Link to="/client-requests" className="icon-item">
              <i className="fa-solid fa-list"></i>
             
              <span>Solicitudes</span>
            </Link>

            <Link to="/cart" className="icon-item">
              <i className="fa-solid fa-cart-shopping"></i>
              <span className="cart-count">{cartCount}</span>
              <span>Carrito</span>
            </Link>

          </div>
        </div>
      </header>

      {/* NAV */}
      <nav className="main-nav">
        <div className="container">
          <ul className="nav-list">
            <li><NavLink to="/products">Todo</NavLink></li>
            <li><NavLink to="/top">Más Vendidos</NavLink></li>
            <li><NavLink to="/new">Novedades</NavLink></li>
          </ul>
        </div>
      </nav>

      {/* CONTENIDO DINÁMICO */}
      <main className="web-content">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="web-footer">
        <p>© 2026 WorkProject</p>
      </footer>

    </div>
  );
  


};