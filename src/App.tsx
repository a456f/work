import { Routes, Route } from 'react-router-dom'
import { Link } from 'react-router-dom'
import './App.css'

// Layout
import { WebLayout } from './web/pages/WebLayout'

// Pages
import { ClientRegister } from './web/pages/ClientRegister'
import { ClientLogin } from './web/pages/ClientLogin'
import { ServicesPage } from './web/pages/ServicesPage'
import { ClientRequests } from './web/pages/ClientRequests'
import { CartPage } from './web/pages/CartPage'
import { MyDownloads } from './web/pages/MyDownloads'
import { ProductsPage } from './web/pages/ProductsPage'
import { BooksPage } from './web/pages/BooksPage'
import { FavoritesPage } from './web/pages/FavoritesPage'
import { AIChatPage } from './web/pages/AIChatPage'
import { AuctionsPage } from './web/pages/AuctionsPage'
import { PointsPage } from './web/pages/PointsPage'

// System
import { ProviderLogin } from './system/pages/ProviderLogin'
import { ProviderRegister } from './system/pages/ProviderRegister'
import { CreateService } from './system/pages/CreateService'
import { MyServices } from './system/pages/MyServices'
import { ServiceRequests } from './system/pages/ServiceRequests'
import { SystemLayout } from './system/pages/SystemLayout'
import { AdminProducts } from './system/pages/AdminProducts'
import { AdminOrders } from './system/pages/AdminOrders'
import { ProviderCatalog } from './system/pages/ProviderCatalog'

// Context
import { CartProvider } from './web/context/CartContext'
import { AuthProvider } from './web/context/AuthContext'
import { FavoritesProvider } from './web/context/FavoritesContext'
import { WebNotificationProvider } from './web/context/WebNotificationContext'
import { SystemNotificationProvider } from './system/context/SystemNotificationContext'
import { SocketProvider } from './web/context/SocketContext'
import { AdminProvider } from './admin/context/AdminContext'

// Admin Pages
import { AdminLogin }        from './admin/pages/AdminLogin'
import { Dashboard }         from './admin/pages/Dashboard'
import { AdminUsers }        from './admin/pages/AdminUsers'
import { AdminProductsPage } from './admin/pages/AdminProductsPage'
import { AdminAuctionsPage } from './admin/pages/AdminAuctionsPage'

function App() {
  return (
    <AdminProvider>
    <WebNotificationProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <SystemNotificationProvider>
              <SocketProvider>
              <Routes>

            {/* 🔥 WEB */}
            <Route element={<WebLayout children={undefined} />}>

              <Route path="/" element={
                <div className="home-container">

                  {/* ── HERO ── */}
                  <section className="home-hero">
                    <div className="home-hero-text">
                      <div className="home-hero-kicker">
                        Marketplace creativo
                      </div>
                      <h1 className="home-title">
                        Encuentra <span>Diseñadores</span> &amp; Arquitectos de elite
                      </h1>
                      <p className="home-subtitle">
                        Servicios, libros, cursos y subastas en una sola plataforma. Conecta con los mejores profesionales creativos del mercado.
                      </p>
                      <div className="home-cta-group">
                        <Link to="/services" className="home-cta-primary">
                          <i className="fa-solid fa-compass-drafting"></i>
                          Explorar servicios
                        </Link>
                        <Link to="/auctions" className="home-cta-secondary">
                          <i className="fa-solid fa-gavel"></i>
                          Ver subastas en vivo
                        </Link>
                      </div>
                    </div>
                    <div className="home-hero-visual">
                      <div className="home-stat-tile">
                        <div className="home-stat-num">1.2k+</div>
                        <div className="home-stat-label">Proyectos completados</div>
                      </div>
                      <div className="home-stat-tile">
                        <div className="home-stat-num">80+</div>
                        <div className="home-stat-label">Profesionales</div>
                      </div>
                      <div className="home-stat-tile">
                        <div className="home-stat-num">4.9★</div>
                        <div className="home-stat-label">Valoración media</div>
                      </div>
                      <div className="home-stat-tile">
                        <div className="home-stat-num">&lt;2h</div>
                        <div className="home-stat-label">Tiempo respuesta</div>
                      </div>
                    </div>
                  </section>

                  {/* ── CATEGORIES ── */}
                  <section>
                    <div className="home-section-label">
                      <h2>Explora por categoría</h2>
                      <Link to="/services">Ver todo <i className="fa-solid fa-arrow-right"></i></Link>
                    </div>
                    <div className="home-categories">
                      <Link to="/services" className="home-category-card">
                        <div className="home-category-icon" style={{ background: 'rgba(249,115,22,0.12)', color: '#ea580c' }}>
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                        </div>
                        Diseño &amp; Branding
                      </Link>
                      <Link to="/books" className="home-category-card">
                        <div className="home-category-icon" style={{ background: 'rgba(59,130,246,0.12)', color: '#2563eb' }}>
                          <i className="fa-solid fa-book-open"></i>
                        </div>
                        Biblioteca Digital
                      </Link>
                      <Link to="/courses" className="home-category-card">
                        <div className="home-category-icon" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>
                          <i className="fa-solid fa-graduation-cap"></i>
                        </div>
                        Cursos Online
                      </Link>
                      <Link to="/auctions" className="home-category-card">
                        <div className="home-category-icon" style={{ background: 'rgba(139,92,246,0.12)', color: '#7c3aed' }}>
                          <i className="fa-solid fa-gavel"></i>
                        </div>
                        Subastas en Vivo
                      </Link>
                    </div>
                  </section>

                  {/* ── FEATURES ── */}
                  <section>
                    <div className="home-section-label">
                      <h2>¿Por qué WorkProject?</h2>
                    </div>
                    <div className="home-features">
                      <div className="home-feature-item">
                        <div className="home-feature-icon" style={{ background: 'rgba(249,115,22,0.1)', color: '#ea580c' }}>
                          <i className="fa-solid fa-shield-halved"></i>
                        </div>
                        <div className="home-feature-text">
                          <h4>Pagos 100% seguros</h4>
                          <p>El pago queda retenido hasta que confirmes la entrega. Sin riesgos para el cliente.</p>
                        </div>
                      </div>
                      <div className="home-feature-item">
                        <div className="home-feature-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                          <i className="fa-solid fa-bolt"></i>
                        </div>
                        <div className="home-feature-text">
                          <h4>Respuesta en &lt;2 horas</h4>
                          <p>Los profesionales verificados responden rápido. Chat en tiempo real integrado.</p>
                        </div>
                      </div>
                      <div className="home-feature-item">
                        <div className="home-feature-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#2563eb' }}>
                          <i className="fa-solid fa-star"></i>
                        </div>
                        <div className="home-feature-text">
                          <h4>Profesionales verificados</h4>
                          <p>Cada proveedor pasa por un proceso de verificación. Calidad garantizada.</p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              } />

              <Route path="/books" element={<BooksPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/courses" element={<ProductsPage type="COURSE" />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/chat" element={<AIChatPage />} />

              {/* ✅ AQUÍ ESTÁ EL FIX */}
              <Route path="/client-requests" element={<ClientRequests />} />

              <Route path="/my-downloads" element={<MyDownloads />} />
              <Route path="/auctions" element={<AuctionsPage />} />
              <Route path="/points" element={<PointsPage />} />

            </Route>

            {/* AUTH */}
            <Route path="/register/client" element={<ClientRegister />} />
            <Route path="/login/client" element={<ClientLogin />} />
            <Route path="/login/provider" element={<ProviderLogin />} />
            <Route path="/register/provider" element={<ProviderRegister />} />

            {/* NEW ADMIN PANEL */}
            <Route path="/admin/login"     element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/users"     element={<AdminUsers />} />
            <Route path="/admin/products"  element={<AdminProductsPage />} />
            <Route path="/admin/auctions"  element={<AdminAuctionsPage />} />

            {/* ADMIN (legacy) */}
            <Route path="/admin/add-product" element={<AdminProducts />} />

            <Route
              path="/admin/*"
              element={
                <SystemLayout>
                  <Routes>
                    <Route path="services/new" element={<CreateService />} />
                    <Route path="requests" element={<ServiceRequests />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="catalog" element={<ProviderCatalog />} />
                    <Route path="*" element={<MyServices />} />
                  </Routes>
                </SystemLayout>
              }
            />

            {/* 404 */}
            <Route path="*" element={<h1>404 Not Found</h1>} />

              </Routes>
              </SocketProvider>
            </SystemNotificationProvider>
          </FavoritesProvider>

        </CartProvider>
      </AuthProvider>
    </WebNotificationProvider>
    </AdminProvider>
  )
}

export default App
