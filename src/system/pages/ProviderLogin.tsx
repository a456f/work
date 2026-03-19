import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../config';

export const ProviderLogin = () => {
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
        if (data.role !== 'PROVIDER') return alert('Esta cuenta no es de profesional.');
        localStorage.setItem('currentUser', JSON.stringify(data));
        navigate('/admin');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f4f4f4' }}>
      <div style={{ padding: '2rem', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Acceso Profesionales</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px' }}>
          <input name="email" type="email" placeholder="Email Profesional" onChange={handleChange} required style={{ padding: '10px' }} />
          <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required style={{ padding: '10px' }} />
          <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: 'none', cursor: 'pointer' }}>Entrar al Panel</button>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center' }}>¿Eres nuevo? <Link to="/register/provider">Regístrate aquí</Link></p>
      </div>
    </div>
  );
};