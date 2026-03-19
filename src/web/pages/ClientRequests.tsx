import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ClientRequests.css'; // New CSS file
import { StarRating } from '../components/StarRating';
import { API_URL } from '../../config';

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

export const ClientRequests = () => {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDelivery, setViewingDelivery] = useState<ClientRequest | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  const [reviewRequest, setReviewRequest] = useState<ClientRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

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
      if (res.ok) {
        setRequests(data);
      } else {
        throw new Error(data.error || 'Error al cargar las solicitudes');
      }
    } catch (err) {
      console.error(err);
      alert('No se pudieron cargar tus solicitudes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientRequests();
  }, []);

  const handleResponse = async (requestId: number, newStatus: 'ACCEPTED' | 'CANCELLED') => {
    if (!user) return;

    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, clientId: user.id })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchClientRequests(); // Refresh the list
      } else {
        throw new Error(data.error || 'No se pudo actualizar la solicitud.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAction = async (requestId: number, action: 'complete' | 'revision') => {
    if (!confirm(action === 'complete' 
      ? '¿Estás seguro de finalizar el pedido? Esto confirmará que estás satisfecho con el trabajo.' 
      : '¿Estás seguro de solicitar una revisión? El profesional deberá entregar una nueva versión.')) return;

    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/${action}`, {
        method: 'PUT'
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setViewingDelivery(null);
        fetchClientRequests();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const openDeliveryModal = async (req: ClientRequest) => {
    setViewingDelivery(req);
    setDeliveryHistory([]); // Limpiar historial anterior
    try {
      const res = await fetch(`${API_URL}/service-requests/${req.id}/deliveries`);
      if (res.ok) {
        setDeliveryHistory(await res.json());
      }
    } catch (err) {
      console.error("Error cargando historial", err);
    }
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
          rating: rating,
          comment: comment
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setReviewRequest(null);
        fetchClientRequests();
      } else {
        throw new Error(data.error || 'No se pudo enviar la reseña.');
      }

    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div className="client-requests-page">
  

      <div className="client-requests-container">
        <h2>Mis Solicitudes de Servicio</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Profesional</th>
                <th>Precio Cotizado</th>
                <th>Fecha Límite</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {requests.length > 0 ? requests.map(req => (
                <tr key={req.id}>
                  <td>{req.service_title}</td>
                  <td>{req.provider_name}</td>
                  <td>{req.agreed_price ? `$${req.agreed_price}` : 'N/A'}</td>
                  <td>{req.deadline ? new Date(req.deadline).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status-badge status-${req.status}`}>{req.status}</span>
                  </td>
                  <td>
                    {req.status === 'PENDING' && <span style={{color:'#999', fontSize:'0.8rem'}}>Esperando cotización...</span>}
                    
                    {/* Acciones para aceptar cotización */}
                    {req.status === 'QUOTED' && (
                      <div className="action-buttons">
                        <button className="action-btn btn-accept" onClick={() => handleResponse(req.id, 'ACCEPTED')}>
                          Aceptar
                        </button>
                        <button className="action-btn btn-reject" onClick={() => handleResponse(req.id, 'CANCELLED')}>
                          Rechazar
                        </button>
                      </div>
                    )}

                    {req.status === 'COMPLETED' && !req.review_id && (
                      <button className="action-btn btn-rate" onClick={() => openReviewModal(req)}>
                        <i className="fa-solid fa-star"></i> Calificar
                      </button>
                    )}

                    {req.status === 'COMPLETED' && req.review_id && (
                      <span className="rated-text">
                        <i className="fa-solid fa-check-circle"></i> Calificado
                      </span>
                    )}

                    {/* Ver entrega cuando está DELIVERED o COMPLETED */}
                    {(req.status === 'DELIVERED' || req.status === 'COMPLETED') && (
                      <button className="action-btn btn-view-delivery" onClick={() => openDeliveryModal(req)}>
                        <i className="fa-solid fa-eye"></i> Ver Entrega
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                    No has realizado ninguna solicitud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal para ver la entrega */}
      {viewingDelivery && (
        <div className="modal-overlay">
          <div className="modal-content delivery-modal">
            <button className="modal-close-btn" onClick={() => setViewingDelivery(null)}>&times;</button>
            <h3>Entrega del Profesional</h3>
            
            <div className="delivery-history-container">
              {deliveryHistory.length === 0 ? <p>Cargando historial...</p> : deliveryHistory.map((delivery) => (
                <div key={delivery.id} className="delivery-item">
                  <div className="delivery-header">
                    <span className="version-tag">Versión {delivery.version}</span>
                    <span className="delivery-date">{new Date(delivery.created_at).toLocaleString()}</span>
                  </div>
                  <p className="delivery-message">"{delivery.message}"</p>
                  <a href={delivery.file_url} target="_blank" rel="noopener noreferrer" className="delivery-file-link">
                    <i className="fa-solid fa-download"></i> Descargar Archivos (v{delivery.version})
                  </a>
                </div>
              ))}
            </div>

            {viewingDelivery.status === 'DELIVERED' && (
              <div className="delivery-actions">
                <button className="action-btn btn-revision" onClick={() => handleAction(viewingDelivery.id, 'revision')}>
                  <i className="fa-solid fa-rotate-left"></i> Pedir Revisión
                </button>
                <button className="action-btn btn-complete" onClick={() => handleAction(viewingDelivery.id, 'complete')}>
                  <i className="fa-solid fa-check"></i> Finalizar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para calificar */}
      {reviewRequest && (
        <div className="modal-overlay">
          <div className="modal-content review-modal">
            <button className="modal-close-btn" onClick={() => setReviewRequest(null)}>&times;</button>
            <h3>Calificar al Profesional</h3>
            <p>Servicio: <strong>{reviewRequest.service_title}</strong></p>
            <form onSubmit={handleSendReview}>
              <div className="review-form-group">
                <label>Tu calificación:</label>
                <StarRating rating={rating} onRating={setRating} />
              </div>
              <div className="review-form-group">
                <label htmlFor="comment">Comentario (opcional):</label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  placeholder="Describe tu experiencia con el profesional..."
                ></textarea>
              </div>
              <button type="submit" className="action-btn btn-complete" style={{width: '100%', marginTop: '1rem'}}>
                Enviar Calificación
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};