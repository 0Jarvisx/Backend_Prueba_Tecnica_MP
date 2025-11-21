import { prisma } from '../config/database';

export class AsignacionService {
  async listarSupervisores(): Promise<any[]> {
    const result: any[] = await prisma.$queryRawUnsafe(`EXEC pr_listar_supervisores`);
    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener supervisores');
    }
    return result[0].supervisores ? JSON.parse(result[0].supervisores) : [];
  }

  async listarTecnicosSinSupervisor(): Promise<any[]> {
    const result: any[] = await prisma.$queryRawUnsafe(`EXEC pr_listar_tecnicos_sin_supervisor`);
    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener técnicos');
    }
    return result[0].tecnicos ? JSON.parse(result[0].tecnicos) : [];
  }

  async listarAsignaciones(): Promise<any[]> {
    const result: any[] = await prisma.$queryRawUnsafe(`EXEC pr_listar_asignaciones_supervisor`);
    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al obtener asignaciones');
    }
    return result[0].asignaciones ? JSON.parse(result[0].asignaciones) : [];
  }

  async asignarSupervisor(idSupervisor: number, idTecnico: number): Promise<{ mensaje: string }> {
    const result: any[] = await prisma.$queryRawUnsafe(
      `EXEC pr_asignar_supervisor_tecnico @idSupervisor = ${idSupervisor}, @idTecnico = ${idTecnico}`
    );
    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al asignar supervisor');
    }
    return { mensaje: result[0].mensaje };
  }

  async eliminarAsignacion(idAsignacion: number): Promise<{ mensaje: string }> {
    const result: any[] = await prisma.$queryRawUnsafe(
      `EXEC pr_eliminar_asignacion_supervisor @idAsignacion = ${idAsignacion}`
    );
    if (!result || result.length === 0 || result[0].resultado === 0) {
      throw new Error(result?.[0]?.mensaje || 'Error al eliminar asignación');
    }
    return { mensaje: result[0].mensaje };
  }
}
