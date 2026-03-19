import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ProductsPage.css';
import './ServicesPage.css';
import { useCart } from '../context/CartContext';
import { API_URL } from '../../config';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  type: 'BOOK' | 'COURSE';
  cover_image: string;
}

interface Category {
  id: number;
  name: string;
}

interface ProductsPageProps {
  type?: 'BOOK' | 'COURSE';
}

export const ProductsPage = ({ type }: ProductsPageProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = new URL(`${API_URL}/products`);
        if (selectedCategory) url.searchParams.append('category', selectedCategory);
        if (type) url.searchParams.append('type', type);

        const resProducts = await fetch(url.toString());
        if (resProducts.ok) setProducts(await resProducts.json());

        const resCategories = await fetch(`${API_URL}/categories`);
        if (resCategories.ok) setCategories(await resCategories.json());
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, type]);

  const handleCategoryClick = (categoryName: string | null) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (categoryName) next.set('category', categoryName);
      else next.delete('category');
      return next;
    });
  };

  let pageTitle = 'Todos los Productos';
  if (type === 'BOOK') pageTitle = 'Libros Digitales';
  if (type === 'COURSE') pageTitle = 'Cursos Online';

  return (
    <div className="products-page-body">
      <div className="main-layout">
        <aside className="sidebar">
          <h3>Categorias</h3>
          <ul className="category-list">
            <li onClick={() => handleCategoryClick(null)}>
              <span>Todas</span>
              {!selectedCategory && <i className="fa-solid fa-check"></i>}
            </li>

            {categories.map((cat) => (
              <li key={cat.id} onClick={() => handleCategoryClick(cat.name)}>
                <span>{cat.name}</span>
                {selectedCategory === cat.name && <i className="fa-solid fa-check"></i>}
              </li>
            ))}
          </ul>
        </aside>

        <main className="services-main">
          <section className="hero-banner product-page-hero">
            <div className="hero-text">
              <span className="hero-kicker">{type === 'BOOK' ? 'Biblioteca digital' : 'Aprendizaje online'}</span>
              <h2>{selectedCategory ? `Explorando ${selectedCategory}` : pageTitle}</h2>
              <p>
                {type === 'BOOK'
                  ? 'Recursos visuales y libros curados para creativos, estudios y equipos que quieren aprender mejor.'
                  : 'Cursos listos para elevar tus habilidades con una experiencia mas clara y moderna.'}
              </p>
            </div>
          </section>

          {loading ? (
            <div className="empty-market-state">
              <i className="fa-solid fa-spinner fa-spin"></i>
              <p>Cargando productos...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-market-state">
              <i className="fa-regular fa-folder-open"></i>
              <p>No hay productos para esta categoria.</p>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <article key={product.id} className="product-card">
                  <div className="product-cover">
                    <img
                      src={product.cover_image || 'https://via.placeholder.com/400x550'}
                      alt={product.title}
                    />
                    <span className={`product-type-badge product-type-${product.type}`}>
                      {product.type === 'BOOK' ? 'Libro' : 'Curso'}
                    </span>
                  </div>

                  <div className="product-body">
                    <h3 className="product-title">{product.title}</h3>
                    <p className="product-description">{product.description}</p>

                    <div className="product-footer">
                      <span className="product-price">${product.price}</span>
                      <button className="btn-buy" onClick={() => addToCart(product)}>Añadir</button>
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
};
