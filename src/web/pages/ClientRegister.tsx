import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WebLayout } from './WebLayout';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './ClientLogin.css';
import { API_URL } from '../../config';

export const ClientRegister = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    country: '',
    city: '',
    address: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      const res = await fetch(`${API_URL}/register/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        alert('Cliente registrado con éxito!');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor');
    }
  };

  return (
    <WebLayout>
      <div className="client-auth-container">
        <div className="client-auth-card" style={{ maxWidth: '500px' }}>
          
          <div className="client-auth-header">
            <h2>Registro de Cliente</h2>
            <p>Crea tu perfil para contactar expertos.</p>
          </div>

          <form onSubmit={handleSubmit} className="client-auth-form">

            <div className="client-form-group">
              <label>Nombre Completo</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-user"></i>
                <input
                  name="name"
                  onChange={handleChange}
                  type="text"
                  placeholder="Tu nombre"
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Correo Electrónico</label>
              <div className="client-input-wrapper">
                <i className="fa-regular fa-envelope"></i>
                <input
                  name="email"
                  onChange={handleChange}
                  type="email"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Contraseña</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-lock"></i>
                <input
                  name="password"
                  onChange={handleChange}
                  type="password"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Teléfono (Opcional)</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-phone"></i>
                <input
                  name="phone"
                  onChange={handleChange}
                  type="tel"
                  placeholder="+XX XXX XXX XXX"
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>País (Opcional)</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-globe"></i>
                <input
                  name="country"
                  onChange={handleChange}
                  type="text"
                  placeholder="País"
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Ciudad (Opcional)</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-city"></i>
                <input
                  name="city"
                  onChange={handleChange}
                  type="text"
                  placeholder="Ciudad"
                />
              </div>
            </div>

            <div className="client-form-group">
              <label>Dirección (Opcional)</label>
              <div className="client-input-wrapper">
                <i className="fa-solid fa-location-dot"></i>
                <input
                  name="address"
                  onChange={handleChange}
                  type="text"
                  placeholder="Calle, número, etc."
                />
              </div>
            </div>

            <button type="submit" className="client-btn-submit">
              Registrarse como Cliente <i className="fa-solid fa-user-plus"></i>
            </button>

          </form>

          <div className="client-auth-footer">
            <p>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login/client">Inicia sesión aquí</Link>
            </p>
            <p>
              ¿Eres profesional?{' '}
              <Link to="/register/provider">Regístrate como Diseñador</Link>
            </p>
          </div>

        </div>
      </div>
    </WebLayout>
  );
};