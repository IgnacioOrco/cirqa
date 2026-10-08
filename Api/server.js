import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import connectDB from './config/db.js';

// Importar Rutas
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';

// Cron Jobs
import { initCancelExpiredOrdersCron } from './jobs/cancelExpiredOrders.js';


// Importar Middlewares de Error
import { notFound, errorHandler } from './middlewares/errorMiddleware.js';

// Cargar variables de entorno
dotenv.config();

// Inicializar conexión a MongoDB
connectDB();

const app = express();

// Configuración dinámica y robusta de CORS
const explicitOrigins = [
  'https://www.cirqa.com.ar',
  'https://cirqa.com.ar',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : []),
].filter(Boolean);

const isOriginAllowed = (origin) => {
  // Permitir solicitudes sin origin (como cURL, mobile apps, server-to-server, scripts, postman)
  if (!origin) return true;

  // Coincidencia exacta con lista configurada
  if (explicitOrigins.includes(origin)) return true;

  // Permitir cualquier subdominio o dominio de CIRQA (ej: https://www.cirqa.com.ar, https://cirqa.com.ar)
  if (/^https?:\/\/([a-z0-9-]+\.)*cirqa\.com\.ar(:\d+)?$/i.test(origin)) return true;

  // Permitir desarrollo local (localhost o 127.0.0.1 con cualquier puerto)
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;

  // Permitir previews de Vercel
  if (/^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) return true;

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origen no autorizado: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middlewares para parseo de solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir carpeta de subidas de forma estática y persistente (/uploads)
const uploadsPath = path.resolve('uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

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
app.use('/api/shipping', shippingRoutes);
app.use('/shipping', shippingRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/payments', webhookRoutes);

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
