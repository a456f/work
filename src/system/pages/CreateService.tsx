import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateService.css';
import { API_URL } from '../../config';

export const CreateService = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', description: '', base_price: '', min_days: '', max_days: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Recuperar ID del proveedor logueado
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return alert('No has iniciado sesión');
    const user = JSON.parse(userStr);

    if (user.role !== 'PROVIDER') return alert('Solo los proveedores pueden crear servicios');

    try {
      const res = await fetch(`${API_URL}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          provider_id: user.providerId // ID clave para la relación
        })
      });

      if (res.ok) {
        alert('¡Servicio creado exitosamente!');
        // Redirigir al listado de servicios
        navigate('/admin');
      } else {
        alert('Error al crear servicio');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div className="create-service-container">
      <div className="create-service-header">
        <h2><i className="fa-solid fa-plus-circle"></i> Nuevo Servicio</h2>
        <p>Completa la información para publicar tu servicio en el marketplace.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="cs-form-group">
          <label>Título del Servicio</label>
          <input 
            className="cs-input"
            name="title" 
            placeholder="Ej. Diseño de Interiores Moderno" 
            value={formData.title} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="cs-form-group">
          <label>Descripción Detallada</label>
          <textarea 
            className="cs-textarea"
            name="description" 
            placeholder="Describe lo que incluye tu servicio, entregables, proceso..." 
            value={formData.description} 
            onChange={handleChange} 
          />
        </div>

        <div className="cs-row">
          <div className="cs-col cs-form-group">
            <label>Precio Base</label>
            <div className="input-with-icon">
              <span>$</span>
              <input className="cs-input" name="base_price" type="number" placeholder="0.00" value={formData.base_price} onChange={handleChange} required />
            </div>
          </div>
          <div className="cs-col cs-form-group">
            <label>Tiempo Mínimo (Días)</label>
            <input className="cs-input" name="min_days" type="number" placeholder="Ej. 3" value={formData.min_days} onChange={handleChange} />
          </div>
          <div className="cs-col cs-form-group">
            <label>Tiempo Máximo (Días)</label>
            <input className="cs-input" name="max_days" type="number" placeholder="Ej. 7" value={formData.max_days} onChange={handleChange} />
          </div>
        </div>

        <button type="submit" className="cs-btn-submit">
          <i className="fa-solid fa-paper-plane"></i> Publicar Servicio
        </button>
      </form>
    </div>
  );
};
