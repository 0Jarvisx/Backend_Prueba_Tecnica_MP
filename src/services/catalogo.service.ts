import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CatalogoService {
  async listarEstadosExpediente() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_estados_expediente`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener estados');
    }

    return JSON.parse(row.estados || '[]');
  }

  async listarEstadosIndicio() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_estados_indicio`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener estados de indicio');
    }

    return JSON.parse(row.estados || '[]');
  }

  async listarUnidades() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_unidades`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener unidades');
    }

    return JSON.parse(row.unidades || '[]');
  }

  async listarFiscalias() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_fiscalias`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener fiscalías');
    }

    return JSON.parse(row.fiscalias || '[]');
  }

  async listarTecnicos() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_tecnicos`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener técnicos');
    }

    return JSON.parse(row.tecnicos || '[]');
  }

  async listarDepartamentos() {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_departamentos`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener departamentos');
    }

    return JSON.parse(row.departamentos || '[]');
  }

  async listarMunicipiosPorDepartamento(idDepartamento: number) {
    const result: any[] = await prisma.$queryRaw`EXEC pr_listar_municipios_por_departamento @idDepartamento = ${idDepartamento}`;
    const row = result[0];

    if (!row || row.resultado === 0) {
      throw new Error(row?.mensaje || 'Error al obtener municipios');
    }

    return JSON.parse(row.municipios || '[]');
  }
}
