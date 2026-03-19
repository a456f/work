import { Routes, Route } from 'react-router-dom'
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

function App() {
  return ( 
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <Routes>

          {/* 🔥 WEB */}
          <Route element={<WebLayout children={undefined} />}>

            <Route path="/" element={
              <div className="home-container">
                <h1 className="home-title">
                  Encuentra Arquitectos y Diseñadores
                </h1>
                <p className="home-subtitle">
                  Conecta con profesionales creativos
                </p>
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

          </Route>

          {/* AUTH */}
          <Route path="/register/client" element={<ClientRegister />} />
          <Route path="/login/client" element={<ClientLogin />} />
          <Route path="/login/provider" element={<ProviderLogin />} />
          <Route path="/register/provider" element={<ProviderRegister />} />

          {/* ADMIN */}
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
        </FavoritesProvider>

      </CartProvider>
    </AuthProvider>
  )
}

export default App