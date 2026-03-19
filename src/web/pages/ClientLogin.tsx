import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../config';
import { AUTH_CHANGED_EVENT } from '../context/SocketContext';
import './ClientLogin.css';

interface LoginResponse {
  id: number;
  email: string;
  role: 'CLIENT' | 'PROVIDER';
  token?: string;
}

export const ClientLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al iniciar sesion');
      }

      const data: LoginResponse = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(data));
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate(data.role === 'PROVIDER' ? '/admin' : '/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-auth-shell">
      <div className="client-auth-panel">
        <div className="client-auth-aside">
          <span className="eyebrow">Acceso clientes</span>
          <h1>Entra a tu espacio creativo</h1>
          <p>Gestiona solicitudes, guarda favoritos y compra recursos con una experiencia mas ordenada y moderna.</p>
          <ul>
            <li>Solicitudes y chat con profesionales</li>
            <li>Favoritos sincronizados</li>
            <li>Compras y descargas en un solo lugar</li>
          </ul>
        </div>

        <div className="client-auth-card">
          <div className="client-auth-header">
            <h2>Iniciar sesion</h2>
            <p>Accede para continuar con tus proyectos y recursos.</p>
          </div>

          {error && <div className="client-error-message">{error}</div>}

          <form className="client-auth-form" onSubmit={handleSubmit}>
            <div className="client-form-group">
              <label htmlFor="email">Correo electronico</label>
              <div className="client-input-wrapper">
                <i className="fa-regular fa-envelope"></i>
                <input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="client-form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
            </div>

            <button type="submit" className="client-auth-submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Entrar a mi cuenta'}
            </button>
          </form>

          <div className="client-auth-footer">
            <span>¿Todavia no tienes cuenta?</span>
            <Link to="/register/client">Crear cuenta</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
