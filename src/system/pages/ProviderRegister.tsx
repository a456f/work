import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './ProviderLogin.css'; // Reutilizamos los mismos estilos
import { useSystemNotification } from '../context/SystemNotificationContext';

export const ProviderRegister = () => {
  const { notify } = useSystemNotification();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    type: 'ARCHITECT',
    title: '',
    experience_years: 0,
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/register/provider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        notify('Registro Exitoso', 'Tu cuenta ha sido creada correctamente. Inicia sesión.', 'success');
        navigate('/login/provider');
      } else {
        notify('Error de Registro', data.error || 'Hubo un problema al crear tu cuenta.', 'error');
      }
    } catch (error) {
      console.error(error);
      notify('Error de Conexión', 'No se pudo conectar con el servidor.', 'error');
    }
  };

  return (
    <div className="provider-login-container">
      <div className="provider-login-card" style={{ maxWidth: '500px' }}>
        <div className="login-header">
          <div className="login-icon">
            <i className="fa-solid fa-user-plus"></i>
          </div>
          <h2>Registro Profesional</h2>
          <p>Únete a nuestra red de expertos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Nombre Completo</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-user"></i>
              <input name="name" placeholder="Tu nombre" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-wrapper">
              <i className="fa-regular fa-envelope"></i>
              <input name="email" type="email" placeholder="correo@ejemplo.com" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-lock"></i>
              <input name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
            </div>
          </div>
        
          <div className="form-group">
            <label>Especialidad</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-briefcase"></i>
              <select name="type" onChange={handleChange} value={formData.type}>
                <option value="ARCHITECT">Arquitecto</option>
                <option value="DESIGNER">Diseñador</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Título Profesional</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-graduation-cap"></i>
              <input name="title" placeholder="Ej. Arquitecto Senior" onChange={handleChange} required />
            </div>
          </div>

          <div className="form-group">
            <label>Años de Experiencia</label>
            <div className="input-wrapper">
              <i className="fa-solid fa-calendar-days"></i>
              <input name="experience_years" type="number" placeholder="0" onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="btn-login">
            Crear Cuenta <i className="fa-solid fa-arrow-right"></i>
          </button>
        </form>
        
        <div className="login-footer">
          <p>¿Ya tienes cuenta? <Link to="/login/provider">Inicia sesión aquí</Link></p>
          <Link to="/" style={{fontSize: '0.85rem', color: '#888', marginTop: '10px', display: 'block'}}>Volver al inicio</Link>
        </div>
      </div>
    </div>
  );
};
