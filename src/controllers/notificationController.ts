import type { Request, Response } from 'express';
import { sendEmail } from '../services/emailService';
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
