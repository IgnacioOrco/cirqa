import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

// Importar Rutas
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

// Cron Jobs
import { initCancelExpiredOrdersCron } from './jobs/cancelExpiredOrders.js';


// Importar Middlewares de Error
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Cargar variables de entorno
dotenv.config();

// Inicializar conexión a MongoDB
connectDB();

const app = express();

// Configuración de CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// Middlewares para parseo de solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Endpoint de prueba / Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'online',
    project: 'CIRQA E-commerce RESTful API',
    version: '1.0.0',
    documentation: {
      auth: '/api/auth',
      products: '/api/products',
      filters: '/api/filters',
    },
  });
});

// Montaje de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);

// Middlewares de captura de errores
app.use(notFound);
app.use(errorHandler);

// Inicializar Servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[CIRQA API] Servidor ejecutándose en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`[CIRQA API] Health check disponible en http://localhost:${PORT}/`);
  
  // Inicializar cron de cancelación de órdenes vencidas
  initCancelExpiredOrdersCron();
});

export default app;
