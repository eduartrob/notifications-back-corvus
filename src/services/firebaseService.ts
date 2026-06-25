import * as admin from 'firebase-admin';
import path from 'path';

class FirebaseService {
    private static instance: FirebaseService;

    private constructor() {
        try {
            // Inicializar usando el archivo descargado
            const serviceAccount = require(path.resolve(__dirname, '../../firebase-adminsdk.json'));
            
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('✅ Firebase Admin SDK inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar Firebase Admin SDK:', error);
        }
    }

    public static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    public async sendPushNotification(fcmToken: string, title: string, body: string, data?: any): Promise<boolean> {
        try {
            const message = {
                notification: {
                    title,
                    body
                },
                data: data || {},
                token: fcmToken
            };

            const response = await admin.messaging().send(message);
            console.log('📨 Notificación Push enviada exitosamente:', response);
            return true;
        } catch (error) {
            console.error('❌ Error enviando notificación Push:', error);
            return false;
        }
    }
}

export default FirebaseService.getInstance();
