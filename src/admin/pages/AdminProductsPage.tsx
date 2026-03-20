import { useState, useEffect } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  type: string;
  image_url: string | null;
  created_at: string;
}

const emptyForm = {
  title: '', description: '', price: '', type: 'BOOK',
  author: '', file_url: '', image_url: '', pages: '',
  level: '', duration: ''
};

export const AdminProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('ALL');
  const [deleting, setDeleting] = useState<number | null>(null);

  // modal
  const [showModal, setShowModal]   = useState(false);
  const [form, setForm]             = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState('');

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/products`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`${API_URL}/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) load();
      else alert('Error al eliminar el producto.');
    } catch { alert('Error de conexión.'); }
    finally { setDeleting(null); }
  };

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const openModal = () => { setForm(emptyForm); setFormError(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title || !form.price || !form.type) { setFormError('Título, precio y tipo son obligatorios.'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:       form.title,
          description: form.description,
          price:       parseFloat(form.price),
          type:        form.type,
          author:      form.author,
          file_url:    form.file_url,
          image_url:   form.image_url,
          pages:       form.pages ? parseInt(form.pages) : null,
          level:       form.level,
          duration:    form.duration,
        }),
      });
      const data = await res.json();
      if (res.ok) { closeModal(); load(); }
      else setFormError(data.error || 'Error al crear el producto.');
    } catch { setFormError('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || p.type === filter;
    return matchSearch && matchFilter;
  });

  const books   = products.filter(p => p.type === 'BOOK').length;
  const courses = products.filter(p => p.type === 'COURSE').length;

  return (
    <AdminLayout title="Productos" subtitle="Gestión de libros y cursos de la plataforma">

      <div className="adm-stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 24 }}>
        <div className="adm-stat-card">
          <div className="adm-stat-icon orange"><i className="fa-solid fa-box"></i></div>
          <div><div className="adm-stat-num">{products.length}</div><div className="adm-stat-label">Total</div></div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon blue"><i className="fa-solid fa-book"></i></div>
          <div><div className="adm-stat-num">{books}</div><div className="adm-stat-label">Libros</div></div>
        </div>
        <div className="adm-stat-card">
          <div className="adm-stat-icon green"><i className="fa-solid fa-graduation-cap"></i></div>
          <div><div className="adm-stat-num">{courses}</div><div className="adm-stat-label">Cursos</div></div>
        </div>
      </div>

      <div className="adm-table-wrap">
        <div className="adm-table-toolbar">
          <span className="adm-table-toolbar-title">Lista de productos</span>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="adm-search-input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="ALL">Todos los tipos</option>
              <option value="BOOK">Libros</option>
              <option value="COURSE">Cursos</option>
            </select>
            <input
              className="adm-search-input"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="adm-btn adm-btn-primary" onClick={openModal}>
              <i className="fa-solid fa-circle-plus"></i> Crear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="adm-loading"><i className="fa-solid fa-spinner fa-spin"></i> Cargando productos...</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty"><i className="fa-solid fa-box-open"></i><p>No hay productos.</p></div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Producto</th><th>Tipo</th><th>Precio</th><th>Creado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {p.image_url
                        ? <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 40, height: 40, borderRadius: 8, background: '#f1f5f9', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                            <i className="fa-solid fa-image" style={{ color: '#cbd5e1', fontSize: '0.8rem' }}></i>
                          </div>
                      }
                      <div>
                        <div className="adm-table-name">{p.title}</div>
                        <div className="adm-table-sub" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.description || '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`adm-badge ${p.type === 'BOOK' ? 'adm-badge-book' : 'adm-badge-course'}`}>{p.type === 'BOOK' ? 'Libro' : 'Curso'}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--adm-text)' }}>${Number(p.price).toFixed(2)}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--adm-text-muted)' }}>
                    {new Date(p.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <div className="adm-table-actions">
                      <button
                        className="adm-btn adm-btn-danger adm-btn-sm"
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                      >
                        {deleting === p.id
                          ? <i className="fa-solid fa-spinner fa-spin"></i>
                          : <i className="fa-solid fa-trash"></i>
                        }
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal crear producto ── */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="adm-modal">
            <div className="adm-modal-header">
              <h3 className="adm-modal-title"><i className="fa-solid fa-circle-plus" style={{ color: 'var(--adm-accent)', marginRight: 8 }}></i>Nuevo producto</h3>
              <button className="adm-modal-close" onClick={closeModal}>&times;</button>
            </div>
            <div className="adm-modal-body">
              {formError && <div className="adm-login-error" style={{ marginBottom: 18 }}>{formError}</div>}
              <form onSubmit={handleSubmit}>

                <div className="adm-form-section-title">Información principal</div>
                <div className="adm-form-grid">
                  <div className="adm-form-group span-2">
                    <label className="adm-form-label">Título <span>*</span></label>
                    <input className="adm-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej. Diseño UX Avanzado" required />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Tipo <span>*</span></label>
                    <select className="adm-select" value={form.type} onChange={e => set('type', e.target.value)}>
                      <option value="BOOK">Libro</option>
                      <option value="COURSE">Curso</option>
                    </select>
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Precio (USD) <span>*</span></label>
                    <input className="adm-input" type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" required />
                  </div>
                </div>

                <div className="adm-form-group" style={{ marginTop: 14 }}>
                  <label className="adm-form-label">Descripción <span>(opcional)</span></label>
                  <textarea className="adm-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe el contenido del producto..." />
                </div>

                <div className="adm-form-section-title">Detalles adicionales</div>
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">Autor / Instructor <span>(opcional)</span></label>
                    <input className="adm-input" value={form.author} onChange={e => set('author', e.target.value)} placeholder="Nombre del autor" />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">Nivel <span>(opcional)</span></label>
                    <select className="adm-select" value={form.level} onChange={e => set('level', e.target.value)}>
                      <option value="">Sin especificar</option>
                      <option value="Principiante">Principiante</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>
                  {form.type === 'BOOK' ? (
                    <div className="adm-form-group">
                      <label className="adm-form-label">Páginas <span>(opcional)</span></label>
                      <input className="adm-input" type="number" value={form.pages} onChange={e => set('pages', e.target.value)} placeholder="Ej. 320" />
                    </div>
                  ) : (
                    <div className="adm-form-group">
                      <label className="adm-form-label">Duración <span>(opcional)</span></label>
                      <input className="adm-input" value={form.duration} onChange={e => set('duration', e.target.value)} placeholder="Ej. 12 horas" />
                    </div>
                  )}
                </div>

                <div className="adm-form-section-title">Recursos</div>
                <div className="adm-form-grid">
                  <div className="adm-form-group">
                    <label className="adm-form-label">URL de imagen <span>(opcional)</span></label>
                    <input className="adm-input" type="url" value={form.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="adm-form-group">
                    <label className="adm-form-label">URL del archivo <span>(opcional)</span></label>
                    <input className="adm-input" type="url" value={form.file_url} onChange={e => set('file_url', e.target.value)} placeholder="https://..." />
                  </div>
                </div>

                <div className="adm-form-actions">
                  <button type="button" className="adm-btn adm-btn-secondary" onClick={closeModal}>Cancelar</button>
                  <button type="submit" className="adm-form-submit" disabled={submitting}>
                    {submitting
                      ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando...</>
                      : <><i className="fa-solid fa-circle-plus"></i> Crear producto</>
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
