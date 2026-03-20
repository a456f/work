import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import '../styles/admin.css';
import { API_URL } from '../../config';

export const AdminLogin = () => {
  const { login, isAuthenticated } = useAdmin();
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (isAuthenticated) { navigate('/admin/dashboard', { replace: true }); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login({ name: data.name });
        navigate('/admin/dashboard');
      } else {
        setError(data.error || 'Credenciales incorrectas.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-page">
      <div className="adm-login-card">
        <div className="adm-login-logo">
          <div className="adm-login-logo-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <div>
            <div className="adm-login-logo-text">WorkProject</div>
            <div className="adm-login-logo-sub">Panel Admin</div>
          </div>
        </div>
        <h1 className="adm-login-title">Acceso administrativo</h1>
        <p className="adm-login-sub">Introduce tus credenciales para continuar.</p>

        {error && <div className="adm-login-error">{error}</div>}

        <form className="adm-login-form" onSubmit={handleSubmit}>
          <div className="adm-login-group">
            <label>Correo electrónico</label>
            <div className="adm-login-input-wrap">
              <i className="fa-regular fa-envelope"></i>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@admin.com" required />
            </div>
          </div>
          <div className="adm-login-group">
            <label>Contraseña</label>
            <div className="adm-login-input-wrap">
              <i className="fa-solid fa-lock"></i>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <button type="submit" className="adm-login-btn" disabled={loading}>
            {loading
              ? <><i className="fa-solid fa-spinner fa-spin"></i> Verificando...</>
              : <><i className="fa-solid fa-right-to-bracket"></i> Entrar al panel</>
            }
          </button>
        </form>

        <div className="adm-login-hint">
          Credenciales por defecto: <strong>admin@admin.com</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
};
