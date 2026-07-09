import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';

class FirebaseService {
    private static instance: FirebaseService;

    private constructor() {
        try {
            // -# inicializar usando el archivo descargado
            const serviceAccount = require(path.resolve(__dirname, '../../firebase-adminsdk.json'));
            
            initializeApp({
                credential: cert(serviceAccount)
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

            const response = await getMessaging().send(message);
            console.log('📨 Notificación Push enviada exitosamente:', response);
            return true;
        } catch (error: any) {
            console.error('❌ Error enviando notificación Push para el token:', fcmToken);
            
            // Si el token ya no es válido, lo eliminamos de la base de datos
            if (error?.code === 'messaging/registration-token-not-registered' || 
                error?.status === 'NOT_FOUND' || 
                JSON.stringify(error).includes('UNREGISTERED')) {
                console.log('⚠️ Token UNREGISTERED detectado. Eliminando de la BD...');
                try {
                    const prisma = require('../utils/prisma').default;
                    await prisma.userDevice.deleteMany({
                        where: { fcmToken: fcmToken }
                    });
                    console.log('✅ Token eliminado exitosamente.');
                } catch (dbError) {
                    console.error('Error al intentar eliminar token expirado:', dbError);
                }
            } else {
                console.error(error); // Imprimir el error completo solo si es otro tipo de error
            }
            return false;
        }
    }

    public async sendSilentTopicMessage(topic: string, data: any): Promise<boolean> {
        try {
            const message = {
                data: data || {},
                topic: topic
            };

            const response = await getMessaging().send(message);
            console.log(`📨 Mensaje silencioso enviado al topic '${topic}':`, response);
            return true;
        } catch (error) {
            console.error(`❌ Error enviando mensaje al topic '${topic}':`, error);
            return false;
        }
    }
    public async sendTopicPushNotification(topic: string, title: string, body: string, data?: any): Promise<boolean> {
        try {
            const message = {
                notification: {
                    title,
                    body
                },
                data: data || {},
                topic: topic
            };

            const response = await getMessaging().send(message);
            console.log(`📨 Notificación Push enviada al topic '${topic}':`, response);
            return true;
        } catch (error) {
            console.error(`❌ Error enviando Push al topic '${topic}':`, error);
            return false;
        }
    }
}

export default FirebaseService.getInstance();
