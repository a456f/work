import { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  country: string | null;
  city: string | null;
  created_at: string;
}

export const AdminUsers = () => {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    fetch(`${API_URL}/admin/users`)
      .then(r => r.json())
      .then(d => setUsers(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const clients   = users.filter(u => u.role === 'CLIENT').length;
  const providers = users.filter(u => u.role === 'PROVIDER').length;

  return (
    <AdminLayout title="Usuarios" subtitle="Gestión de clientes y proveedores registrados">

      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
        <div className="adm-stat-card">
          <div className="adm-stat-icon blue"><i className="fa-solid fa-users"></i></div>
          <div><div className="adm-stat-num">{users.length}</div><div className="adm-stat-label">Total</div></div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon orange"><i className="fa-solid fa-user"></i></div>
          <div><div className="adm-stat-num">{clients}</div><div className="adm-stat-label">Clientes</div></div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon purple"><i className="fa-solid fa-user-tie"></i></div>
          <div><div className="adm-stat-num">{providers}</div><div className="adm-stat-label">Proveedores</div></div>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-toolbar">
          <span className="adm-table-toolbar-title">Lista de usuarios</span>
          <input
            className="adm-search-input"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="adm-loading"><i className="fa-solid fa-spinner fa-spin"></i> Cargando usuarios...</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty"><i className="fa-solid fa-users"></i><p>No se encontraron usuarios.</p></div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Ubicación</th>
                <th>Teléfono</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td style={{ color: 'var(--adm-text-muted)', fontSize: '0.78rem' }}>#{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: u.role === 'CLIENT' ? 'rgba(59,130,246,0.12)' : 'rgba(139,92,246,0.12)',
                        display: 'grid', placeItems: 'center',
                        color: u.role === 'CLIENT' ? '#1d4ed8' : '#6d28d9',
                        fontSize: '0.72rem', fontWeight: 800, flexShrink: 0
                      }}>
                        {u.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="adm-table-name">{u.name}</div>
                        <div className="adm-table-sub">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`adm-badge ${u.role === 'CLIENT' ? 'adm-badge-client' : 'adm-badge-provider'}`}>
                      {u.role === 'CLIENT' ? 'Cliente' : 'Proveedor'}
                    </span>
                  </td>
                  <td>{[u.city, u.country].filter(Boolean).join(', ') || <span style={{ color: 'var(--adm-text-muted)' }}>—</span>}</td>
                  <td>{u.phone || <span style={{ color: 'var(--adm-text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};
