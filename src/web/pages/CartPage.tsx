import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';
import { API_URL } from '../../config';

export const CartPage = () => {
  const navigate = useNavigate();
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();

  const handleCheckout = async () => {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      alert('Debes iniciar sesión para completar la compra.');
      navigate('/login/client');
      return;
    }
    const user = JSON.parse(userStr);

    if (cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cart, total: cartTotal })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        clearCart();
        navigate('/my-downloads');
      } else {
        throw new Error(data.error || 'Error al procesar la compra.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const typeLabel = (type: string) =>
    type === 'COURSE' ? 'Curso' : type === 'BOOK' ? 'Libro' : type;

  return (
    <div className="cart-page">
      <div className="cart-wrapper">

        {/* ── Page header ── */}
        <div className="cart-page-header">
          <div>
            <span className="eyebrow">Compra segura</span>
            <h1 className="cart-heading">Tu carrito</h1>
          </div>
          {cart.length > 0 && (
            <button className="cart-clear-link" onClick={clearCart}>
              <i className="fa-solid fa-trash-can"></i> Vaciar carrito
            </button>
          )}
        </div>

        {cart.length === 0 ? (
          /* ── Empty state ── */
          <div className="cart-empty">
            <div className="cart-empty-icon">
              <i className="fa-solid fa-cart-shopping"></i>
            </div>
            <h3>Tu carrito está vacío</h3>
            <p>Explora nuestra biblioteca de libros, cursos y servicios para encontrar lo que necesitas.</p>
            <div className="cart-empty-actions">
              <Link to="/books" className="cart-empty-btn primary">
                <i className="fa-solid fa-book-open"></i> Ver libros
              </Link>
              <Link to="/courses" className="cart-empty-btn secondary">
                <i className="fa-solid fa-graduation-cap"></i> Ver cursos
              </Link>
            </div>
          </div>
        ) : (
          /* ── Cart layout ── */
          <div className="cart-layout">

            {/* Items list */}
            <div className="cart-items-panel">
              <div className="cart-items-header">
                <span>{cart.length} {cart.length === 1 ? 'producto' : 'productos'}</span>
              </div>
              <ul className="cart-items">
                {cart.map(item => (
                  <li key={item.id} className="cart-item">
                    <div className="cart-item-thumb">
                      <img
                        src={item.cover_image || 'https://via.placeholder.com/80x80?text=Item'}
                        alt={item.title}
                      />
                    </div>
                    <div className="cart-item-info">
                      <span className={`cart-type-badge type-${item.type}`}>
                        {typeLabel(item.type)}
                      </span>
                      <h3 className="cart-item-title">{item.title}</h3>
                      <div className="cart-item-meta">
                        <i className="fa-solid fa-shield-halved"></i>
                        Acceso de por vida · Descarga incluida
                      </div>
                    </div>
                    <div className="cart-item-right">
                      <span className="cart-item-price">${Number(item.price).toFixed(2)}</span>
                      <button
                        className="cart-item-remove"
                        onClick={() => removeFromCart(item.id)}
                        title="Eliminar"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="cart-continue">
                <Link to="/books">
                  <i className="fa-solid fa-arrow-left"></i> Seguir comprando
                </Link>
              </div>
            </div>

            {/* Order summary */}
            <aside className="cart-summary-panel">
              <div className="cart-summary-card">
                <h3 className="cart-summary-title">Resumen del pedido</h3>

                <div className="cart-summary-lines">
                  <div className="cart-summary-line">
                    <span>Subtotal ({cart.length} {cart.length === 1 ? 'item' : 'items'})</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="cart-summary-line">
                    <span>Descuento</span>
                    <span className="cart-discount">$0.00</span>
                  </div>
                </div>

                <div className="cart-summary-total">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>

                <button className="cart-checkout-btn" onClick={handleCheckout}>
                  <i className="fa-solid fa-lock"></i>
                  Pagar ahora · ${cartTotal.toFixed(2)}
                </button>

                <div className="cart-trust-badges">
                  <div className="cart-trust-item">
                    <i className="fa-solid fa-shield-halved"></i>
                    <span>Pago 100% seguro</span>
                  </div>
                  <div className="cart-trust-item">
                    <i className="fa-solid fa-bolt"></i>
                    <span>Acceso inmediato</span>
                  </div>
                  <div className="cart-trust-item">
                    <i className="fa-solid fa-rotate-left"></i>
                    <span>Garantía 30 días</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};
