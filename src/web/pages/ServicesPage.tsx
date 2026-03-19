import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ServicesPage.css';
import { useCart } from '../context/CartContext';
import { API_URL } from '../../config';
import { AUTH_CHANGED_EVENT } from '../context/SocketContext';

interface Service {
  id: number;
  title: string;
  description: string;
  base_price: number;
  provider_id: number; // ID del perfil del proveedor
  provider_name: string;
  provider_title: string;
}

export const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { cartCount } = useCart();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        const data = await res.json();
        if (res.ok) {
          setServices(data);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();

    // Verificar si hay usuario logueado
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Función auxiliar para generar colores aleatorios para las tarjetas
  const getGradient = (id: number) => {
    const gradients = [
      'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
      'linear-gradient(45deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
      'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
      'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)'
    ];
    return gradients[id % gradients.length];
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    setCurrentUser(null);
    navigate('/login/client');
  };

  const handleRequestClick = (service: Service) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      alert('Debes iniciar sesión como cliente para solicitar un servicio.');
      navigate('/login/client');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role === 'PROVIDER') {
      alert('Solo los clientes pueden solicitar servicios. Por favor, usa una cuenta de cliente.');
      return;
    }
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setRequestDescription('');
    setModalError('');
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!requestDescription.trim()) {
      setModalError('Por favor, describe lo que necesitas.');
      return;
    }

    const userStr = localStorage.getItem('currentUser');
    if (!userStr || !selectedService) return;
    const user = JSON.parse(userStr);

    try {
      const res = await fetch(`${API_URL}/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          client_id: user.id, // user.id del usuario logueado
          provider_id: selectedService.provider_id, // provider_profiles.id del servicio
          description: requestDescription
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('¡Tu solicitud ha sido enviada! El profesional se pondrá en contacto contigo.');
        handleCloseModal();
      } else {
        throw new Error(data.error || 'No se pudo enviar la solicitud.');
      }
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  return (
    <div className="services-page-body">
    

      <div className="main-layout">
        <aside className="sidebar">
          <h3>Servicios</h3>
          <ul className="category-list">
            <li>Identidad Visual <i className="fa-solid fa-chevron-right"></i></li>
            <li>Diseño Web UI/UX <i className="fa-solid fa-chevron-right"></i></li>
            <li>Redes Sociales <i className="fa-solid fa-chevron-right"></i></li>
            <li>Editorial & Revistas <i className="fa-solid fa-chevron-right"></i></li>
            <li>Ilustración Digital <i className="fa-solid fa-chevron-right"></i></li>
            <li>Packaging <i className="fa-solid fa-chevron-right"></i></li>
          </ul>
        </aside>

        <main>
          <section className="hero-banner">
            <div className="hero-text">
              <h2>Dale vida a tu marca<br /><span style={{ color: 'var(--accent)' }}>Diseño profesional</span></h2>
              <p>Contrata a los mejores diseñadores para tu próximo proyecto.</p>
              <Link to="/login/provider" className="hero-btn">Ofrecer mis servicios</Link>
            </div>
            <div style={{ fontSize: '8rem', color: 'rgba(255,255,255,0.2)' }}>
              <i className="fa-solid fa-palette"></i>
            </div>
          </section>

          <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Paquetes Populares</h2>
          
          {loading ? (
            <p>Cargando servicios...</p>
          ) : (
            <div className="product-grid">
              {services.map((service) => (
                <div key={service.id} className="service-card">
                  <div className="service-preview">
                    {/* Generar fondo dinámico basado en ID */}
                    <div className="service-preview-gradient" style={{ background: getGradient(service.id) }}>
                      <i className="fa-solid fa-gem preview-icon"></i>
                    </div>
                  </div>
                  <div className="service-body">
                    <div className="seller-info">
                      <div className="seller-avatar" style={{ backgroundColor: '#ff9900', color: 'black' }}>
                        {service.provider_name.substring(0, 2)}
                      </div>
                      <span>{service.provider_name}</span>
                      <span style={{ fontSize: '0.7rem', background: '#e0f7fa', color: '#006064', padding: '2px 6px', borderRadius: '4px', marginLeft: 'auto' }}>
                        Pro
                      </span>
                    </div>
                    <h3 className="service-title">{service.title}</h3>
                    <p style={{fontSize: '0.85rem', color: '#555', marginBottom: '10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                      {service.description}
                    </p>
                    <div className="rating-row">
                      <span className="stars"><i className="fa-solid fa-star"></i> 5.0</span>
                      <span className="rating-count">({Math.floor(Math.random() * 100) + 10} reseñas)</span>
                    </div>
                    <div className="service-footer">
                      <div>
                        <div className="price-label">A partir de</div>
                        <div className="price-val">US${service.base_price}</div>
                      </div>
                      <button className="btn-hire-sm" onClick={() => handleRequestClick(service)}>Solicitar Cotización</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal para solicitar servicio */}
      {selectedService && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
            <h3>Solicitar Cotización</h3>
            <p className="modal-service-title">Para: <strong>{selectedService.title}</strong></p>
            <p className="modal-provider-info">De: {selectedService.provider_name}</p>
            
            <form onSubmit={handleSendRequest}>
              <div className="modal-form-group">
                <label htmlFor="requestDescription">Describe tus requerimientos:</label>
                <textarea
                  id="requestDescription"
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Ej: Necesito un logo para mi nueva cafetería. El estilo debe ser vintage y usar colores cálidos..."
                  rows={6}
                  required
                ></textarea>
              </div>
              {modalError && <p className="modal-error">{modalError}</p>}
              <button type="submit" className="modal-submit-btn">Enviar Solicitud</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
