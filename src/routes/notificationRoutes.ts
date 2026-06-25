import { Router } from 'express';
import { sendNotification } from '../controllers/notificationController';
import { registerDevice } from '../controllers/deviceController';

const router = Router();

router.post('/send', sendNotification);
router.post('/device', registerDevice);

export default router;
