import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { API_URL } from '../../config';

export const CreateProductPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', price: '', type: 'BOOK',
    author: '', file_url: '', image_url: '', pages: '',
    level: '', duration: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.price || !form.type) { setError('Título, precio y tipo son obligatorios.'); return; }
    setSubmitting(true);
    try {
      const res  = await fetch(`${API_URL}/products`, {
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
      if (res.ok) navigate('/admin/products');
      else setError(data.error || 'Error al crear el producto.');
    } catch { setError('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  return (
    <AdminLayout title="Crear Producto" subtitle="Agregar nuevo libro o curso a la plataforma">
      <div className="adm-page-header">
        <div>
          <h2 className="adm-page-title">Nuevo producto</h2>
          <p className="adm-page-sub">Completa todos los campos requeridos.</p>
        </div>
        <Link to="/admin/products" className="adm-btn adm-btn-secondary">
          <i className="fa-solid fa-arrow-left"></i> Volver
        </Link>
      </div>

      {error && <div className="adm-login-error" style={{ marginBottom: 20 }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="adm-form-card">

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
            <Link to="/admin/products" className="adm-btn adm-btn-secondary">Cancelar</Link>
            <button type="submit" className="adm-form-submit" disabled={submitting}>
              {submitting
                ? <><i className="fa-solid fa-spinner fa-spin"></i> Creando...</>
                : <><i className="fa-solid fa-circle-plus"></i> Crear producto</>
              }
            </button>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
};
