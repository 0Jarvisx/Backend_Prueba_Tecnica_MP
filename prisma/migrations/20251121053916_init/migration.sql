BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[usuarios] (
    [id_usuario] INT NOT NULL IDENTITY(1,1),
    [nombre] VARCHAR(100) NOT NULL,
    [apellido] VARCHAR(100) NOT NULL,
    [email] VARCHAR(100) NOT NULL,
    [password] VARCHAR(255) NOT NULL,
    [dpi] VARCHAR(13),
    [telefono] VARCHAR(15),
    [activo] BIT NOT NULL CONSTRAINT [usuarios_activo_df] DEFAULT 1,
    [id_rol] INT NOT NULL,
    [requiere_cambio_password] BIT NOT NULL CONSTRAINT [usuarios_requiere_cambio_password_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [usuarios_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [usuarios_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [usuarios_pkey] PRIMARY KEY CLUSTERED ([id_usuario]),
    CONSTRAINT [usuarios_email_key] UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [usuarios_dpi_key] UNIQUE NONCLUSTERED ([dpi])
);

-- CreateTable
CREATE TABLE [dbo].[rol] (
    [id_rol] INT NOT NULL IDENTITY(1,1),
    [nombre_rol] VARCHAR(50) NOT NULL,
    [descripcion] TEXT,
    [activo] BIT NOT NULL CONSTRAINT [rol_activo_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [rol_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [rol_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [rol_pkey] PRIMARY KEY CLUSTERED ([id_rol]),
    CONSTRAINT [rol_nombre_rol_key] UNIQUE NONCLUSTERED ([nombre_rol])
);

-- CreateTable
CREATE TABLE [dbo].[permiso] (
    [id_permiso] INT NOT NULL IDENTITY(1,1),
    [nombre_permiso] VARCHAR(100) NOT NULL,
    [descripcion] TEXT,
    [modulo] VARCHAR(50),
    [created_at] DATETIME2 NOT NULL CONSTRAINT [permiso_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [permiso_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [permiso_pkey] PRIMARY KEY CLUSTERED ([id_permiso])
);

-- CreateTable
CREATE TABLE [dbo].[rol_permiso] (
    [id_rol] INT NOT NULL,
    [id_permiso] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [rol_permiso_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [rol_permiso_pkey] PRIMARY KEY CLUSTERED ([id_rol],[id_permiso])
);

-- CreateTable
CREATE TABLE [dbo].[fiscalia] (
    [id_fiscalia] INT NOT NULL IDENTITY(1,1),
    [nombre] VARCHAR(150) NOT NULL,
    [codigo] VARCHAR(20) NOT NULL,
    [direccion] VARCHAR(255),
    [telefono] VARCHAR(15),
    [departamento] VARCHAR(50),
    [municipio] VARCHAR(50),
    [activo] BIT NOT NULL CONSTRAINT [fiscalia_activo_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [fiscalia_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [fiscalia_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [fiscalia_pkey] PRIMARY KEY CLUSTERED ([id_fiscalia]),
    CONSTRAINT [fiscalia_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable
CREATE TABLE [dbo].[unidad] (
    [id_unidad] INT NOT NULL IDENTITY(1,1),
    [nombre_unidad] VARCHAR(100) NOT NULL,
    [codigo_unidad] VARCHAR(20) NOT NULL,
    [descripcion] TEXT,
    [especialidad] VARCHAR(100),
    [activo] BIT NOT NULL CONSTRAINT [unidad_activo_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [unidad_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [unidad_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [unidad_pkey] PRIMARY KEY CLUSTERED ([id_unidad]),
    CONSTRAINT [unidad_codigo_unidad_key] UNIQUE NONCLUSTERED ([codigo_unidad])
);

-- CreateTable
CREATE TABLE [dbo].[estados] (
    [id_estado] INT NOT NULL IDENTITY(1,1),
    [nombre_estado] VARCHAR(50) NOT NULL,
    [descripcion] TEXT,
    [color] VARCHAR(7),
    [orden] INT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [estados_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [estados_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [estados_pkey] PRIMARY KEY CLUSTERED ([id_estado]),
    CONSTRAINT [estados_nombre_estado_key] UNIQUE NONCLUSTERED ([nombre_estado])
);

-- CreateTable
CREATE TABLE [dbo].[estado_indicio] (
    [id_estado_indicio] INT NOT NULL IDENTITY(1,1),
    [nombre] VARCHAR(50) NOT NULL,
    [descripcion] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [estado_indicio_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [estado_indicio_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [estado_indicio_pkey] PRIMARY KEY CLUSTERED ([id_estado_indicio]),
    CONSTRAINT [estado_indicio_nombre_key] UNIQUE NONCLUSTERED ([nombre])
);

-- CreateTable
CREATE TABLE [dbo].[expediente] (
    [id_expediente] INT NOT NULL IDENTITY(1,1),
    [numero_expediente] VARCHAR(50) NOT NULL,
    [numero_caso_mp] VARCHAR(50),
    [fecha_registro] DATETIME2 NOT NULL CONSTRAINT [expediente_fecha_registro_df] DEFAULT CURRENT_TIMESTAMP,
    [id_usuario_registro] INT NOT NULL,
    [id_tecnico_asignado] INT NOT NULL,
    [id_supervisor] INT,
    [id_fiscalia] INT NOT NULL,
    [id_unidad] INT NOT NULL,
    [id_estado] INT NOT NULL,
    [tipo_analisis] VARCHAR(100),
    [fiscal_solicitante] VARCHAR(150),
    [oficio_solicitud] VARCHAR(50),
    [urgencia] VARCHAR(20),
    [fecha_limite] DATE,
    [tipo_delito] VARCHAR(100),
    [lugar_hecho] VARCHAR(255),
    [fecha_hecho] DATE,
    [descripcion_caso] TEXT,
    [fecha_inicio_analisis] DATETIME2,
    [fecha_entrega_dictamen] DATETIME2,
    [observaciones] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [expediente_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [expediente_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [expediente_pkey] PRIMARY KEY CLUSTERED ([id_expediente]),
    CONSTRAINT [expediente_numero_expediente_key] UNIQUE NONCLUSTERED ([numero_expediente])
);

-- CreateTable
CREATE TABLE [dbo].[indicio] (
    [id_indicio] INT NOT NULL IDENTITY(1,1),
    [id_expediente] INT NOT NULL,
    [numero_indicio] VARCHAR(50) NOT NULL,
    [descripcion] TEXT NOT NULL,
    [tipo_objeto] VARCHAR(100),
    [color] VARCHAR(50),
    [tamanio] VARCHAR(100),
    [peso] DECIMAL(10,2),
    [peso_unidad] VARCHAR(20),
    [ubicacion_hallazgo] VARCHAR(255),
    [id_tecnico_registro] INT NOT NULL,
    [fecha_registro] DATETIME2 NOT NULL CONSTRAINT [indicio_fecha_registro_df] DEFAULT CURRENT_TIMESTAMP,
    [id_estado_indicio] INT NOT NULL,
    [observaciones] TEXT,
    [cantidad] INT NOT NULL CONSTRAINT [indicio_cantidad_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [indicio_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [indicio_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [indicio_pkey] PRIMARY KEY CLUSTERED ([id_indicio]),
    CONSTRAINT [indicio_id_expediente_numero_indicio_key] UNIQUE NONCLUSTERED ([id_expediente],[numero_indicio])
);

-- CreateTable
CREATE TABLE [dbo].[bitacora] (
    [id_bitacora] INT NOT NULL IDENTITY(1,1),
    [id_expediente] INT NOT NULL,
    [id_usuario] INT NOT NULL,
    [accion] VARCHAR(100) NOT NULL,
    [fecha_hora] DATETIME2 NOT NULL CONSTRAINT [bitacora_fecha_hora_df] DEFAULT CURRENT_TIMESTAMP,
    [descripcion] TEXT,
    [ip_address] VARCHAR(45),
    [detalles_json] TEXT,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [bitacora_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [bitacora_pkey] PRIMARY KEY CLUSTERED ([id_bitacora])
);

-- CreateTable
CREATE TABLE [dbo].[documentos] (
    [id_documento] INT NOT NULL IDENTITY(1,1),
    [id_expediente] INT NOT NULL,
    [id_indicio] INT,
    [tipo_documento] VARCHAR(50) NOT NULL,
    [nombre_archivo] VARCHAR(255) NOT NULL,
    [ruta_archivo] VARCHAR(500) NOT NULL,
    [extension] VARCHAR(10) NOT NULL,
    [tamanio_kb] INT,
    [id_usuario_carga] INT NOT NULL,
    [fecha_carga] DATETIME2 NOT NULL CONSTRAINT [documentos_fecha_carga_df] DEFAULT CURRENT_TIMESTAMP,
    [descripcion] TEXT,
    [version] INT NOT NULL CONSTRAINT [documentos_version_df] DEFAULT 1,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [documentos_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [documentos_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [documentos_pkey] PRIMARY KEY CLUSTERED ([id_documento])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [usuarios_id_rol_idx] ON [dbo].[usuarios]([id_rol]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [usuarios_deleted_at_idx] ON [dbo].[usuarios]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [rol_deleted_at_idx] ON [dbo].[rol]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [permiso_deleted_at_idx] ON [dbo].[permiso]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [rol_permiso_deleted_at_idx] ON [dbo].[rol_permiso]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [fiscalia_deleted_at_idx] ON [dbo].[fiscalia]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [unidad_deleted_at_idx] ON [dbo].[unidad]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [estados_deleted_at_idx] ON [dbo].[estados]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [estado_indicio_deleted_at_idx] ON [dbo].[estado_indicio]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_numero_caso_mp_idx] ON [dbo].[expediente]([numero_caso_mp]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_usuario_registro_idx] ON [dbo].[expediente]([id_usuario_registro]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_tecnico_asignado_idx] ON [dbo].[expediente]([id_tecnico_asignado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_supervisor_idx] ON [dbo].[expediente]([id_supervisor]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_fiscalia_idx] ON [dbo].[expediente]([id_fiscalia]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_unidad_idx] ON [dbo].[expediente]([id_unidad]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_estado_idx] ON [dbo].[expediente]([id_estado]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_fecha_registro_idx] ON [dbo].[expediente]([fecha_registro]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_deleted_at_idx] ON [dbo].[expediente]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicio_id_expediente_idx] ON [dbo].[indicio]([id_expediente]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicio_id_tecnico_registro_idx] ON [dbo].[indicio]([id_tecnico_registro]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicio_id_estado_indicio_idx] ON [dbo].[indicio]([id_estado_indicio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicio_fecha_registro_idx] ON [dbo].[indicio]([fecha_registro]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [indicio_deleted_at_idx] ON [dbo].[indicio]([deleted_at]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bitacora_id_expediente_idx] ON [dbo].[bitacora]([id_expediente]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bitacora_id_usuario_idx] ON [dbo].[bitacora]([id_usuario]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bitacora_fecha_hora_idx] ON [dbo].[bitacora]([fecha_hora]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [bitacora_accion_idx] ON [dbo].[bitacora]([accion]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_id_expediente_idx] ON [dbo].[documentos]([id_expediente]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_id_indicio_idx] ON [dbo].[documentos]([id_indicio]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_id_usuario_carga_idx] ON [dbo].[documentos]([id_usuario_carga]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_fecha_carga_idx] ON [dbo].[documentos]([fecha_carga]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_tipo_documento_idx] ON [dbo].[documentos]([tipo_documento]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [documentos_deleted_at_idx] ON [dbo].[documentos]([deleted_at]);

-- AddForeignKey
ALTER TABLE [dbo].[usuarios] ADD CONSTRAINT [usuarios_id_rol_fkey] FOREIGN KEY ([id_rol]) REFERENCES [dbo].[rol]([id_rol]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rol_permiso] ADD CONSTRAINT [rol_permiso_id_rol_fkey] FOREIGN KEY ([id_rol]) REFERENCES [dbo].[rol]([id_rol]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[rol_permiso] ADD CONSTRAINT [rol_permiso_id_permiso_fkey] FOREIGN KEY ([id_permiso]) REFERENCES [dbo].[permiso]([id_permiso]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_usuario_registro_fkey] FOREIGN KEY ([id_usuario_registro]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_tecnico_asignado_fkey] FOREIGN KEY ([id_tecnico_asignado]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_supervisor_fkey] FOREIGN KEY ([id_supervisor]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_fiscalia_fkey] FOREIGN KEY ([id_fiscalia]) REFERENCES [dbo].[fiscalia]([id_fiscalia]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_unidad_fkey] FOREIGN KEY ([id_unidad]) REFERENCES [dbo].[unidad]([id_unidad]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_estado_fkey] FOREIGN KEY ([id_estado]) REFERENCES [dbo].[estados]([id_estado]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicio] ADD CONSTRAINT [indicio_id_expediente_fkey] FOREIGN KEY ([id_expediente]) REFERENCES [dbo].[expediente]([id_expediente]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicio] ADD CONSTRAINT [indicio_id_tecnico_registro_fkey] FOREIGN KEY ([id_tecnico_registro]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[indicio] ADD CONSTRAINT [indicio_id_estado_indicio_fkey] FOREIGN KEY ([id_estado_indicio]) REFERENCES [dbo].[estado_indicio]([id_estado_indicio]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bitacora] ADD CONSTRAINT [bitacora_id_expediente_fkey] FOREIGN KEY ([id_expediente]) REFERENCES [dbo].[expediente]([id_expediente]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[bitacora] ADD CONSTRAINT [bitacora_id_usuario_fkey] FOREIGN KEY ([id_usuario]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_id_expediente_fkey] FOREIGN KEY ([id_expediente]) REFERENCES [dbo].[expediente]([id_expediente]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_id_indicio_fkey] FOREIGN KEY ([id_indicio]) REFERENCES [dbo].[indicio]([id_indicio]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[documentos] ADD CONSTRAINT [documentos_id_usuario_carga_fkey] FOREIGN KEY ([id_usuario_carga]) REFERENCES [dbo].[usuarios]([id_usuario]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
