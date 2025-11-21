# Backend - Sistema de Gestión de Evidencias DICRI

API REST para el Sistema de Gestión de Evidencias del Ministerio Público de Guatemala.

## Tecnologías

- **Runtime**: Node.js >= 18
- **Framework**: Express.js
- **Lenguaje**: TypeScript
- **ORM**: Prisma
- **Base de datos**: SQL Server
- **Autenticación**: JWT

## Requisitos previos

- Node.js >= 18.0.0
- SQL Server (local o Docker)
- npm o yarn

## Instalación

1. Clonar el repositorio e instalar dependencias:

```bash
cd Backend_Prueba_Tecnica_MP
npm install
```

2. Configurar variables de entorno:

```bash
cp .env.example .env
```

3. Editar `.env` con tus credenciales:

```env
DATABASE_URL="sqlserver://localhost:1433;database=PruebaTecnicaMP;user=sa;password=TU_PASSWORD;encrypt=true;trustServerCertificate=true"
JWT_SECRET=tu-clave-secreta-segura
```

4. Generar cliente Prisma:

```bash
npm run prisma:generate
```

5. Ejecutar migraciones:

```bash
npm run prisma:migrate
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor en modo desarrollo con hot reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia servidor en producción |
| `npm run prisma:generate` | Genera cliente Prisma |
| `npm run prisma:migrate` | Ejecuta migraciones de BD |
| `npm run prisma:studio` | Abre Prisma Studio (GUI para BD) |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea código con Prettier |

## Estructura del proyecto

```
src/
├── config/           # Configuración (BD, environment)
├── controllers/      # Controladores de rutas
├── middlewares/      # Middlewares (auth, validación, errores)
├── routes/           # Definición de rutas
├── services/         # Lógica de negocio
├── validators/       # Validaciones con express-validator
├── types/            # Tipos TypeScript
├── utils/            # Utilidades (logger, jwt, formatters)
├── app.ts            # Configuración de Express
└── server.ts         # Punto de entrada
prisma/
├── schema.prisma     # Esquema de BD
├── migrations/       # Migraciones
└── seed.ts           # Datos iniciales
```

## Modelo de datos

### Entidades principales

- **Usuario**: Usuarios del sistema con roles
- **Rol/Permiso**: Sistema RBAC de permisos
- **Fiscalía/Unidad**: Catálogos organizacionales
- **Expediente**: Casos criminalísticos
- **Indicio**: Evidencias físicas
- **CadenaCustodia**: Trazabilidad de evidencias
- **Flujo**: Historial de estados
- **Bitácora**: Auditoría de acciones
- **Documento**: Archivos adjuntos

### Estados de expediente

1. En Cola
2. En Proceso
3. En Revisión
4. Rechazado
5. Aprobado
6. Finalizado

## API Endpoints

### Health Check

```
GET /health
```

### Autenticación

```
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh
```

### Usuarios

```
GET    /api/usuarios
GET    /api/usuarios/:id
POST   /api/usuarios
PUT    /api/usuarios/:id
DELETE /api/usuarios/:id
```

### Expedientes

```
GET    /api/expedientes
GET    /api/expedientes/:id
POST   /api/expedientes
PUT    /api/expedientes/:id
PATCH  /api/expedientes/:id/estado
```

### Indicios

```
GET    /api/indicios
GET    /api/indicios/:id
POST   /api/indicios
PUT    /api/indicios/:id
GET    /api/indicios/:id/cadena-custodia
POST   /api/indicios/:id/cadena-custodia
```

## Seguridad

- Autenticación JWT
- Encriptación de passwords con bcrypt
- Rate limiting
- Helmet para headers HTTP
- CORS configurado
- Validación de inputs

## Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `NODE_ENV` | Entorno de ejecución | development |
| `PORT` | Puerto del servidor | 3000 |
| `DATABASE_URL` | URL de conexión a SQL Server | - |
| `JWT_SECRET` | Clave secreta para JWT | - |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | 12h |
| `BCRYPT_SALT_ROUNDS` | Rounds para bcrypt | 10 |
| `RATE_LIMIT_WINDOW_MS` | Ventana de rate limit (ms) | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Máximo de requests por ventana | 100 |
| `MAX_FILE_SIZE` | Tamaño máximo de archivo (bytes) | 10485760 |
| `UPLOAD_PATH` | Ruta para archivos subidos | ./uploads |

## Docker (SQL Server)

Para ejecutar SQL Server localmente con Docker:

```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourPassword123!" \
  -p 1433:1433 --name sqlserver \
  -d mcr.microsoft.com/mssql/server:2022-latest
```

## Licencia

ISC
