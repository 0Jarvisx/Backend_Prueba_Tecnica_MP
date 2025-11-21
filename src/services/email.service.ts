import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { environment } from '../config/environment';
import logger from '../utils/logger';

export class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: environment.emailHost,
      port: environment.emailPort,
      secure: environment.emailPort === 465,
      auth: {
        user: environment.emailUser,
        pass: environment.emailPassword,
      },
    });
  }

  /**
   * Verificar conexión con servidor SMTP
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Conexión SMTP verificada correctamente');
      return true;
    } catch (error) {
      logger.error('Error al verificar conexión SMTP:', error);
      return false;
    }
  }

  /**
   * Enviar email genérico
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: `"${environment.emailFromName}" <${environment.emailFrom}>`,
        to,
        subject,
        text: text || '',
        html,
      });

      logger.info(`Email enviado: ${info.messageId} a ${to}`);
      return true;
    } catch (error) {
      logger.error('Error al enviar email:', error);
      return false;
    }
  }

  /**
   * Enviar email de reseteo de contraseña
   */
  async sendPasswordResetEmail(
    email: string,
    userName: string,
    resetToken: string
  ): Promise<boolean> {
    const resetUrl = `${environment.frontendUrl}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetTemplate(userName, resetUrl);
    const text = `Hola ${userName},\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta.\n\nHaz clic en el siguiente enlace para restablecer tu contraseña:\n${resetUrl}\n\nEste enlace expirará en 1 hora.\n\nSi no solicitaste restablecer tu contraseña, puedes ignorar este correo.\n\nSaludos,\nMinisterio Público - DICRI`;

    return await this.sendEmail(
      email,
      'Restablecer contraseña - Sistema DICRI',
      html,
      text
    );
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(
    email: string,
    userName: string,
    userLastName: string,
    roleName: string,
    temporaryPassword: string
  ): Promise<boolean> {
    const loginUrl = `${environment.frontendUrl}/login`;

    const html = this.getWelcomeTemplate(userName, userLastName, roleName, email, temporaryPassword, loginUrl);
    const text = `Hola ${userName} ${userLastName},\n\n¡Bienvenido al Sistema de Control de Indicios del Ministerio Público!\n\nTu cuenta ha sido creada exitosamente con el rol de ${roleName}.\n\nCredenciales de acceso:\nEmail: ${email}\nContraseña temporal: ${temporaryPassword}\n\nPor favor, cambia tu contraseña después de iniciar sesión.\n\nAccede al sistema: ${loginUrl}\n\nSaludos,\nMinisterio Público - DICRI`;

    return await this.sendEmail(
      email,
      'Bienvenido al Sistema DICRI - Ministerio Público',
      html,
      text
    );
  }

  /**
   * Enviar email de rechazo de expediente
   */
  async sendExpedienteRechazadoEmail(
    email: string,
    tecnicoNombre: string,
    numeroExpediente: string,
    motivoRechazo: string
  ): Promise<boolean> {
    const expedientesUrl = `${environment.frontendUrl}/expedientes`;

    const html = this.getExpedienteRechazadoTemplate(tecnicoNombre, numeroExpediente, motivoRechazo, expedientesUrl);
    const text = `Hola ${tecnicoNombre},\n\nTe informamos que el expediente ${numeroExpediente} ha sido RECHAZADO por el supervisor.\n\nMotivo del rechazo:\n${motivoRechazo}\n\nPor favor, revisa las observaciones y realiza las correcciones necesarias.\n\nAccede al expediente: ${expedientesUrl}\n\nSaludos,\nMinisterio Público - DICRI`;

    return await this.sendEmail(
      email,
      `Expediente ${numeroExpediente} Rechazado - DICRI`,
      html,
      text
    );
  }

  /**
   * Plantilla HTML para email de bienvenida
   */
  private getWelcomeTemplate(
    userName: string,
    userLastName: string,
    roleName: string,
    email: string,
    temporaryPassword: string,
    loginUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido al Sistema</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #1e3a8a;
      font-size: 22px;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .credentials-box {
      background-color: #f3f4f6;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .credentials-box h3 {
      margin: 0 0 15px 0;
      color: #1e3a8a;
      font-size: 18px;
    }
    .credential-item {
      margin: 10px 0;
      padding: 10px;
      background-color: #ffffff;
      border-radius: 4px;
      border-left: 3px solid #3b82f6;
    }
    .credential-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 14px;
      display: block;
      margin-bottom: 5px;
    }
    .credential-value {
      color: #1e3a8a;
      font-size: 16px;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    .info-box {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .login-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .login-button:hover {
      transform: translateY(-2px);
    }
    .features {
      margin: 30px 0;
    }
    .feature-item {
      display: flex;
      align-items: start;
      margin: 15px 0;
    }
    .feature-icon {
      background-color: #dbeafe;
      color: #1e3a8a;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .feature-text {
      color: #4b5563;
      font-size: 15px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido al Sistema!</h1>
      <p>Ministerio Público - DICRI</p>
    </div>

    <div class="content">
      <h2>Hola ${userName} ${userLastName},</h2>

      <p>Es un placer darte la bienvenida al <strong>Sistema de Control de Indicios</strong> de la Dirección de Investigación Criminalística del Ministerio Público de Guatemala.</p>

      <p>Tu cuenta ha sido creada exitosamente con el rol de <strong>${roleName}</strong>.</p>

      <div class="credentials-box">
        <h3>🔐 Credenciales de Acceso</h3>
        <div class="credential-item">
          <span class="credential-label">Email:</span>
          <span class="credential-value">${email}</span>
        </div>
        <div class="credential-item">
          <span class="credential-label">Contraseña temporal:</span>
          <span class="credential-value">${temporaryPassword}</span>
        </div>
      </div>

      <div class="warning-box">
        <p><strong>⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña temporal después de iniciar sesión por primera vez.</p>
      </div>

      <div class="button-container">
        <a href="${loginUrl}" class="login-button">Iniciar Sesión</a>
      </div>

      <div class="info-box">
        <p><strong>💡 Tip:</strong> Guarda este correo en un lugar seguro para futuras referencias.</p>
      </div>

      <div class="features">
        <h3 style="color: #1e3a8a; margin-bottom: 20px;">Con tu cuenta podrás:</h3>
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">Gestionar expedientes y casos de manera eficiente</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">Controlar la cadena de custodia de indicios</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">Generar reportes y estadísticas</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon">✓</div>
          <div class="feature-text">Colaborar con tu equipo en tiempo real</div>
        </div>
      </div>

      <p style="margin-top: 30px;">Si tienes alguna pregunta o necesitas asistencia, no dudes en contactar al administrador del sistema.</p>

      <p style="margin-top: 20px;">
        <strong>Saludos cordiales,</strong><br>
        Equipo de Soporte Técnico<br>
        Dirección de Investigación Criminalística
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ministerio Público de Guatemala</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para email de reseteo de contraseña
   */
  private getPasswordResetTemplate(userName: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #1e3a8a;
      font-size: 20px;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .reset-button {
      display: inline-block;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: #ffffff !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .reset-button:hover {
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ministerio Público - DICRI</h1>
    </div>

    <div class="content">
      <h2>Hola ${userName},</h2>

      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Control de Indicios.</p>

      <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>

      <div class="button-container">
        <a href="${resetUrl}" class="reset-button">Restablecer Contraseña</a>
      </div>

      <div class="info-box">
        <p><strong>⏱️ Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por motivos de seguridad.</p>
      </div>

      <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
      <p style="word-break: break-all; color: #3b82f6; font-size: 14px;">${resetUrl}</p>

      <p style="margin-top: 30px;">Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.</p>

      <p style="margin-top: 20px;">
        <strong>Saludos,</strong><br>
        Equipo de Soporte Técnico<br>
        Dirección de Investigación Criminalística
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ministerio Público de Guatemala</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Plantilla HTML para email de expediente rechazado
   */
  private getExpedienteRechazadoTemplate(
    tecnicoNombre: string,
    numeroExpediente: string,
    motivoRechazo: string,
    expedientesUrl: string
  ): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Expediente Rechazado</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
      color: #333333;
      line-height: 1.6;
    }
    .content h2 {
      color: #dc2626;
      font-size: 20px;
      margin-bottom: 20px;
    }
    .content p {
      margin-bottom: 15px;
      font-size: 16px;
    }
    .expediente-box {
      background-color: #fee2e2;
      border-left: 4px solid #dc2626;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .expediente-box h3 {
      margin: 0 0 10px 0;
      color: #dc2626;
      font-size: 18px;
    }
    .expediente-number {
      font-size: 24px;
      font-weight: bold;
      color: #991b1b;
      margin: 10px 0;
    }
    .motivo-box {
      background-color: #f3f4f6;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .motivo-box h3 {
      margin: 0 0 15px 0;
      color: #374151;
      font-size: 16px;
      font-weight: 600;
    }
    .motivo-text {
      color: #1f2937;
      font-size: 15px;
      line-height: 1.6;
      background-color: #ffffff;
      padding: 15px;
      border-radius: 4px;
      border-left: 3px solid #dc2626;
      white-space: pre-wrap;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning-box p {
      margin: 0;
      color: #92400e;
      font-size: 14px;
    }
    .info-box {
      background-color: #dbeafe;
      border-left: 4px solid #3b82f6;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .info-box p {
      margin: 0;
      color: #1e40af;
      font-size: 14px;
    }
    .button-container {
      text-align: center;
      margin: 30px 0;
    }
    .action-button {
      display: inline-block;
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: #ffffff !important;
      padding: 14px 40px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .action-button:hover {
      transform: translateY(-2px);
    }
    .steps-box {
      margin: 30px 0;
    }
    .step-item {
      display: flex;
      align-items: start;
      margin: 15px 0;
      padding: 15px;
      background-color: #f9fafb;
      border-radius: 6px;
    }
    .step-number {
      background-color: #dc2626;
      color: #ffffff;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .step-text {
      color: #4b5563;
      font-size: 15px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 20px 30px;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Expediente Rechazado</h1>
      <p>Ministerio Público - DICRI</p>
    </div>

    <div class="content">
      <h2>Hola ${tecnicoNombre},</h2>

      <p>Te informamos que el expediente que registraste ha sido <strong style="color: #dc2626;">RECHAZADO</strong> por el supervisor y requiere correcciones.</p>

      <div class="expediente-box">
        <h3>📁 Expediente Rechazado</h3>
        <div class="expediente-number">${numeroExpediente}</div>
      </div>

      <div class="motivo-box">
        <h3>📋 Motivo del Rechazo:</h3>
        <div class="motivo-text">${motivoRechazo}</div>
      </div>

      <div class="warning-box">
        <p><strong>⚠️ Acción Requerida:</strong> Debes revisar y corregir el expediente según las observaciones indicadas por el supervisor.</p>
      </div>

      <div class="steps-box">
        <h3 style="color: #374151; margin-bottom: 20px;">Próximos pasos:</h3>
        <div class="step-item">
          <div class="step-number">1</div>
          <div class="step-text">Revisa cuidadosamente el motivo del rechazo</div>
        </div>
        <div class="step-item">
          <div class="step-number">2</div>
          <div class="step-text">Accede al expediente en el sistema</div>
        </div>
        <div class="step-item">
          <div class="step-number">3</div>
          <div class="step-text">Realiza las correcciones necesarias</div>
        </div>
        <div class="step-item">
          <div class="step-number">4</div>
          <div class="step-text">Envía nuevamente el expediente para revisión</div>
        </div>
      </div>

      <div class="button-container">
        <a href="${expedientesUrl}" class="action-button">Ver Expediente</a>
      </div>

      <div class="info-box">
        <p><strong>💡 Importante:</strong> El expediente permanecerá en estado "Rechazado" hasta que realices las correcciones y sea aprobado por el supervisor.</p>
      </div>

      <p style="margin-top: 30px;">Si tienes dudas sobre las correcciones requeridas, contacta directamente con tu supervisor.</p>

      <p style="margin-top: 20px;">
        <strong>Saludos cordiales,</strong><br>
        Sistema de Gestión de Evidencias<br>
        Dirección de Investigación Criminalística
      </p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ministerio Público de Guatemala</p>
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
    `;
  }
}

export const emailService = new EmailService();
