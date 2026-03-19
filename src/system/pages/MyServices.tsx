 import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
 import { API_URL } from '../../config';
import './MyServices.css';
import { useSystemNotification } from '../context/SystemNotificationContext';
  
  export const MyServices = () => {
    const [services, setServices] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [stats, setStats] = useState({
      totalServices: 0,
      pendingRequests: 0,
      totalEarnings: 0
    });
    const [loading, setLoading] = useState(true);
    const { notify } = useSystemNotification();

    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
  
    const fetchData = useCallback(async () => {
      if (user && user.providerId) {
        try {
          setLoading(true);
          const [servicesRes, requestsRes] = await Promise.all([
            fetch(`${API_URL}/providers/${user.providerId}/services`),
            fetch(`${API_URL}/providers/${user.providerId}/requests`)
          ]);

          const servicesData = await servicesRes.json();
          const requestsData = await requestsRes.json();

          if (Array.isArray(servicesData)) setServices(servicesData);
          if (Array.isArray(requestsData)) setRequests(requestsData);

          // Calcular Estadísticas
          const pending = Array.isArray(requestsData) 
            ? requestsData.filter((r: any) => r.status === 'PENDING').length 
            : 0;
          
          const earnings = Array.isArray(requestsData)
            ? requestsData
                .filter((r: any) => ['ACCEPTED', 'IN_PROGRESS', 'DELIVERED', 'COMPLETED'].includes(r.status))
                .reduce((acc: number, curr: any) => acc + (Number(curr.agreed_price) || 0), 0)
            : 0;

          setStats({
            totalServices: Array.isArray(servicesData) ? servicesData.length : 0,
            pendingRequests: pending,
            totalEarnings: earnings
          });

        } catch (err) {
          console.error("Error cargando dashboard:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Detener carga si no hay usuario
      }
    }, [user?.providerId]); // Solo recrear si cambia el ID del proveedor

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const handleDelete = async (serviceId: number) => {
      if (!confirm('¿Eliminar este servicio permanentemente?')) return;
      try {
        const res = await fetch(`${API_URL}/services/${serviceId}`, { method: 'DELETE' });
        if (res.ok) {
          notify('Servicio Eliminado', 'El servicio se ha eliminado correctamente.', 'success');
          fetchData();
        } else {
          notify('Error', 'No se pudo eliminar el servicio.', 'error');
        }
      } catch (err) { 
        console.error(err);
        notify('Error de Conexión', 'No se pudo conectar con el servidor.', 'error');
      }
    };

    if (loading) return <div style={{padding:'2rem'}}>Cargando panel...</div>;
  
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h2>Dashboard</h2>
            <span className="dashboard-date">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* TARJETAS DE ESTADÍSTICAS */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon"><i className="fa-solid fa-cube"></i></div>
            <div className="stat-info">
              <h3>{stats.totalServices}</h3>
              <p>Servicios Activos</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><i className="fa-regular fa-bell"></i></div>
            <div className="stat-info">
              <h3>{stats.pendingRequests}</h3>
              <p>Solicitudes Pendientes</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon"><i className="fa-solid fa-dollar-sign"></i></div>
            <div className="stat-info">
              <h3>${stats.totalEarnings}</h3>
              <p>Ingresos Proyectados</p>
            </div>
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE */}
        <div className="recent-activity">
          <h3 className="section-title">Actividad Reciente</h3>
          {requests.length === 0 ? <p style={{color:'#999'}}>No hay actividad reciente.</p> : (
            <ul className="activity-list">
              {requests.slice(0, 5).map(req => (
                <li key={req.id} className="activity-item">
                  <div>
                    <strong>{req.client_name}</strong> solicitó <em>{req.service_title}</em>
                  </div>
                  <span style={{fontSize:'0.85rem', color: '#666'}}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {requests.length > 0 && (
            <Link to="/admin/requests" style={{display:'inline-block', marginTop:'1rem', color:'#000', fontWeight:'bold', textDecoration:'none'}}>
              Ver todas las solicitudes &rarr;
            </Link>
          )}
        </div>

        {/* MIS SERVICIOS */}
        <div className="services-section">
          <div className="services-section-header">
            <h3 className="section-title" style={{marginBottom:0, borderBottom:'none'}}>Mis Servicios</h3>
            <Link to="/admin/services/new" className="btn-create">
              <i className="fa-solid fa-plus"></i> Nuevo Servicio
            </Link>
          </div>

          {services.length === 0 ? (
            <div style={{padding:'3rem', textAlign:'center', border:'1px dashed #ccc', color:'#999'}}>
              No has publicado servicios aún.
            </div>
          ) : (
            <div className="services-grid">
              {services.map(service => (
                <div key={service.id} className="provider-service-card">
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <p style={{color: '#666', fontSize:'0.9rem', marginBottom:'1.5rem', lineHeight:'1.5', height:'3em', overflow:'hidden'}}>
                      {service.description}
                    </p>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span className="service-price">${service.base_price}</span>
                      <button className="btn-delete-service" onClick={() => handleDelete(service.id)}>
                        <i className="fa-solid fa-trash"></i> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
