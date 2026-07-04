import type { Request, Response } from 'express';
import { sendEmail } from '../services/emailService';
import { sendWhatsAppMessage } from '../services/whatsappService';
import prisma from '../utils/prisma';
import { sendWhatsAppMessage } from '../services/whatsappService';

export const sendNotification = async (req: Request, res: Response): Promise<any> => {
    const { type, toEmail, toPhone, subject, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'El campo "message" es requerido.' });
    }

    let emailSent = false;
    let whatsappSent = false;

    if ((type === 'EMAIL' || type === 'EMAIL_AND_WHATSAPP') && toEmail && subject) {
        emailSent = await sendEmail(toEmail, subject, message);
    }

    if ((type === 'WHATSAPP' || type === 'EMAIL_AND_WHATSAPP') && toPhone) {
        whatsappSent = await sendWhatsAppMessage(toPhone, message);
    }

    return res.status(200).json({
        message: 'Proceso de notificación finalizado',
        status: { emailSent, whatsappSent }
    });
};

export const sendTopicNotification = async (req: Request, res: Response): Promise<any> => {
    const { topic, data } = req.body;

    if (!topic) {
        return res.status(400).json({ error: 'El campo "topic" es requerido.' });
    }

    // Importar dinámicamente o asegurarse de que firebaseService esté disponible
    const firebaseService = require('../services/firebaseService').default;
    
    const sent = await firebaseService.sendSilentTopicMessage(topic, data || {});

    if (sent) {
        return res.status(200).json({ message: `Notificación enviada al topic ${topic}` });
    } else {
        return res.status(500).json({ error: 'Fallo al enviar notificación al topic' });
    }
};

export const sendVisibleTopicNotification = async (req: Request, res: Response): Promise<any> => {
    const { topic, title, body, data } = req.body;

    if (!topic || !title || !body) {
        return res.status(400).json({ error: 'Los campos "topic", "title" y "body" son requeridos.' });
    }

    const firebaseService = require('../services/firebaseService').default;
    
    // 1. Enviar el Push vía FCM
    const sent = await firebaseService.sendTopicPushNotification(topic, title, body, data || {});

    if (sent) {
        // 2. Guardar en Base de Datos para sincronización
        try {
            await prisma.globalNotification.create({
                data: {
                    topic,
                    title,
                    body,
                    type: data?.type || 'info',
                    authorName: data?.authorName,
                    authorPhotoUrl: data?.authorPhotoUrl
                }
            });
        } catch (dbError) {
            console.error('Error guardando GlobalNotification:', dbError);
        }

        return res.status(200).json({ message: `Push notification enviada al topic ${topic}` });
    } else {
        return res.status(500).json({ error: 'Fallo al enviar push notification al topic' });
    }
};
