import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
  const { addToCart, cartCount } = useCart();

  const selectedCategory = searchParams.get('category');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 🔥 PRODUCTS
        const url = new URL(`${API_URL}/products`);
        if (selectedCategory) url.searchParams.append('category', selectedCategory);
        if (type) url.searchParams.append('type', type);

        const resProducts = await fetch(url.toString());
        if (resProducts.ok) {
          setProducts(await resProducts.json());
        }

        // 🔥 CATEGORIES
        const resCategories = await fetch(`${API_URL}/categories`);
        if (resCategories.ok) {
          setCategories(await resCategories.json());
        }

      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, type]); // 🔥 FIX DEPENDENCIA

  const handleCategoryClick = (categoryName: string | null) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (categoryName) newParams.set('category', categoryName);
      else newParams.delete('category');
      return newParams;
    });
  };

  let pageTitle = 'Todos los Productos';
  if (type === 'BOOK') pageTitle = 'Libros Digitales';
  if (type === 'COURSE') pageTitle = 'Cursos Online';

  return (
    <div className="products-page-body">

  

      {/* LAYOUT */}
      <div className="main-layout">

        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Categorías</h3>
          <ul className="category-list">
            <li
              onClick={() => handleCategoryClick(null)}
              style={{ fontWeight: !selectedCategory ? 'bold' : 'normal' }}
            >
              Todas
            </li>

            {categories.map(cat => (
              <li
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                style={{ fontWeight: selectedCategory === cat.name ? 'bold' : 'normal' }}
              >
                {cat.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* MAIN */}
        <main>

          {/* ALERTAS */}
          {type === 'BOOK' && (
            <div className="alert-book">
              🔥 Feria del Libro: descuentos en arquitectura
            </div>
          )}

          {type === 'COURSE' && (
            <div className="alert-course">
              🎓 Cursos con certificado digital
            </div>
          )}

          <h2>
            {selectedCategory ? `Mostrando: ${selectedCategory}` : pageTitle}
          </h2>

          {loading ? (
            <p>Cargando...</p>
          ) : (
            <div className="product-grid">

              {products.map(product => (
                <div key={product.id} className="product-card">

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
                    <h3>{product.title}</h3>
                    <p>{product.description}</p>

                    <div className="product-footer">
                      <span className="product-price">
                        ${product.price}
                      </span>

                      <button onClick={() => addToCart(product)}>
                        Añadir
                      </button>
                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

          {!loading && products.length === 0 && (
            <p>No hay productos.</p>
          )}

        </main>
      </div>
    </div>
  );
};