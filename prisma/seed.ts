import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Crear roles
  const roles = await Promise.all([
    prisma.rol.upsert({
      where: { nombreRol: 'ADMIN' },
      update: {},
      create: {
        nombreRol: 'ADMIN',
        descripcion: 'Administrador del sistema con acceso total',
        activo: true
      }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'SUPERVISOR' },
      update: {},
      create: {
        nombreRol: 'SUPERVISOR',
        descripcion: 'Supervisor de unidad, puede aprobar y rechazar',
        activo: true
      }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'TECNICO' },
      update: {},
      create: {
        nombreRol: 'TECNICO',
        descripcion: 'Técnico criminalístico, realiza análisis',
        activo: true
      }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'RECEPCION' },
      update: {},
      create: {
        nombreRol: 'RECEPCION',
        descripcion: 'Recepción de indicios y expedientes',
        activo: true
      }
    }),
    prisma.rol.upsert({
      where: { nombreRol: 'CONSULTA' },
      update: {},
      create: {
        nombreRol: 'CONSULTA',
        descripcion: 'Solo lectura de expedientes',
        activo: true
      }
    })
  ]);

  console.log(`Created ${roles.length} roles`);

  // Crear permisos - usar createMany que soporta skip duplicates
  const permisosCount = await prisma.permiso.count();
  if (permisosCount === 0) {
    await prisma.permiso.createMany({
      data: [
        // Expedientes
        { nombrePermiso: 'crear', descripcion: 'Crear expedientes', modulo: 'expedientes' },
        { nombrePermiso: 'ver', descripcion: 'Ver expedientes', modulo: 'expedientes' },
        { nombrePermiso: 'editar', descripcion: 'Editar expedientes', modulo: 'expedientes' },
        { nombrePermiso: 'eliminar', descripcion: 'Eliminar expedientes', modulo: 'expedientes' },
        { nombrePermiso: 'aprobar', descripcion: 'Aprobar expedientes', modulo: 'expedientes' },
        // Indicios
        { nombrePermiso: 'crear_indicio', descripcion: 'Crear indicios', modulo: 'indicios' },
        { nombrePermiso: 'leer', descripcion: 'Ver indicios', modulo: 'indicios' },
        { nombrePermiso: 'editar_indicio', descripcion: 'Editar indicios', modulo: 'indicios' },
        // Usuarios
        { nombrePermiso: 'gestionar', descripcion: 'Gestionar usuarios', modulo: 'usuarios' },
        // Reportes
        { nombrePermiso: 'ver_reportes', descripcion: 'Ver reportes', modulo: 'reportes' },
        // Sistema
        { nombrePermiso: 'gestionar_sistema', descripcion: 'Gestionar sistema', modulo: 'configuracion' }
      ]
    });
    console.log('Created 11 permisos');
  } else {
    console.log(`Skipped permisos (${permisosCount} already exist)`);
  }

  // Crear estados de expediente
  const estados = await Promise.all([
    prisma.estado.upsert({
      where: { nombreEstado: 'En Cola' },
      update: {},
      create: { nombreEstado: 'En Cola', descripcion: 'Expediente registrado, pendiente de asignación', color: '#6B7280', orden: 1 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'En Proceso' },
      update: {},
      create: { nombreEstado: 'En Proceso', descripcion: 'Expediente en análisis', color: '#3B82F6', orden: 2 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'En Revisión' },
      update: {},
      create: { nombreEstado: 'En Revisión', descripcion: 'Pendiente de revisión por supervisor', color: '#F59E0B', orden: 3 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'Rechazado' },
      update: {},
      create: { nombreEstado: 'Rechazado', descripcion: 'Rechazado por supervisor, requiere correcciones', color: '#EF4444', orden: 4 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'Aprobado' },
      update: {},
      create: { nombreEstado: 'Aprobado', descripcion: 'Aprobado por supervisor', color: '#10B981', orden: 5 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'Finalizado' },
      update: {},
      create: { nombreEstado: 'Finalizado', descripcion: 'Expediente finalizado y entregado', color: '#8B5CF6', orden: 6 }
    })
  ]);

  console.log(`Created ${estados.length} estados`);

  // Crear estados de indicio
  const estadosIndicio = await Promise.all([
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Registrado' },
      update: {},
      create: { nombre: 'Registrado', descripcion: 'Indicio registrado en el sistema' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'En Análisis' },
      update: {},
      create: { nombre: 'En Análisis', descripcion: 'Indicio en proceso de análisis' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Analizado' },
      update: {},
      create: { nombre: 'Analizado', descripcion: 'Análisis completado' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Devuelto' },
      update: {},
      create: { nombre: 'Devuelto', descripcion: 'Indicio devuelto a la fiscalía' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Destruido' },
      update: {},
      create: { nombre: 'Destruido', descripcion: 'Indicio destruido según protocolo' }
    })
  ]);

  console.log(`Created ${estadosIndicio.length} estados de indicio`);

  // Asignar todos los permisos al rol ADMIN
  const adminRole = roles.find(r => r.nombreRol === 'ADMIN');
  if (adminRole) {
    const allPermisos = await prisma.permiso.findMany({ where: { deletedAt: null } });

    if (allPermisos.length > 0) {
      // Verificar si ya existen las asignaciones
      const existingAssignments = await prisma.rolPermiso.count({
        where: { idRol: adminRole.id, deletedAt: null }
      });

      if (existingAssignments === 0) {
        await prisma.rolPermiso.createMany({
          data: allPermisos.map(p => ({
            idRol: adminRole.id,
            idPermiso: p.id,
            createdAt: new Date()
          }))
        });
        console.log(`Assigned ${allPermisos.length} permissions to ADMIN role`);
      } else {
        console.log(`Skipped permission assignment (${existingAssignments} already assigned to ADMIN)`);
      }
    }
  }

  // Crear usuario admin
  if (adminRole) {
    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    await prisma.usuario.upsert({
      where: { email: 'admin@mp.gob.gt' },
      update: {},
      create: {
        nombre: 'Administrador',
        apellido: 'Sistema',
        email: 'admin@mp.gob.gt',
        password: hashedPassword,
        dpi: '0000000000001',
        activo: true,
        idRol: adminRole.id
      }
    });

    console.log('Created admin user: admin@mp.gob.gt / Admin123!');
  }

  // Crear unidades de ejemplo
  const unidades = await Promise.all([
    prisma.unidad.upsert({
      where: { codigoUnidad: 'BAL' },
      update: {},
      create: { nombreUnidad: 'Balística', codigoUnidad: 'BAL', especialidad: 'Balística Forense', activo: true }
    }),
    prisma.unidad.upsert({
      where: { codigoUnidad: 'DOC' },
      update: {},
      create: { nombreUnidad: 'Documentoscopía', codigoUnidad: 'DOC', especialidad: 'Análisis de Documentos', activo: true }
    }),
    prisma.unidad.upsert({
      where: { codigoUnidad: 'QUI' },
      update: {},
      create: { nombreUnidad: 'Química Forense', codigoUnidad: 'QUI', especialidad: 'Química Forense', activo: true }
    }),
    prisma.unidad.upsert({
      where: { codigoUnidad: 'LOF' },
      update: {},
      create: { nombreUnidad: 'Lofoscopía', codigoUnidad: 'LOF', especialidad: 'Huellas Dactilares', activo: true }
    }),
    prisma.unidad.upsert({
      where: { codigoUnidad: 'GEN' },
      update: {},
      create: { nombreUnidad: 'Genética Forense', codigoUnidad: 'GEN', especialidad: 'ADN y Genética', activo: true }
    })
  ]);

  console.log(`Created ${unidades.length} unidades`);

  // Crear fiscalías de ejemplo
  const fiscalias = await Promise.all([
    prisma.fiscalia.upsert({
      where: { codigo: 'FMC-01' },
      update: {},
      create: {
        nombre: 'Fiscalía Metropolitana Central',
        codigo: 'FMC-01',
        direccion: '15 Avenida 15-16, Zona 1',
        departamento: 'Guatemala',
        municipio: 'Guatemala',
        activo: true
      }
    }),
    prisma.fiscalia.upsert({
      where: { codigo: 'FDH-01' },
      update: {},
      create: {
        nombre: 'Fiscalía de Delitos contra la Vida',
        codigo: 'FDH-01',
        direccion: 'Barrio Gerona, Zona 1',
        departamento: 'Guatemala',
        municipio: 'Guatemala',
        activo: true
      }
    })
  ]);

  console.log(`Created ${fiscalias.length} fiscalías`);

  // Crear procedimientos almacenados
  console.log('Creating stored procedures...');

  // Helper function to create or alter procedure
  const createProcedure = async (name: string, body: string) => {
    // First drop if exists
    try {
      await prisma.$executeRawUnsafe(`DROP PROCEDURE IF EXISTS ${name}`);
    } catch (e) {
      // Ignore if procedure doesn't exist
    }

    // Then create the procedure using EXEC
    const escapedBody = body.replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`EXEC('${escapedBody}')`);
  };

  // Procedimientos de autenticación
  await createProcedure('pr_login_usuario', `CREATE PROCEDURE pr_login_usuario
      @email VARCHAR(100)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Credenciales inválidas' AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email, NULL AS password, NULL AS dpi, NULL AS telefono, NULL AS id_rol, NULL AS nombre_rol, NULL AS rol_descripcion, NULL AS activo, NULL AS requiere_cambio_password, NULL AS permisos, NULL AS created_at, NULL AS updated_at;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND activo = 1 AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El usuario está inactivo. Contacte al administrador' AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email, NULL AS password, NULL AS dpi, NULL AS telefono, NULL AS id_rol, NULL AS nombre_rol, NULL AS rol_descripcion, NULL AS activo, NULL AS requiere_cambio_password, NULL AS permisos, NULL AS created_at, NULL AS updated_at;
          RETURN;
        END
        SELECT 1 AS resultado, 'Datos de usuario obtenidos correctamente' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email, u.password, u.dpi, u.telefono, u.id_rol, r.nombre_rol, r.descripcion AS rol_descripcion, u.activo, u.requiere_cambio_password, (SELECT p.nombre_permiso FROM rol_permiso rp INNER JOIN permiso p ON rp.id_permiso = p.id_permiso WHERE rp.id_rol = u.id_rol AND rp.deleted_at IS NULL AND p.deleted_at IS NULL FOR JSON PATH) AS permisos, u.created_at, u.updated_at FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.email = @email AND u.deleted_at IS NULL AND u.activo = 1 AND r.deleted_at IS NULL AND r.activo = 1;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email, NULL AS password, NULL AS dpi, NULL AS telefono, NULL AS id_rol, NULL AS nombre_rol, NULL AS rol_descripcion, NULL AS activo, NULL AS requiere_cambio_password, NULL AS permisos, NULL AS created_at, NULL AS updated_at;
      END CATCH
    END;
  `);

  await createProcedure('pr_obtener_perfil_usuario', `CREATE PROCEDURE pr_obtener_perfil_usuario
      @idUsuario INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado' AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email, NULL AS dpi, NULL AS telefono, NULL AS activo, NULL AS id_rol, NULL AS nombre_rol, NULL AS rol_descripcion, NULL AS created_at, NULL AS updated_at, NULL AS permisos;
          RETURN;
        END
        SELECT 1 AS resultado, 'Perfil obtenido correctamente' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email, u.dpi, u.telefono, u.activo, u.id_rol, r.nombre_rol, r.descripcion AS rol_descripcion, u.created_at, u.updated_at, (SELECT p.id_permiso, p.nombre_permiso, p.descripcion, p.modulo FROM rol_permiso rp INNER JOIN permiso p ON rp.id_permiso = p.id_permiso WHERE rp.id_rol = u.id_rol AND rp.deleted_at IS NULL AND p.deleted_at IS NULL FOR JSON PATH) AS permisos FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = @idUsuario AND u.deleted_at IS NULL AND r.deleted_at IS NULL;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email, NULL AS dpi, NULL AS telefono, NULL AS activo, NULL AS id_rol, NULL AS nombre_rol, NULL AS rol_descripcion, NULL AS created_at, NULL AS updated_at, NULL AS permisos;
      END CATCH
    END;
  `);

  await createProcedure('pr_actualizar_perfil_usuario', `CREATE PROCEDURE pr_actualizar_perfil_usuario
      @idUsuario INT,
      @nombre VARCHAR(100),
      @apellido VARCHAR(100),
      @telefono VARCHAR(15) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE usuarios SET nombre = @nombre, apellido = @apellido, telefono = @telefono, updated_at = GETDATE() WHERE id_usuario = @idUsuario AND deleted_at IS NULL;
        SELECT 1 AS resultado, 'Perfil actualizado exitosamente' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email, u.telefono, r.nombre_rol FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = @idUsuario;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_cambiar_password_usuario', `CREATE PROCEDURE pr_cambiar_password_usuario
      @idUsuario INT,
      @passwordNuevo VARCHAR(255)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado o inactivo' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE usuarios SET password = @passwordNuevo, requiere_cambio_password = 0, updated_at = GETDATE() WHERE id_usuario = @idUsuario AND deleted_at IS NULL;
        SELECT 1 AS resultado, 'Contraseña cambiada exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_solicitar_reset_password', `CREATE PROCEDURE pr_solicitar_reset_password
      @email VARCHAR(100)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 1 AS resultado, 'Si el email está registrado, recibirás instrucciones para resetear tu contraseña' AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email;
          RETURN;
        END
        SELECT 1 AS resultado, 'Si el email está registrado, recibirás instrucciones para resetear tu contraseña' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email FROM usuarios u WHERE u.email = @email AND u.deleted_at IS NULL AND u.activo = 1;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_usuario, NULL AS nombre, NULL AS apellido, NULL AS email;
      END CATCH
    END;
  `);

  await createProcedure('pr_resetear_password', `CREATE PROCEDURE pr_resetear_password
      @email VARCHAR(100),
      @passwordNuevo VARCHAR(255)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado o inactivo' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE usuarios SET password = @passwordNuevo, updated_at = GETDATE() WHERE email = @email AND deleted_at IS NULL;
        SELECT 1 AS resultado, 'Contraseña restablecida exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  console.log('Created auth procedures');

  // Procedimientos de usuarios
  await createProcedure('pr_registrar_usuario', `CREATE PROCEDURE pr_registrar_usuario
      @nombre VARCHAR(100),
      @apellido VARCHAR(100),
      @email VARCHAR(100),
      @password VARCHAR(255),
      @dpi VARCHAR(13) = NULL,
      @telefono VARCHAR(15) = NULL,
      @idRol INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El email ya está registrado en el sistema' AS mensaje, NULL AS id_usuario;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF @dpi IS NOT NULL AND EXISTS (SELECT 1 FROM usuarios WHERE dpi = @dpi AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El DPI ya está registrado en el sistema' AS mensaje, NULL AS id_usuario;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND activo = 1 AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El rol especificado no existe o no está activo' AS mensaje, NULL AS id_usuario;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @idUsuario INT;
        INSERT INTO usuarios (nombre, apellido, email, password, dpi, telefono, id_rol, activo, created_at, updated_at) VALUES (@nombre, @apellido, @email, @password, @dpi, @telefono, @idRol, 1, GETDATE(), GETDATE());
        SET @idUsuario = SCOPE_IDENTITY();
        SELECT 1 AS resultado, 'Usuario registrado exitosamente' AS mensaje, @idUsuario AS id_usuario;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_usuario;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_usuarios', `CREATE PROCEDURE pr_listar_usuarios
      @pagina INT = 1,
      @limite INT = 10,
      @busqueda VARCHAR(100) = NULL,
      @idRol INT = NULL,
      @soloActivos BIT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      DECLARE @offset INT = (@pagina - 1) * @limite;
      DECLARE @total INT;
      SELECT @total = COUNT(*) FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.deleted_at IS NULL AND (@busqueda IS NULL OR u.nombre LIKE '%' + @busqueda + '%' OR u.apellido LIKE '%' + @busqueda + '%' OR u.email LIKE '%' + @busqueda + '%' OR u.dpi LIKE '%' + @busqueda + '%') AND (@idRol IS NULL OR u.id_rol = @idRol) AND (@soloActivos = 0 OR u.activo = 1);
      SELECT 1 AS resultado, 'Usuarios obtenidos correctamente' AS mensaje, @total AS total, @pagina AS pagina, @limite AS limite, CEILING(CAST(@total AS FLOAT) / @limite) AS total_paginas, (SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.dpi, u.telefono, u.activo, u.id_rol, r.nombre_rol AS nombre_rol, u.created_at, u.updated_at FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.deleted_at IS NULL AND (@busqueda IS NULL OR u.nombre LIKE '%' + @busqueda + '%' OR u.apellido LIKE '%' + @busqueda + '%' OR u.email LIKE '%' + @busqueda + '%' OR u.dpi LIKE '%' + @busqueda + '%') AND (@idRol IS NULL OR u.id_rol = @idRol) AND (@soloActivos = 0 OR u.activo = 1) ORDER BY u.created_at DESC OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY FOR JSON PATH) AS usuarios
    END;
  `);

  await createProcedure('pr_obtener_usuario', `CREATE PROCEDURE pr_obtener_usuario
      @idUsuario INT
    AS
    BEGIN
      SET NOCOUNT ON;
      IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL)
      BEGIN
        SELECT 0 AS resultado, 'Usuario no encontrado' AS mensaje;
        RETURN;
      END
      SELECT 1 AS resultado, 'Usuario obtenido correctamente' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email, u.dpi, u.telefono, u.activo, u.id_rol, r.nombre_rol AS nombre_rol, r.descripcion AS rol_descripcion, u.created_at, u.updated_at FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.id_usuario = @idUsuario AND u.deleted_at IS NULL;
    END;
  `);

  await createProcedure('pr_actualizar_usuario', `CREATE PROCEDURE pr_actualizar_usuario
      @idUsuario INT,
      @nombre VARCHAR(100),
      @apellido VARCHAR(100),
      @email VARCHAR(100),
      @dpi VARCHAR(13) = NULL,
      @telefono VARCHAR(15) = NULL,
      @idRol INT,
      @activo BIT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM usuarios WHERE email = @email AND id_usuario != @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El email ya está registrado en el sistema' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF @dpi IS NOT NULL AND EXISTS (SELECT 1 FROM usuarios WHERE dpi = @dpi AND id_usuario != @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El DPI ya está registrado en el sistema' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND activo = 1 AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El rol especificado no existe o no está activo' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE usuarios SET nombre = @nombre, apellido = @apellido, email = @email, dpi = @dpi, telefono = @telefono, id_rol = @idRol, activo = @activo, updated_at = GETDATE() WHERE id_usuario = @idUsuario;
        SELECT 1 AS resultado, 'Usuario actualizado exitosamente' AS mensaje, @idUsuario AS id_usuario;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_usuario', `CREATE PROCEDURE pr_eliminar_usuario
      @idUsuario INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Usuario no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE usuarios SET deleted_at = GETDATE(), activo = 0 WHERE id_usuario = @idUsuario;
        SELECT 1 AS resultado, 'Usuario eliminado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_roles', `CREATE PROCEDURE pr_listar_roles
    AS
    BEGIN
      SET NOCOUNT ON;
      SELECT 1 AS resultado, 'Roles obtenidos correctamente' AS mensaje, (SELECT id_rol, nombre_rol, descripcion FROM rol WHERE activo = 1 AND deleted_at IS NULL ORDER BY nombre_rol FOR JSON PATH) AS roles;
    END;
  `);

  console.log('Created user procedures');

  // Procedimientos de roles
  await createProcedure('pr_registrar_rol', `CREATE PROCEDURE pr_registrar_rol
      @nombreRol NVARCHAR(50),
      @descripcion NTEXT = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF @nombreRol IS NULL OR LTRIM(RTRIM(@nombreRol)) = ''
        BEGIN
          SELECT 0 AS resultado, 'El nombre del rol es requerido' AS mensaje, NULL AS id_rol;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM rol WHERE nombre_rol = @nombreRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Ya existe un rol con ese nombre' AS mensaje, NULL AS id_rol;
          RETURN;
        END
        DECLARE @idRol INT;
        INSERT INTO rol (nombre_rol, descripcion, activo, created_at, updated_at) VALUES (@nombreRol, @descripcion, 1, GETDATE(), GETDATE());
        SET @idRol = SCOPE_IDENTITY();
        SELECT 1 AS resultado, 'Rol registrado exitosamente' AS mensaje, @idRol AS id_rol;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_rol;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_roles_paginado', `CREATE PROCEDURE pr_listar_roles_paginado
      @pagina INT = 1,
      @limite INT = 10,
      @busqueda NVARCHAR(100) = NULL,
      @soloActivos BIT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        DECLARE @offset INT = (@pagina - 1) * @limite;
        DECLARE @total INT;
        SELECT @total = COUNT(*) FROM rol WHERE deleted_at IS NULL AND (@soloActivos = 0 OR activo = 1) AND (@busqueda IS NULL OR nombre_rol LIKE '%' + @busqueda + '%' OR descripcion LIKE '%' + @busqueda + '%');
        DECLARE @roles NVARCHAR(MAX);
        SELECT @roles = (SELECT r.id_rol, r.nombre_rol, r.descripcion, r.activo, r.created_at, r.updated_at, (SELECT COUNT(*) FROM rol_permiso rp WHERE rp.id_rol = r.id_rol AND rp.deleted_at IS NULL) AS total_permisos FROM rol r WHERE r.deleted_at IS NULL AND (@soloActivos = 0 OR r.activo = 1) AND (@busqueda IS NULL OR r.nombre_rol LIKE '%' + @busqueda + '%' OR r.descripcion LIKE '%' + @busqueda + '%') ORDER BY r.created_at DESC OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY FOR JSON PATH);
        SELECT 1 AS resultado, 'Roles obtenidos correctamente' AS mensaje, @total AS total, @pagina AS pagina, @limite AS limite, CEILING(CAST(@total AS FLOAT) / @limite) AS total_paginas, ISNULL(@roles, '[]') AS roles;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, 0 AS total, 0 AS pagina, 0 AS limite, 0 AS total_paginas, NULL AS roles;
      END CATCH
    END;
  `);

  await createProcedure('pr_obtener_rol', `CREATE PROCEDURE pr_obtener_rol
      @idRol INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Rol no encontrado' AS mensaje;
          RETURN;
        END
        DECLARE @nombreRol NVARCHAR(50);
        DECLARE @descripcion NVARCHAR(MAX);
        DECLARE @activo BIT;
        DECLARE @createdAt DATETIME;
        DECLARE @updatedAt DATETIME;
        SELECT @nombreRol = nombre_rol, @descripcion = descripcion, @activo = activo, @createdAt = created_at, @updatedAt = updated_at FROM rol WHERE id_rol = @idRol;
        DECLARE @permisos NVARCHAR(MAX);
        SELECT @permisos = (SELECT p.id_permiso, p.nombre_permiso, p.descripcion, p.modulo FROM permiso p INNER JOIN rol_permiso rp ON p.id_permiso = rp.id_permiso WHERE rp.id_rol = @idRol AND rp.deleted_at IS NULL AND p.deleted_at IS NULL ORDER BY p.modulo, p.nombre_permiso FOR JSON PATH);
        SELECT 1 AS resultado, 'Rol obtenido correctamente' AS mensaje, @idRol AS id_rol, @nombreRol AS nombre_rol, @descripcion AS descripcion, @activo AS activo, @createdAt AS created_at, @updatedAt AS updated_at, ISNULL(@permisos, '[]') AS permisos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_actualizar_rol', `CREATE PROCEDURE pr_actualizar_rol
      @idRol INT,
      @nombreRol NVARCHAR(50),
      @descripcion NTEXT = NULL,
      @activo BIT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Rol no encontrado' AS mensaje, NULL AS id_rol;
          RETURN;
        END
        IF @nombreRol IS NULL OR LTRIM(RTRIM(@nombreRol)) = ''
        BEGIN
          SELECT 0 AS resultado, 'El nombre del rol es requerido' AS mensaje, NULL AS id_rol;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM rol WHERE nombre_rol = @nombreRol AND id_rol != @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Ya existe otro rol con ese nombre' AS mensaje, NULL AS id_rol;
          RETURN;
        END
        UPDATE rol SET nombre_rol = @nombreRol, descripcion = @descripcion, activo = @activo, updated_at = GETDATE() WHERE id_rol = @idRol;
        SELECT 1 AS resultado, 'Rol actualizado exitosamente' AS mensaje, @idRol AS id_rol;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_rol;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_rol', `CREATE PROCEDURE pr_eliminar_rol
      @idRol INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Rol no encontrado' AS mensaje;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM usuarios WHERE id_rol = @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'No se puede eliminar el rol porque tiene usuarios asignados' AS mensaje;
          RETURN;
        END
        UPDATE rol SET deleted_at = GETDATE() WHERE id_rol = @idRol;
        UPDATE rol_permiso SET deleted_at = GETDATE() WHERE id_rol = @idRol;
        SELECT 1 AS resultado, 'Rol eliminado exitosamente' AS mensaje;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_asignar_permisos_rol', `CREATE PROCEDURE pr_asignar_permisos_rol
      @idRol INT,
      @permisos NVARCHAR(MAX)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM rol WHERE id_rol = @idRol AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Rol no encontrado' AS mensaje;
          RETURN;
        END
        UPDATE rol_permiso SET deleted_at = GETDATE() WHERE id_rol = @idRol AND deleted_at IS NULL;
        INSERT INTO rol_permiso (id_rol, id_permiso, created_at) SELECT @idRol, value, GETDATE() FROM OPENJSON(@permisos) WHERE value IN (SELECT id_permiso FROM permiso WHERE deleted_at IS NULL);
        SELECT 1 AS resultado, 'Permisos asignados exitosamente' AS mensaje;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  console.log('Created role procedures');

  // Procedimientos de permisos
  await createProcedure('pr_registrar_permiso', `CREATE PROCEDURE pr_registrar_permiso
      @nombrePermiso NVARCHAR(100),
      @descripcion NTEXT = NULL,
      @modulo NVARCHAR(50) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF @nombrePermiso IS NULL OR LTRIM(RTRIM(@nombrePermiso)) = ''
        BEGIN
          SELECT 0 AS resultado, 'El nombre del permiso es requerido' AS mensaje, NULL AS id_permiso;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM permiso WHERE nombre_permiso = @nombrePermiso AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Ya existe un permiso con ese nombre' AS mensaje, NULL AS id_permiso;
          RETURN;
        END
        DECLARE @idPermiso INT;
        INSERT INTO permiso (nombre_permiso, descripcion, modulo, created_at, updated_at) VALUES (@nombrePermiso, @descripcion, @modulo, GETDATE(), GETDATE());
        SET @idPermiso = SCOPE_IDENTITY();
        SELECT 1 AS resultado, 'Permiso registrado exitosamente' AS mensaje, @idPermiso AS id_permiso;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_permiso;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_permisos', `CREATE PROCEDURE pr_listar_permisos
      @pagina INT = 1,
      @limite INT = 10,
      @busqueda NVARCHAR(100) = NULL,
      @modulo NVARCHAR(50) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        DECLARE @offset INT = (@pagina - 1) * @limite;
        DECLARE @total INT;
        SELECT @total = COUNT(*) FROM permiso WHERE deleted_at IS NULL AND (@busqueda IS NULL OR nombre_permiso LIKE '%' + @busqueda + '%' OR descripcion LIKE '%' + @busqueda + '%') AND (@modulo IS NULL OR modulo = @modulo);
        DECLARE @permisos NVARCHAR(MAX);
        SELECT @permisos = (SELECT p.id_permiso, p.nombre_permiso, p.descripcion, p.modulo, p.created_at, p.updated_at, (SELECT COUNT(*) FROM rol_permiso rp WHERE rp.id_permiso = p.id_permiso AND rp.deleted_at IS NULL) AS total_roles FROM permiso p WHERE p.deleted_at IS NULL AND (@busqueda IS NULL OR p.nombre_permiso LIKE '%' + @busqueda + '%' OR p.descripcion LIKE '%' + @busqueda + '%') AND (@modulo IS NULL OR p.modulo = @modulo) ORDER BY p.modulo, p.nombre_permiso OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY FOR JSON PATH);
        SELECT 1 AS resultado, 'Permisos obtenidos correctamente' AS mensaje, @total AS total, @pagina AS pagina, @limite AS limite, CEILING(CAST(@total AS FLOAT) / @limite) AS total_paginas, ISNULL(@permisos, '[]') AS permisos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, 0 AS total, 0 AS pagina, 0 AS limite, 0 AS total_paginas, NULL AS permisos;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_todos_permisos', `CREATE PROCEDURE pr_listar_todos_permisos
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        DECLARE @permisos NVARCHAR(MAX);
        SELECT @permisos = (SELECT id_permiso, nombre_permiso, descripcion, modulo FROM permiso WHERE deleted_at IS NULL ORDER BY modulo, nombre_permiso FOR JSON PATH);
        SELECT 1 AS resultado, 'Permisos obtenidos correctamente' AS mensaje, ISNULL(@permisos, '[]') AS permisos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS permisos;
      END CATCH
    END;
  `);

  await createProcedure('pr_obtener_permiso', `CREATE PROCEDURE pr_obtener_permiso
      @idPermiso INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM permiso WHERE id_permiso = @idPermiso AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Permiso no encontrado' AS mensaje;
          RETURN;
        END
        SELECT 1 AS resultado, 'Permiso obtenido correctamente' AS mensaje, id_permiso, nombre_permiso, descripcion, modulo, created_at, updated_at FROM permiso WHERE id_permiso = @idPermiso;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_actualizar_permiso', `CREATE PROCEDURE pr_actualizar_permiso
      @idPermiso INT,
      @nombrePermiso NVARCHAR(100),
      @descripcion NTEXT = NULL,
      @modulo NVARCHAR(50) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM permiso WHERE id_permiso = @idPermiso AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Permiso no encontrado' AS mensaje, NULL AS id_permiso;
          RETURN;
        END
        IF @nombrePermiso IS NULL OR LTRIM(RTRIM(@nombrePermiso)) = ''
        BEGIN
          SELECT 0 AS resultado, 'El nombre del permiso es requerido' AS mensaje, NULL AS id_permiso;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM permiso WHERE nombre_permiso = @nombrePermiso AND id_permiso != @idPermiso AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Ya existe otro permiso con ese nombre' AS mensaje, NULL AS id_permiso;
          RETURN;
        END
        UPDATE permiso SET nombre_permiso = @nombrePermiso, descripcion = @descripcion, modulo = @modulo, updated_at = GETDATE() WHERE id_permiso = @idPermiso;
        SELECT 1 AS resultado, 'Permiso actualizado exitosamente' AS mensaje, @idPermiso AS id_permiso;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_permiso;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_permiso', `CREATE PROCEDURE pr_eliminar_permiso
      @idPermiso INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM permiso WHERE id_permiso = @idPermiso AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Permiso no encontrado' AS mensaje;
          RETURN;
        END
        UPDATE permiso SET deleted_at = GETDATE() WHERE id_permiso = @idPermiso;
        UPDATE rol_permiso SET deleted_at = GETDATE() WHERE id_permiso = @idPermiso;
        SELECT 1 AS resultado, 'Permiso eliminado exitosamente' AS mensaje;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  console.log('Created permission procedures');
  console.log('All stored procedures created successfully!');

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
