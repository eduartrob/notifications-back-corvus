import amqp, { Connection, Channel } from 'amqplib';

class RabbitMQService {
  private connection!: Connection;
  private channel!: Channel;
  private readonly URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

  async connect() {
    try {
      this.connection = await amqp.connect(this.URL);
      this.channel = await this.connection.createChannel();
      console.log('✅ Conectado a RabbitMQ (Notificaciones)');

      // Configurar Colas
      await this.setupQueues();
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000); // Reintentar en 5s
    }
  }

  private async setupQueues() {
    // Definimos el Exchange y las Colas por codigo (No necesitas la UI de RabbitMQ)
    const exchange = 'corvus_events';
    await this.channel.assertExchange(exchange, 'topic', { durable: true });

    // Cola para eventos de autenticación (Login/Logout)
    const authQueue = await this.channel.assertQueue('auth_events_queue', { durable: true });
    
    // Vinculamos la cola a cualquier evento que empiece con "auth.device."
    await this.channel.bindQueue(authQueue.queue, exchange, 'auth.device.*');

    // Empezamos a escuchar la cola
    this.channel.consume(authQueue.queue, (msg) => {
      if (msg) {
        this.handleAuthEvent(msg);
        this.channel.ack(msg);
      }
    });

    console.log('🎧 Escuchando eventos en auth_events_queue...');
  }

  private handleAuthEvent(msg: amqp.ConsumeMessage) {
    const routingKey = msg.fields.routingKey;
    const content = JSON.parse(msg.content.toString());

    console.log(`📥 Evento recibido [${routingKey}]:`, content);

    // Aquí llamaremos a Prisma para guardar/borrar el FCM Token
    if (routingKey === 'auth.device.registered') {
      console.log('✅ TODO: Guardar FCM Token en BD');
      // await prisma.userDevice.upsert(...)
    } else if (routingKey === 'auth.device.unregistered') {
      console.log('🗑️  TODO: Eliminar FCM Token de BD');
      // await prisma.userDevice.delete(...)
    }
  }
}

export const rabbitmqService = new RabbitMQService();
