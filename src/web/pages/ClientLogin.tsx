import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="login-container" style={{ maxWidth: '400px', margin: '4rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Iniciar Sesión</h2>
      {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Correo Electrónico:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" style={{ padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
          Ingresar
        </button>
                <Link to="/" style={{ textAlign: 'center', display: 'block', marginBottom: '0.5rem'}}>¿Olvidaste tu contraseña?</Link>

      </form>
         <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        ¿No tienes cuenta? <Link to="/register/client">Regístrate como Cliente</Link>
        |
        <Link to="/register/provider">Regístrate como Diseñador</Link>
      </p>
    </div>
  );
};