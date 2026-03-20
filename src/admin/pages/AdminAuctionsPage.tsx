import { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

interface Auction {
  id: number;
  title: string;
  current_price: number;
  starting_price: number;
  status: string;
  end_time: string;
  bid_count: number;
  category: string | null;
  seller_name: string | null;
}

const STATUS_MAP: Record<string, string> = {
  ACTIVE:    'adm-badge-active',
  PAUSED:    'adm-badge-paused',
  ENDED:     'adm-badge-ended',
  CANCELLED: 'adm-badge-cancelled',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activa', PAUSED: 'Pausada', ENDED: 'Finalizada', CANCELLED: 'Cancelada',
};

const CATEGORIES = ['Arte', 'Electronica', 'Vehiculos', 'Inmuebles', 'Joyeria', 'Coleccionables', 'Moda', 'Deportes'];
const CONDITIONS  = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable', 'Para reparar'];

const makeDefaultForm = () => {
  const now        = new Date();
  const defaultStart = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const defaultEnd   = new Date(now.getTime() + 7 * 24 * 3600000).toISOString().slice(0, 16);
  return {
    title: '', description: '', category: '', image_url: '',
    condition_text: '', location_text: '', lot_code: '',
    brand: '', model: '', year_text: '',
    starting_price: '', start_time: defaultStart, end_time: defaultEnd,
    is_featured: false,
  };
};

export const AdminAuctionsPage = () => {
  const [auctions, setAuctions]         = useState<Auction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [updating, setUpdating]         = useState<number | null>(null);

  // modal
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(makeDefaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/auctions`)
      .then(r => r.json())
      .then(d => setAuctions(Array.isArray(d) ? d.map((a: Auction) => ({
        ...a,
        current_price:  parseFloat(String(a.current_price)),
        starting_price: parseFloat(String(a.starting_price)),
        bid_count:      Number(a.bid_count) || 0,
      })) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatus = async (id: number, status: string) => {
    if (!confirm(`¿Cambiar estado a "${STATUS_LABELS[status]}"?`)) return;
    setUpdating(id);
    try {
      const res = await fetch(`${API_URL}/admin/auctions/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) load();
      else alert('Error al actualizar estado.');
    } catch { alert('Error de conexión.'); }
    finally { setUpdating(null); }
  };

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const openModal  = () => { setForm(makeDefaultForm()); setFormError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.starting_price || !form.start_time || !form.end_time) {
      setFormError('Título, precio inicial, fecha de inicio y cierre son obligatorios.');
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setFormError('La fecha de cierre debe ser posterior a la de inicio.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { closeModal(); load(); }
      else setFormError(data.error || 'Error al crear la subasta.');
    } catch { setFormError('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  const filtered = auctions.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const activeCount = auctions.filter(a => a.status === 'ACTIVE').length;
  const totalBids   = auctions.reduce((s, a) => s + a.bid_count, 0);

  return (
    <AdminLayout title="Subastas" subtitle="Gestión y control de todas las subastas">

      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
        <div className="adm-stat-card"><div className="adm-stat-icon purple"><i className="fa-solid fa-gavel"></i></div><div><div className="adm-stat-num">{auctions.length}</div><div className="adm-stat-label">Total</div></div></div>
        <div className="adm-stat-card"><div className="adm-stat-icon green"><i className="fa-solid fa-circle-dot"></i></div><div><div className="adm-stat-num">{activeCount}</div><div className="adm-stat-label">Activas</div></div></div>
        <div className="adm-stat-card"><div className="adm-stat-icon gold"><i className="fa-solid fa-fire"></i></div><div><div className="adm-stat-num">{totalBids}</div><div className="adm-stat-label">Pujas totales</div></div></div>
        <div className="adm-stat-card"><div className="adm-stat-icon blue"><i className="fa-solid fa-clock"></i></div><div><div className="adm-stat-num">{auctions.filter(a => a.status === 'ENDED').length}</div><div className="adm-stat-label">Finalizadas</div></div></div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-toolbar">
          <span className="adm-table-toolbar-title">Lista de subastas</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="adm-search-input" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activas</option>
              <option value="PAUSED">Pausadas</option>
              <option value="ENDED">Finalizadas</option>
              <option value="CANCELLED">Canceladas</option>
            </select>
            <input className="adm-search-input" placeholder="Buscar subasta..." value={search} onChange={e => setSearch(e.target.value)} />
            <button className="adm-btn adm-btn-primary" onClick={openModal}><i className="fa-solid fa-hammer"></i> Crear</button>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><i className="fa-solid fa-spinner fa-spin"></i> Cargando subastas...</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty"><i className="fa-solid fa-gavel"></i><p>No hay subastas.</p></div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Subasta</th><th>Estado</th><th>Precio actual</th><th>Pujas</th><th>Cierre</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td>
                    <div className="adm-table-name">#{a.id} {a.title}</div>
                    <div className="adm-table-sub">{a.category || 'Sin categoría'} · Inicio: ${a.starting_price.toFixed(2)}</div>
                  </td>
                  <td><span className={`adm-badge ${STATUS_MAP[a.status] || 'adm-badge-ended'}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--adm-text)' }}>${a.current_price.toFixed(2)}</td>
                  <td>{a.bid_count}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>
                    {new Date(a.end_time).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div className="adm-table-actions" style={{ flexWrap: 'wrap' }}>
                      {a.status !== 'ACTIVE' && <button className="adm-btn adm-btn-success adm-btn-sm" disabled={updating === a.id} onClick={() => handleStatus(a.id, 'ACTIVE')}><i className="fa-solid fa-play"></i> Activar</button>}
                      {a.status === 'ACTIVE' && <button className="adm-btn adm-btn-secondary adm-btn-sm" disabled={updating === a.id} onClick={() => handleStatus(a.id, 'PAUSED')}><i className="fa-solid fa-pause"></i> Pausar</button>}
                      {a.status !== 'ENDED'  && <button className="adm-btn adm-btn-danger adm-btn-sm" disabled={updating === a.id} onClick={() => handleStatus(a.id, 'ENDED')}><i className="fa-solid fa-stop"></i> Finalizar</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal crear subasta ── */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title"><i className="fa-solid fa-hammer" style={{ color: 'var(--adm-accent)', marginRight: 8 }}></i>Nueva subasta</h3>
              <button className="adm-modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="adm-modal-body">
              {formError && <div className="adm-login-error" style={{ marginBottom: 18 }}>{formError}</div>}
              <form onSubmit={handleSubmit}>

                <div className="adm-form-section-title">Información del artículo</div>
                <div className="adm-form-grid">
                  <div className="adm-form-group span-2">
                    <label className="adm-form-label">Título <span>*</span></label>
                    <input className="adm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Reloj Rolex Submariner 2023" required />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Categoría</label>
                    <select className="adm-select" value={form.category} onChange={e => set('category', e.target.value)}>
                      <option value="">Sin categoría</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Estado del artículo</label>
                    <select className="adm-select" value={form.condition_text} onChange={e => set('condition_text', e.target.value)}>
                      <option value="">Sin especificar</option>
                      {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="adm-form-group span-2">
                    <label className="adm-form-label">Descripción</label>
                    <textarea className="adm-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe detalladamente el artículo..." />
                  </div>
                </div>

                <div className="adm-form-section-title">
                  Detalles técnicos <span style={{ fontSize: '0.72rem', fontWeight: 400, textTransform: 'none', color: 'var(--adm-text-muted)' }}>(opcionales)</span>
                </div>
                <div className="adm-form-grid cols-3">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Marca</label>
                    <input className="adm-input" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Ej. Rolex" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Modelo</label>
                    <input className="adm-input" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Ej. Submariner" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Año</label>
                    <input className="adm-input" value={form.year_text} onChange={e => set('year_text', e.target.value)} placeholder="Ej. 2023" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Código de lote</label>
                    <input className="adm-input" value={form.lot_code} onChange={e => set('lot_code', e.target.value)} placeholder="Ej. LOT-001" />
                  </div>
                  <div className="adm-form-group span-2">
                    <label className="adm-form-label">Ubicación</label>
                    <input className="adm-input" value={form.location_text} onChange={e => set('location_text', e.target.value)} placeholder="Ej. Ciudad de México, MX" />
                  </div>
                </div>

                <div className="adm-form-section-title">Imagen</div>
                <div className="adm-form-group">
                  <label className="adm-form-label">URL de imagen <span>(opcional)</span></label>
                  <input className="adm-input" type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
                </div>

                <div className="adm-form-section-title">Configuración de la subasta</div>
                <div className="adm-form-grid cols-3">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Precio inicial (pts) <span>*</span></label>
                    <input className="adm-input" type="number" step="1" min="1" value={form.starting_price} onChange={e => set('starting_price', e.target.value)} placeholder="Ej. 100" required />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Inicio <span>*</span></label>
                    <input className="adm-input" type="datetime-local" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Cierre <span>*</span></label>
                    <input className="adm-input" type="datetime-local" value={form.end_time} onChange={e => set('end_time', e.target.value)} required />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label className="adm-checkbox-row" style={{ maxWidth: 340 }}>
                    <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--adm-text)' }}>Marcar como PREMIUM</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--adm-text-muted)' }}>Aparece destacada en la sección principal</div>
                    </div>
                  </label>
                </div>

                <div className="adm-form-actions">
                  <button type="button" className="adm-btn adm-btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="adm-form-submit" disabled={submitting}>
                    {submitting
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando subasta...</>
                      : <><i className="fa-solid fa-hammer"></i> Crear subasta</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
