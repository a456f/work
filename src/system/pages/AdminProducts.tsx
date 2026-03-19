import React, { useState, useEffect } from 'react';
import './AdminProducts.css';
import { API_URL } from '../../config';

export const AdminProducts = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null); // ID del producto que se está editando
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    type: 'BOOK',
    category_id: '',
    cover_image: '',
    file_url: ''
  });

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`);
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Cargar categorías para el select
    fetch(`${API_URL}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error(err));

    fetchProducts();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      title: product.title,
      description: product.description || '',
      price: product.price,
      type: product.type,
      category_id: product.category_id || '',
      cover_image: product.cover_image || '',
      file_url: product.file_url || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '', description: '', price: '', type: 'BOOK',
      category_id: '', cover_image: '', file_url: ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${API_URL}/products/${editingId}` 
        : `${API_URL}/products`;
      
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        alert(`✅ Producto ${editingId ? 'actualizado' : 'agregado'} correctamente`);
        handleCancelEdit(); // Limpia y resetea estado
        fetchProducts(); // Recarga la lista
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '20px' }}>
      <div className="admin-products-container">
        <h2><i className="fa-solid fa-box-open"></i> {editingId ? 'Editar Producto' : 'Agregar Producto'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="ap-form-group">
            <label>Título del Producto</label>
            <input className="ap-input" name="title" value={formData.title} onChange={handleChange} required placeholder="Ej. Arquitectura Moderna Vol. 1" />
          </div>

          <div className="ap-row">
            <div className="ap-form-group" style={{ flex: 1 }}>
              <label>Tipo</label>
              <select className="ap-select" name="type" value={formData.type} onChange={handleChange}>
                <option value="BOOK">Libro Digital (PDF)</option>
                <option value="COURSE">Curso Online (Video)</option>
              </select>
            </div>
            <div className="ap-form-group" style={{ flex: 1 }}>
              <label>Precio (USD)</label>
              <input className="ap-input" type="number" step="0.01" name="price" value={formData.price} onChange={handleChange} required placeholder="0.00" />
            </div>
          </div>

          <div className="ap-form-group">
            <label>Categoría</label>
            <select className="ap-select" name="category_id" value={formData.category_id} onChange={handleChange}>
              <option value="">Selecciona una categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="ap-form-group">
            <label>Descripción</label>
            <textarea className="ap-textarea" name="description" value={formData.description} onChange={handleChange} placeholder="Detalles del libro o curso..." />
          </div>

          <div className="ap-form-group">
            <label>URL de Portada (Imagen)</label>
            <input className="ap-input" name="cover_image" value={formData.cover_image} onChange={handleChange} placeholder="https://..." />
            {formData.cover_image && <img src={formData.cover_image} alt="Vista previa" style={{marginTop:'10px', height: '100px', borderRadius:'4px'}} />}
          </div>

          <div className="ap-form-group">
            <label>URL del Archivo/Contenido (PDF o Link)</label>
            <input className="ap-input" name="file_url" value={formData.file_url} onChange={handleChange} placeholder="Link seguro al PDF o Video" />
            <small style={{color:'#666'}}>Este link se entregará al cliente tras la compra.</small>
          </div>

          <button type="submit" className="ap-btn-submit">
            {editingId ? 'Guardar Cambios' : 'Publicar Producto'}
          </button>
          
          {editingId && (
            <button type="button" className="ap-btn-submit ap-btn-cancel" onClick={handleCancelEdit}>
              Cancelar Edición
            </button>
          )}
        </form>

        {/* LISTA DE PRODUCTOS */}
        <div className="products-list-section">
          <h3>Inventario ({products.length})</h3>
          <table className="ap-table">
            <thead>
              <tr>
                <th>IMG</th>
                <th>Título</th>
                <th>Tipo</th>
                <th>Precio</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(prod => (
                <tr key={prod.id}>
                  <td><img src={prod.cover_image} alt="" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}} /></td>
                  <td>{prod.title}</td>
                  <td><span style={{fontSize:'0.8rem', padding:'2px 6px', background: prod.type==='BOOK'?'#e3f2fd':'#fff3e0', borderRadius:'4px'}}>{prod.type}</span></td>
                  <td>${prod.price}</td>
                  <td>
                    <button className="ap-action-btn btn-edit" onClick={() => handleEdit(prod)}><i className="fa-solid fa-pen"></i></button>
                    <button className="ap-action-btn btn-delete" onClick={() => handleDelete(prod.id)}><i className="fa-solid fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};