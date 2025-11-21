BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[supervisor_tecnico] (
    [id_asignacion] INT NOT NULL IDENTITY(1,1),
    [id_supervisor] INT NOT NULL,
    [id_tecnico] INT NOT NULL,
    [created_at] DATETIME2 NOT NULL CONSTRAINT [supervisor_tecnico_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME2 NOT NULL CONSTRAINT [supervisor_tecnico_updated_at_df] DEFAULT CURRENT_TIMESTAMP,
    [deleted_at] DATETIME2,
    CONSTRAINT [supervisor_tecnico_pkey] PRIMARY KEY CLUSTERED ([id_asignacion]),
    CONSTRAINT [supervisor_tecnico_id_tecnico_key] UNIQUE NONCLUSTERED ([id_tecnico])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [supervisor_tecnico_id_supervisor_idx] ON [dbo].[supervisor_tecnico]([id_supervisor]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [supervisor_tecnico_deleted_at_idx] ON [dbo].[supervisor_tecnico]([deleted_at]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
