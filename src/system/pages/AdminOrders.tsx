import { useEffect, useState } from 'react';
import './AdminOrders.css';
import { API_URL } from '../../config';

interface Order {
  id: number;
  total: string;
  status: string;
  created_at: string;
  client_name: string;
  client_email: string;
}

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/orders`)
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="admin-orders-container">
      <h2><i className="fa-solid fa-receipt"></i> Historial de Ventas</h2>
      <table className="orders-table">
        <thead>
          <tr>
            <th>ID Orden</th>
            <th>Cliente</th>
            <th>Email</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td>#{order.id}</td>
              <td>{order.client_name}</td>
              <td>{order.client_email}</td>
              <td>{new Date(order.created_at).toLocaleDateString()}</td>
              <td><strong>${order.total}</strong></td>
              <td><span className={`order-status status-${order.status}`}>{order.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};