import { useState } from 'react';
import { Link } from 'react-router-dom';
import { WebLayout } from './WebLayout';
import { API_URL } from '../../config';
  
  export const ClientRegister = () => {
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      phone: '',
      country: '',
      city: '',
      address: ''
    });
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };
  
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      try {
        const res = await fetch(`${API_URL}/register/client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        const data = await res.json();
        if (res.ok) alert('Cliente registrado con éxito!');
        else alert('Error: ' + data.error);
      } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor');
      }
    };
  
    return (
      <WebLayout>
        <div style={{ maxWidth: '400px', margin: '2rem auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h2>Registro de Cliente</h2>
          <p>Crea tu perfil para contactar expertos.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input name="name" onChange={handleChange} type="text" placeholder="Nombre completo" required />
          
            <input name="email" onChange={handleChange} type="email" placeholder="Email" required />
            <input name="password" onChange={handleChange} type="password" placeholder="Contraseña" required />
            <input name="phone" onChange={handleChange} type="tel" placeholder="Teléfono (Opcional)" />
            <input name="country" onChange={handleChange} type="text" placeholder="País (Opcional)" />
            <input name="city" onChange={handleChange} type="text" placeholder="Ciudad (Opcional)" />
            <input name="address" onChange={handleChange} type="text" placeholder="Dirección (Opcional)" />
            <button type="submit" style={{ padding: '0.5rem', background: '#007bff', color: 'white', border: 'none' }}>Registrarse como Cliente</button>
         
          </form>
           ¿Ya tienes cuenta? <Link to="/login/client">Inicia sesión aquí</Link>
       
        </div>
      </WebLayout>
    );
  };
