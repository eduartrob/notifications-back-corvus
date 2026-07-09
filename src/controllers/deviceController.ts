import type { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const registerDevice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { userId, fcmToken } = req.body;

        if (!userId || !fcmToken) {
            return res.status(400).json({ error: 'userId y fcmToken son requeridos' });
        }

        // -# registrar o actualizar el dispositivo usando upsert basado en el token unico
        const device = await prisma.userDevice.upsert({
            where: { fcmToken: fcmToken },
            update: { userId: userId },
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

export const unregisterDevice = async (req: Request, res: Response): Promise<any> => {
    try {
        const { fcmToken } = req.body;

        if (!fcmToken) {
            return res.status(400).json({ error: 'fcmToken es requerido' });
        }

        await prisma.userDevice.deleteMany({
            where: { fcmToken: fcmToken }
        });

        return res.status(200).json({
            message: 'Dispositivo desregistrado exitosamente'
        });
    } catch (error) {
        console.error('Error al desregistrar dispositivo:', error);
        return res.status(500).json({ error: 'Error interno del servidor al desregistrar dispositivo' });
    }
};
