import { useState, useEffect, useCallback } from 'react';
import './ServiceRequests.css';
import { API_URL } from '../../config';
import { useSystemNotification } from '../context/SystemNotificationContext';
import { RequestChat } from '../../web/components/RequestChat';
import { useSocket } from '../../web/context/SocketContext';

interface Request {
  id: number;
  description: string;
  status: string;
  agreed_price: number | null;
  deadline: string | null;
  created_at: string;
  service_title: string;
  client_name: string;
}

interface QuoteData {
  agreed_price: string;
  deadline: string;
}

interface DeliveryData {
  message: string;
  file_url: string;
}

export const ServiceRequests = () => {
  const { notify } = useSystemNotification();
  const { socket } = useSocket();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [quoteData, setQuoteData] = useState<QuoteData>({ agreed_price: '', deadline: '' });
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({ message: '', file_url: '' });
  const [chatRequest, setChatRequest] = useState<Request | null>(null);

  const userStr = localStorage.getItem('currentUser');
  const user = userStr ? JSON.parse(userStr) : null;

  const fetchRequests = useCallback(async () => {
    if (user && user.providerId) {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/providers/${user.providerId}/requests`);
        const data = await res.json();
        if (res.ok) {
          setRequests(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }, [user?.providerId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = () => {
      fetchRequests();
    };

    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket, fetchRequests]);

  // Abre el modal (sirve tanto para cotizar como para entregar, dependiendo del estado)
  const handleOpenModal = (request: Request) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setQuoteData({ agreed_price: '', deadline: '' });
    setDeliveryData({ message: '', file_url: '' });
  };

  const handleQuoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuoteData({ ...quoteData, [e.target.name]: e.target.value });
  };

  const handleDeliveryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDeliveryData({ ...deliveryData, [e.target.name]: e.target.value });
  };

  // Acción: Cotizar (PENDING -> QUOTED)
  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await fetch(`${API_URL}/service-requests/${selectedRequest.id}/quote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      if (res.ok) {
        notify('Cotización Enviada', 'El cliente ha recibido tu propuesta.', 'success');
        handleCloseModal();
        fetchRequests(); // Re-fetch requests to update the list
      } else {
        const data = await res.json();
        notify('Error', data.error || 'No se pudo enviar la cotización.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error de Conexión', 'Inténtalo más tarde.', 'error');
    }
  };

  // Acción: Iniciar Trabajo (ACCEPTED -> IN_PROGRESS)
  const handleStartWork = async (requestId: number) => {
    if (!confirm('¿Estás listo para comenzar este trabajo? El cliente será notificado.')) return;
    
    try {
      const res = await fetch(`${API_URL}/service-requests/${requestId}/start`, {
        method: 'PUT'
      });
      if (res.ok) {
        notify('Trabajo Iniciado', 'El estado cambió a "En Progreso".', 'success');
        fetchRequests();
      } else {
        notify('Error', 'No se pudo iniciar el trabajo.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error', 'Error de conexión.', 'error');
    }
  };

  // Acción: Entregar Trabajo (IN_PROGRESS -> DELIVERED)
  const handleSendDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const res = await fetch(`${API_URL}/service-requests/${selectedRequest.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deliveryData)
      });

      if (res.ok) {
        notify('Trabajo Entregado', 'Se ha notificado al cliente.', 'success');
        handleCloseModal();
        fetchRequests();
      } else {
        notify('Error', 'No se pudo enviar la entrega.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error', 'Error de conexión.', 'error');
    }
  };

  if (loading) {
    return <h2>Cargando solicitudes...</h2>;
  }

  return (
    <div className="requests-container-page">
      <div className="requests-header">
        <h2>Solicitudes</h2>
      </div>
      <table className="requests-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Servicio</th>
            <th>Precio Cotizado</th>
            <th>Fecha Límite</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {requests.length > 0 ? requests.map(req => (
            <tr key={req.id}>
              <td>{req.client_name}</td>
              <td>{req.service_title}</td>
              <td>{req.agreed_price ? `$${req.agreed_price}` : '-'}</td>
              <td>{req.deadline ? new Date(req.deadline).toLocaleDateString() : '-'}</td>
              <td>{new Date(req.created_at).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge status-${req.status}`}>{req.status}</span>
              </td>
              <td>
                {req.status === 'PENDING' && (
                  <button className="action-btn btn-quote" onClick={() => handleOpenModal(req)}>
                    Cotizar
                  </button>
                )}
                {req.status === 'ACCEPTED' && (
                  <button className="action-btn btn-start" onClick={() => handleStartWork(req.id)}>
                    Comenzar
                  </button>
                )}
                {(req.status === 'IN_PROGRESS' || req.status === 'REVISION') && (
                  <button className="action-btn btn-deliver" onClick={() => handleOpenModal(req)}>
                    Entregar
                  </button>
                )}
                
                {/* Botón de Chat siempre visible para hablar con el cliente */}
                <button className="action-btn" style={{marginLeft:'5px', background:'#444', color:'white'}} onClick={() => setChatRequest(req)}>
                  <i className="fa-solid fa-comments"></i> Chat
                </button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No tienes solicitudes.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Componente de Chat Flotante */}
      {chatRequest && user && (
        <RequestChat 
          requestId={chatRequest.id}
          currentUserId={user.id} // user.id es el ID de usuario del proveedor
          title={`Chat con ${chatRequest.client_name}`}
          onClose={() => setChatRequest(null)}
        />
      )}

      {selectedRequest && (
        <div className="quote-modal-overlay">
          <div className="quote-modal-content">
            {/* Header del Modal Dinámico */}
            <h3>
              {selectedRequest.status === 'PENDING' ? 'Cotizar Servicio' : 'Entregar Trabajo'}
            </h3>
            
            <p><strong>Para:</strong> {selectedRequest.service_title}</p>
            <p><strong>Cliente:</strong> {selectedRequest.client_name}</p>
            
            {/* FORMULARIO DE COTIZACIÓN (PENDING) */}
            {selectedRequest.status === 'PENDING' && (
              <form onSubmit={handleSendQuote}>
                <p style={{fontSize: '0.9rem', color: '#666', marginBottom: '1rem'}}>Solicitud: "{selectedRequest.description}"</p>
                <div className="quote-form-group">
                  <label htmlFor="agreed_price">Precio Acordado (USD)</label>
                  <input type="number" id="agreed_price" name="agreed_price" value={quoteData.agreed_price} onChange={handleQuoteChange} required />
                </div>
                <div className="quote-form-group">
                  <label htmlFor="deadline">Fecha Límite de Entrega</label>
                  <input type="date" id="deadline" name="deadline" value={quoteData.deadline} onChange={handleQuoteChange} required />
                </div>
                <div className="quote-modal-actions">
                  <button type="button" className="action-btn" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="action-btn btn-quote">Enviar Cotización</button>
                </div>
              </form>
            )}

            {/* FORMULARIO DE ENTREGA (IN_PROGRESS o REVISION) */}
            {(selectedRequest.status === 'IN_PROGRESS' || selectedRequest.status === 'REVISION') && (
              <form onSubmit={handleSendDelivery}>
                <div className="quote-form-group">
                  <label>Mensaje de Entrega</label>
                  <textarea name="message" value={deliveryData.message} onChange={handleDeliveryChange} rows={4} style={{width:'100%', padding:'8px'}} placeholder="Aquí tienes los archivos finales..." required />
                </div>
                <div className="quote-form-group">
                  <label>URL del Archivo (Drive/Dropbox)</label>
                  <input type="url" name="file_url" value={deliveryData.file_url} onChange={handleDeliveryChange} placeholder="https://..." required />
                </div>
                <div className="quote-modal-actions">
                  <button type="button" className="action-btn" onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="action-btn btn-deliver">Enviar Entrega</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
