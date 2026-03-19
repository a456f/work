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

  // 🔥 IMAGEN DEFAULT
  const DEFAULT_IMG =
    "https://static-cse.canva.com/blob/439109/1024w-qIvQK6RTXxg.jpg";

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await fetch(`${API_URL}/products?type=BOOK`);
        if (res.ok) {
          setBooks(await res.json());
        }
      } catch (error) {
        console.error("Error fetching books:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // 🛒 AGREGAR AL CARRITO
  const handleAddToCart = (book: Book) => {
    if (!user) {
      alert("Debes iniciar sesión para agregar al carrito");
      navigate('/login/client');
      return;
    }

    const item = {
      id: book.id,
      title: book.title,
      price: book.price,
      type: 'BOOK' as const,
      cover_image: book.cover_image
    };

    addToCart(item);
  };

  return (
    <div className="bookstore">

      <div className="main-layout">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Categorías</h3>
          <ul className="category-list">
            <li>Ficción</li>
            <li>Tecnología</li>
            <li>Negocios</li>
            <li>Ciencia</li>
          </ul>
        </aside>

        {/* CONTENT */}
        <main className="content-area">

          {/* HERO */}
          <section className="hero-banner">
            <div className="hero-text">
              <h2>Feria del Libro Digital</h2>
              <p>50% OFF en miles de libros</p>
              <button className="btn-primary">Ver Ofertas</button>
            </div>
          </section>

          {/* PRODUCTOS */}
          <section>
            <h2>Recomendados</h2>

            {loading ? (
              <p>Cargando libros...</p>
            ) : (
              <div className="product-grid">

                {books.map(book => (
                  <div key={book.id} className="product-card">

                    {/* 🔥 IMAGEN CON FALLBACK REAL */}
                    <img
                      src={
                        book.cover_image && book.cover_image !== ""
                          ? book.cover_image
                          : DEFAULT_IMG
                      }
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (target.src !== DEFAULT_IMG) {
                          target.src = DEFAULT_IMG;
                        }
                      }}
                      className="product-img"
                      alt={book.title}
                    />

                    {/* TITLE */}
                    <h3 className="product-title">{book.title}</h3>

                    {/* AUTHOR */}
                    <p className="product-author">{book.author}</p>

                    {/* RATING */}
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={
                            i < Math.round(book.rating)
                              ? "fa-solid fa-star"
                              : "fa-regular fa-star"
                          }
                        ></i>
                      ))}
                    </div>

                    {/* PRICE */}
                    <div className="price-block">
                      <span className="price-current">
                        US${book.price}
                      </span>
                    </div>

                    {/* BOTÓN */}
                    <button
                      className="btn btn-cart"
                      onClick={() => handleAddToCart(book)}
                    >
                      🛒 Agregar al carrito
                    </button>

                  </div>
                ))}

              </div>
            )}

            {!loading && books.length === 0 && (
              <p>No hay libros disponibles.</p>
            )}

          </section>

        </main>
      </div>

    </div>
  );
}