import { Router } from 'express';
import { sendNotification, sendTopicNotification, sendVisibleTopicNotification } from '../controllers/notificationController';
import { registerDevice } from '../controllers/deviceController';

const router = Router();

router.post('/send', sendNotification);
router.post('/topic', sendTopicNotification);
router.post('/topic/push', sendVisibleTopicNotification);
router.post('/device', registerDevice);

export default router;
