import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WebLayout } from './WebLayout';
import { API_URL } from '../../config';
  
  export const LoginPage = () => {
    const navigate = useNavigate();
    const [creds, setCredentials] = useState({ email: '', password: '' });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCredentials({ ...creds, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(creds)
        });
  
        const data = await res.json();
  
        if (res.ok) {
          // Guardar sesión (simple)
          localStorage.setItem('currentUser', JSON.stringify(data));
          
          if (data.role === 'PROVIDER') {
            navigate('/admin'); // Ir al panel de sistema
          } else {
            navigate('/'); // Clientes van al inicio por ahora
          }
        } else {
          alert(data.error);
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión');
      }
    };
  
    return (
      <WebLayout> 
        <div style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2>Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required />
            <button type="submit" className="btn-primary" style={{ padding: '0.5rem', background: '#333', color: 'white', border: 'none' }}>Entrar</button>
          </form>
        </div>
      </WebLayout>
    );
  };
