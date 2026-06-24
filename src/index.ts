import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notificationRoutes';
import { initializeWhatsApp } from './services/whatsappService';
import { rabbitmqService } from './services/rabbitmq.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/notifications', notificationRoutes);

app.listen(PORT, async () => {
    console.log(`[Server] API de Notificaciones en puerto ${PORT}`);
    
    // Conectar a RabbitMQ
    await rabbitmqService.connect();

    // Deshabilitado temporalmente para pruebas locales (Evita el QR bloqueante)
    // initializeWhatsApp();
});
