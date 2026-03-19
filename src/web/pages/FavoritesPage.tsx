import { Link } from 'react-router-dom';
import './FavoritesPage.css';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export const FavoritesPage = () => {
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h2><i className="fa-solid fa-heart" style={{color: '#ff4757', marginRight: '10px'}}></i> Mis Favoritos</h2>
        <span className="favorites-count">{favorites.length} artículos</span>
      </div>
      
      {favorites.length === 0 ? (
        <div className="favorites-empty-state">
          <div className="empty-icon-container">
            <i className="fa-regular fa-heart"></i>
          </div>
          <h3>Tu lista de deseos está vacía</h3>
          <p>
            Parece que aún no has añadido ningún producto a tus favoritos. 
            Explora nuestra colección y guarda lo que te inspire.
          </p>
          <Link to="/products" className="btn-explore">
            <i className="fa-solid fa-compass"></i> Explorar Productos
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {favorites.map(product => (
            <div key={product.id} className="product-card" style={{position: 'relative'}}>
              <button 
                onClick={() => removeFromFavorites(product.id)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  color: '#ff4757',
                  zIndex: 10,
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                title="Eliminar de favoritos"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
              
              <div className="product-image">
                <img src={product.cover_image || 'https://via.placeholder.com/300x400'} alt={product.title} />
              </div>
              <div className="product-info">
                <h3 className="product-title">{product.title}</h3>
                <div className="product-footer">
                  <span className="price">${product.price}</span>
                  <button 
                    className="add-cart-btn"
                    onClick={() => addToCart({
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      type: (product.type as 'BOOK' | 'COURSE') || 'BOOK',
                      cover_image: product.cover_image
                    })}
                  >
                    <i className="fa-solid fa-cart-plus"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};