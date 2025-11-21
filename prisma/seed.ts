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
        { nombrePermiso: 'gestionar_sistema', descripcion: 'Gestionar sistema', modulo: 'configuracion' },
        // Asignaciones
        { nombrePermiso: 'gestionar_asignaciones', descripcion: 'Gestionar asignaciones supervisor-técnico', modulo: 'configuracion' }
      ]
    });
    console.log('Created 12 permisos');
  } else {
    console.log(`Skipped permisos (${permisosCount} already exist)`);
  }

  // Crear estados de expediente (solo 3: Pendiente de Revisión, Aprobado, Rechazado)
  const estados = await Promise.all([
    prisma.estado.upsert({
      where: { nombreEstado: 'Pendiente de Revisión' },
      update: { color: '#F59E0B', orden: 1 },
      create: { nombreEstado: 'Pendiente de Revisión', descripcion: 'Pendiente de revisión por supervisor', color: '#F59E0B', orden: 1 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'Aprobado' },
      update: { color: '#10B981', orden: 2 },
      create: { nombreEstado: 'Aprobado', descripcion: 'Aprobado por supervisor', color: '#10B981', orden: 2 }
    }),
    prisma.estado.upsert({
      where: { nombreEstado: 'Rechazado' },
      update: { color: '#EF4444', orden: 3 },
      create: { nombreEstado: 'Rechazado', descripcion: 'Rechazado por supervisor, requiere correcciones', color: '#EF4444', orden: 3 }
    })
  ]);

  console.log(`Created ${estados.length} estados`);

  // Crear estados de indicio (solo 3: Pendiente de Revisión, Aprobado, Rechazado)
  const estadosIndicio = await Promise.all([
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Pendiente de Revisión' },
      update: {},
      create: { nombre: 'Pendiente de Revisión', descripcion: 'Indicio pendiente de revisión' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Aprobado' },
      update: {},
      create: { nombre: 'Aprobado', descripcion: 'Indicio aprobado' }
    }),
    prisma.estadoIndicio.upsert({
      where: { nombre: 'Rechazado' },
      update: {},
      create: { nombre: 'Rechazado', descripcion: 'Indicio rechazado' }
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

  // Asignar permisos al rol SUPERVISOR (ver, aprobar expedientes + ver indicios)
  const supervisorRoleForPerms = roles.find(r => r.nombreRol === 'SUPERVISOR');
  if (supervisorRoleForPerms) {
    const supervisorPermisos = await prisma.permiso.findMany({
      where: {
        deletedAt: null,
        nombrePermiso: { in: ['ver', 'aprobar', 'leer'] } // ver expedientes, aprobar, ver indicios
      }
    });

    const existingSupervisorAssignments = await prisma.rolPermiso.count({
      where: { idRol: supervisorRoleForPerms.id, deletedAt: null }
    });

    if (existingSupervisorAssignments === 0 && supervisorPermisos.length > 0) {
      await prisma.rolPermiso.createMany({
        data: supervisorPermisos.map(p => ({
          idRol: supervisorRoleForPerms.id,
          idPermiso: p.id,
          createdAt: new Date()
        }))
      });
      console.log(`Assigned ${supervisorPermisos.length} permissions to SUPERVISOR role`);
    }
  }

  // Asignar permisos al rol TECNICO (crear, ver, editar expedientes + crear, ver, editar indicios)
  const tecnicoRoleForPerms = roles.find(r => r.nombreRol === 'TECNICO');
  if (tecnicoRoleForPerms) {
    const tecnicoPermisos = await prisma.permiso.findMany({
      where: {
        deletedAt: null,
        nombrePermiso: { in: ['crear', 'ver', 'editar', 'crear_indicio', 'leer', 'editar_indicio'] }
      }
    });

    const existingTecnicoAssignments = await prisma.rolPermiso.count({
      where: { idRol: tecnicoRoleForPerms.id, deletedAt: null }
    });

    if (existingTecnicoAssignments === 0 && tecnicoPermisos.length > 0) {
      await prisma.rolPermiso.createMany({
        data: tecnicoPermisos.map(p => ({
          idRol: tecnicoRoleForPerms.id,
          idPermiso: p.id,
          createdAt: new Date()
        }))
      });
      console.log(`Assigned ${tecnicoPermisos.length} permissions to TECNICO role`);
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

  // Crear departamentos de Guatemala (22 departamentos)
  const departamentos = await Promise.all([
    prisma.departamento.upsert({
      where: { codigo: '01' },
      update: {},
      create: { nombre: 'Guatemala', codigo: '01' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '02' },
      update: {},
      create: { nombre: 'El Progreso', codigo: '02' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '03' },
      update: {},
      create: { nombre: 'Sacatepéquez', codigo: '03' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '04' },
      update: {},
      create: { nombre: 'Chimaltenango', codigo: '04' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '05' },
      update: {},
      create: { nombre: 'Escuintla', codigo: '05' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '06' },
      update: {},
      create: { nombre: 'Santa Rosa', codigo: '06' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '07' },
      update: {},
      create: { nombre: 'Sololá', codigo: '07' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '08' },
      update: {},
      create: { nombre: 'Totonicapán', codigo: '08' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '09' },
      update: {},
      create: { nombre: 'Quetzaltenango', codigo: '09' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '10' },
      update: {},
      create: { nombre: 'Suchitepéquez', codigo: '10' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '11' },
      update: {},
      create: { nombre: 'Retalhuleu', codigo: '11' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '12' },
      update: {},
      create: { nombre: 'San Marcos', codigo: '12' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '13' },
      update: {},
      create: { nombre: 'Huehuetenango', codigo: '13' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '14' },
      update: {},
      create: { nombre: 'Quiché', codigo: '14' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '15' },
      update: {},
      create: { nombre: 'Baja Verapaz', codigo: '15' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '16' },
      update: {},
      create: { nombre: 'Alta Verapaz', codigo: '16' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '17' },
      update: {},
      create: { nombre: 'Petén', codigo: '17' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '18' },
      update: {},
      create: { nombre: 'Izabal', codigo: '18' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '19' },
      update: {},
      create: { nombre: 'Zacapa', codigo: '19' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '20' },
      update: {},
      create: { nombre: 'Chiquimula', codigo: '20' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '21' },
      update: {},
      create: { nombre: 'Jalapa', codigo: '21' }
    }),
    prisma.departamento.upsert({
      where: { codigo: '22' },
      update: {},
      create: { nombre: 'Jutiapa', codigo: '22' }
    })
  ]);

  console.log(`Created ${departamentos.length} departamentos`);

  // Crear municipios de Guatemala
  const guatemala = departamentos.find(d => d.codigo === '01');
  if (guatemala) {
    const municipiosGuatemala = [
      { nombre: 'Guatemala', codigo: '0101' },
      { nombre: 'Santa Catarina Pinula', codigo: '0102' },
      { nombre: 'San José Pinula', codigo: '0103' },
      { nombre: 'San José del Golfo', codigo: '0104' },
      { nombre: 'Palencia', codigo: '0105' },
      { nombre: 'Chinautla', codigo: '0106' },
      { nombre: 'San Pedro Ayampuc', codigo: '0107' },
      { nombre: 'Mixco', codigo: '0108' },
      { nombre: 'San Pedro Sacatepéquez', codigo: '0109' },
      { nombre: 'San Juan Sacatepéquez', codigo: '0110' },
      { nombre: 'San Raymundo', codigo: '0111' },
      { nombre: 'Chuarrancho', codigo: '0112' },
      { nombre: 'Fraijanes', codigo: '0113' },
      { nombre: 'Amatitlán', codigo: '0114' },
      { nombre: 'Villa Nueva', codigo: '0115' },
      { nombre: 'Villa Canales', codigo: '0116' },
      { nombre: 'San Miguel Petapa', codigo: '0117' }
    ];

    for (const mun of municipiosGuatemala) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: {
          nombre: mun.nombre,
          codigo: mun.codigo,
          idDepartamento: guatemala.id
        }
      });
    }
  }

  const elProgreso = departamentos.find(d => d.codigo === '02');
  if (elProgreso) {
    const municipiosProgreso = [
      { nombre: 'Guastatoya', codigo: '0201' },
      { nombre: 'Morazán', codigo: '0202' },
      { nombre: 'San Agustín Acasaguastlán', codigo: '0203' },
      { nombre: 'San Cristóbal Acasaguastlán', codigo: '0204' },
      { nombre: 'El Jícaro', codigo: '0205' },
      { nombre: 'Sansare', codigo: '0206' },
      { nombre: 'Sanarate', codigo: '0207' },
      { nombre: 'San Antonio La Paz', codigo: '0208' }
    ];

    for (const mun of municipiosProgreso) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: {
          nombre: mun.nombre,
          codigo: mun.codigo,
          idDepartamento: elProgreso.id
        }
      });
    }
  }

  const sacatepequez = departamentos.find(d => d.codigo === '03');
  if (sacatepequez) {
    const municipiosSacatepequez = [
      { nombre: 'Antigua Guatemala', codigo: '0301' },
      { nombre: 'Jocotenango', codigo: '0302' },
      { nombre: 'Pastores', codigo: '0303' },
      { nombre: 'Sumpango', codigo: '0304' },
      { nombre: 'Santo Domingo Xenacoj', codigo: '0305' },
      { nombre: 'Santiago Sacatepéquez', codigo: '0306' },
      { nombre: 'San Bartolomé Milpas Altas', codigo: '0307' },
      { nombre: 'San Lucas Sacatepéquez', codigo: '0308' },
      { nombre: 'Santa Lucía Milpas Altas', codigo: '0309' },
      { nombre: 'Magdalena Milpas Altas', codigo: '0310' },
      { nombre: 'Santa María de Jesús', codigo: '0311' },
      { nombre: 'Ciudad Vieja', codigo: '0312' },
      { nombre: 'San Miguel Dueñas', codigo: '0313' },
      { nombre: 'San Juan Alotenango', codigo: '0314' },
      { nombre: 'San Antonio Aguas Calientes', codigo: '0315' },
      { nombre: 'Santa Catarina Barahona', codigo: '0316' }
    ];

    for (const mun of municipiosSacatepequez) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: {
          nombre: mun.nombre,
          codigo: mun.codigo,
          idDepartamento: sacatepequez.id
        }
      });
    }
  }

  // Chimaltenango
  const chimaltenango = departamentos.find(d => d.codigo === '04');
  if (chimaltenango) {
    const municipiosChimaltenango = [
      { nombre: 'Chimaltenango', codigo: '0401' },
      { nombre: 'San José Poaquil', codigo: '0402' },
      { nombre: 'San Martín Jilotepeque', codigo: '0403' },
      { nombre: 'San Juan Comalapa', codigo: '0404' },
      { nombre: 'Santa Apolonia', codigo: '0405' },
      { nombre: 'Tecpán Guatemala', codigo: '0406' },
      { nombre: 'Patzún', codigo: '0407' },
      { nombre: 'San Miguel Pochuta', codigo: '0408' },
      { nombre: 'Patzicía', codigo: '0409' },
      { nombre: 'Santa Cruz Balanyá', codigo: '0410' },
      { nombre: 'Acatenango', codigo: '0411' },
      { nombre: 'San Pedro Yepocapa', codigo: '0412' },
      { nombre: 'San Andrés Itzapa', codigo: '0413' },
      { nombre: 'Parramos', codigo: '0414' },
      { nombre: 'Zaragoza', codigo: '0415' },
      { nombre: 'El Tejar', codigo: '0416' }
    ];

    for (const mun of municipiosChimaltenango) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: { nombre: mun.nombre, codigo: mun.codigo, idDepartamento: chimaltenango.id }
      });
    }
  }

  // Escuintla
  const escuintla = departamentos.find(d => d.codigo === '05');
  if (escuintla) {
    const municipiosEscuintla = [
      { nombre: 'Escuintla', codigo: '0501' },
      { nombre: 'Santa Lucía Cotzumalguapa', codigo: '0502' },
      { nombre: 'La Democracia', codigo: '0503' },
      { nombre: 'Siquinalá', codigo: '0504' },
      { nombre: 'Masagua', codigo: '0505' },
      { nombre: 'Tiquisate', codigo: '0506' },
      { nombre: 'La Gomera', codigo: '0507' },
      { nombre: 'Guanagazapa', codigo: '0508' },
      { nombre: 'San José', codigo: '0509' },
      { nombre: 'Iztapa', codigo: '0510' },
      { nombre: 'Palín', codigo: '0511' },
      { nombre: 'San Vicente Pacaya', codigo: '0512' },
      { nombre: 'Nueva Concepción', codigo: '0513' }
    ];

    for (const mun of municipiosEscuintla) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: { nombre: mun.nombre, codigo: mun.codigo, idDepartamento: escuintla.id }
      });
    }
  }

  // Quetzaltenango
  const quetzaltenango = departamentos.find(d => d.codigo === '09');
  if (quetzaltenango) {
    const municipiosQuetzaltenango = [
      { nombre: 'Quetzaltenango', codigo: '0901' },
      { nombre: 'Salcajá', codigo: '0902' },
      { nombre: 'San Juan Olintepeque', codigo: '0903' },
      { nombre: 'San Carlos Sija', codigo: '0904' },
      { nombre: 'Sibilia', codigo: '0905' },
      { nombre: 'Cabricán', codigo: '0906' },
      { nombre: 'Cajolá', codigo: '0907' },
      { nombre: 'San Miguel Sigüilá', codigo: '0908' },
      { nombre: 'San Juan Ostuncalco', codigo: '0909' },
      { nombre: 'San Mateo', codigo: '0910' },
      { nombre: 'Concepción Chiquirichapa', codigo: '0911' },
      { nombre: 'San Martín Sacatepéquez', codigo: '0912' },
      { nombre: 'Almolonga', codigo: '0913' },
      { nombre: 'Cantel', codigo: '0914' },
      { nombre: 'Huitán', codigo: '0915' },
      { nombre: 'Zunil', codigo: '0916' },
      { nombre: 'Colomba Costa Cuca', codigo: '0917' },
      { nombre: 'San Francisco La Unión', codigo: '0918' },
      { nombre: 'El Palmar', codigo: '0919' },
      { nombre: 'Coatepeque', codigo: '0920' },
      { nombre: 'Génova', codigo: '0921' },
      { nombre: 'Flores Costa Cuca', codigo: '0922' },
      { nombre: 'La Esperanza', codigo: '0923' },
      { nombre: 'Palestina de Los Altos', codigo: '0924' }
    ];

    for (const mun of municipiosQuetzaltenango) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: { nombre: mun.nombre, codigo: mun.codigo, idDepartamento: quetzaltenango.id }
      });
    }
  }

  // Alta Verapaz
  const altaVerapaz = departamentos.find(d => d.codigo === '16');
  if (altaVerapaz) {
    const municipiosAltaVerapaz = [
      { nombre: 'Cobán', codigo: '1601' },
      { nombre: 'Santa Cruz Verapaz', codigo: '1602' },
      { nombre: 'San Cristóbal Verapaz', codigo: '1603' },
      { nombre: 'Tactic', codigo: '1604' },
      { nombre: 'Tamahú', codigo: '1605' },
      { nombre: 'San Miguel Tucurú', codigo: '1606' },
      { nombre: 'Panzós', codigo: '1607' },
      { nombre: 'Senahú', codigo: '1608' },
      { nombre: 'San Pedro Carchá', codigo: '1609' },
      { nombre: 'San Juan Chamelco', codigo: '1610' },
      { nombre: 'San Agustín Lanquín', codigo: '1611' },
      { nombre: 'Santa María Cahabón', codigo: '1612' },
      { nombre: 'Chisec', codigo: '1613' },
      { nombre: 'Chahal', codigo: '1614' },
      { nombre: 'Fray Bartolomé de Las Casas', codigo: '1615' },
      { nombre: 'Santa Catalina La Tinta', codigo: '1616' },
      { nombre: 'Raxruhá', codigo: '1617' }
    ];

    for (const mun of municipiosAltaVerapaz) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: { nombre: mun.nombre, codigo: mun.codigo, idDepartamento: altaVerapaz.id }
      });
    }
  }

  // Petén
  const peten = departamentos.find(d => d.codigo === '17');
  if (peten) {
    const municipiosPeten = [
      { nombre: 'Flores', codigo: '1701' },
      { nombre: 'San José', codigo: '1702' },
      { nombre: 'San Benito', codigo: '1703' },
      { nombre: 'San Andrés', codigo: '1704' },
      { nombre: 'La Libertad', codigo: '1705' },
      { nombre: 'San Francisco', codigo: '1706' },
      { nombre: 'Santa Ana', codigo: '1707' },
      { nombre: 'Dolores', codigo: '1708' },
      { nombre: 'San Luis', codigo: '1709' },
      { nombre: 'Sayaxché', codigo: '1710' },
      { nombre: 'Melchor de Mencos', codigo: '1711' },
      { nombre: 'Poptún', codigo: '1712' },
      { nombre: 'Las Cruces', codigo: '1713' },
      { nombre: 'El Chal', codigo: '1714' }
    ];

    for (const mun of municipiosPeten) {
      await prisma.municipio.upsert({
        where: { codigo: mun.codigo },
        update: {},
        create: { nombre: mun.nombre, codigo: mun.codigo, idDepartamento: peten.id }
      });
    }
  }

  console.log('Created municipios for all major departments');

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
        SELECT 1 AS resultado, 'Datos de usuario obtenidos correctamente' AS mensaje, u.id_usuario, u.nombre, u.apellido, u.email, u.password, u.dpi, u.telefono, u.id_rol, r.nombre_rol, r.descripcion AS rol_descripcion, u.activo, u.requiere_cambio_password, (SELECT p.id_permiso, p.nombre_permiso, p.descripcion, p.modulo FROM rol_permiso rp INNER JOIN permiso p ON rp.id_permiso = p.id_permiso WHERE rp.id_rol = u.id_rol AND rp.deleted_at IS NULL AND p.deleted_at IS NULL FOR JSON PATH) AS permisos, u.created_at, u.updated_at FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol WHERE u.email = @email AND u.deleted_at IS NULL AND u.activo = 1 AND r.deleted_at IS NULL AND r.activo = 1;
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
      @descripcion NVARCHAR(MAX) = NULL
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
      @descripcion NVARCHAR(MAX) = NULL,
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
      @descripcion NVARCHAR(MAX) = NULL,
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
      @descripcion NVARCHAR(MAX) = NULL,
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

  // Procedimientos de expedientes
  await createProcedure('pr_crear_expediente', `CREATE PROCEDURE pr_crear_expediente
      @numeroExpediente NVARCHAR(50),
      @numeroCasoMp NVARCHAR(50) = NULL,
      @idUsuarioRegistro INT,
      @idTecnicoAsignado INT,
      @idSupervisor INT = NULL,
      @idFiscalia INT,
      @idUnidad INT,
      @idEstado INT,
      @tipoAnalisis NVARCHAR(100) = NULL,
      @fiscalSolicitante NVARCHAR(150) = NULL,
      @oficioSolicitud NVARCHAR(50) = NULL,
      @urgencia NVARCHAR(20) = NULL,
      @fechaLimite DATE = NULL,
      @tipoDelito NVARCHAR(100) = NULL,
      @lugarHecho NVARCHAR(255) = NULL,
      @fechaHecho DATE = NULL,
      @descripcionCaso NVARCHAR(MAX) = NULL,
      @observaciones NVARCHAR(MAX) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM expediente WHERE numero_expediente = @numeroExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El número de expediente ya existe' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuarioRegistro AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Usuario de registro no encontrado o inactivo' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idTecnicoAsignado AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Técnico asignado no encontrado o inactivo' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF @idSupervisor IS NOT NULL AND NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idSupervisor AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Supervisor no encontrado o inactivo' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM fiscalia WHERE id_fiscalia = @idFiscalia AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Fiscalía no encontrada o inactiva' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM unidad WHERE id_unidad = @idUnidad AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Unidad no encontrada o inactiva' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM estados WHERE id_estado = @idEstado AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Estado no encontrado' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @idExpediente INT;
        INSERT INTO expediente (numero_expediente, numero_caso_mp, fecha_registro, id_usuario_registro, id_tecnico_asignado, id_supervisor, id_fiscalia, id_unidad, id_estado, tipo_analisis, fiscal_solicitante, oficio_solicitud, urgencia, fecha_limite, tipo_delito, lugar_hecho, fecha_hecho, descripcion_caso, observaciones, created_at, updated_at)
        VALUES (@numeroExpediente, @numeroCasoMp, GETDATE(), @idUsuarioRegistro, @idTecnicoAsignado, @idSupervisor, @idFiscalia, @idUnidad, @idEstado, @tipoAnalisis, @fiscalSolicitante, @oficioSolicitud, @urgencia, @fechaLimite, @tipoDelito, @lugarHecho, @fechaHecho, @descripcionCaso, @observaciones, GETDATE(), GETDATE());
        SET @idExpediente = SCOPE_IDENTITY();
        SELECT 1 AS resultado, 'Expediente creado exitosamente' AS mensaje, @idExpediente AS id_expediente;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_expediente;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_expedientes', `CREATE PROCEDURE pr_listar_expedientes
      @pagina INT = 1,
      @limite INT = 10,
      @busqueda NVARCHAR(100) = NULL,
      @idUsuario INT = NULL,
      @rolUsuario NVARCHAR(50) = NULL,
      @idEstado INT = NULL,
      @idUnidad INT = NULL,
      @idFiscalia INT = NULL,
      @soloActivos BIT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        DECLARE @offset INT = (@pagina - 1) * @limite;
        DECLARE @total INT;
        SELECT @total = COUNT(*)
        FROM expediente e
        INNER JOIN usuarios u_registro ON e.id_usuario_registro = u_registro.id_usuario
        INNER JOIN usuarios u_tecnico ON e.id_tecnico_asignado = u_tecnico.id_usuario
        LEFT JOIN usuarios u_supervisor ON e.id_supervisor = u_supervisor.id_usuario
        INNER JOIN fiscalia f ON e.id_fiscalia = f.id_fiscalia
        INNER JOIN unidad un ON e.id_unidad = un.id_unidad
        INNER JOIN estados est ON e.id_estado = est.id_estado
        WHERE e.deleted_at IS NULL
          AND (@busqueda IS NULL OR e.numero_expediente LIKE '%' + @busqueda + '%' OR e.numero_caso_mp LIKE '%' + @busqueda + '%' OR e.descripcion_caso LIKE '%' + @busqueda + '%')
          AND (@idEstado IS NULL OR e.id_estado = @idEstado)
          AND (@idUnidad IS NULL OR e.id_unidad = @idUnidad)
          AND (@idFiscalia IS NULL OR e.id_fiscalia = @idFiscalia)
          AND (@rolUsuario IS NULL OR @rolUsuario = 'ADMIN'
              OR (@rolUsuario = 'SUPERVISOR' AND e.id_tecnico_asignado IN (SELECT id_tecnico FROM supervisor_tecnico WHERE id_supervisor = @idUsuario AND deleted_at IS NULL))
              OR (@rolUsuario = 'TECNICO' AND e.id_tecnico_asignado = @idUsuario));

        DECLARE @expedientes NVARCHAR(MAX);
        SELECT @expedientes = (
          SELECT
            e.id_expediente,
            e.numero_expediente,
            e.numero_caso_mp,
            e.fecha_registro,
            e.id_usuario_registro,
            u_registro.nombre AS usuario_registro_nombre,
            u_registro.apellido AS usuario_registro_apellido,
            e.id_tecnico_asignado,
            u_tecnico.nombre AS tecnico_nombre,
            u_tecnico.apellido AS tecnico_apellido,
            e.id_supervisor,
            u_supervisor.nombre AS supervisor_nombre,
            u_supervisor.apellido AS supervisor_apellido,
            e.id_fiscalia,
            f.nombre AS fiscalia_nombre,
            f.codigo AS fiscalia_codigo,
            e.id_unidad,
            un.nombre_unidad,
            un.codigo_unidad,
            e.id_estado,
            est.nombre_estado,
            est.color AS estado_color,
            e.tipo_analisis,
            e.fiscal_solicitante,
            e.oficio_solicitud,
            e.urgencia,
            e.fecha_limite,
            e.tipo_delito,
            e.lugar_hecho,
            e.fecha_hecho,
            e.descripcion_caso,
            e.fecha_inicio_analisis,
            e.fecha_entrega_dictamen,
            e.observaciones,
            e.created_at,
            e.updated_at,
            (SELECT COUNT(*) FROM indicio WHERE id_expediente = e.id_expediente AND deleted_at IS NULL) AS total_indicios
          FROM expediente e
          INNER JOIN usuarios u_registro ON e.id_usuario_registro = u_registro.id_usuario
          INNER JOIN usuarios u_tecnico ON e.id_tecnico_asignado = u_tecnico.id_usuario
          LEFT JOIN usuarios u_supervisor ON e.id_supervisor = u_supervisor.id_usuario
          INNER JOIN fiscalia f ON e.id_fiscalia = f.id_fiscalia
          INNER JOIN unidad un ON e.id_unidad = un.id_unidad
          INNER JOIN estados est ON e.id_estado = est.id_estado
          WHERE e.deleted_at IS NULL
            AND (@busqueda IS NULL OR e.numero_expediente LIKE '%' + @busqueda + '%' OR e.numero_caso_mp LIKE '%' + @busqueda + '%' OR e.descripcion_caso LIKE '%' + @busqueda + '%')
            AND (@idEstado IS NULL OR e.id_estado = @idEstado)
            AND (@idUnidad IS NULL OR e.id_unidad = @idUnidad)
            AND (@idFiscalia IS NULL OR e.id_fiscalia = @idFiscalia)
            AND (@rolUsuario IS NULL OR @rolUsuario = 'ADMIN'
                OR (@rolUsuario = 'SUPERVISOR' AND e.id_tecnico_asignado IN (SELECT id_tecnico FROM supervisor_tecnico WHERE id_supervisor = @idUsuario AND deleted_at IS NULL))
                OR (@rolUsuario = 'TECNICO' AND e.id_tecnico_asignado = @idUsuario))
          ORDER BY e.created_at DESC
          OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
          FOR JSON PATH
        );

        SELECT 1 AS resultado, 'Expedientes obtenidos correctamente' AS mensaje, @total AS total, @pagina AS pagina, @limite AS limite, CEILING(CAST(@total AS FLOAT) / @limite) AS total_paginas, ISNULL(@expedientes, '[]') AS expedientes;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, 0 AS total, 0 AS pagina, 0 AS limite, 0 AS total_paginas, NULL AS expedientes;
      END CATCH
    END;
  `);

  await createProcedure('pr_obtener_expediente', `CREATE PROCEDURE pr_obtener_expediente
      @idExpediente INT,
      @idUsuario INT = NULL,
      @rolUsuario NVARCHAR(50) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje;
          RETURN;
        END
        IF @rolUsuario = 'TECNICO' AND NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND id_tecnico_asignado = @idUsuario AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'No tienes permiso para ver este expediente' AS mensaje;
          RETURN;
        END
        SELECT
          1 AS resultado,
          'Expediente obtenido correctamente' AS mensaje,
          e.id_expediente,
          e.numero_expediente,
          e.numero_caso_mp,
          e.fecha_registro,
          e.id_usuario_registro,
          u_registro.nombre AS usuario_registro_nombre,
          u_registro.apellido AS usuario_registro_apellido,
          u_registro.email AS usuario_registro_email,
          e.id_tecnico_asignado,
          u_tecnico.nombre AS tecnico_nombre,
          u_tecnico.apellido AS tecnico_apellido,
          u_tecnico.email AS tecnico_email,
          e.id_supervisor,
          u_supervisor.nombre AS supervisor_nombre,
          u_supervisor.apellido AS supervisor_apellido,
          u_supervisor.email AS supervisor_email,
          e.id_fiscalia,
          f.nombre AS fiscalia_nombre,
          f.codigo AS fiscalia_codigo,
          f.direccion AS fiscalia_direccion,
          f.telefono AS fiscalia_telefono,
          e.id_unidad,
          un.nombre_unidad,
          un.codigo_unidad,
          un.especialidad,
          e.id_estado,
          est.nombre_estado,
          est.descripcion AS estado_descripcion,
          est.color AS estado_color,
          e.id_departamento,
          dep.nombre AS departamento_nombre,
          e.id_municipio,
          mun.nombre AS municipio_nombre,
          e.tipo_analisis,
          e.fiscal_solicitante,
          e.oficio_solicitud,
          e.urgencia,
          e.fecha_limite,
          e.tipo_delito,
          e.lugar_hecho,
          e.fecha_hecho,
          e.descripcion_caso,
          e.fecha_inicio_analisis,
          e.fecha_entrega_dictamen,
          e.observaciones,
          e.created_at,
          e.updated_at
        FROM expediente e
        INNER JOIN usuarios u_registro ON e.id_usuario_registro = u_registro.id_usuario
        INNER JOIN usuarios u_tecnico ON e.id_tecnico_asignado = u_tecnico.id_usuario
        LEFT JOIN usuarios u_supervisor ON e.id_supervisor = u_supervisor.id_usuario
        INNER JOIN fiscalia f ON e.id_fiscalia = f.id_fiscalia
        INNER JOIN unidad un ON e.id_unidad = un.id_unidad
        INNER JOIN estados est ON e.id_estado = est.id_estado
        LEFT JOIN departamento dep ON e.id_departamento = dep.id_departamento
        LEFT JOIN municipio mun ON e.id_municipio = mun.id_municipio
        WHERE e.id_expediente = @idExpediente AND e.deleted_at IS NULL;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_actualizar_expediente', `CREATE PROCEDURE pr_actualizar_expediente
      @idExpediente INT,
      @numeroExpediente NVARCHAR(50),
      @numeroCasoMp NVARCHAR(50) = NULL,
      @idTecnicoAsignado INT,
      @idSupervisor INT = NULL,
      @idFiscalia INT,
      @idUnidad INT,
      @idEstado INT,
      @idDepartamento INT = NULL,
      @idMunicipio INT = NULL,
      @tipoAnalisis NVARCHAR(100) = NULL,
      @fiscalSolicitante NVARCHAR(150) = NULL,
      @oficioSolicitud NVARCHAR(50) = NULL,
      @urgencia NVARCHAR(20) = NULL,
      @fechaLimite DATE = NULL,
      @tipoDelito NVARCHAR(100) = NULL,
      @lugarHecho NVARCHAR(255) = NULL,
      @fechaHecho DATE = NULL,
      @descripcionCaso NVARCHAR(MAX) = NULL,
      @observaciones NVARCHAR(MAX) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM expediente WHERE numero_expediente = @numeroExpediente AND id_expediente != @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El número de expediente ya existe' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE expediente SET
          numero_expediente = @numeroExpediente,
          numero_caso_mp = @numeroCasoMp,
          id_tecnico_asignado = @idTecnicoAsignado,
          id_supervisor = @idSupervisor,
          id_fiscalia = @idFiscalia,
          id_unidad = @idUnidad,
          id_estado = @idEstado,
          id_departamento = @idDepartamento,
          id_municipio = @idMunicipio,
          tipo_analisis = @tipoAnalisis,
          fiscal_solicitante = @fiscalSolicitante,
          oficio_solicitud = @oficioSolicitud,
          urgencia = @urgencia,
          fecha_limite = @fechaLimite,
          tipo_delito = @tipoDelito,
          lugar_hecho = @lugarHecho,
          fecha_hecho = @fechaHecho,
          descripcion_caso = @descripcionCaso,
          observaciones = @observaciones,
          updated_at = GETDATE()
        WHERE id_expediente = @idExpediente;
        SELECT 1 AS resultado, 'Expediente actualizado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_expediente', `CREATE PROCEDURE pr_eliminar_expediente
      @idExpediente INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE expediente SET deleted_at = GETDATE(), updated_at = GETDATE() WHERE id_expediente = @idExpediente;
        SELECT 1 AS resultado, 'Expediente eliminado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_aprobar_expediente', `CREATE PROCEDURE pr_aprobar_expediente
      @idExpediente INT,
      @idSupervisor INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @estadoAprobadoId INT;
        SELECT @estadoAprobadoId = id_estado FROM estados WHERE nombre_estado = 'Aprobado' AND deleted_at IS NULL;
        IF @estadoAprobadoId IS NULL
        BEGIN
          SELECT 0 AS resultado, 'Estado Aprobado no encontrado en el sistema' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE expediente SET
          id_estado = @estadoAprobadoId,
          id_supervisor = @idSupervisor,
          updated_at = GETDATE()
        WHERE id_expediente = @idExpediente;
        SELECT 1 AS resultado, 'Expediente aprobado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_rechazar_expediente', `CREATE PROCEDURE pr_rechazar_expediente
      @idExpediente INT,
      @idSupervisor INT,
      @motivoRechazo NVARCHAR(MAX)
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje, NULL AS tecnico_email, NULL AS tecnico_nombre, NULL AS numero_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @estadoRechazadoId INT;
        SELECT @estadoRechazadoId = id_estado FROM estados WHERE nombre_estado = 'Rechazado' AND deleted_at IS NULL;
        IF @estadoRechazadoId IS NULL
        BEGIN
          SELECT 0 AS resultado, 'Estado Rechazado no encontrado en el sistema' AS mensaje, NULL AS tecnico_email, NULL AS tecnico_nombre, NULL AS numero_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @tecnicoEmail NVARCHAR(100);
        DECLARE @tecnicoNombre NVARCHAR(100);
        DECLARE @tecnicoApellido NVARCHAR(100);
        DECLARE @numeroExpediente NVARCHAR(50);
        SELECT
          @tecnicoEmail = u.email,
          @tecnicoNombre = u.nombre,
          @tecnicoApellido = u.apellido,
          @numeroExpediente = e.numero_expediente
        FROM expediente e
        INNER JOIN usuarios u ON e.id_tecnico_asignado = u.id_usuario
        WHERE e.id_expediente = @idExpediente;
        UPDATE expediente SET
          id_estado = @estadoRechazadoId,
          id_supervisor = @idSupervisor,
          observaciones = CAST(ISNULL(CAST(observaciones AS NVARCHAR(MAX)), N'') + CHAR(13) + CHAR(10) + N'=== RECHAZO ===' + CHAR(13) + CHAR(10) + N'Fecha: ' + CONVERT(NVARCHAR(30), GETDATE(), 120) + CHAR(13) + CHAR(10) + N'Motivo: ' + @motivoRechazo AS NVARCHAR(MAX)),
          updated_at = GETDATE()
        WHERE id_expediente = @idExpediente;
        SELECT 1 AS resultado, 'Expediente rechazado exitosamente' AS mensaje, @tecnicoEmail AS tecnico_email, (@tecnicoNombre + ' ' + @tecnicoApellido) AS tecnico_nombre, @numeroExpediente AS numero_expediente, @motivoRechazo AS motivo_rechazo;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS tecnico_email, NULL AS tecnico_nombre, NULL AS numero_expediente;
      END CATCH
    END;
  `);

  console.log('Created expediente procedures');

  // Procedimientos de indicios
  await createProcedure('pr_crear_indicio', `CREATE PROCEDURE pr_crear_indicio
      @idExpediente INT,
      @numeroIndicio NVARCHAR(50),
      @descripcion NVARCHAR(MAX),
      @tipoObjeto NVARCHAR(100) = NULL,
      @color NVARCHAR(50) = NULL,
      @tamanio NVARCHAR(100) = NULL,
      @peso DECIMAL(10, 2) = NULL,
      @pesoUnidad NVARCHAR(20) = NULL,
      @ubicacionHallazgo NVARCHAR(255) = NULL,
      @idTecnicoRegistro INT,
      @idEstadoIndicio INT,
      @observaciones NVARCHAR(MAX) = NULL,
      @cantidad INT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM expediente WHERE id_expediente = @idExpediente AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Expediente no encontrado' AS mensaje, NULL AS id_indicio;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF EXISTS (SELECT 1 FROM indicio WHERE id_expediente = @idExpediente AND numero_indicio = @numeroIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El número de indicio ya existe en este expediente' AS mensaje, NULL AS id_indicio;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idTecnicoRegistro AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Técnico de registro no encontrado o inactivo' AS mensaje, NULL AS id_indicio;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        IF NOT EXISTS (SELECT 1 FROM estado_indicio WHERE id_estado_indicio = @idEstadoIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Estado de indicio no encontrado' AS mensaje, NULL AS id_indicio;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @idIndicio INT;
        INSERT INTO indicio (id_expediente, numero_indicio, descripcion, tipo_objeto, color, tamanio, peso, peso_unidad, ubicacion_hallazgo, id_tecnico_registro, fecha_registro, id_estado_indicio, observaciones, cantidad, created_at, updated_at)
        VALUES (@idExpediente, @numeroIndicio, @descripcion, @tipoObjeto, @color, @tamanio, @peso, @pesoUnidad, @ubicacionHallazgo, @idTecnicoRegistro, GETDATE(), @idEstadoIndicio, @observaciones, @cantidad, GETDATE(), GETDATE());
        SET @idIndicio = SCOPE_IDENTITY();
        SELECT 1 AS resultado, 'Indicio creado exitosamente' AS mensaje, @idIndicio AS id_indicio;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_indicio;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_indicios', `CREATE PROCEDURE pr_listar_indicios
      @pagina INT = 1,
      @limite INT = 10,
      @busqueda NVARCHAR(100) = NULL,
      @idExpediente INT = NULL,
      @idEstadoIndicio INT = NULL,
      @idUsuario INT = NULL,
      @rolUsuario NVARCHAR(50) = NULL,
      @soloActivos BIT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        DECLARE @offset INT = (@pagina - 1) * @limite;
        DECLARE @total INT;
        SELECT @total = COUNT(*)
        FROM indicio i
        INNER JOIN expediente e ON i.id_expediente = e.id_expediente
        INNER JOIN usuarios u_tecnico ON i.id_tecnico_registro = u_tecnico.id_usuario
        INNER JOIN estado_indicio ei ON i.id_estado_indicio = ei.id_estado_indicio
        WHERE i.deleted_at IS NULL
          AND (@busqueda IS NULL OR i.numero_indicio LIKE '%' + @busqueda + '%' OR i.descripcion LIKE '%' + @busqueda + '%' OR i.tipo_objeto LIKE '%' + @busqueda + '%')
          AND (@idExpediente IS NULL OR i.id_expediente = @idExpediente)
          AND (@idEstadoIndicio IS NULL OR i.id_estado_indicio = @idEstadoIndicio)
          AND (@rolUsuario IS NULL OR @rolUsuario = 'ADMIN' OR @rolUsuario = 'SUPERVISOR' OR (@rolUsuario = 'TECNICO' AND e.id_tecnico_asignado = @idUsuario));

        DECLARE @indicios NVARCHAR(MAX);
        SELECT @indicios = (
          SELECT
            i.id_indicio,
            i.id_expediente,
            e.numero_expediente,
            i.numero_indicio,
            i.descripcion,
            i.tipo_objeto,
            i.color,
            i.tamanio,
            i.peso,
            i.peso_unidad,
            i.ubicacion_hallazgo,
            i.id_tecnico_registro,
            u_tecnico.nombre AS tecnico_nombre,
            u_tecnico.apellido AS tecnico_apellido,
            i.fecha_registro,
            i.id_estado_indicio,
            ei.nombre AS estado_nombre,
            ei.descripcion AS estado_descripcion,
            i.observaciones,
            i.cantidad,
            i.created_at,
            i.updated_at
          FROM indicio i
          INNER JOIN expediente e ON i.id_expediente = e.id_expediente
          INNER JOIN usuarios u_tecnico ON i.id_tecnico_registro = u_tecnico.id_usuario
          INNER JOIN estado_indicio ei ON i.id_estado_indicio = ei.id_estado_indicio
          WHERE i.deleted_at IS NULL
            AND (@busqueda IS NULL OR i.numero_indicio LIKE '%' + @busqueda + '%' OR i.descripcion LIKE '%' + @busqueda + '%' OR i.tipo_objeto LIKE '%' + @busqueda + '%')
            AND (@idExpediente IS NULL OR i.id_expediente = @idExpediente)
            AND (@idEstadoIndicio IS NULL OR i.id_estado_indicio = @idEstadoIndicio)
            AND (@rolUsuario IS NULL OR @rolUsuario = 'ADMIN' OR @rolUsuario = 'SUPERVISOR' OR (@rolUsuario = 'TECNICO' AND e.id_tecnico_asignado = @idUsuario))
          ORDER BY i.created_at DESC
          OFFSET @offset ROWS FETCH NEXT @limite ROWS ONLY
          FOR JSON PATH
        );

        SELECT 1 AS resultado, 'Indicios obtenidos correctamente' AS mensaje, @total AS total, @pagina AS pagina, @limite AS limite, CEILING(CAST(@total AS FLOAT) / @limite) AS total_paginas, ISNULL(@indicios, '[]') AS indicios;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, 0 AS total, 0 AS pagina, 0 AS limite, 0 AS total_paginas, NULL AS indicios;
      END CATCH
    END;
  `);

  await createProcedure('pr_obtener_indicio', `CREATE PROCEDURE pr_obtener_indicio
      @idIndicio INT,
      @idUsuario INT = NULL,
      @rolUsuario NVARCHAR(50) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM indicio WHERE id_indicio = @idIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Indicio no encontrado' AS mensaje;
          RETURN;
        END
        IF @rolUsuario = 'TECNICO' AND NOT EXISTS (
          SELECT 1 FROM indicio i
          INNER JOIN expediente e ON i.id_expediente = e.id_expediente
          WHERE i.id_indicio = @idIndicio AND e.id_tecnico_asignado = @idUsuario AND i.deleted_at IS NULL
        )
        BEGIN
          SELECT 0 AS resultado, 'No tienes permiso para ver este indicio' AS mensaje;
          RETURN;
        END
        SELECT
          1 AS resultado,
          'Indicio obtenido correctamente' AS mensaje,
          i.id_indicio,
          i.id_expediente,
          e.numero_expediente,
          e.numero_caso_mp,
          i.numero_indicio,
          i.descripcion,
          i.tipo_objeto,
          i.color,
          i.tamanio,
          i.peso,
          i.peso_unidad,
          i.ubicacion_hallazgo,
          i.id_tecnico_registro,
          u_tecnico.nombre AS tecnico_nombre,
          u_tecnico.apellido AS tecnico_apellido,
          u_tecnico.email AS tecnico_email,
          i.fecha_registro,
          i.id_estado_indicio,
          ei.nombre AS estado_nombre,
          ei.descripcion AS estado_descripcion,
          i.observaciones,
          i.cantidad,
          i.created_at,
          i.updated_at
        FROM indicio i
        INNER JOIN expediente e ON i.id_expediente = e.id_expediente
        INNER JOIN usuarios u_tecnico ON i.id_tecnico_registro = u_tecnico.id_usuario
        INNER JOIN estado_indicio ei ON i.id_estado_indicio = ei.id_estado_indicio
        WHERE i.id_indicio = @idIndicio AND i.deleted_at IS NULL;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_actualizar_indicio', `CREATE PROCEDURE pr_actualizar_indicio
      @idIndicio INT,
      @numeroIndicio NVARCHAR(50),
      @descripcion NVARCHAR(MAX),
      @tipoObjeto NVARCHAR(100) = NULL,
      @color NVARCHAR(50) = NULL,
      @tamanio NVARCHAR(100) = NULL,
      @peso DECIMAL(10, 2) = NULL,
      @pesoUnidad NVARCHAR(20) = NULL,
      @ubicacionHallazgo NVARCHAR(255) = NULL,
      @idEstadoIndicio INT,
      @observaciones NVARCHAR(MAX) = NULL,
      @cantidad INT = 1
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM indicio WHERE id_indicio = @idIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Indicio no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        DECLARE @idExpediente INT;
        SELECT @idExpediente = id_expediente FROM indicio WHERE id_indicio = @idIndicio;
        IF EXISTS (SELECT 1 FROM indicio WHERE id_expediente = @idExpediente AND numero_indicio = @numeroIndicio AND id_indicio != @idIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'El número de indicio ya existe en este expediente' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE indicio SET
          numero_indicio = @numeroIndicio,
          descripcion = @descripcion,
          tipo_objeto = @tipoObjeto,
          color = @color,
          tamanio = @tamanio,
          peso = @peso,
          peso_unidad = @pesoUnidad,
          ubicacion_hallazgo = @ubicacionHallazgo,
          id_estado_indicio = @idEstadoIndicio,
          observaciones = @observaciones,
          cantidad = @cantidad,
          updated_at = GETDATE()
        WHERE id_indicio = @idIndicio;
        SELECT 1 AS resultado, 'Indicio actualizado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_indicio', `CREATE PROCEDURE pr_eliminar_indicio
      @idIndicio INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM indicio WHERE id_indicio = @idIndicio AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Indicio no encontrado' AS mensaje;
          ROLLBACK TRANSACTION;
          RETURN;
        END
        UPDATE indicio SET deleted_at = GETDATE(), updated_at = GETDATE() WHERE id_indicio = @idIndicio;
        SELECT 1 AS resultado, 'Indicio eliminado exitosamente' AS mensaje;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  console.log('Created indicio procedures');

  // Procedimientos de catálogos
  await createProcedure('pr_listar_estados_expediente', `CREATE PROCEDURE pr_listar_estados_expediente
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Estados obtenidos correctamente' AS mensaje,
          (SELECT id_estado AS id, nombre_estado AS nombre, descripcion, color, orden
           FROM estados
           WHERE deleted_at IS NULL
           ORDER BY orden
           FOR JSON PATH) AS estados;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS estados;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_estados_indicio', `CREATE PROCEDURE pr_listar_estados_indicio
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Estados de indicio obtenidos correctamente' AS mensaje,
          (SELECT id_estado_indicio AS id, nombre, descripcion
           FROM estado_indicio
           WHERE deleted_at IS NULL
           ORDER BY nombre
           FOR JSON PATH) AS estados;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS estados;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_unidades', `CREATE PROCEDURE pr_listar_unidades
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Unidades obtenidas correctamente' AS mensaje,
          (SELECT id_unidad AS id, nombre_unidad AS nombre, codigo_unidad AS codigo, especialidad
           FROM unidad
           WHERE deleted_at IS NULL AND activo = 1
           ORDER BY nombre_unidad
           FOR JSON PATH) AS unidades;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS unidades;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_fiscalias', `CREATE PROCEDURE pr_listar_fiscalias
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Fiscalías obtenidas correctamente' AS mensaje,
          (SELECT id_fiscalia AS id, nombre, codigo, direccion, departamento, municipio
           FROM fiscalia
           WHERE deleted_at IS NULL AND activo = 1
           ORDER BY nombre
           FOR JSON PATH) AS fiscalias;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS fiscalias;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_tecnicos', `CREATE PROCEDURE pr_listar_tecnicos
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Técnicos obtenidos correctamente' AS mensaje,
          (SELECT u.id_usuario, u.nombre, u.apellido, u.email
           FROM usuarios u
           INNER JOIN rol r ON u.id_rol = r.id_rol
           WHERE u.deleted_at IS NULL AND u.activo = 1 AND r.nombre_rol IN ('TECNICO', 'ADMIN', 'SUPERVISOR')
           ORDER BY u.nombre, u.apellido
           FOR JSON PATH) AS tecnicos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS tecnicos;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_departamentos', `CREATE PROCEDURE pr_listar_departamentos
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Departamentos obtenidos correctamente' AS mensaje,
          (SELECT id_departamento AS id, nombre, codigo
           FROM departamento
           ORDER BY nombre
           FOR JSON PATH) AS departamentos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS departamentos;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_municipios_por_departamento', `CREATE PROCEDURE pr_listar_municipios_por_departamento
    @idDepartamento INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF @idDepartamento IS NULL
        BEGIN
          SELECT 0 AS resultado, 'El ID del departamento es requerido' AS mensaje, NULL AS municipios;
          RETURN;
        END

        SELECT 1 AS resultado, 'Municipios obtenidos correctamente' AS mensaje,
          (SELECT id_municipio AS id, nombre, codigo, id_departamento AS idDepartamento
           FROM municipio
           WHERE id_departamento = @idDepartamento
           ORDER BY nombre
           FOR JSON PATH) AS municipios;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS municipios;
      END CATCH
    END;
  `);

  console.log('Created catalog procedures');

  // Procedimiento para crear expediente con indicios
  await createProcedure('pr_crear_expediente_con_indicios', `CREATE PROCEDURE pr_crear_expediente_con_indicios
      @numeroCasoMp NVARCHAR(50) = NULL,
      @idUsuarioRegistro INT,
      @idTecnicoAsignado INT = NULL,
      @idFiscalia INT = NULL,
      @idUnidad INT = NULL,
      @idEstado INT = NULL,
      @urgencia NVARCHAR(20) = 'ordinario',
      @tipoDelito NVARCHAR(100) = NULL,
      @observaciones NVARCHAR(MAX) = NULL,
      @indiciosJson NVARCHAR(MAX) = NULL
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        BEGIN TRANSACTION;

        -- Generar número de expediente automáticamente
        DECLARE @year NVARCHAR(4) = CAST(YEAR(GETDATE()) AS NVARCHAR(4));
        DECLARE @secuencia INT;
        SELECT @secuencia = ISNULL(MAX(CAST(RIGHT(numero_expediente, 4) AS INT)), 0) + 1
        FROM expediente
        WHERE numero_expediente LIKE 'EXP-' + @year + '-%';
        DECLARE @numeroExpediente NVARCHAR(50) = 'EXP-' + @year + '-' + RIGHT('0000' + CAST(@secuencia AS NVARCHAR(4)), 4);

        -- Validaciones
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE id_usuario = @idUsuarioRegistro AND deleted_at IS NULL AND activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Usuario de registro no encontrado o inactivo' AS mensaje, NULL AS id_expediente;
          ROLLBACK TRANSACTION;
          RETURN;
        END

        -- Si no se especifica técnico, usar el usuario de registro
        IF @idTecnicoAsignado IS NULL SET @idTecnicoAsignado = @idUsuarioRegistro;

        -- Si no se especifica estado, usar "Pendiente de Revisión" (para técnicos que crean expedientes)
        IF @idEstado IS NULL
        BEGIN
          SELECT TOP 1 @idEstado = id_estado FROM estados WHERE nombre_estado = N'Pendiente de Revisión' AND deleted_at IS NULL;
          IF @idEstado IS NULL
            SELECT TOP 1 @idEstado = id_estado FROM estados WHERE deleted_at IS NULL ORDER BY orden;
        END

        -- Crear expediente
        DECLARE @idExpediente INT;
        INSERT INTO expediente (numero_expediente, numero_caso_mp, fecha_registro, id_usuario_registro, id_tecnico_asignado, id_fiscalia, id_unidad, id_estado, urgencia, tipo_delito, observaciones, created_at, updated_at)
        VALUES (@numeroExpediente, @numeroCasoMp, GETDATE(), @idUsuarioRegistro, @idTecnicoAsignado, @idFiscalia, @idUnidad, @idEstado, @urgencia, @tipoDelito, @observaciones, GETDATE(), GETDATE());
        SET @idExpediente = SCOPE_IDENTITY();

        -- Crear indicios si se proporcionaron
        DECLARE @indiciosCreados NVARCHAR(MAX) = '[]';
        IF @indiciosJson IS NOT NULL AND @indiciosJson != '[]'
        BEGIN
          DECLARE @estadoIndicioDefault INT;
          SELECT TOP 1 @estadoIndicioDefault = id_estado_indicio FROM estado_indicio WHERE deleted_at IS NULL ORDER BY id_estado_indicio;

          -- Tabla temporal para capturar IDs insertados
          DECLARE @insertedIndicios TABLE (id_indicio INT, numero_indicio NVARCHAR(20));

          INSERT INTO indicio (id_expediente, numero_indicio, descripcion, tipo_objeto, color, tamanio, peso, peso_unidad, ubicacion_hallazgo, id_tecnico_registro, fecha_registro, id_estado_indicio, observaciones, cantidad, created_at, updated_at)
          OUTPUT INSERTED.id_indicio, INSERTED.numero_indicio INTO @insertedIndicios
          SELECT
            @idExpediente,
            'IND-' + RIGHT('000' + CAST(ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS NVARCHAR(3)), 3),
            JSON_VALUE(value, '$.descripcion'),
            JSON_VALUE(value, '$.tipoObjeto'),
            JSON_VALUE(value, '$.color'),
            JSON_VALUE(value, '$.tamanio'),
            CASE WHEN JSON_VALUE(value, '$.peso') IS NOT NULL THEN CAST(JSON_VALUE(value, '$.peso') AS DECIMAL(10,2)) ELSE NULL END,
            JSON_VALUE(value, '$.pesoUnidad'),
            JSON_VALUE(value, '$.ubicacionHallazgo'),
            @idUsuarioRegistro,
            GETDATE(),
            ISNULL(CAST(JSON_VALUE(value, '$.idEstadoIndicio') AS INT), @estadoIndicioDefault),
            JSON_VALUE(value, '$.observaciones'),
            ISNULL(CAST(JSON_VALUE(value, '$.cantidad') AS INT), 1),
            GETDATE(),
            GETDATE()
          FROM OPENJSON(@indiciosJson);

          SELECT @indiciosCreados = (SELECT id_indicio AS idIndicio, numero_indicio AS numeroIndicio FROM @insertedIndicios FOR JSON PATH);
        END

        SELECT 1 AS resultado, 'Expediente creado exitosamente' AS mensaje, @idExpediente AS id_expediente, @numeroExpediente AS numero_expediente, ISNULL(@indiciosCreados, '[]') AS indicios_creados;
        COMMIT TRANSACTION;
      END TRY
      BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS id_expediente, NULL AS numero_expediente;
      END CATCH
    END;
  `);

  console.log('Created expediente con indicios procedure');

  // Procedimientos para asignación supervisor-técnico
  await createProcedure('pr_listar_supervisores', `CREATE PROCEDURE pr_listar_supervisores
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Supervisores obtenidos' AS mensaje,
          (SELECT u.id_usuario, u.nombre, u.apellido, u.email
           FROM usuarios u
           INNER JOIN rol r ON u.id_rol = r.id_rol
           WHERE u.deleted_at IS NULL AND u.activo = 1 AND r.nombre_rol = 'SUPERVISOR'
           ORDER BY u.nombre, u.apellido
           FOR JSON PATH) AS supervisores;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS supervisores;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_tecnicos_sin_supervisor', `CREATE PROCEDURE pr_listar_tecnicos_sin_supervisor
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Técnicos obtenidos' AS mensaje,
          (SELECT u.id_usuario, u.nombre, u.apellido, u.email
           FROM usuarios u
           INNER JOIN rol r ON u.id_rol = r.id_rol
           LEFT JOIN supervisor_tecnico st ON u.id_usuario = st.id_tecnico AND st.deleted_at IS NULL
           WHERE u.deleted_at IS NULL AND u.activo = 1 AND r.nombre_rol = 'TECNICO' AND st.id_asignacion IS NULL
           ORDER BY u.nombre, u.apellido
           FOR JSON PATH) AS tecnicos;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS tecnicos;
      END CATCH
    END;
  `);

  await createProcedure('pr_listar_asignaciones_supervisor', `CREATE PROCEDURE pr_listar_asignaciones_supervisor
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        SELECT 1 AS resultado, 'Asignaciones obtenidas' AS mensaje,
          (SELECT st.id_asignacion,
                  st.id_supervisor,
                  sup.nombre AS supervisor_nombre,
                  sup.apellido AS supervisor_apellido,
                  st.id_tecnico,
                  tec.nombre AS tecnico_nombre,
                  tec.apellido AS tecnico_apellido,
                  st.created_at AS fecha_asignacion
           FROM supervisor_tecnico st
           INNER JOIN usuarios sup ON st.id_supervisor = sup.id_usuario
           INNER JOIN usuarios tec ON st.id_tecnico = tec.id_usuario
           WHERE st.deleted_at IS NULL
           ORDER BY sup.nombre, tec.nombre
           FOR JSON PATH) AS asignaciones;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje, NULL AS asignaciones;
      END CATCH
    END;
  `);

  await createProcedure('pr_asignar_supervisor_tecnico', `CREATE PROCEDURE pr_asignar_supervisor_tecnico
      @idSupervisor INT,
      @idTecnico INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        -- Validar supervisor
        IF NOT EXISTS (SELECT 1 FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol
                       WHERE u.id_usuario = @idSupervisor AND r.nombre_rol = 'SUPERVISOR' AND u.deleted_at IS NULL AND u.activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Supervisor no válido' AS mensaje;
          RETURN;
        END

        -- Validar técnico
        IF NOT EXISTS (SELECT 1 FROM usuarios u INNER JOIN rol r ON u.id_rol = r.id_rol
                       WHERE u.id_usuario = @idTecnico AND r.nombre_rol = 'TECNICO' AND u.deleted_at IS NULL AND u.activo = 1)
        BEGIN
          SELECT 0 AS resultado, 'Técnico no válido' AS mensaje;
          RETURN;
        END

        -- Verificar si el técnico ya tiene supervisor (actualizar o insertar)
        IF EXISTS (SELECT 1 FROM supervisor_tecnico WHERE id_tecnico = @idTecnico AND deleted_at IS NULL)
        BEGIN
          UPDATE supervisor_tecnico SET id_supervisor = @idSupervisor, updated_at = GETDATE() WHERE id_tecnico = @idTecnico AND deleted_at IS NULL;
          SELECT 1 AS resultado, 'Supervisor actualizado correctamente' AS mensaje;
        END
        ELSE
        BEGIN
          INSERT INTO supervisor_tecnico (id_supervisor, id_tecnico, created_at, updated_at) VALUES (@idSupervisor, @idTecnico, GETDATE(), GETDATE());
          SELECT 1 AS resultado, 'Supervisor asignado correctamente' AS mensaje;
        END
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  await createProcedure('pr_eliminar_asignacion_supervisor', `CREATE PROCEDURE pr_eliminar_asignacion_supervisor
      @idAsignacion INT
    AS
    BEGIN
      SET NOCOUNT ON;
      BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM supervisor_tecnico WHERE id_asignacion = @idAsignacion AND deleted_at IS NULL)
        BEGIN
          SELECT 0 AS resultado, 'Asignación no encontrada' AS mensaje;
          RETURN;
        END

        UPDATE supervisor_tecnico SET deleted_at = GETDATE() WHERE id_asignacion = @idAsignacion;
        SELECT 1 AS resultado, 'Asignación eliminada correctamente' AS mensaje;
      END TRY
      BEGIN CATCH
        SELECT 0 AS resultado, ERROR_MESSAGE() AS mensaje;
      END CATCH
    END;
  `);

  console.log('Created supervisor-tecnico procedures');
  console.log('All stored procedures created successfully!');

  // Crear usuarios técnicos y supervisor de ejemplo
  const tecnicoRole = roles.find(r => r.nombreRol === 'TECNICO');
  const supervisorRole = roles.find(r => r.nombreRol === 'SUPERVISOR');

  if (tecnicoRole && supervisorRole) {
    const hashedPasswordTecnico = await bcrypt.hash('Tecnico123!', 10);
    const hashedPasswordSupervisor = await bcrypt.hash('Supervisor123!', 10);

    // Buscar o crear técnico 1
    let tecnico1 = await prisma.usuario.findFirst({
      where: { OR: [{ email: 'tecnico1@mp.gob.gt' }, { dpi: '1234567890101' }] }
    });
    if (!tecnico1) {
      tecnico1 = await prisma.usuario.create({
        data: {
          nombre: 'Carlos',
          apellido: 'Pérez',
          email: 'tecnico1@mp.gob.gt',
          password: hashedPasswordTecnico,
          dpi: '1234567890101',
          telefono: '12345678',
          activo: true,
          idRol: tecnicoRole.id,
          requiereCambioPassword: false
        }
      });
    }

    // Buscar o crear técnico 2
    let tecnico2 = await prisma.usuario.findFirst({
      where: { OR: [{ email: 'tecnico2@mp.gob.gt' }, { dpi: '1234567890102' }] }
    });
    if (!tecnico2) {
      tecnico2 = await prisma.usuario.create({
        data: {
          nombre: 'María',
          apellido: 'González',
          email: 'tecnico2@mp.gob.gt',
          password: hashedPasswordTecnico,
          dpi: '1234567890102',
          telefono: '87654321',
          activo: true,
          idRol: tecnicoRole.id,
          requiereCambioPassword: false
        }
      });
    }

    // Buscar o crear supervisor
    let supervisor = await prisma.usuario.findFirst({
      where: { OR: [{ email: 'supervisor@mp.gob.gt' }, { dpi: '1234567890103' }] }
    });
    if (!supervisor) {
      supervisor = await prisma.usuario.create({
        data: {
          nombre: 'Ana',
          apellido: 'Rodríguez',
          email: 'supervisor@mp.gob.gt',
          password: hashedPasswordSupervisor,
          dpi: '1234567890103',
          telefono: '11223344',
          activo: true,
          idRol: supervisorRole.id,
          requiereCambioPassword: false
        }
      });
    }

    console.log('Created sample users: tecnico1@mp.gob.gt, tecnico2@mp.gob.gt, supervisor@mp.gob.gt');

    // Crear expedientes de ejemplo
    const estadoPendiente = estados.find(e => e.nombreEstado === 'Pendiente de Revisión');
    const estadoAprobado = estados.find(e => e.nombreEstado === 'Aprobado');
    const estadoRechazado = estados.find(e => e.nombreEstado === 'Rechazado');
    const estadoIndicioPendiente = estadosIndicio.find(e => e.nombre === 'Pendiente de Revisión');

    if (estadoPendiente && estadoAprobado && estadoRechazado && estadoIndicioPendiente) {
      // Expediente 1 - Aprobado
      const expediente1 = await prisma.expediente.upsert({
        where: { numeroExpediente: 'EXP-2025-001' },
        update: {},
        create: {
          numeroExpediente: 'EXP-2025-001',
          numeroCasoMp: 'MP-001-2025-12345',
          fechaRegistro: new Date('2025-01-10'),
          idUsuarioRegistro: tecnico1.id,
          idTecnicoAsignado: tecnico1.id,
          idSupervisor: supervisor.id,
          idFiscalia: fiscalias[0].id,
          idUnidad: unidades[0].id,
          idEstado: estadoAprobado.id,
          urgencia: 'urgente',
          tipoDelito: 'Homicidio',
          observaciones: 'Expediente aprobado'
        }
      });

      // Expediente 2 - Pendiente de revisión
      const expediente2 = await prisma.expediente.upsert({
        where: { numeroExpediente: 'EXP-2025-002' },
        update: {},
        create: {
          numeroExpediente: 'EXP-2025-002',
          numeroCasoMp: 'MP-001-2025-12346',
          fechaRegistro: new Date('2025-01-12'),
          idUsuarioRegistro: tecnico2.id,
          idTecnicoAsignado: tecnico2.id,
          idSupervisor: supervisor.id,
          idFiscalia: fiscalias[1].id,
          idUnidad: unidades[1].id,
          idEstado: estadoPendiente.id,
          urgencia: 'ordinario',
          tipoDelito: 'Falsificación',
          observaciones: 'Pendiente de revisión por supervisor'
        }
      });

      // Expediente 3 - Rechazado
      await prisma.expediente.upsert({
        where: { numeroExpediente: 'EXP-2025-003' },
        update: {},
        create: {
          numeroExpediente: 'EXP-2025-003',
          numeroCasoMp: 'MP-001-2025-12347',
          fechaRegistro: new Date('2025-01-15'),
          idUsuarioRegistro: tecnico1.id,
          idTecnicoAsignado: tecnico1.id,
          idFiscalia: fiscalias[0].id,
          idUnidad: unidades[2].id,
          idEstado: estadoRechazado.id,
          urgencia: 'muy_urgente',
          tipoDelito: 'Narcotráfico',
          observaciones: 'Rechazado - requiere correcciones'
        }
      });

      console.log('Created 3 sample expedientes (1 aprobado, 1 pendiente, 1 rechazado)');

      // Crear indicios para los expedientes
      await prisma.indicio.upsert({
        where: {
          idExpediente_numeroIndicio: {
            idExpediente: expediente1.id,
            numeroIndicio: 'IND-001'
          }
        },
        update: {},
        create: {
          idExpediente: expediente1.id,
          numeroIndicio: 'IND-001',
          descripcion: 'Casquillo calibre 9mm',
          tipoObjeto: 'Casquillo',
          idTecnicoRegistro: tecnico1.id,
          fechaRegistro: new Date('2025-01-10'),
          idEstadoIndicio: estadoIndicioPendiente.id,
          cantidad: 1
        }
      });

      await prisma.indicio.upsert({
        where: {
          idExpediente_numeroIndicio: {
            idExpediente: expediente2.id,
            numeroIndicio: 'IND-001'
          }
        },
        update: {},
        create: {
          idExpediente: expediente2.id,
          numeroIndicio: 'IND-001',
          descripcion: 'Documento falsificado',
          tipoObjeto: 'Documento',
          idTecnicoRegistro: tecnico2.id,
          fechaRegistro: new Date('2025-01-12'),
          idEstadoIndicio: estadoIndicioPendiente.id,
          cantidad: 1
        }
      });

      console.log('Created 2 sample indicios');
    }
  }

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
