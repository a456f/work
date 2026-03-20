import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ClientLogin.css';
import { API_URL } from '../../config';

export const ClientRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    city: '',
    address: '',
  });
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/register/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/login/client');
      } else {
        setError(data.error || 'No se pudo crear la cuenta.');
      }
    } catch {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-auth-shell">
      <div className="client-auth-panel">

        {/* ── Left panel ── */}
        <div className="client-auth-aside">
          <div>
            <span className="eyebrow">Crear cuenta</span>
            <h1>Únete a la comunidad creativa</h1>
            <p>Accede a servicios profesionales, cursos, libros y subastas exclusivas desde un solo lugar.</p>
          </div>
          <ul>
            <li>Solicitudes directas a profesionales</li>
            <li>Favoritos y carrito sincronizados</li>
            <li>Participación en subastas en vivo</li>
            <li>Historial de compras y descargas</li>
          </ul>
        </div>

        {/* ── Right panel ── */}
        <div className="client-auth-card">
          <div className="client-auth-header">
            <h2>Crear cuenta</h2>
            <p>Completa el formulario para comenzar.</p>
          </div>

          {error && <div className="client-error-message">{error}</div>}

          <form className="client-auth-form" onSubmit={handleSubmit}>

            <div className="client-form-group">
              <label htmlFor="name">Nombre completo</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-user"></i>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="client-input-wrapper">
                <i className="fa-regular fa-envelope"></i>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label htmlFor="phone">Teléfono <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span></label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-phone"></i>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+XX XXX XXX XXX"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="client-form-row">
              <div className="client-form-group">
                <label htmlFor="country">País <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span></label>
                <div className="client-input-wrapper">
                  <i className="fa-solid fa-globe"></i>
                  <input
                    id="country"
                    name="country"
                    type="text"
                    placeholder="País"
                    value={formData.country}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="client-form-group">
                <label htmlFor="city">Ciudad <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span></label>
                <div className="client-input-wrapper">
                  <i className="fa-solid fa-city"></i>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Ciudad"
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="client-form-group">
              <label htmlFor="address">Dirección <span style={{ fontWeight: 400, opacity: .6 }}>(opcional)</span></label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-location-dot"></i>
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Calle, número, etc."
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="client-auth-submit" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando cuenta...</>
                : <><i className="fa-solid fa-user-plus"></i> Crear cuenta</>
              }
            </button>

          </form>

          <div className="client-auth-footer">
            <span>¿Ya tienes cuenta?</span>
            <Link to="/login/client">Inicia sesión aquí</Link>
            <span style={{ width: '100%' }}>¿Eres profesional? <Link to="/register/provider">Regístrate como Diseñador</Link></span>
          </div>
        </div>

      </div>
    </div>
  );
};
