import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

interface Stats {
  total_users: number;
  total_products: number;
  total_auctions: number;
  active_auctions: number;
  total_orders: number;
  total_bids: number;
}

export const Dashboard = () => {
  const [stats, setStats]     = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/admin/stats`)
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = stats ? [
    { label: 'Usuarios registrados', num: stats.total_users,    color: 'blue',   icon: 'fa-solid fa-users',      link: '/admin/users'   },
    { label: 'Productos totales',    num: stats.total_products,  color: 'orange', icon: 'fa-solid fa-box',        link: '/admin/products'},
    { label: 'Subastas totales',     num: stats.total_auctions,  color: 'purple', icon: 'fa-solid fa-gavel',      link: '/admin/auctions'},
    { label: 'Subastas activas',     num: stats.active_auctions, color: 'green',  icon: 'fa-solid fa-circle-dot', link: '/admin/auctions'},
    { label: 'Órdenes realizadas',   num: stats.total_orders,    color: 'gold',   icon: 'fa-solid fa-receipt',    link: '#'              },
    { label: 'Pujas totales',        num: stats.total_bids,      color: 'red',    icon: 'fa-solid fa-fire',       link: '/admin/auctions'},
  ] : [];

  const quickLinks = [
    { to: '/admin/create-product', icon: 'fa-solid fa-circle-plus', label: 'Crear producto',  desc: 'Agregar nuevo libro o curso'          },
    { to: '/admin/create-auction', icon: 'fa-solid fa-hammer',      label: 'Crear subasta',   desc: 'Configurar nueva subasta'             },
    { to: '/admin/users',          icon: 'fa-solid fa-users',       label: 'Ver usuarios',    desc: 'Gestionar clientes y proveedores'     },
    { to: '/admin/products',       icon: 'fa-solid fa-box',         label: 'Ver productos',   desc: 'Lista completa de productos'          },
  ];

  return (
    <AdminLayout title="Dashboard" subtitle="Resumen general de la plataforma">
      {loading ? (
        <div className="adm-loading"><i className="fa-solid fa-spinner fa-spin"></i> Cargando métricas...</div>
      ) : (
        <>
          <div className="adm-stats-grid">
            {cards.map(c => (
              <Link to={c.link} key={c.label} className="adm-stat-card" style={{ textDecoration: 'none' }}>
                <div className={`adm-stat-icon ${c.color}`}><i className={c.icon}></i></div>
                <div>
                  <div className="adm-stat-num">{Number(c.num).toLocaleString('es-ES')}</div>
                  <div className="adm-stat-label">{c.label}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="adm-recent-grid">
            <div className="adm-card">
              <div className="adm-card-title"><i className="fa-solid fa-bolt" style={{ color: 'var(--adm-accent)', marginRight: 8 }}></i>Acciones rápidas</div>
              <div className="adm-activity-list">
                {quickLinks.map(l => (
                  <Link to={l.to} key={l.to} className="adm-activity-item" style={{ textDecoration: 'none' }}>
                    <div className="adm-activity-dot" style={{ background: 'var(--adm-accent)' }}></div>
                    <div className="adm-activity-text">
                      <strong style={{ color: 'var(--adm-text)' }}>{l.label}</strong>
                      <div style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>{l.desc}</div>
                    </div>
                    <i className="fa-solid fa-chevron-right" style={{ color: 'var(--adm-text-muted)', fontSize: '0.74rem' }}></i>
                  </Link>
                ))}
              </div>
            </div>

            <div className="adm-card">
              <div className="adm-card-title"><i className="fa-solid fa-circle-info" style={{ color: 'var(--adm-info)', marginRight: 8 }}></i>Estado del sistema</div>
              <div className="adm-activity-list">
                {[
                  { label: 'Backend API',        ok: true },
                  { label: 'Base de datos',       ok: true },
                  { label: 'Socket.io (RT)',      ok: true },
                  { label: 'Sistema de subastas', ok: (stats?.active_auctions ?? 0) > 0 },
                  { label: 'Puntos de clientes',  ok: true },
                ].map(s => (
                  <div key={s.label} className="adm-activity-item">
                    <div className="adm-activity-dot" style={{ background: s.ok ? 'var(--adm-success)' : 'var(--adm-danger)' }}></div>
                    <div className="adm-activity-text" style={{ color: 'var(--adm-text-sub)' }}>{s.label}</div>
                    <span className={`adm-badge ${s.ok ? 'adm-badge-active' : 'adm-badge-cancelled'}`}>{s.ok ? 'OK' : 'REVISAR'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};
