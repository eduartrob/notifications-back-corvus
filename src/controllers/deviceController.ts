import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const registerDevice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            return res.status(400).json({ error: 'userId y fcmToken son requeridos' });
        }

        // Registrar o actualizar el dispositivo usando upsert basado en el token único
        const device = await prisma.userDevice.upsert({
            where: { fcmToken: fcmToken },
            update: { userId: userId }, // Si el token ya existe, actualiza el usuario al que pertenece
            create: {
                userId: userId,
                fcmToken: fcmToken,
            },
        });

        return res.status(200).json({
            message: 'Dispositivo registrado exitosamente',
            device,
        });
    } catch (error) {
        console.error('Error al registrar dispositivo:', error);
        return res.status(500).json({ error: 'Error interno del servidor al registrar dispositivo' });
    }
};
