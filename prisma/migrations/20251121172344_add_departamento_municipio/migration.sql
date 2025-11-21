BEGIN TRY

BEGIN TRAN;

-- CreateTable: departamento
CREATE TABLE [dbo].[departamento] (
    [id_departamento] INT NOT NULL IDENTITY(1,1),
    [nombre] VARCHAR(100) NOT NULL,
    [codigo] VARCHAR(10) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [departamento_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [departamento_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [departamento_pkey] PRIMARY KEY CLUSTERED ([id_departamento]),
    CONSTRAINT [departamento_nombre_key] UNIQUE NONCLUSTERED ([nombre]),
    CONSTRAINT [departamento_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateTable: municipio
CREATE TABLE [dbo].[municipio] (
    [id_municipio] INT NOT NULL IDENTITY(1,1),
    [id_departamento] INT NOT NULL,
    [nombre] VARCHAR(100) NOT NULL,
    [codigo] VARCHAR(10) NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [municipio_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [municipio_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [municipio_pkey] PRIMARY KEY CLUSTERED ([id_municipio]),
    CONSTRAINT [municipio_codigo_key] UNIQUE NONCLUSTERED ([codigo])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [municipio_id_departamento_idx] ON [dbo].[municipio]([id_departamento]);

-- AddForeignKey
ALTER TABLE [dbo].[municipio] ADD CONSTRAINT [municipio_id_departamento_fkey] FOREIGN KEY ([id_departamento]) REFERENCES [dbo].[departamento]([id_departamento]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AlterTable: expediente - Add departamento and municipio columns
ALTER TABLE [dbo].[expediente] ADD [id_departamento] INT NULL;
ALTER TABLE [dbo].[expediente] ADD [id_municipio] INT NULL;

-- CreateIndex
CREATE NONCLUSTERED INDEX [expediente_id_departamento_idx] ON [dbo].[expediente]([id_departamento]);
CREATE NONCLUSTERED INDEX [expediente_id_municipio_idx] ON [dbo].[expediente]([id_municipio]);

-- AddForeignKey
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_departamento_fkey] FOREIGN KEY ([id_departamento]) REFERENCES [dbo].[departamento]([id_departamento]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[expediente] ADD CONSTRAINT [expediente_id_municipio_fkey] FOREIGN KEY ([id_municipio]) REFERENCES [dbo].[municipio]([id_municipio]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
