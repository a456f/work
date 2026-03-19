import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './MyDownloads.css';
import { API_URL } from '../../config';

interface DownloadItem {
  title: string;
  cover_image: string;
  download_url: string;
  expires_at: string;
}

export const MyDownloads = () => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      alert('Debes iniciar sesión para ver tus descargas.');
      navigate('/login/client');
      return;
    }
    const user = JSON.parse(userStr);

    const fetchDownloads = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${user.id}/downloads`);
        if (res.ok) {
          setDownloads(await res.json());
        } else {
          throw new Error('No se pudieron cargar las descargas.');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [navigate]);

  return (
    <div className="downloads-page">
      <div className="downloads-container">
        <h2>Mis Descargas</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : downloads.length === 0 ? (
          <div className="empty-downloads">
            <p>No tienes productos para descargar.</p>
            <Link to="/products">Ir a la tienda</Link>
          </div>
        ) : (
          <div className="downloads-grid">
            {downloads.map((item, index) => (
           <div key={index} className="download-card">
                <div className="download-cover">
                  <img src={item.cover_image || 'https://via.placeholder.com/400x200.png?text=Producto'} alt={item.title} />
                </div>
                <div className="download-body">
                  <h3 className="download-title">{item.title}</h3>
                  <p className="download-expires">
                    Expira: {new Date(item.expires_at).toLocaleDateString()}
                  </p>
                  <a href={item.download_url} className="download-button" target="_blank" rel="noopener noreferrer">
                    <i className="fa-solid fa-download"></i> Descargar
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};