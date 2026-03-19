import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './BooksPage.css';
import { API_URL } from '../../config';

interface Book {
  id: number;
  title: string;
  cover_image: string;
  author: string;
  rating: number;
  price: number;
}

export function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const DEFAULT_IMG = 'https://static-cse.canva.com/blob/439109/1024w-qIvQK6RTXxg.jpg';

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(`${API_URL}/products?type=BOOK`);
        if (res.ok) {
          setBooks(await res.json());
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const handleAddToCart = (book: Book) => {
    if (!user) {
      alert('Debes iniciar sesión para agregar al carrito');
      navigate('/login/client');
      return;
    }

    addToCart({
      id: book.id,
      title: book.title,
      price: book.price,
      type: 'BOOK',
      cover_image: book.cover_image
    });
  };

  return (
    <div className="bookstore">
      <div className="main-layout">
        <aside className="sidebar">
          <h3>Categorias</h3>
          <ul className="category-list">
            <li><span>Ficcion</span><i className="fa-solid fa-chevron-right"></i></li>
            <li><span>Tecnologia</span><i className="fa-solid fa-chevron-right"></i></li>
            <li><span>Negocios</span><i className="fa-solid fa-chevron-right"></i></li>
            <li><span>Ciencia</span><i className="fa-solid fa-chevron-right"></i></li>
          </ul>
        </aside>

        <main className="books-main">
          <section className="hero-banner books-hero">
            <div className="hero-text">
              <span className="eyebrow">Biblioteca digital</span>
              <h2>Libros curados para creativos y profesionales.</h2>
              <p>Una selección más sobria y editorial para aprender, investigar y comprar recursos con confianza.</p>
            </div>
          </section>

          <section className="books-heading">
            <div>
              <span className="eyebrow">Recomendados</span>
              <h2>Explora títulos disponibles</h2>
            </div>
          </section>

          {loading ? (
            <div className="books-empty-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando libros...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="books-empty-state">
              <i className="fa-regular fa-folder-open"></i>
              <p>No hay libros disponibles.</p>
            </div>
          ) : (
            <div className="product-grid">
              {books.map((book) => (
                <article key={book.id} className="product-card book-card">
                  <div className="book-cover-shell">
                    <img
                      src={book.cover_image && book.cover_image !== '' ? book.cover_image : DEFAULT_IMG}
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_IMG) {
                          target.src = DEFAULT_IMG;
                        }
                      }}
                      className="product-img"
                      alt={book.title}
                    />
                  </div>

                  <div className="product-body">
                    <h3 className="product-title">{book.title}</h3>
                    <p className="product-author">{book.author}</p>
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={i < Math.round(book.rating) ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                        ></i>
                      ))}
                      <span>{Number(book.rating || 5).toFixed(1)}</span>
                    </div>
                    <div className="product-footer">
                      <span className="price-current">US${book.price}</span>
                      <button className="btn-buy" onClick={() => handleAddToCart(book)}>
                        Agregar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
