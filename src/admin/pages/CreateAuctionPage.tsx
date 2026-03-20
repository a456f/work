import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

const CATEGORIES = ['Arte', 'Electronica', 'Vehiculos', 'Inmuebles', 'Joyeria', 'Coleccionables', 'Moda', 'Deportes'];
const CONDITIONS  = ['Nuevo', 'Como nuevo', 'Buen estado', 'Aceptable', 'Para reparar'];

export const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const now          = new Date();
  const defaultStart = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const defaultEnd   = new Date(now.getTime() + 7 * 24 * 3600000).toISOString().slice(0, 16);

  const [form, setForm] = useState({
    title: '', description: '', category: '', image_url: '',
    condition_text: '', location_text: '', lot_code: '',
    brand: '', model: '', year_text: '',
    starting_price: '', start_time: defaultStart, end_time: defaultEnd,
    is_featured: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const set = (k: string, v: string | boolean) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.starting_price || !form.start_time || !form.end_time) {
      setError('Título, precio inicial, fecha de inicio y cierre son obligatorios.');
      return;
    }
    if (new Date(form.end_time) <= new Date(form.start_time)) {
      setError('La fecha de cierre debe ser posterior a la de inicio.');
      return;
    }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/auctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) navigate('/admin/auctions');
      else setError(data.error || 'Error al crear la subasta.');
    } catch { setError('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout title="Crear Subasta" subtitle="Configura una nueva subasta en vivo">
      <div className="adm-page-header">
        <div>
          <h2 className="adm-page-title">Nueva subasta</h2>
          <p className="adm-page-sub">Los campos marcados con * son obligatorios.</p>
        </div>
        <Link to="/admin/auctions" className="adm-btn adm-btn-secondary"><i className="fa-solid fa-arrow-left"></i> Volver</Link>
      </div>

      {error && <div className="adm-login-error" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="adm-form-card">

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
            <Link to="/admin/auctions" className="adm-btn adm-btn-secondary">Cancelar</Link>
            <button type="submit" className="adm-form-submit" disabled={submitting}>
              {submitting
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando subasta...</>
                : <><i className="fa-solid fa-hammer"></i> Crear subasta</>
              }
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};
