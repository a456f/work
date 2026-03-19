import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Asegurar iconos
import './ProviderLogin.css';
import { useSystemNotification } from '../context/SystemNotificationContext';

export const ProviderLogin = () => {
  const { notify } = useSystemNotification();
  const navigate = useNavigate();
  const [creds, setCredentials] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...creds, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();

      if (res.ok) {
        if (data.role !== 'PROVIDER') {
          notify('Acceso Denegado', 'Esta cuenta no es de profesional.', 'error');
          return;
        }
        localStorage.setItem('currentUser', JSON.stringify(data));
        notify('Bienvenido', `Hola, ${data.name}`, 'success');
        navigate('/admin');
      } else {
        notify('Error de Acceso', data.error || 'Credenciales incorrectas.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error de Conexión', 'Verifique su conexión a internet.', 'error');
    }
  };

  return (
    <div className="provider-login-container">
      <div className="provider-login-card">
        <div className="login-header">
          <div className="login-icon">
            <i className="fa-solid fa-drafting-compass"></i>
          </div>
          <h2>Acceso Profesional</h2>
          <p>Gestiona tus servicios y proyectos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Correo Profesional</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-envelope"></i>
              <input 
                name="email" 
                type="email" 
                placeholder="arquitecto@ejemplo.com" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input 
                name="password" 
                type="password" 
                placeholder="••••••••" 
                onChange={handleChange} 
                required 
              />
            </div>
          </div>

          <button type="submit" className="btn-login">
            Ingresar al Panel <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿Aún no tienes cuenta? <Link to="/register/provider">Regístrate aquí</Link></p>
          <Link to="/" style={{fontSize: '0.85rem', color: '#a0aec0', marginTop: '10px', display: 'block'}}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
};