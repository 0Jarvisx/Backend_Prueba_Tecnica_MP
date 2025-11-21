import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { environment } from './config/environment';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middlewares/errorHandler.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import rolRoutes from './routes/rol.routes';
import permisoRoutes from './routes/permiso.routes';
import expedienteRoutes from './routes/expediente.routes';
import indicioRoutes from './routes/indicio.routes';
import catalogoRoutes from './routes/catalogo.routes';
import asignacionRoutes from './routes/asignacion.routes';
import documentoRoutes from './routes/documento.routes';
import dashboardRoutes from './routes/dashboard.routes';

const app: Application = express();

// Security middlewares
app.use(helmet());
app.use(cors({
  origin: environment.isDevelopment() ? '*' : process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: environment.rateLimitWindowMs,
  max: environment.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Static files for uploads
app.use('/uploads', express.static(environment.uploadPath));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: environment.nodeEnv
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/expedientes', expedienteRoutes);
app.use('/api/indicios', indicioRoutes);
app.use('/api/catalogos', catalogoRoutes);
app.use('/api/asignaciones', asignacionRoutes);
app.use('/api/documentos', documentoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

export default app;
