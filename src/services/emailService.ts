import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { getEmailTemplate } from '../templates/emailTemplate';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendEmail = async (to: string, subject: string, text: string) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text, // Respaldo para clientes sin soporte HTML
            html: getEmailTemplate(subject, text)
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error(`[Email] Error al enviar a ${to}:`, error);
        return false;
    }
};
