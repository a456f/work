import { useState, useEffect } from 'react';
import './ProviderCatalog.css';
import { API_URL } from '../../config';
import { useSystemNotification } from '../context/SystemNotificationContext';

interface CatalogItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
}

export const ProviderCatalog = () => {
  const { notify } = useSystemNotification();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchCatalog = async () => {
    if (user?.providerId) {
      try {
        const res = await fetch(`${API_URL}/providers/${user.providerId}/catalog`);
        if (res.ok) setItems(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
  };

  useEffect(() => { fetchCatalog(); }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) {
      notify('Atención', 'Debes seleccionar una imagen.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('provider_id', user.providerId);
    formData.append('title', title);
    formData.append('description', desc);
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/catalog`, {
        method: 'POST',
        body: formData // No header content-type needed, fetch sets multipart/form-data automatically
      });

      if (res.ok) {
        notify('Éxito', 'Trabajo agregado al portafolio.', 'success');
        setShowModal(false);
        setTitle(''); setDesc(''); setFile(null);
        fetchCatalog();
      } else {
        notify('Error', 'No se pudo subir el trabajo.', 'error');
      }
    } catch (err) { 
      console.error(err); 
      notify('Error', 'Error de conexión.', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Borrar este trabajo del portafolio?')) return;
    try {
      await fetch(`${API_URL}/catalog/${id}`, { method: 'DELETE' });
      notify('Eliminado', 'El trabajo ha sido eliminado.', 'success');
    } catch (err) { notify('Error', 'No se pudo eliminar.', 'error'); }
    fetchCatalog();
  };

  return (
    <div className="catalog-container">
      <div className="catalog-header">
        <div>
          <h2>Portafolio</h2>
          <p style={{margin:0, color:'#666'}}>Muestra tu trabajo al mundo</p>
        </div>
        <button className="btn-create" onClick={() => setShowModal(true)}>
          <i className="fa-solid fa-camera"></i> Subir Trabajo
        </button>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="catalog-grid">
          {items.map(item => (
            <div key={item.id} className="portfolio-item">
              <div className="portfolio-image-wrapper">
                <img src={item.image_url} alt={item.title} />
              </div>
              <div className="portfolio-content">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
              <button className="delete-portfolio-btn" onClick={() => handleDelete(item.id)} title="Eliminar">
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))}
          {items.length === 0 && (
            <div style={{gridColumn: '1/-1', textAlign:'center', padding:'3rem', background:'white', borderRadius:'12px'}}>
              <p>Tu portafolio está vacío. ¡Sube tu primer diseño!</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL PARA SUBIR */}
      {showModal && (
        <div className="pc-modal-overlay">
          <div className="pc-modal-content">
            <button className="pc-modal-close-btn" onClick={() => setShowModal(false)}><i className="fa-solid fa-xmark"></i></button>
            <h3 className="pc-modal-title">Subir Trabajo</h3>
            <p className="pc-modal-subtitle">Comparte tus mejores diseños con el mundo</p>
            
            <form onSubmit={handleSubmit}>
              <div className="pc-form-group">
                <label>Título del Proyecto</label>
                <input className="pc-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej. Casa de Playa Moderna" />
              </div>
              <div className="pc-form-group">
                <label>Descripción Corta</label>
                <textarea className="pc-textarea" value={desc} onChange={e => setDesc(e.target.value)} required placeholder="Describe brevemente el estilo y las herramientas usadas..." />
              </div>
              <div className="pc-form-group">
                <label>Imagen (JPG, PNG)</label>
                <div className="pc-file-upload-wrapper">
                  <i className="fa-solid fa-cloud-arrow-up pc-file-upload-icon"></i>
                  <p className="pc-file-upload-text">{file ? `Archivo seleccionado: ${file.name}` : "Haz clic o arrastra tu imagen aquí"}</p>
                  <input type="file" onChange={handleFileChange} accept="image/*" />
                </div>
              </div>
              <button type="submit" className="pc-btn-submit">
                <i className="fa-solid fa-upload"></i> Publicar en Portafolio
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};