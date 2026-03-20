import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientRequests.css';
import { StarRating } from '../components/StarRating';
import { API_URL } from '../../config';
import { RequestChat } from '../components/RequestChat';

interface ClientRequest {
  id: number;
  description: string;
  status: string;
  created_at: string;
  agreed_price: number | null;
  deadline: string | null;
  service_title: string;
  provider_name: string;
  provider_id: number;
  file_url?: string;
  delivery_message?: string;
  review_id: number | null;
}

interface Delivery {
  id: number;
  file_url: string;
  message: string;
  version: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  QUOTED: 'Cotizado',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En progreso',
  DELIVERED: 'Entregado',
  REVISION: 'Revisión',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  REJECTED: 'Rechazado',
};

export const ClientRequests = () => {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDelivery, setViewingDelivery] = useState<ClientRequest | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  const [reviewRequest, setReviewRequest] = useState<ClientRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [chatRequest, setChatRequest] = useState<ClientRequest | null>(null);

  const navigate = useNavigate();

  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchClientRequests = async () => {
    if (!user || user.role !== 'CLIENT') {
      alert('Debes iniciar sesión como cliente para ver tus solicitudes.');
      navigate('/login/client');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/clients/${user.id}/requests`);
      const data = await res.json();
      if (res.ok) setRequests(data);
      else throw new Error(data.error || 'Error al cargar las solicitudes');
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar tus solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClientRequests(); }, []);

  const handleResponse = async (requestId: number, newStatus: 'ACCEPTED' | 'CANCELLED') => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, clientId: user.id })
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); fetchClientRequests(); }
      else throw new Error(data.error || 'No se pudo actualizar la solicitud.');
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  const handleAction = async (requestId: number, action: 'complete' | 'revision') => {
    if (!confirm(action === 'complete'
      ? '¿Estás seguro de finalizar el pedido? Esto confirmará que estás satisfecho con el trabajo.'
      : '¿Estás seguro de solicitar una revisión? El profesional deberá entregar una nueva versión.')) return;
    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/${action}`, { method: 'PUT' });
      const data = await res.json();
      if (res.ok) { alert(data.message); setViewingDelivery(null); fetchClientRequests(); }
      else alert(data.error);
    } catch (err) { alert('Error de conexión'); }
  };

  const openDeliveryModal = async (req: ClientRequest) => {
    setViewingDelivery(req);
    setDeliveryHistory([]);
    try {
      const res = await fetch(`${API_URL}/service-requests/${req.id}/deliveries`);
      if (res.ok) setDeliveryHistory(await res.json());
    } catch (err) { console.error('Error cargando historial', err); }
  };

  const openReviewModal = (req: ClientRequest) => {
    setReviewRequest(req);
    setRating(0);
    setComment('');
  };

  const handleSendReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRequest || rating === 0) {
      alert('Por favor, selecciona una calificación de 1 a 5 estrellas.');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: reviewRequest.id,
          client_id: user.id,
          provider_id: reviewRequest.provider_id,
          rating,
          comment
        })
      });
      const data = await res.json();
      if (res.ok) { alert(data.message); setReviewRequest(null); fetchClientRequests(); }
      else throw new Error(data.error || 'No se pudo enviar la reseña.');
    } catch (err: any) { alert(`Error: ${err.message}`); }
  };

  return (
    <div className="client-requests-page">
      <div className="client-requests-container">

        {/* ── Header ── */}
        <div className="requests-page-header">
          <div>
            <span className="eyebrow">
              <i className="fa-solid fa-list-check"></i> Gestión de proyectos
            </span>
            <h1 className="requests-heading">Mis Solicitudes</h1>
          </div>
          {!loading && (
            <div className="requests-header-meta">
              <div className="requests-total-badge">
                {requests.length} {requests.length === 1 ? 'solicitud' : 'solicitudes'}
              </div>
            </div>
          )}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="requests-loading">
            <i className="fa-solid fa-spinner fa-spin"></i>
            <span>Cargando tus solicitudes...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="requests-empty">
            <div className="requests-empty-icon">
              <i className="fa-solid fa-inbox"></i>
            </div>
            <h3>No tienes solicitudes aún</h3>
            <p>Explora nuestros servicios profesionales y envía tu primera solicitud de proyecto.</p>
            <Link to="/services" className="requests-empty-btn">
              <i className="fa-solid fa-wand-magic-sparkles"></i> Explorar servicios
            </Link>
          </div>
        ) : (
          <div className="requests-list">
            {requests.map(req => (
              <div key={req.id} className="request-card">
                <div className="request-card-main">

                  {/* Left */}
                  <div className="request-card-left">
                    <div className="request-card-top">
                      <span className="request-id"># {req.id}</span>
                      <span className={`status-badge status-${req.status}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </div>

                    <h3 className="request-card-title">{req.service_title}</h3>

                    <div className="request-card-meta">
                      <span>
                        <i className="fa-solid fa-user-tie"></i>
                        {req.provider_name}
                      </span>
                      <span>
                        <i className="fa-regular fa-calendar"></i>
                        {new Date(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      {req.deadline && (
                        <span>
                          <i className="fa-solid fa-flag"></i>
                          Límite: {new Date(req.deadline).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>

                    {req.description && (
                      <p className="request-description">{req.description}</p>
                    )}
                  </div>

                  {/* Right */}
                  <div className="request-card-right">
                    {req.agreed_price ? (
                      <div className="request-price-block">
                        <div className="request-price-label">Precio acordado</div>
                        <div className="request-price-val">${Number(req.agreed_price).toFixed(2)}</div>
                      </div>
                    ) : (
                      <span className="request-price-na">Sin cotización</span>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="request-card-actions">

                  {req.status === 'PENDING' && (
                    <span className="pending-hint">
                      <i className="fa-regular fa-clock"></i>
                      Esperando cotización del profesional...
                    </span>
                  )}

                  {req.status === 'QUOTED' && (
                    <>
                      <button className="action-btn btn-accept" onClick={() => handleResponse(req.id, 'ACCEPTED')}>
                        <i className="fa-solid fa-check"></i> Aceptar cotización
                      </button>
                      <button className="action-btn btn-reject" onClick={() => handleResponse(req.id, 'CANCELLED')}>
                        <i className="fa-solid fa-xmark"></i> Rechazar
                      </button>
                    </>
                  )}

                  {(req.status === 'DELIVERED' || req.status === 'COMPLETED') && (
                    <button className="action-btn btn-view-delivery" onClick={() => openDeliveryModal(req)}>
                      <i className="fa-solid fa-eye"></i> Ver entrega
                    </button>
                  )}

                  {req.status === 'COMPLETED' && !req.review_id && (
                    <button className="action-btn btn-rate" onClick={() => openReviewModal(req)}>
                      <i className="fa-solid fa-star"></i> Calificar
                    </button>
                  )}

                  {req.status === 'COMPLETED' && req.review_id && (
                    <span className="rated-text">
                      <i className="fa-solid fa-circle-check"></i> Calificado
                    </span>
                  )}

                  <button className="action-btn btn-chat" onClick={() => setChatRequest(req)} style={{ marginLeft: 'auto' }}>
                    <i className="fa-solid fa-comments"></i> Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Chat flotante ── */}
      {chatRequest && user && (
        <RequestChat
          requestId={chatRequest.id}
          currentUserId={user.id}
          title={`Chat — ${chatRequest.service_title}`}
          onClose={() => setChatRequest(null)}
        />
      )}

      {/* ── Modal: Ver entrega ── */}
      {viewingDelivery && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setViewingDelivery(null); }}>
          <div className="modal-content delivery-modal">
            <button className="modal-close-btn" onClick={() => setViewingDelivery(null)}>&times;</button>
            <span className="eyebrow"><i className="fa-solid fa-box-open"></i> Entrega del profesional</span>
            <h3>Historial de entregas</h3>
            <p className="modal-subtitle">Servicio: <strong>{viewingDelivery.service_title}</strong></p>

            <div className="delivery-history-container">
              {deliveryHistory.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  <i className="fa-solid fa-spinner fa-spin"></i> Cargando historial...
                </p>
              ) : deliveryHistory.map(delivery => (
                <div key={delivery.id} className="delivery-item">
                  <div className="delivery-header">
                    <span className="version-tag">v{delivery.version}</span>
                    <span className="delivery-date">
                      {new Date(delivery.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="delivery-message">"{delivery.message}"</p>
                  <a href={delivery.file_url} target="_blank" rel="noopener noreferrer" className="delivery-file-link">
                    <i className="fa-solid fa-download"></i> Descargar archivos (v{delivery.version})
                  </a>
                </div>
              ))}
            </div>

            {viewingDelivery.status === 'DELIVERED' && (
              <div className="delivery-actions">
                <button className="action-btn btn-revision" onClick={() => handleAction(viewingDelivery.id, 'revision')}>
                  <i className="fa-solid fa-rotate-left"></i> Pedir revisión
                </button>
                <button className="action-btn btn-complete" onClick={() => handleAction(viewingDelivery.id, 'complete')}>
                  <i className="fa-solid fa-check"></i> Finalizar pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: Calificar ── */}
      {reviewRequest && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setReviewRequest(null); }}>
          <div className="modal-content review-modal">
            <button className="modal-close-btn" onClick={() => setReviewRequest(null)}>&times;</button>
            <span className="eyebrow"><i className="fa-solid fa-star"></i> Calificación</span>
            <h3>Calificar al profesional</h3>
            <p className="modal-subtitle">Servicio: <strong>{reviewRequest.service_title}</strong></p>
            <form onSubmit={handleSendReview}>
              <div className="review-form-group">
                <label>Tu calificación:</label>
                <StarRating rating={rating} onRating={setRating} />
              </div>
              <div className="review-form-group">
                <label htmlFor="review-comment">Comentario (opcional)</label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                  placeholder="Describe tu experiencia con el profesional..."
                />
              </div>
              <button type="submit" className="review-submit-btn">
                <i className="fa-solid fa-paper-plane"></i> Enviar calificación
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
