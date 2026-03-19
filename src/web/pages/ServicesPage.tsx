import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './ServicesPage.css';
import { API_URL } from '../../config';

interface Service {
  id: number;
  title: string;
  description: string;
  base_price: number;
  provider_id: number;
  provider_name: string;
  provider_title: string;
}

const categories = [
  'Identidad Visual',
  'UI/UX para Web',
  'Social Media',
  'Editorial',
  'Ilustracion',
  'Packaging'
];

const highlights = [
  { label: 'Profesionales activos', value: '80+' },
  { label: 'Tiempo medio de respuesta', value: '< 2h' },
  { label: 'Proyectos cerrados', value: '1.2k' }
];

export const ServicesPage = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [requestDescription, setRequestDescription] = useState('');
  const [modalError, setModalError] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/services`);
        const data = await res.json();
        if (res.ok) setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const getGradient = (id: number) => {
    const gradients = [
      'linear-gradient(135deg, #1c3150 0%, #e87b2a 100%)',
      'linear-gradient(135deg, #233d4d 0%, #f0a85c 100%)',
      'linear-gradient(135deg, #174a5a 0%, #e96f7f 100%)',
      'linear-gradient(135deg, #27334f 0%, #8db9c8 100%)'
    ];
    return gradients[id % gradients.length];
  };

  const handleRequestClick = (service: Service) => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      alert('Debes iniciar sesion como cliente para solicitar un servicio.');
      navigate('/login/client');
      return;
    }

    const user = JSON.parse(userStr);
    if (user.role === 'PROVIDER') {
      alert('Solo los clientes pueden solicitar servicios.');
      return;
    }

    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setRequestDescription('');
    setModalError('');
    setSending(false);
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
      setSending(true);
      const res = await fetch(`${API_URL}/service-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          client_id: user.id,
          provider_id: selectedService.provider_id,
          description: requestDescription
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Tu solicitud ha sido enviada. El profesional fue notificado.');
        handleCloseModal();
      } else {
        throw new Error(data.error || 'No se pudo enviar la solicitud.');
      }
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="services-page-body">
      <div className="main-layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Explora categorias</h3>
            <ul className="category-list">
              {categories.map((category) => (
                <li key={category}>
                  <span>{category}</span>
                  <i className="fa-solid fa-arrow-right"></i>
                </li>
              ))}
            </ul>
          </div>

          <div className="sidebar-card">
            <span className="eyebrow">Curado para marcas</span>
            <h4>Marketplace creativo con trato directo</h4>
            <p>Solicita, conversa y cierra proyectos con diseñadores que ya publican su portafolio y servicios.</p>
          </div>
        </aside>

        <main className="services-main">
          <section className="hero-banner services-hero">
            <div className="hero-text">
              <span className="hero-kicker">Marketplace de diseno digital</span>
              <h2>Encuentra talento visual para lanzar tu marca con mas nivel.</h2>
              <p>Explora servicios listos para contratar, compara estilos y manda solicitudes claras sin salir de la plataforma.</p>
              <div className="hero-actions">
                <Link to="/login/provider" className="hero-btn">Publicar como profesional</Link>
                <Link to="/client-requests" className="hero-secondary">Ver mis solicitudes</Link>
              </div>
            </div>

            <div className="hero-stats">
              {highlights.map((item) => (
                <div key={item.label} className="hero-stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="section-heading">
            <div>
              <span className="eyebrow">Servicios destacados</span>
              <h2>Diseñadores listos para cotizar tu proyecto</h2>
            </div>
            <p>Una vista mas limpia, mas premium y orientada a conversion para el cliente.</p>
          </section>

          {loading ? (
            <div className="empty-market-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando servicios disponibles...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="empty-market-state">
              <i className="fa-regular fa-folder-open"></i>
              <p>Aun no hay servicios publicados.</p>
            </div>
          ) : (
            <div className="product-grid">
              {services.map((service) => (
                <article key={service.id} className="service-card">
                  <div className="service-preview">
                    <div className="service-preview-gradient" style={{ background: getGradient(service.id) }}>
                      <span className="service-badge">Featured</span>
                      <i className="fa-solid fa-wand-magic-sparkles preview-icon"></i>
                    </div>
                  </div>

                  <div className="service-body">
                    <div className="seller-info">
                      <div className="seller-avatar">{service.provider_name.substring(0, 2)}</div>
                      <div className="seller-copy">
                        <strong>{service.provider_name}</strong>
                        <span>{service.provider_title || 'Especialista creativo'}</span>
                      </div>
                      <span className="seller-tag">Pro</span>
                    </div>

                    <h3 className="service-title">{service.title}</h3>
                    <p className="service-description">{service.description}</p>

                    <div className="service-meta">
                      <span><i className="fa-solid fa-star"></i> 5.0 rating</span>
                      <span><i className="fa-regular fa-clock"></i> Respuesta rapida</span>
                    </div>

                    <div className="service-footer">
                      <div>
                        <div className="price-label">Desde</div>
                        <div className="price-val">US${service.base_price}</div>
                      </div>
                      <button className="btn-hire-sm" onClick={() => handleRequestClick(service)}>
                        Solicitar cotizacion
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {selectedService && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close-btn" onClick={handleCloseModal}>&times;</button>
            <span className="eyebrow">Nueva solicitud</span>
            <h3>Solicitar cotizacion</h3>
            <p className="modal-service-title">Servicio: <strong>{selectedService.title}</strong></p>
            <p className="modal-provider-info">Profesional: {selectedService.provider_name}</p>

            <form onSubmit={handleSendRequest}>
              <div className="modal-form-group">
                <label htmlFor="requestDescription">Cuentale al profesional lo que buscas</label>
                <textarea
                  id="requestDescription"
                  value={requestDescription}
                  onChange={(e) => setRequestDescription(e.target.value)}
                  placeholder="Ej: Necesito un logo para una cafeteria contemporanea, con una linea elegante, adaptable a redes y packaging..."
                  rows={6}
                  required
                ></textarea>
              </div>

              {modalError && <p className="modal-error">{modalError}</p>}

              <button type="submit" className="modal-submit-btn" disabled={sending}>
                {sending ? 'Enviando solicitud...' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
