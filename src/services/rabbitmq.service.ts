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
    // -# definimos el exchange y las colas por codigo no necesitas la ui de rabbitmq
    const exchange = 'corvus_events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // -# 1 cola para eventos de autenticacion fcm tokens
    const authQueue = await this.channel.assertQueue('auth_events_queue', { durable: true });
    await this.channel.bindQueue(authQueue.queue, exchange, 'auth.device.*');
    this.channel.consume(authQueue.queue, (msg: any) => {
      if (msg) {
        this.handleAuthEvent(msg);
        this.channel.ack(msg);
      }
    });

    // -# 2 cola para eventos de correo electronico email
    const emailQueue = await this.channel.assertQueue('email_events_queue', { durable: true });
    await this.channel.bindQueue(emailQueue.queue, exchange, 'auth.password_recovery.requested');
    this.channel.consume(emailQueue.queue, (msg: any) => {
      if (msg) {
        this.handleEmailEvent(msg);
        this.channel.ack(msg);
      }
    });

    // -# 3 cola para eventos de sincronizacion de drive fcm
    const syncQueue = await this.channel.assertQueue('sync_events_queue', { durable: true });
    await this.channel.bindQueue(syncQueue.queue, exchange, 'sync.progress');
    this.channel.consume(syncQueue.queue, (msg: any) => {
      if (msg) {
        this.handleSyncEvent(msg);
        this.channel.ack(msg);
      }
    });

    console.log('🎧 Escuchando eventos en auth, email y sync queues...');
  }

  private handleAuthEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());

    console.log(`📥 Evento recibido [${routingKey}]:`, content);

    if (routingKey === 'auth.device.registered') {
      console.log('✅ TODO: Guardar FCM Token en BD');
    } else if (routingKey === 'auth.device.unregistered') {
      console.log('🗑️  TODO: Eliminar FCM Token de BD');
    }
  }

  private async handleEmailEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());

    console.log(`📧 Evento de Email recibido [${routingKey}]:`, content.email);

    if (routingKey === 'auth.password_recovery.requested') {
      const email = content.email;
      const pin = content.recovery_token;

      // -# usar nodemailer para enviar el pin de recuperacion
      const subject = "Código de Recuperación de Contraseña - Corvus";
      const text = `Tu código de seguridad (PIN) de 6 dígitos es: ${pin}. Por favor introdúcelo en la aplicación para restablecer tu contraseña. Este código expirará pronto.`;
      
      const emailSent = await sendEmail(email, subject, text);
      if (emailSent) {
        console.log(`✅ Correo enviado con éxito a ${email} con el PIN ${pin}`);
      } else {
        console.log(`❌ Falló el envío de correo a ${email}`);
      }
    }
  }

  private async handleSyncEvent(msg: any) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());

    console.log(`📥 [RABBITMQ] Evento de Sincronización [${routingKey}]:`, content);

    const userId = content.user_id;
    if (!userId) {
      console.log('⚠️ No se proporcionó user_id en el evento de sincronización. Ignorando notificación Push.');
      return;
    }

    try {
      const devices = await prisma.userDevice.findMany({
        where: { userId: userId }
      });

      if (devices.length === 0) {
        console.log(`⚠️ No se encontraron dispositivos (fcmToken) para el usuario ${userId}`);
        return;
      }

      // -# enviar push notification a todos los dispositivos del usuario
      const title = 'Sincronización Corvus';
      let body = content.message || 'Actualización de progreso';
      
      // -# enviar data payload personalizado a flutter para que maindart lo capture
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
      console.error('❌ Error enviando notificaciones Push desde RabbitMQ:', error);
    }
  }
}

export const rabbitmqService = new RabbitMQService();
