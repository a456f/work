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
        body: JSON.stringify({
          userId: user.id,
          cart: cart,
          total: cartTotal
        })
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        clearCart();
        navigate('/my-downloads'); // Redirigir a la página de descargas
      } else {
        throw new Error(data.error || 'Error al procesar la compra.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="cart-page">
   
      <div className="cart-container">
        <h2>Tu Carrito de Compras</h2>
        {cart.length === 0 ? (
          <div className="empty-cart">
            <p>Tu carrito está vacío.</p>
            
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {cart.map(item => (
                <li key={item.id} className="cart-item">
                  <div className="item-info">
                    <img src={item.cover_image || 'https://via.placeholder.com/150'} alt={item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>Precio: ${item.price}</p>
                    </div>
                  </div>
                  <button className="remove-button" onClick={() => removeFromCart(item.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
            <div className="cart-summary">
              <p className="cart-total">Total: ${cartTotal.toFixed(2)}</p>
              <div className="cart-actions">
                <button className="clear-button" onClick={clearCart}>
                  Vaciar Carrito
                </button>
                <button className="checkout-button" onClick={handleCheckout}>
                  Pagar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
