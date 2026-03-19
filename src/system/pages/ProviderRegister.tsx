import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';

export const ProviderRegister = () => {
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
        alert('Registro exitoso. Por favor inicia sesión.');
        navigate('/login/provider');
      } else {
        alert(data.error || 'Error en el registro');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '2rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Registro de Profesional</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input name="name" placeholder="Nombre Completo" onChange={handleChange} required style={{padding: '8px'}} />
        <input name="email" type="email" placeholder="Correo Electrónico" onChange={handleChange} required style={{padding: '8px'}} />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required style={{padding: '8px'}} />
        
        <select name="type" onChange={handleChange} value={formData.type} style={{padding: '8px'}}>
          <option value="ARCHITECT">Arquitecto</option>
          <option value="DESIGNER">Diseñador</option>
        </select>

        <input name="title" placeholder="Título Profesional (ej. Arquitecto Senior)" onChange={handleChange} required style={{padding: '8px'}} />
        <input name="experience_years" type="number" placeholder="Años de Experiencia" onChange={handleChange} required style={{padding: '8px'}} />
        <textarea name="description" placeholder="Breve descripción de tu perfil" onChange={handleChange} style={{padding: '8px'}} />

        <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: 'none', cursor:'pointer' }}>Registrarse</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        ¿Ya tienes cuenta? <Link to="/login/provider">Inicia sesión aquí</Link>
      </p>
    </div>
  );
};
