import express from 'express';
import { createServer } from 'http'; // Necesario para Socket.io
import { Server } from 'socket.io';  // Importar Socket.io
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

dotenv.config({ path: path.join(process.cwd(), 'backend/.env') });


const app = express();
const httpServer = createServer(app); // Envolver express
const io = new Server(httpServer, {   // Inicializar Socket.io
  cors: {
    origin: "*", // Permitir conexiones desde el frontend
    methods: ["GET", "POST"]
  }
});

const port = process.env.PORT || 3002; // Puerto 3002 (para evitar conflicto)

// Middleware
app.use(cors());
app.use(express.json());

// --- SOCKET.IO LÓGICA DE TIEMPO REAL ---

// Mapa de participantes activos por subasta: auctionId -> Set de socket.id
const auctionParticipants = new Map();

io.on('connection', (socket) => {
  console.log('Usuario conectado al socket:', socket.id);

  // Unirse a sala personal para notificaciones (usando ID de usuario)
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Usuario ${userId} unido a sala de notificaciones`);
  });

  // Unirse a sala de chat de una solicitud específica
  socket.on('join_chat', (requestId) => {
    socket.join(`request_${requestId}`);
    console.log(`Socket ${socket.id} unido al chat de solicitud ${requestId}`);
  });

  // Manejar indicador de "escribiendo..."
  socket.on('typing_start', (data) => {
    socket.to(`request_${data.requestId}`).emit('user_is_typing');
  });

  socket.on('typing_stop', (data) => {
    socket.to(`request_${data.requestId}`).emit('user_stopped_typing');
  });

  // ── SUBASTAS EN TIEMPO REAL ──

  socket.on('join_auction', (auctionId) => {
    const key = String(auctionId);
    socket.join(`auction_${key}`);
    if (!auctionParticipants.has(key)) auctionParticipants.set(key, new Set());
    auctionParticipants.get(key).add(socket.id);
    io.to(`auction_${key}`).emit('participants_update', {
      auction_id: auctionId,
      count: auctionParticipants.get(key).size,
    });
  });

  socket.on('leave_auction', (auctionId) => {
    const key = String(auctionId);
    socket.leave(`auction_${key}`);
    if (auctionParticipants.has(key)) {
      auctionParticipants.get(key).delete(socket.id);
      io.to(`auction_${key}`).emit('participants_update', {
        auction_id: auctionId,
        count: auctionParticipants.get(key).size,
      });
    }
  });

  socket.on('disconnect', () => {
    auctionParticipants.forEach((participants, key) => {
      if (participants.has(socket.id)) {
        participants.delete(socket.id);
        io.to(`auction_${key}`).emit('participants_update', {
          auction_id: parseInt(key),
          count: participants.size,
        });
      }
    });
  });
});

// Servir carpeta de uploads públicamente para acceder a las imágenes
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Constante para el "salting" de bcrypt (para uso futuro)
const saltRounds = 10;

// --- Configuración para subida de archivos con Multer ---
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// --- Configuración específica para el CATÁLOGO (Portfolio) ---
const catalogDir = 'uploads/catalog/';
if (!fs.existsSync(catalogDir)) {
  fs.mkdirSync(catalogDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único para evitar colisiones
  }
});
const upload = multer({ storage: storage });

const catalogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, catalogDir); // ✅ Guardar en carpeta específica de catálogo
  },
  filename: (req, file, cb) => {
    cb(null, 'portfolio-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadCatalog = multer({ storage: catalogStorage });

// Configuración de la Base de Datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'workuser',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'workdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión al iniciar
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a Base de Datos MySQL exitosa');
    connection.release();
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
  }
})();

// --- Rutas ---

// Registro para Clientes
app.post('/api/register/client', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // Datos del body (users + user_profiles)
    const { name, email, password, phone, country, city, address } = req.body;

    // 1. Insertar Usuario Base
    // MySQL usa '?' para placeholders y devuelve el ID en el resultado
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, password] // TODO: Hashear password en producción
    );
    const userId = userResult.insertId;

    // 2. Insertar Perfil de Cliente
    await connection.execute(
      `INSERT INTO user_profiles (user_id, phone, country, city, address) VALUES (?, ?, ?, ?, ?)`,
      [userId, phone || null, country || null, city || null, address || null]
    );

    await connection.commit();
    res.status(201).json({ message: 'Cliente registrado correctamente', userId });
  } catch (error) {
    await connection.rollback();
    console.error('Error en registro cliente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar el cliente.' });
  } finally {
    connection.release();
  }
});

// Registro para Proveedores (Arquitectos/Diseñadores)
app.post('/api/register/provider', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Datos del body (users + provider_profiles)
    const { name, email, password, type, title, description, experience_years } = req.body;

    // Validar tipo
    if (!['DESIGNER', 'ARCHITECT'].includes(type)) {
      throw new Error('Tipo de proveedor inválido');
    }

    // 1. Insertar Usuario Base
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
      [name, email, password] // TODO: Hashear password en producción
    );
    const userId = userResult.insertId;

    // 2. Insertar Perfil Profesional
    await connection.execute(
      `INSERT INTO provider_profiles (user_id, type, title, description, experience_years) VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, description || null, experience_years]
    );

    await connection.commit();
    res.status(201).json({ message: 'Profesional registrado correctamente', userId });
  } catch (error) {
    await connection.rollback();
    console.error('Error en registro profesional:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo electrónico ya está registrado.' });
    }
    res.status(500).json({ error: error.message || 'Error interno del servidor al registrar el profesional.' });
  } finally {
    connection.release();
  }
});

// --- Servicios del Proveedor ---

// 4. Crear un nuevo servicio
app.post('/api/services', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // provider_id debe venir del frontend (idealmente del usuario logueado)
    const { provider_id, title, description, base_price, min_days, max_days } = req.body;

    await connection.execute(
      `INSERT INTO services (provider_id, title, description, base_price, min_days, max_days) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [provider_id, title, description, base_price, min_days, max_days]
    );

    res.status(201).json({ message: 'Servicio creado correctamente' });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({ error: 'Error al crear el servicio.' });
  } finally {
    connection.release();
  }
});

// 5. Listar servicios de un proveedor específico
app.get('/api/providers/:providerId/services', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { providerId } = req.params;
    const [rows] = await connection.execute(
      `SELECT * FROM services WHERE provider_id = ? AND is_active = TRUE`,
      [providerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    res.status(500).json({ error: 'Error al obtener los servicios.' });
  } finally {
    connection.release();
  }
});

// 5.5. Eliminar un servicio
app.delete('/api/services/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.execute('DELETE FROM services WHERE id = ?', [id]);
    res.json({ message: 'Servicio eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    res.status(500).json({ error: 'Error al eliminar el servicio.' });
  } finally {
    connection.release();
  }
});

// 6. Listar todos los servicios (Público - para la Home/Proyectos)
app.get('/api/services', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT s.*, u.name as provider_name, p.title as provider_title
       FROM services s
       JOIN provider_profiles p ON s.provider_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE s.is_active = TRUE
       ORDER BY s.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al listar servicios:', error);
    res.status(500).json({ error: 'Error al obtener los servicios.' });
  } finally {
    connection.release();
  }
});

// 7. Listar profesionales (Público - para la página de Profesionales)
app.get('/api/professionals', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT u.id as user_id, u.name, p.id as provider_id, p.title, p.type, p.experience_years, p.rating
       FROM provider_profiles p
       JOIN users u ON p.user_id = u.id`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al listar profesionales:', error);
    res.status(500).json({ error: 'Error al obtener profesionales.' });
  } finally {
    connection.release();
  }
});

// --- Digital Products (Books/Courses) ---

/*
  CREATE TABLE products (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      type VARCHAR(20) CHECK (type IN ('BOOK','COURSE')),
      cover_image TEXT,
      file_url TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
  );
  CREATE TABLE product_categories (
      id SERIAL PRIMARY KEY,
      product_id INT,
      category_id INT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id)
  );
*/

// Get all categories
app.get('/api/categories', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [categories] = await connection.execute('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// Get all products, with optional category filtering
app.get('/api/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { category, type } = req.query;
    // Mejorada: Traer siempre la categoría para poder mostrarla/editarla en el admin
    let query = `
      SELECT p.*, c.id as category_id, c.name as category_name 
      FROM products p
      LEFT JOIN product_categories pc ON p.id = pc.product_id
      LEFT JOIN categories c ON pc.category_id = c.id
    `;
    const params = [];
    const conditions = ['p.is_active = TRUE'];

    if (category) {
      // La condición se aplica sobre el LEFT JOIN ya existente
      conditions.push('c.name = ?');
      params.push(category);
    }

    if (type) {
      conditions.push('p.type = ?');
      params.push(type);
    }

    query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY p.created_at DESC';
    const [products] = await connection.execute(query, params);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// Crear un nuevo producto (Libro o Curso)
app.post('/api/products', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { title, description, price, type, cover_image, file_url, category_id } = req.body;

    if (!title || !price || !type) {
      return res.status(400).json({ error: 'Título, precio y tipo son obligatorios.' });
    }

    // 1. Insertar producto
    const [result] = await connection.execute(
      `INSERT INTO products (title, description, price, type, cover_image, file_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, price, type, cover_image || '', file_url || '']
    );
    const productId = result.insertId;

    // 2. Relacionar categoría (si se seleccionó una)
    if (category_id) {
      await connection.execute('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [productId, category_id]);
    }

    await connection.commit();
    res.status(201).json({ message: 'Producto creado exitosamente', productId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno al crear el producto.' });
  } finally {
    connection.release();
  }
});

// Actualizar producto existente
app.put('/api/products/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { title, description, price, type, cover_image, file_url, category_id } = req.body;

    await connection.beginTransaction();

    // 1. Actualizar datos básicos
    await connection.execute(
      'UPDATE products SET title=?, description=?, price=?, type=?, cover_image=?, file_url=? WHERE id=?',
      [title, description, price, type, cover_image || '', file_url || '', id]
    );

    // 2. Actualizar categoría (borrar anterior e insertar nueva, enfoque simple)
    if (category_id) {
      await connection.execute('DELETE FROM product_categories WHERE product_id = ?', [id]);
      await connection.execute('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, category_id]);
    }

    await connection.commit();
    res.json({ message: 'Producto actualizado correctamente' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error al actualizar.' });
  } finally {
    connection.release();
  }
});

// Eliminar producto (soft delete o hard delete, aquí haremos hard delete para limpiar)
app.delete('/api/products/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    await connection.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar producto.' });
  } finally {
    connection.release();
  }
});

// --- Flujo de Compra de Productos Digitales ---

/*
  CREATE TABLE orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      total DECIMAL(10,2),
      status VARCHAR(20) CHECK (status IN ('PENDING','PAID','CANCELLED')) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      product_id INT,
      price DECIMAL(10,2),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
  );
  CREATE TABLE payments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT,
      amount DECIMAL(10,2),
      status VARCHAR(20) CHECK (status IN ('PENDING','COMPLETED','FAILED')),
      transaction_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  CREATE TABLE downloads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      product_id INT,
      download_url TEXT,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
  );
*/

// Procesar una nueva orden de productos
app.post('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { userId, cart, total } = req.body;
    if (!userId || !cart || cart.length === 0) {
      return res.status(400).json({ error: 'Datos de la orden inválidos.' });
    }

    await connection.beginTransaction();

    // 1. Crear Orden
    const [orderResult] = await connection.execute('INSERT INTO orders (user_id, total, status) VALUES (?, ?, ?)', [userId, total, 'PAID']);
    const orderId = orderResult.insertId;

    // 2. Insertar Items de la Orden y generar descargas
    for (const item of cart) {
      await connection.execute('INSERT INTO order_items (order_id, product_id, price) VALUES (?, ?, ?)', [orderId, item.id, item.price]);
      const [productRows] = await connection.execute('SELECT file_url FROM products WHERE id = ?', [item.id]);
      const product = productRows[0];
      await connection.execute('INSERT INTO downloads (user_id, product_id, download_url, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL 3 DAY)', [userId, item.id, product.file_url]);
    }

    await connection.commit();
    res.status(201).json({ message: '¡Compra completada con éxito!', orderId });
  } catch (error) {
    await connection.rollback();
    console.error('Error procesando la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar la orden.' });
  } finally {
    connection.release();
  }
});

// Obtener descargas de un usuario (Para el Cliente)
app.get('/api/users/:userId/downloads', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { userId } = req.params;
    const [rows] = await connection.execute(
      `SELECT d.id, d.download_url, d.expires_at, p.title, p.cover_image
       FROM downloads d
       JOIN products p ON d.product_id = p.id
       WHERE d.user_id = ?
       ORDER BY d.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({ error: 'Error fetching downloads.' });
  } finally {
    connection.release();
  }
});

// Obtener todas las órdenes (Para el Admin/Sistema)
app.get('/api/orders', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      `SELECT o.id, o.total, o.status, o.created_at, u.name as client_name, u.email as client_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching orders.' });
  } finally {
    connection.release();
  }
});

// --- Flujo de Solicitud de Servicios ---

/*
  NOTA: Asegúrate de haber creado estas tablas en tu base de datos MySQL.

  CREATE TABLE service_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_id INT,
      client_id INT,
      provider_id INT,
      description TEXT,
      agreed_price DECIMAL(10,2),
      deadline DATE,
      status VARCHAR(20) CHECK (status IN ('PENDING', 'QUOTED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'DELIVERED', 'REVISION', 'COMPLETED', 'CANCELLED')) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
  );

  CREATE TABLE deliveries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT,
      file_url TEXT NOT NULL,
      message TEXT,
      version INT DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id)
  );
*/
/*
  CREATE TABLE request_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT,
      sender_id INT,
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
  );
*/
/*
  CREATE TABLE reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      request_id INT UNIQUE,
      client_id INT,
      provider_id INT,
      rating INT CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (request_id) REFERENCES service_requests(id),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (provider_id) REFERENCES provider_profiles(id)
  );
*/

// 1. Cliente crea una solicitud de servicio
app.post('/api/service-requests', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { service_id, client_id, provider_id, description } = req.body;
    if (!service_id || !client_id || !provider_id || !description) {
      return res.status(400).json({ error: 'Faltan datos para crear la solicitud.' });
    }
    const [result] = await connection.execute(
      `INSERT INTO service_requests (service_id, client_id, provider_id, description) VALUES (?, ?, ?, ?)`,
      [service_id, client_id, provider_id, description]
    );

    // 🔥 NOTIFICACIÓN EN TIEMPO REAL AL PROVEEDOR
    // 1. Obtener el user_id del proveedor para notificarle a su sala personal
    const [provRows] = await connection.execute('SELECT user_id FROM provider_profiles WHERE id = ?', [provider_id]);
    if (provRows.length > 0) {
      const providerUserId = provRows[0].user_id;
      console.log(`Emitiendo notificacion de nueva solicitud a user_${providerUserId}`);
      io.to(`user_${providerUserId}`).emit('new_notification', { title: 'Nueva Solicitud', message: '¡Has recibido un nuevo trabajo potencial!' });
    }

    res.status(201).json({ message: 'Solicitud enviada. El diseñador ha sido notificado.', requestId: result.insertId });
  } catch (error) {
    console.error('Error al crear la solicitud de servicio:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 2. Proveedor lista sus solicitudes de servicio
app.get('/api/providers/:providerId/requests', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { providerId } = req.params;
    const [requests] = await connection.execute(
      `SELECT
         sr.id, sr.description, sr.status, sr.created_at, sr.agreed_price, sr.deadline,
         s.title as service_title,
         u.name as client_name
       FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       JOIN users u ON sr.client_id = u.id
       WHERE sr.provider_id = ?
       ORDER BY sr.created_at DESC`,
      [providerId]
    );
    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes para el proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 3. Proveedor responde a una solicitud (cotiza)
app.put('/api/service-requests/:requestId/quote', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    const { agreed_price, deadline } = req.body;

    if (!agreed_price || !deadline) {
      return res.status(400).json({ error: 'Precio y fecha límite son requeridos.' });
    }

    // Opcional: verificar que la solicitud esté en PENDING
    const [requests] = await connection.execute('SELECT status FROM service_requests WHERE id = ?', [requestId]);
    if (requests.length === 0 || requests[0].status !== 'PENDING') {
      return res.status(409).json({ error: 'La solicitud no está pendiente o no existe.' });
    }

    await connection.execute(
      `UPDATE service_requests SET status = 'QUOTED', agreed_price = ?, deadline = ? WHERE id = ?`,
      [agreed_price, deadline, requestId]
    );

    // 🔥 MENSAJE DE SISTEMA EN CHAT
    // El proveedor (quien cotiza) envía este mensaje automático
    const [reqData] = await connection.execute('SELECT provider_id FROM service_requests WHERE id = ?', [requestId]);
    const [provData] = await connection.execute('SELECT user_id FROM provider_profiles WHERE id = ?', [reqData[0].provider_id]);
    const senderId = provData[0].user_id;
    
    await insertSystemMessage(connection, requestId, senderId, `📋 Ha enviado una cotización: $${agreed_price} para el ${deadline}`);

    // Notificar al cliente (la solicitud tiene client_id, habría que buscarlo pero por brevedad lo omitimos aquí)
    res.json({ message: 'Solicitud cotizada correctamente.' });
  } catch (error) {
    console.error('Error al cotizar la solicitud:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 3.5. Cliente lista sus solicitudes de servicio
app.get('/api/clients/:clientId/requests', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { clientId } = req.params;
    const [requests] = await connection.execute(
      `SELECT
         sr.id, sr.description, sr.status, sr.created_at, sr.agreed_price, sr.deadline,
         s.title as service_title,
         s.provider_id,
         prov_user.name as provider_name,
         d.file_url, d.message as delivery_message,
         r.id as review_id
       FROM service_requests sr
       JOIN services s ON sr.service_id = s.id
       JOIN provider_profiles pp ON sr.provider_id = pp.id
       JOIN users prov_user ON pp.user_id = prov_user.id
       LEFT JOIN deliveries d ON d.request_id = sr.id AND d.id = (
           SELECT MAX(id) FROM deliveries WHERE request_id = sr.id
       )
       LEFT JOIN reviews r ON r.request_id = sr.id
       WHERE sr.client_id = ?
       ORDER BY sr.created_at DESC`,
      [clientId]
    );
    res.json(requests);
  } catch (error) {
    console.error('Error al obtener solicitudes para el cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 3.6. Cliente responde a una cotización (acepta/rechaza)
app.put('/api/service-requests/:requestId/respond', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    const { newStatus, clientId } = req.body; // newStatus: 'ACCEPTED' o 'CANCELLED'

    if (!newStatus || !clientId || !['ACCEPTED', 'CANCELLED'].includes(newStatus)) {
      return res.status(400).json({ error: 'Faltan datos o el estado es inválido.' });
    }

    // Solo se puede cambiar si el estado actual es 'QUOTED'
    const [result] = await connection.execute(
      `UPDATE service_requests SET status = ? WHERE id = ? AND client_id = ? AND status = 'QUOTED'`,
      [newStatus, requestId, clientId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'La solicitud no se encontró, no pertenece al cliente o no está en estado de cotización.' });
    }

    // 🔥 MENSAJE DE SISTEMA EN CHAT
    await insertSystemMessage(connection, requestId, clientId, newStatus === 'ACCEPTED' ? '✅ Ha aceptado la cotización. El proyecto puede comenzar.' : '❌ Ha rechazado la cotización.');

    res.json({ message: `Solicitud ${newStatus === 'ACCEPTED' ? 'aceptada' : 'cancelada'} correctamente.` });
  } catch (error) {
    console.error('Error al responder a la cotización:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 3.7. Cliente finaliza el pedido (COMPLETED)
app.put('/api/service-requests/:requestId/complete', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    await connection.execute(
      `UPDATE service_requests SET status = 'COMPLETED' WHERE id = ?`,
      [requestId]
    );

    // 🔥 MENSAJE DE SISTEMA EN CHAT (Busca el client_id de la solicitud, o asume que quien llama es el cliente)
    // Para simplificar, obtenemos el client_id de la solicitud
    const [reqRows] = await connection.execute('SELECT client_id FROM service_requests WHERE id = ?', [requestId]);
    if (reqRows.length > 0) {
      await insertSystemMessage(connection, requestId, reqRows[0].client_id, '🎉 Ha finalizado el pedido. ¡Gracias por confiar en nosotros!');
    }

    res.json({ message: '¡Pedido finalizado con éxito! Gracias por confirmar.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al finalizar el pedido.' });
  } finally {
    connection.release();
  }
});

// 3.8. Cliente solicita revisión (REVISION)
app.put('/api/service-requests/:requestId/revision', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    await connection.execute(
      `UPDATE service_requests SET status = 'REVISION' WHERE id = ?`,
      [requestId]
    );

    // 🔥 MENSAJE DE SISTEMA EN CHAT
    const [reqRows] = await connection.execute('SELECT client_id FROM service_requests WHERE id = ?', [requestId]);
    if (reqRows.length > 0) {
      await insertSystemMessage(connection, requestId, reqRows[0].client_id, '🔄 Ha solicitado una revisión sobre la entrega.');
    }

    res.json({ message: 'Se ha solicitado una revisión al profesional.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al solicitar revisión.' });
  } finally {
    connection.release();
  }
});

// 4. Proveedor inicia el trabajo (Cambia a IN_PROGRESS)
app.put('/api/service-requests/:requestId/start', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    // Solo permitir si estaba ACCEPTED (Opcional: validar estado actual antes de update)
    await connection.execute(
      `UPDATE service_requests SET status = 'IN_PROGRESS' WHERE id = ?`,
      [requestId]
    );

    // 🔥 MENSAJE DE SISTEMA EN CHAT
    const [reqRows] = await connection.execute('SELECT provider_id FROM service_requests WHERE id = ?', [requestId]);
    const [provData] = await connection.execute('SELECT user_id FROM provider_profiles WHERE id = ?', [reqRows[0].provider_id]);
    if (provData.length > 0) {
      await insertSystemMessage(connection, requestId, provData[0].user_id, '🚀 Ha comenzado a trabajar en el proyecto.');
    }

    res.json({ message: 'Trabajo marcado como iniciado.' });
  } catch (error) {
    console.error('Error al iniciar trabajo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 5. Proveedor entrega el trabajo (Crea delivery y cambia a DELIVERED)
app.post('/api/service-requests/:requestId/deliver', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { requestId } = req.params;
    const { file_url, message } = req.body;

    // 1. Determinar la nueva versión de la entrega
    const [lastDelivery] = await connection.execute(
      'SELECT MAX(version) as max_version FROM deliveries WHERE request_id = ?',
      [requestId]
    );
    const newVersion = (lastDelivery[0].max_version || 0) + 1;

    // 2. Crear registro de entrega
    await connection.execute(
      `INSERT INTO deliveries (request_id, file_url, message, version) VALUES (?, ?, ?, ?)`,
      [requestId, file_url || '', message || '', newVersion]
    );

    // 3. Actualizar estado de la solicitud
    await connection.execute(
      `UPDATE service_requests SET status = 'DELIVERED' WHERE id = ?`,
      [requestId]
    );

    // 🔥 MENSAJE DE SISTEMA EN CHAT
    const [provData] = await connection.execute('SELECT user_id FROM provider_profiles WHERE id = ?', [(await connection.execute('SELECT provider_id FROM service_requests WHERE id = ?', [requestId]))[0][0].provider_id]);
    if (provData.length > 0) {
      await insertSystemMessage(connection, requestId, provData[0].user_id, '📦 Ha realizado una entrega. Por favor revísala.');
    }

    await connection.commit();
    res.json({ message: 'Trabajo entregado exitosamente.' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al entregar trabajo:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 5.5. Obtener historial de entregas de una solicitud
app.get('/api/service-requests/:requestId/deliveries', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    const [deliveries] = await connection.execute(
      `SELECT * FROM deliveries WHERE request_id = ? ORDER BY version DESC`,
      [requestId]
    );
    res.json(deliveries);
  } catch (error) {
    console.error('Error al obtener entregas:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// 6. Cliente envía una reseña
app.post('/api/reviews', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { request_id, client_id, provider_id, rating, comment } = req.body;

    // 1. Validar que el pedido esté COMPLETED
    const [requests] = await connection.execute(
      'SELECT status FROM service_requests WHERE id = ? AND client_id = ?',
      [request_id, client_id]
    );

    if (requests.length === 0 || requests[0].status !== 'COMPLETED') {
      await connection.rollback();
      return res.status(403).json({ error: 'Solo se pueden calificar pedidos completados.' });
    }

    // 2. Insertar la reseña
    try {
      await connection.execute(
        'INSERT INTO reviews (request_id, client_id, provider_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
        [request_id, client_id, provider_id, rating, comment]
      );
    } catch (insertError) {
      if (insertError.code === 'ER_DUP_ENTRY') {
        await connection.rollback();
        return res.status(409).json({ error: 'Este pedido ya ha sido calificado.' });
      }
      throw insertError; // Re-throw other errors
    }

    // 3. Actualizar el perfil del proveedor
    const [stats] = await connection.execute(
      `SELECT AVG(rating) as avg_rating, COUNT(id) as total_reviews 
       FROM reviews 
       WHERE provider_id = ?`,
      [provider_id]
    );

    if (stats.length > 0) {
      const { avg_rating, total_reviews } = stats[0];
      await connection.execute(
        'UPDATE provider_profiles SET rating = ?, total_reviews = ? WHERE id = ?',
        [avg_rating, total_reviews, provider_id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Reseña enviada con éxito. ¡Gracias!' });
  } catch (error) {
    await connection.rollback();
    console.error('Error al enviar la reseña:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    connection.release();
  }
});

// --- CHAT DE LA SOLICITUD ---

// Enviar mensaje (Guarda en BD y emite por Socket)
app.post('/api/request-messages', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { request_id, sender_id, message } = req.body;
    
    // Guardar en BD
    const [result] = await connection.execute(
      'INSERT INTO request_messages (request_id, sender_id, message) VALUES (?, ?, ?)',
      [request_id, sender_id, message]
    );

    // Obtener nombre del remitente para el chat
    const [userRows] = await connection.execute('SELECT name FROM users WHERE id = ?', [sender_id]);
    const senderName = userRows[0]?.name || 'Usuario';

    // 🔥 EMITIR MENSAJE EN TIEMPO REAL A LA SALA DE LA SOLICITUD
    const messageData = { id: result.insertId, request_id, sender_id, message, created_at: new Date(), sender_name: senderName };
    io.to(`request_${request_id}`).emit('receive_message', messageData);

    res.json(messageData);
  } catch (error) {
    console.error(error);
    // Capturar error de llave foránea (usuario o solicitud no existen)
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ error: 'Tu sesión no es válida o la solicitud no existe. Por favor, cierra sesión e ingresa nuevamente.' });
    }
    res.status(500).json({ error: 'Error al enviar mensaje' });
  } finally {
    connection.release();
  }
});

// --- HELPER PARA MENSAJES DE SISTEMA ---
async function insertSystemMessage(connection, requestId, senderId, text) {
  try {
    const [result] = await connection.execute(
      'INSERT INTO request_messages (request_id, sender_id, message) VALUES (?, ?, ?)',
      [requestId, senderId, `[SYSTEM] ${text}`] // Prefijo especial para identificarlo en el front
    );
    
    // Emitir socket para actualizar chat en vivo
    const [userRows] = await connection.execute('SELECT name FROM users WHERE id = ?', [senderId]);
    const senderName = userRows[0]?.name || 'Sistema';
    const messageData = { id: result.insertId, request_id: requestId, sender_id: senderId, message: `[SYSTEM] ${text}`, created_at: new Date(), sender_name: senderName };
    io.to(`request_${requestId}`).emit('receive_message', messageData);
  } catch (e) {
    console.error("Error insertando mensaje de sistema:", e);
  }
}

// Obtener historial de mensajes
app.get('/api/service-requests/:requestId/messages', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { requestId } = req.params;
    const [rows] = await connection.execute(
      `SELECT m.*, u.name as sender_name 
       FROM request_messages m 
       JOIN users u ON m.sender_id = u.id 
       WHERE m.request_id = ? 
       ORDER BY m.created_at ASC`,
      [requestId]
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al cargar mensajes' });
  } finally {
    connection.release();
  }
});

// --- Autenticación ---

// 8. Login
app.post('/api/login', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // 1. Buscar usuario base (En producción, usar bcrypt.compare)
    const [users] = await connection.execute(
      'SELECT * FROM users WHERE email = ? AND password = ?', 
      [email, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = users[0];
    let role = 'CLIENT';
    let providerId = null;
    let clientId = null;

    // 2. Verificar si es proveedor (tiene perfil en provider_profiles)
    const [providers] = await connection.execute(
      'SELECT id FROM provider_profiles WHERE user_id = ?',
      [user.id]
    );

    if (providers.length > 0) {
      role = 'PROVIDER';
      providerId = providers[0].id;
    } else {
      // Si no es proveedor, verificamos si tiene perfil de cliente para obtener su ID
      const [clients] = await connection.execute(
        'SELECT id FROM user_profiles WHERE user_id = ?',
        [user.id]
      );
      if (clients.length > 0) {
        clientId = clients[0].id;
      }
    }

    // Devolver datos del usuario
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      providerId, // Importante para proveedores
      clientId    // Importante para clientes
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión' });
  } finally {
    connection.release();
  }
});

// 9. Endpoint para subir imágenes (Usando la configuración de Multer existente)
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se envió ningún archivo' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

// --- 11. Endpoints para el CATÁLOGO (Portfolio) ---

// Listar catálogo de un proveedor
app.get('/api/providers/:providerId/catalog', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { providerId } = req.params;
    const [rows] = await connection.execute(
      'SELECT * FROM provider_catalog WHERE provider_id = ? ORDER BY created_at DESC',
      [providerId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching catalog:', error);
    res.status(500).json({ error: 'Error al obtener el catálogo.' });
  } finally {
    connection.release();
  }
});

// Agregar ítem al catálogo (Imagen + Datos)
app.post('/api/catalog', uploadCatalog.single('image'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { provider_id, title, description } = req.body;
    const fileUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/catalog/${req.file.filename}` : null;

    if (!fileUrl) return res.status(400).json({ error: 'La imagen es obligatoria para el portafolio.' });

    await connection.execute(
      'INSERT INTO provider_catalog (provider_id, title, description, image_url) VALUES (?, ?, ?, ?)',
      [provider_id, title, description, fileUrl]
    );
    res.status(201).json({ message: 'Trabajo agregado al portafolio.' });
  } catch (error) {
    console.error('Error adding to catalog:', error);
    res.status(500).json({ error: 'Error al guardar el trabajo.' });
  } finally {
    connection.release();
  }
});

// Eliminar ítem del catálogo
app.delete('/api/catalog/:id', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    // Nota: Idealmente borrar también el archivo físico aquí usando fs.unlink
    await connection.execute('DELETE FROM provider_catalog WHERE id = ?', [id]);
    res.json({ message: 'Eliminado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar.' });
  } finally {
    connection.release();
  }
});

// --- 10. Endpoint para Chat con IA (Anthropic Claude) ---
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Se requiere el historial de mensajes.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY, // ¡Tu token va aquí en el .env!
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Modelo rápido y económico
        max_tokens: 1024,
        messages: messages
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.json({ reply: data.content[0].text });
    } else {
      console.error('Error de Anthropic:', data);
      res.status(500).json({ error: data.error?.message || 'Error al conectar con la IA.' });
    }
  } catch (error) {
    console.error('Error en el servidor de chat:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// --- 10.1. Endpoints alternos de OpenAI para web ---
app.post('/api/chat-openai', async (req, res) => {
  const { messages } = req.body;

  if (!messages) {
    return res.status(400).json({ error: 'Se requiere el historial de mensajes.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar OPENAI_API_KEY en el backend.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: messages.map((msg) => ({
          role: msg.role,
          content: [{ type: 'input_text', text: msg.content }]
        }))
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error de OpenAI chat:', data);
      return res.status(500).json({ error: data.error?.message || 'Error al conectar con la IA.' });
    }

    res.json({ reply: data.output_text || 'No pude generar una respuesta en este momento.' });
  } catch (error) {
    console.error('Error en chat-openai:', error);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

app.post('/api/chat-image', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Debes enviar un prompt para generar la imagen.' });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'Falta configurar OPENAI_API_KEY en el backend.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024'
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Error de OpenAI image:', data);
      return res.status(500).json({ error: data.error?.message || 'No se pudo generar la imagen.' });
    }

    const image = data.data?.[0]?.b64_json
      ? `data:image/png;base64,${data.data[0].b64_json}`
      : data.data?.[0]?.url;

    if (!image) {
      return res.status(500).json({ error: 'La respuesta de OpenAI no incluyó ninguna imagen.' });
    }

    res.json({ image });
  } catch (error) {
    console.error('Error generando imagen con OpenAI:', error);
    res.status(500).json({ error: 'Error interno del servidor al generar la imagen.' });
  }
});

// ─────────────────────────────────────────────
// SUBASTAS (Auctions)
// ─────────────────────────────────────────────

// GET /api/auctions  — lista todas las subastas con info del item y conteo de pujas
app.get('/api/auctions', async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = `
      SELECT
        a.id, a.auction_item_id, a.starting_price, a.current_price,
        a.start_time, a.end_time, a.status, a.winner_user_id, a.created_at,
        ai.title, ai.description, ai.category, ai.image_url,
        ai.condition_text, ai.location_text, ai.lot_code,
        ai.brand, ai.model, ai.year_text, ai.seller_name,
        ai.base_price, ai.is_featured,
        COUNT(b.id) AS bid_count
      FROM auctions a
      JOIN auction_items ai ON a.auction_item_id = ai.id
      LEFT JOIN bids b ON b.auction_id = a.id
      WHERE 1=1
    `;
    const params = [];
    if (category) { query += ' AND ai.category = ?'; params.push(category); }
    if (status)   { query += ' AND a.status = ?';    params.push(status); }
    query += ' GROUP BY a.id ORDER BY a.status ASC, a.end_time ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Error GET /api/auctions:', err);
    res.status(500).json({ error: 'Error al obtener subastas.' });
  }
});

// GET /api/auctions/:id  — detalle de una subasta
app.get('/api/auctions/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        a.*, ai.title, ai.description, ai.category, ai.image_url,
        ai.condition_text, ai.location_text, ai.lot_code,
        ai.brand, ai.model, ai.year_text, ai.seller_name,
        ai.base_price, ai.is_featured,
        COUNT(b.id) AS bid_count
      FROM auctions a
      JOIN auction_items ai ON a.auction_item_id = ai.id
      LEFT JOIN bids b ON b.auction_id = a.id
      WHERE a.id = ?
      GROUP BY a.id
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Subasta no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error GET /api/auctions/:id:', err);
    res.status(500).json({ error: 'Error al obtener la subasta.' });
  }
});

// GET /api/auctions/:id/bids  — historial de pujas (mayor primero)
app.get('/api/auctions/:id/bids', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id, b.auction_id, b.user_id, b.amount, b.created_at,
             u.name AS user_name
      FROM bids b
      JOIN users u ON u.id = b.user_id
      WHERE b.auction_id = ?
      ORDER BY b.amount DESC, b.created_at DESC
      LIMIT 50
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('Error GET /api/auctions/:id/bids:', err);
    res.status(500).json({ error: 'Error al obtener las pujas.' });
  }
});

// ════════════════════════════════════════════
// POINTS SYSTEM
// ════════════════════════════════════════════

async function ensureClientPoints(clientId) {
  await pool.query(
    'INSERT IGNORE INTO client_points (client_id, balance, total_earned, total_spent) VALUES (?, 0, 0, 0)',
    [clientId]
  );
}

// GET /api/clients/:id/points
app.get('/api/clients/:id/points', async (req, res) => {
  const clientId = req.params.id;
  try {
    await ensureClientPoints(clientId);
    const [[points]] = await pool.query('SELECT * FROM client_points WHERE client_id = ?', [clientId]);
    const [transactions] = await pool.query(
      'SELECT * FROM points_transactions WHERE client_id = ? ORDER BY created_at DESC LIMIT 30',
      [clientId]
    );
    res.json({ ...points, transactions });
  } catch (err) {
    console.error('Error GET /api/clients/:id/points:', err);
    res.status(500).json({ error: 'Error al obtener puntos.' });
  }
});

// GET /api/points/packages
app.get('/api/points/packages', async (req, res) => {
  try {
    const [packages] = await pool.query('SELECT * FROM points_packages WHERE is_active = TRUE ORDER BY price_usd ASC');
    res.json(packages);
  } catch (err) {
    console.error('Error GET /api/points/packages:', err);
    res.status(500).json({ error: 'Error al obtener paquetes.' });
  }
});

// POST /api/clients/:id/points/purchase
app.post('/api/clients/:id/points/purchase', async (req, res) => {
  const clientId = req.params.id;
  const { package_id } = req.body;
  if (!package_id) return res.status(400).json({ error: 'Falta package_id.' });
  try {
    await ensureClientPoints(clientId);
    const [[pkg]] = await pool.query('SELECT * FROM points_packages WHERE id = ? AND is_active = TRUE', [package_id]);
    if (!pkg) return res.status(404).json({ error: 'Paquete no encontrado.' });

    const totalPoints = pkg.points + pkg.bonus_points;
    const [[current]] = await pool.query('SELECT balance FROM client_points WHERE client_id = ?', [clientId]);
    const newBalance = current.balance + totalPoints;

    await pool.query(
      'UPDATE client_points SET balance = ?, total_earned = total_earned + ? WHERE client_id = ?',
      [newBalance, totalPoints, clientId]
    );
    await pool.query(
      'INSERT INTO points_transactions (client_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)',
      [clientId, 'PURCHASE', totalPoints, newBalance, `Compra paquete ${pkg.name}: +${totalPoints} pts`]
    );
    res.json({ success: true, new_balance: newBalance, points_added: totalPoints });
  } catch (err) {
    console.error('Error POST /api/clients/:id/points/purchase:', err);
    res.status(500).json({ error: 'Error al procesar la compra.' });
  }
});

app.post('/api/auctions/:id/bids', async (req, res) => {
  const { user_id, amount } = req.body;
  const auctionId = req.params.id;
  if (!user_id || !amount) return res.status(400).json({ error: 'Faltan campos requeridos.' });

  try {
    await ensureClientPoints(user_id);

    const [[auction]] = await pool.query(
      'SELECT id, current_price, end_time, status FROM auctions WHERE id = ?',
      [auctionId]
    );
    if (!auction) return res.status(404).json({ error: 'Subasta no encontrada.' });
    if (auction.status !== 'ACTIVE') return res.status(400).json({ error: 'La subasta no está activa.' });
    if (new Date(auction.end_time) < new Date()) return res.status(400).json({ error: 'La subasta ya ha cerrado.' });

    const bidAmount = parseFloat(amount);
    if (bidAmount <= parseFloat(auction.current_price)) {
      return res.status(400).json({ error: `La puja debe superar el precio actual: $${auction.current_price}` });
    }

    // Check balance
    const [[clientPoints]] = await pool.query('SELECT balance FROM client_points WHERE client_id = ?', [user_id]);
    if (clientPoints.balance < bidAmount) {
      return res.status(400).json({
        error: `Puntos insuficientes. Tienes ${clientPoints.balance} pts y necesitas ${bidAmount} pts.`,
        insufficient_points: true
      });
    }

    // Find previous leader (highest bid from another user)
    const [[prevBid]] = await pool.query(
      'SELECT user_id, amount FROM bids WHERE auction_id = ? AND user_id != ? ORDER BY amount DESC LIMIT 1',
      [auctionId, user_id]
    );

    const conn = await pool.getConnection();
    await conn.beginTransaction();
    try {
      // Deduct from new bidder
      const newBidderBalance = clientPoints.balance - bidAmount;
      await conn.query(
        'UPDATE client_points SET balance = ?, total_spent = total_spent + ? WHERE client_id = ?',
        [newBidderBalance, bidAmount, user_id]
      );
      await conn.query(
        'INSERT INTO points_transactions (client_id, type, amount, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, 'BID_PLACED', -bidAmount, newBidderBalance, `Puja de ${bidAmount} pts — subasta #${auctionId}`, auctionId]
      );

      // Refund previous leader
      if (prevBid) {
        const [[prevPoints]] = await conn.query('SELECT balance FROM client_points WHERE client_id = ?', [prevBid.user_id]);
        const refundAmount = parseFloat(prevBid.amount);
        const prevNewBalance = prevPoints.balance + refundAmount;
        await conn.query(
          'UPDATE client_points SET balance = ?, total_spent = GREATEST(0, total_spent - ?) WHERE client_id = ?',
          [prevNewBalance, refundAmount, prevBid.user_id]
        );
        await conn.query(
          'INSERT INTO points_transactions (client_id, type, amount, balance_after, description, reference_id) VALUES (?, ?, ?, ?, ?, ?)',
          [prevBid.user_id, 'BID_REFUND', refundAmount, prevNewBalance, `Reembolso de puja — subasta #${auctionId}`, auctionId]
        );
      }

      await conn.query('INSERT INTO bids (auction_id, user_id, amount) VALUES (?, ?, ?)', [auctionId, user_id, amount]);
      await conn.query('UPDATE auctions SET current_price = ? WHERE id = ?', [amount, auctionId]);

      await conn.commit();

      // Emit real-time event to all viewers of this auction
      const [[bidUser]] = await pool.query('SELECT name FROM users WHERE id = ?', [user_id]);
      io.to(`auction_${auctionId}`).emit('new_bid', {
        auction_id: parseInt(auctionId),
        new_price:  parseFloat(amount),
        user_id:    parseInt(user_id),
        user_name:  bidUser?.name || `Usuario #${user_id}`,
      });

      res.json({ success: true, new_price: amount, new_balance: newBidderBalance });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error('Error POST /api/auctions/:id/bids:', err);
    res.status(500).json({ error: 'Error al registrar la puja.' });
  }
});

// ════════════════════════════════════════════
// ADMIN PANEL API
// ════════════════════════════════════════════

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail    = process.env.ADMIN_EMAIL    || 'admin@admin.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (email === adminEmail && password === adminPassword) {
    res.json({ success: true, name: 'Administrador' });
  } else {
    res.status(401).json({ error: 'Credenciales incorrectas.' });
  }
});

// GET /api/admin/stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [[{ total_users }]]    = await pool.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_products }]] = await pool.query('SELECT COUNT(*) as total_products FROM products');
    const [[{ total_auctions }]] = await pool.query('SELECT COUNT(*) as total_auctions FROM auctions');
    const [[{ active_auctions }]]= await pool.query("SELECT COUNT(*) as active_auctions FROM auctions WHERE status='ACTIVE'");
    const [[{ total_orders }]]   = await pool.query('SELECT COUNT(*) as total_orders FROM orders');
    const [[{ total_bids }]]     = await pool.query('SELECT COUNT(*) as total_bids FROM bids');
    res.json({ total_users, total_products, total_auctions, active_auctions, total_orders, total_bids });
  } catch (err) {
    console.error('Error GET /api/admin/stats:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, name, email, role, phone, country, city, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (err) {
    console.error('Error GET /api/admin/users:', err);
    res.status(500).json({ error: 'Error al obtener usuarios.' });
  }
});

// POST /api/auctions (create auction + item)
app.post('/api/auctions', async (req, res) => {
  const {
    title, description, category, image_url, condition_text,
    location_text, lot_code, brand, model, year_text, is_featured,
    starting_price, start_time, end_time
  } = req.body;

  if (!title || !starting_price || !start_time || !end_time) {
    return res.status(400).json({ error: 'Faltan campos requeridos: título, precio inicial, fechas.' });
  }

  try {
    const [itemResult] = await pool.query(
      `INSERT INTO auction_items (title, description, category, image_url, condition_text, location_text, lot_code, brand, model, year_text, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, category || null, image_url || null, condition_text || null,
       location_text || null, lot_code || null, brand || null, model || null, year_text || null,
       is_featured ? 1 : 0]
    );

    const itemId = itemResult.insertId;
    const price  = parseFloat(starting_price);

    await pool.query(
      `INSERT INTO auctions (auction_item_id, starting_price, current_price, start_time, end_time, status)
       VALUES (?, ?, ?, ?, ?, 'ACTIVE')`,
      [itemId, price, price, start_time, end_time]
    );

    res.status(201).json({ success: true, message: 'Subasta creada correctamente.' });
  } catch (err) {
    console.error('Error POST /api/auctions:', err);
    res.status(500).json({ error: 'Error al crear la subasta.' });
  }
});

// PUT /api/admin/auctions/:id/status
app.put('/api/admin/auctions/:id/status', async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }
  try {
    await pool.query('UPDATE auctions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Subasta actualizada a ${status}.` });
  } catch (err) {
    console.error('Error PUT /api/admin/auctions/:id/status:', err);
    res.status(500).json({ error: 'Error al actualizar estado.' });
  }
});

// DELETE /api/admin/products/:id
app.delete('/api/admin/products/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto.' });
  }
});

// IMPORTANTE: Usar httpServer en lugar de app.listen
httpServer.listen(port, () => {
  console.log(`Servidor backend + Socket.io corriendo en http://localhost:${port}`);
});
