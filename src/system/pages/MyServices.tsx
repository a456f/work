 import { useEffect, useState } from 'react';
 import { API_URL } from '../../config';
  
  export const MyServices = () => {
    const [services, setServices] = useState<any[]>([]);
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
  
    useEffect(() => {
      if (user && user.providerId) {
        fetch(`${API_URL}/providers/${user.providerId}/services`)
          .then(res => res.json())
          .then(data => setServices(data))
          .catch(err => console.error(err));
      }
    }, [user]);
  
    return (
      <div>
        <h2>Mis Servicios</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          {services.map(service => (
            <div key={service.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px', background: '#fff' }}>
              <h3 style={{marginTop: 0}}>{service.title}</h3>
              <p>{service.description}</p>
              <p style={{ fontWeight: 'bold' }}>Precio: ${service.base_price}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
