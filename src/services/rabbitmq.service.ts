import amqp from 'amqplib';
import { sendEmail } from './emailService';
import FirebaseService from './firebaseService';
import prisma from '../utils/prisma';

class RabbitMQService {
  private connection: any;
  private channel: any;
  private readonly URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  async connect() {
    try {
      this.connection = await amqp.connect(this.URL);
      this.channel = await this.connection.createChannel();
      console.log('✅ Conectado a RabbitMQ (Notificaciones)');
      await this.setupQueues();
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async setupQueues() {
    const exchange = 'corvus_events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // -# 1 cola para eventos de autenticacion fcm tokens
    const authQueue = await this.channel.assertQueue('auth_events_queue', { durable: true });
    await this.channel.bindQueue(authQueue.queue, exchange, 'auth.device.*');
    this.channel.consume(authQueue.queue, (msg: any) => {
      if (msg) { this.handleAuthEvent(msg); this.channel.ack(msg); }
    });

    // -# 2 cola para eventos de correo electronico
    const emailQueue = await this.channel.assertQueue('email_events_queue', { durable: true });
    await this.channel.bindQueue(emailQueue.queue, exchange, 'auth.password_recovery.requested');
    await this.channel.bindQueue(emailQueue.queue, exchange, 'auth.email_verification.requested');
    this.channel.consume(emailQueue.queue, (msg: any) => {
      if (msg) { this.handleEmailEvent(msg); this.channel.ack(msg); }
    });

    // -# 3 cola para eventos de sincronizacion de drive
    const syncQueue = await this.channel.assertQueue('sync_events_queue', { durable: true });
    await this.channel.bindQueue(syncQueue.queue, exchange, 'sync.progress');
    this.channel.consume(syncQueue.queue, (msg: any) => {
      if (msg) { this.handleSyncEvent(msg); this.channel.ack(msg); }
    });

    // -# 4 cola para notificaciones push genericas
    const pushQueue = await this.channel.assertQueue('push_events_queue', { durable: true });
    await this.channel.bindQueue(pushQueue.queue, exchange, 'notifications.push.send');
    this.channel.consume(pushQueue.queue, (msg: any) => {
      if (msg) { this.handlePushEvent(msg); this.channel.ack(msg); }
    });

    // -# 5 cola para eventos de pagos/suscripciones
    const paymentsQueue = await this.channel.assertQueue('payments_events_queue', { durable: true });
    await this.channel.bindQueue(paymentsQueue.queue, exchange, 'payments.subscription.*');
    this.channel.consume(paymentsQueue.queue, (msg: any) => {
      if (msg) { this.handlePaymentEvent(msg); this.channel.ack(msg); }
    });

    console.log('🎧 Escuchando eventos en auth, email, sync, push y payments queues...');
  }

  private handleAuthEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());
    console.log(`📥 Evento recibido [${routingKey}]:`, content);
  }

  private async handleEmailEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());
    console.log(`📧 Evento de Email [${routingKey}]:`, content.email);

    if (routingKey === 'auth.password_recovery.requested') {
      const subject = "Código de Recuperación de Contraseña - Corvus";
      const text = `Tu código de seguridad (PIN) de 6 dígitos es: ${content.recovery_token}. Por favor introdúcelo en la aplicación para restablecer tu contraseña. Este código expirará pronto.`;
      const sent = await sendEmail(content.email, subject, text);
      console.log(sent ? `✅ Correo enviado a ${content.email}` : `❌ Falló envío a ${content.email}`);
    } else if (routingKey === 'auth.email_verification.requested') {
      const subject = "Código de Verificación - Corvus";
      const text = `Tu código de verificación de 6 dígitos es: ${content.pin}. Expira en 15 minutos.`;
      const sent = await sendEmail(content.email, subject, text);
      console.log(sent ? `✅ Correo de verificación enviado a ${content.email}` : `❌ Falló envío verificación`);
    }
  }

  private async handleSyncEvent(msg: any) {
    const content = JSON.parse(msg.content.toString());
    const userId = content.user_id;
    if (!userId) return;

    try {
      const devices = await prisma.userDevice.findMany({ where: { userId } });
      if (devices.length === 0) return;

      const title = 'Sincronización Corvus';
      const body = content.message || 'Actualización de progreso';
      const dataPayload = {
        type: content.type_event || 'sync_progress',
        progress: content.progress?.toString() || '0',
        total: content.total?.toString() || '100',
        message: body
      };

      for (const device of devices) {
        await FirebaseService.sendPushNotification(device.fcmToken, title, body, dataPayload);
      }
    } catch (error) {
      console.error('❌ Error enviando Push de Sync:', error);
    }
  }

  private async handlePushEvent(msg: any) {
    const content = JSON.parse(msg.content.toString());
    const userId = content.user_id;
    if (!userId) return;

    try {
      const devices = await prisma.userDevice.findMany({ where: { userId } });
      const title = content.title || 'Notificación Corvus';
      const body = content.body || '';
      const dataPayload = content.data || {};
      const deepLink: string | null = content.deepLink || dataPayload.deepLink || null;

      for (const device of devices) {
        await FirebaseService.sendPushNotification(device.fcmToken, title, body, {
          ...dataPayload,
          ...(deepLink ? { deepLink } : {})
        });
      }

      // -# Guardar en BD
      try {
        const globalNotif = await prisma.globalNotification.create({
          data: {
            topic: `user_${userId}`,
            title,
            body,
            type: content.type || dataPayload.type || 'info',
            deepLink,
            authorName: content.authorName || dataPayload.authorName || null,
            authorPhotoUrl: content.authorPhotoUrl || dataPayload.authorPhotoUrl || null
          }
        });

        await prisma.userNotificationStatus.create({
          data: {
            userId,
            globalNotificationId: globalNotif.id,
            isRead: false,
            isDeleted: false
          }
        });
      } catch (dbError) {
        console.error('❌ Error guardando notificación en BD:', dbError);
      }
    } catch (error) {
      console.error('❌ Error enviando Push genérica:', error);
    }
  }

  private async handlePaymentEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());
    console.log(`💳 [RABBITMQ] Evento de Pago [${routingKey}]`);

    const { userId, email, planName, action } = content;
    if (!userId || !email) return;

    let title = 'Corvus — Tu suscripción';
    let body = '';
    let emailSubject = '';
    let emailBody = '';
    const deepLink = '/profile';

    if (routingKey === 'payments.subscription.purchased') {
      title = '🎉 ¡Bienvenido a Corvus PRO!';
      body = `Tu plan ${planName || 'PRO'} está activo. Disfruta todas las ventajas.`;
      emailSubject = '¡Gracias por tu compra! — Corvus PRO';
      emailBody = `¡Hola! Tu suscripción al plan ${planName || 'PRO'} ha sido activada exitosamente. Ahora tienes acceso completo a todas las funcionalidades premium de Corvus.`;
    } else if (routingKey === 'payments.subscription.cancelled') {
      title = 'Suscripción cancelada';
      body = `Tu plan ${planName || 'PRO'} ha sido cancelado. Seguirás teniendo acceso hasta el fin del período.`;
      emailSubject = 'Tu suscripción ha sido cancelada — Corvus';
      emailBody = `Tu suscripción al plan ${planName || 'PRO'} ha sido cancelada. Mantendrás el acceso hasta el fin del período actual de facturación.`;
    } else if (routingKey === 'payments.subscription.changed') {
      title = 'Plan actualizado';
      body = `Tu plan ha cambiado a ${planName || 'PRO'} exitosamente.`;
      emailSubject = 'Tu plan ha sido actualizado — Corvus';
      emailBody = `Tu suscripción ha sido cambiada al plan ${planName || 'PRO'} exitosamente.`;
    }

    if (!body) return;

    try {
      const devices = await prisma.userDevice.findMany({ where: { userId } });
      for (const device of devices) {
        await FirebaseService.sendPushNotification(device.fcmToken, title, body, {
          type: 'payment_update',
          deepLink,
          action: action || ''
        });
      }

      if (email) {
        await sendEmail(email, emailSubject, emailBody);
        console.log(`✅ Email de pago enviado a ${email}`);
      }

      const globalNotif = await prisma.globalNotification.create({
        data: {
          topic: `user_${userId}`,
          title,
          body,
          type: 'payment_update',
          deepLink,
          authorName: 'Corvus',
          authorPhotoUrl: null
        }
      });

      await prisma.userNotificationStatus.create({
        data: {
          userId,
          globalNotificationId: globalNotif.id,
          isRead: false,
          isDeleted: false
        }
      });
    } catch (error) {
      console.error('❌ Error procesando evento de pago:', error);
    }
  }
}

export const rabbitmqService = new RabbitMQService();
