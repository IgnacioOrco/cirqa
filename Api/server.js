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
const allowedOrigins = [
  'https://cirqa.com.ar',
  'https://www.cirqa.com.ar',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((u) => u.trim()) : []),
].filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (origin.endsWith('.cirqa.com.ar') || origin.endsWith('cirqa.com.ar')) return true;
  if (/^https?:\/\/([a-z0-9-]+\.)*cirqa\.com\.ar(:\d+)?$/i.test(origin)) return true;
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  if (/^https?:\/\/([a-z0-9-]+\.)*vercel\.app$/i.test(origin)) return true;
  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Permite peticiones sin origin (herramientas locales, scripts) o dentro de la lista permitida
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some((o) => origin.endsWith('.cirqa.com.ar')) || isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origen ${origin} no autorizado por CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Responder explícitamente a las peticiones preflight OPTIONS
app.options('*', cors(corsOptions));

// Middlewares para parseo de solicitudes con soporte para payloads pesados
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
