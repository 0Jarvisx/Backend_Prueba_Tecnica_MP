import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API DICRI - Sistema de Gestión de Evidencias',
      version: '1.0.0',
      description: 'API RESTful para la gestión de expedientes y evidencias de la Dirección de Investigación Criminalística (DICRI) del Ministerio Público de Guatemala',
      contact: {
        name: 'Ministerio Público de Guatemala',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Login: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@mp.gob.gt' },
            password: { type: 'string', example: 'password123' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/Usuario' },
              },
            },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'Juan' },
            apellido: { type: 'string', example: 'Pérez' },
            email: { type: 'string', example: 'juan@mp.gob.gt' },
            dpi: { type: 'string', example: '1234567890101' },
            telefono: { type: 'string', example: '55551234' },
            rol: { $ref: '#/components/schemas/Rol' },
            activo: { type: 'boolean', example: true },
          },
        },
        Rol: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            nombre: { type: 'string', example: 'ADMIN' },
            descripcion: { type: 'string', example: 'Administrador del sistema' },
          },
        },
        Expediente: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            numero_expediente: { type: 'string', example: 'EXP-2024-001' },
            numero_caso_mp: { type: 'string', example: 'MP-001-2024' },
            fecha_registro: { type: 'string', format: 'date-time' },
            usuario_registro_id: { type: 'integer' },
            tecnico_asignado_id: { type: 'integer' },
            supervisor_id: { type: 'integer' },
            fiscalia_id: { type: 'integer' },
            unidad_id: { type: 'integer' },
            estado_id: { type: 'integer' },
            tipo_analisis: { type: 'string' },
            fiscal_solicitante: { type: 'string' },
            oficio_solicitud: { type: 'string' },
            urgencia: { type: 'string', enum: ['ORDINARIO', 'URGENTE', 'MUY_URGENTE'] },
            fecha_limite: { type: 'string', format: 'date' },
            tipo_delito: { type: 'string' },
            lugar_hecho: { type: 'string' },
            fecha_hecho: { type: 'string', format: 'date' },
            descripcion_caso: { type: 'string' },
          },
        },
        CreateExpediente: {
          type: 'object',
          required: ['numero_expediente', 'numero_caso_mp', 'fiscalia_id', 'unidad_id'],
          properties: {
            numero_expediente: { type: 'string', example: 'EXP-2024-001' },
            numero_caso_mp: { type: 'string', example: 'MP-001-2024' },
            fiscalia_id: { type: 'integer', example: 1 },
            unidad_id: { type: 'integer', example: 1 },
            tipo_analisis: { type: 'string', example: 'Balística' },
            fiscal_solicitante: { type: 'string', example: 'Dr. García' },
            oficio_solicitud: { type: 'string', example: 'OF-001-2024' },
            urgencia: { type: 'string', enum: ['ORDINARIO', 'URGENTE', 'MUY_URGENTE'], default: 'ORDINARIO' },
            fecha_limite: { type: 'string', format: 'date' },
            tipo_delito: { type: 'string', example: 'Homicidio' },
            lugar_hecho: { type: 'string', example: 'Zona 1, Guatemala' },
            fecha_hecho: { type: 'string', format: 'date' },
            descripcion_caso: { type: 'string' },
          },
        },
        Indicio: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            expediente_id: { type: 'integer', example: 1 },
            numero_indicio: { type: 'string', example: 'IND-001' },
            descripcion: { type: 'string', example: 'Proyectil calibre 9mm' },
            tipo_objeto: { type: 'string', example: 'Arma de fuego' },
            color: { type: 'string', example: 'Negro' },
            tamano: { type: 'string', example: '15cm x 5cm' },
            peso: { type: 'string', example: '500g' },
            ubicacion_hallazgo: { type: 'string', example: 'Escena principal' },
            tecnico_registro_id: { type: 'integer' },
            estado_indicio_id: { type: 'integer' },
            observaciones: { type: 'string' },
            cantidad: { type: 'integer', example: 1 },
          },
        },
        CreateIndicio: {
          type: 'object',
          required: ['expediente_id', 'numero_indicio', 'descripcion'],
          properties: {
            expediente_id: { type: 'integer', example: 1 },
            numero_indicio: { type: 'string', example: 'IND-001' },
            descripcion: { type: 'string', example: 'Proyectil calibre 9mm' },
            tipo_objeto: { type: 'string', example: 'Arma de fuego' },
            color: { type: 'string', example: 'Negro' },
            tamano: { type: 'string', example: '15cm x 5cm' },
            peso: { type: 'string', example: '500g' },
            ubicacion_hallazgo: { type: 'string', example: 'Escena principal' },
            observaciones: { type: 'string' },
            cantidad: { type: 'integer', example: 1 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de sesión' },
      { name: 'Usuarios', description: 'Gestión de usuarios del sistema' },
      { name: 'Roles', description: 'Gestión de roles y permisos' },
      { name: 'Expedientes', description: 'Gestión de expedientes DICRI' },
      { name: 'Indicios', description: 'Gestión de indicios/evidencias' },
      { name: 'Catálogos', description: 'Catálogos del sistema (fiscalías, unidades, estados)' },
      { name: 'Asignaciones', description: 'Asignaciones supervisor-técnico' },
      { name: 'Documentos', description: 'Gestión de documentos adjuntos' },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
