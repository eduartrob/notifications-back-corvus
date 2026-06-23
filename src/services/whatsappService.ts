import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('[WhatsApp] Escanea este código QR con tu celular:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('[WhatsApp] Cliente listo.');
    isReady = true;
});

client.on('authenticated', () => console.log('[WhatsApp] Autenticado.'));
client.on('auth_failure', (msg) => console.error('[WhatsApp] Fallo de autenticación:', msg));

export const initializeWhatsApp = () => client.initialize();

export const sendWhatsAppMessage = async (phoneNumber: string, message: string) => {
    if (!isReady) return false;

    try {
        const formattedNumber = phoneNumber.includes('@c.us') ? phoneNumber : `${phoneNumber}@c.us`;
        await client.sendMessage(formattedNumber, message);
        return true;
    } catch (error) {
        console.error(`[WhatsApp] Error al enviar a ${phoneNumber}:`, error);
        return false;
    }
};
