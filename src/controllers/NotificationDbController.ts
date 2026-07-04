import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import jwt from 'jsonwebtoken';

// Extraer token y verificar userId y rol (asumiendo que el gateway valida el JWT, pero necesitamos leerlo)
const getUserFromReq = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
        const decoded = jwt.decode(token) as any;
        return decoded;
    } catch (e) {
        return null;
    }
};

export const getMyNotifications = async (req: Request, res: Response): Promise<any> => {
    const user = getUserFromReq(req);
    if (!user || !user.id) return res.status(401).json({ error: 'No autorizado' });

    try {
        // En un caso real, filtramos por topic al que el usuario pertenece.
        // Aquí traeremos todas las globales y las cruzaremos con el estado del usuario.
        const globalNotifications = await prisma.globalNotification.findMany({
            orderBy: { createdAt: 'desc' }
        });

        const userStatuses = await prisma.userNotificationStatus.findMany({
            where: { userId: user.id }
        });

        const statusMap = new Map();
        userStatuses.forEach(s => statusMap.set(s.globalNotificationId, s));

        const result = [];
        for (const notif of globalNotifications) {
            const status = statusMap.get(notif.id);
            if (status?.isDeleted) continue; // Si está borrada, no la enviamos

            result.push({
                id: notif.id,
                title: notif.title,
                body: notif.body,
                type: notif.type,
                timestamp: notif.createdAt,
                isRead: status?.isRead || false,
                authorName: notif.authorName,
                authorPhotoUrl: notif.authorPhotoUrl
            });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const markAsRead = async (req: Request, res: Response): Promise<any> => {
    const user = getUserFromReq(req);
    if (!user || !user.id) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;

    try {
        await prisma.userNotificationStatus.upsert({
            where: {
                userId_globalNotificationId: {
                    userId: user.id,
                    globalNotificationId: id
                }
            },
            update: { isRead: true },
            create: {
                userId: user.id,
                globalNotificationId: id,
                isRead: true
            }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
    const user = getUserFromReq(req);
    if (!user || !user.id) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.params;

    try {
        await prisma.userNotificationStatus.upsert({
            where: {
                userId_globalNotificationId: {
                    userId: user.id,
                    globalNotificationId: id
                }
            },
            update: { isDeleted: true },
            create: {
                userId: user.id,
                globalNotificationId: id,
                isDeleted: true
            }
        });
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const deleteBulk = async (req: Request, res: Response): Promise<any> => {
    const user = getUserFromReq(req);
    if (!user || !user.id) return res.status(401).json({ error: 'No autorizado' });
    const { ids } = req.body;
    
    if (!Array.isArray(ids)) {
        return res.status(400).json({ error: 'Se esperaba un arreglo de ids' });
    }

    try {
        // En Prisma SQLite/Postgres no hay un upsert bulk directo con composite key, 
        // así que iteramos o usamos transacciones. Para pocos IDs, un Promise.all es eficiente.
        await Promise.all(ids.map(id => 
            prisma.userNotificationStatus.upsert({
                where: {
                    userId_globalNotificationId: {
                        userId: user.id,
                        globalNotificationId: id
                    }
                },
                update: { isDeleted: true },
                create: {
                    userId: user.id,
                    globalNotificationId: id,
                    isDeleted: true
                }
            })
        ));
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno' });
    }
};

export const deleteAll = async (req: Request, res: Response): Promise<any> => {
    const user = getUserFromReq(req);
    if (!user || !user.id) return res.status(401).json({ error: 'No autorizado' });

    try {
        const globalNotifications = await prisma.globalNotification.findMany();
        await Promise.all(globalNotifications.map(notif => 
            prisma.userNotificationStatus.upsert({
                where: {
                    userId_globalNotificationId: {
                        userId: user.id,
                        globalNotificationId: notif.id
                    }
                },
                update: { isDeleted: true },
                create: {
                    userId: user.id,
                    globalNotificationId: notif.id,
                    isDeleted: true
                }
            })
        ));
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Error interno' });
    }
};
