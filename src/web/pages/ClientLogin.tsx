import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WebLayout } from './WebLayout';
import { API_URL } from '../../config';

export const ClientLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      
      // Guardar usuario en localStorage
      localStorage.setItem('currentUser', JSON.stringify(data));

      // Redirigir según el rol
      if (data.role === 'PROVIDER') {
        navigate('/admin');

      } else {
        navigate('/'); // Redirigir a la home o dashboard de cliente
      }

    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <WebLayout>
      <div className="client-auth-container">
        <div className="client-auth-card">
          <div className="client-auth-header">
            <h2>Iniciar Sesión</h2>
            <p>Accede a tu cuenta de cliente</p>
          </div>

          {error && <div className="client-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="client-auth-form">
            <div className="client-form-group">
              <label>Correo Electrónico</label>
              <div className="client-input-wrapper">
                <i className="fa-regular fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Contraseña</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" className="client-btn-submit">
              Ingresar <i className="fa-solid fa-arrow-right"></i>
            </button>

            <Link to="/" className="client-auth-footer" style={{ textAlign: 'center', display: 'block', marginBottom: '0.5rem', borderTop: 'none', paddingTop: '0' }}>¿Olvidaste tu contraseña?</Link>
          </form>

          <div className="client-auth-footer">
            <p>¿No tienes cuenta? <Link to="/register/client">Regístrate como Cliente</Link></p>
            <p>¿Eres profesional? <Link to="/register/provider">Regístrate como Diseñador</Link></p>
          </div>
        </div>
      </div>
    </WebLayout>
  );
};