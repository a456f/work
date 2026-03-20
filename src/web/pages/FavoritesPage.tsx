import { Link } from 'react-router-dom';
import './FavoritesPage.css';
import { useFavorites } from '../context/FavoritesContext';
import { useCart } from '../context/CartContext';

export const FavoritesPage = () => {
  const { favorites, removeFromFavorites } = useFavorites();
  const { addToCart } = useCart();

  return (
    <div className="favorites-page">
      <div className="favorites-wrapper">

        {/* Header */}
        <div className="favorites-page-header">
          <div>
            <span className="eyebrow">
              <i className="fa-solid fa-heart"></i> Lista de deseos
            </span>
            <h1 className="favorites-heading">Mis Favoritos</h1>
          </div>
          {favorites.length > 0 && (
            <div className="favorites-count-badge">
              {favorites.length} {favorites.length === 1 ? 'artículo' : 'artículos'}
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
          /* Empty state */
          <div className="favorites-empty">
            <div className="favorites-empty-icon">
              <i className="fa-regular fa-heart"></i>
            </div>
            <h3>Tu lista de deseos está vacía</h3>
            <p>Guarda los libros, cursos y servicios que más te interesen para encontrarlos fácilmente.</p>
            <div className="favorites-empty-actions">
              <Link to="/books" className="fav-empty-btn primary">
                <i className="fa-solid fa-book-open"></i> Explorar libros
              </Link>
              <Link to="/services" className="fav-empty-btn secondary">
                <i className="fa-solid fa-wand-magic-sparkles"></i> Ver servicios
              </Link>
            </div>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map(product => (
              <div key={product.id} className="fav-card">
                <div className="fav-card-image">
                  <img
                    src={product.cover_image || 'https://via.placeholder.com/300x200?text=Producto'}
                    alt={product.title}
                  />
                  <span className={`fav-type-badge type-${product.type}`}>
                    {product.type === 'COURSE' ? 'Curso' : product.type === 'BOOK' ? 'Libro' : product.type}
                  </span>
                  <button
                    className="fav-remove-btn"
                    onClick={() => removeFromFavorites(product.id)}
                    title="Quitar de favoritos"
                  >
                    <i className="fa-solid fa-heart-crack"></i>
                  </button>
                </div>

                <div className="fav-card-body">
                  <h3 className="fav-card-title">{product.title}</h3>

                  <div className="fav-card-footer">
                    <div className="fav-price-block">
                      <span className="fav-price">${Number(product.price).toFixed(2)}</span>
                    </div>
                    <button
                      className="fav-add-cart-btn"
                      onClick={() => addToCart({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        type: (product.type as 'BOOK' | 'COURSE') || 'BOOK',
                        cover_image: product.cover_image
                      })}
                    >
                      <i className="fa-solid fa-cart-plus"></i>
                      Agregar
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
