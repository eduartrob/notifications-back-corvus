import { Router } from 'express';
import { sendNotification, sendTopicNotification, sendVisibleTopicNotification } from '../controllers/notificationController';
import { getMyNotifications, markAsRead, deleteNotification, deleteBulk, deleteAll } from '../controllers/NotificationDbController';
import { registerDevice, unregisterDevice } from '../controllers/deviceController';

const router = Router();

// Rutas de emisión de notificaciones (consumidas por otros microservicios)
router.post('/send', sendNotification);
router.post('/topic', sendTopicNotification);
router.post('/topic/push', sendVisibleTopicNotification);
router.post('/device', registerDevice);
router.delete('/device', unregisterDevice);

// Rutas de sincronización para clientes (consumidas por la app móvil/web)
router.get('/my-notifications', getMyNotifications);
router.put('/:id/read', markAsRead);
router.delete('/bulk', deleteBulk);
router.delete('/:id', deleteNotification);
router.delete('/', deleteAll);

export default router;
