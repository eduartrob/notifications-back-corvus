# Corvus — Notifications Service

Este microservicio es responsable de gestionar y despachar cualquier tipo de comunicación del sistema hacia los usuarios. Al ser un servicio de mensajería (correos, notificaciones Push, WhatsApp), está estrictamente diseñado bajo un patrón de **Arquitectura Orientada a Eventos (EDA)** escuchando tareas asíncronas vía **RabbitMQ**.

## 🚀 Arquitectura
- **Framework**: Node.js + Express (TypeScript)
- **ORM**: Prisma (Conectado a PostgreSQL)
- **Mensajería**: RabbitMQ (`amqplib`) como Consumidor de Eventos.
- **Librerías de Entrega**: Nodemailer (SMTP), Firebase Cloud Messaging (FCM).

## 📡 Escuchador de Eventos (Event Bus)
Este servicio se encuentra activo a la escucha del Exchange `corvus_events`.
- `auth.device.registered`: Guarda en la base de datos el token FCM del dispositivo que acaba de iniciar sesión.
- `auth.device.unregistered`: Elimina de la base de datos el token del dispositivo que acaba de cerrar sesión.
- `auth.password_recovery.requested`: Evento despachado por el API de Autenticación para compilar y enviar un correo electrónico con el link de restablecimiento.
- `project.analysis.completed`: Evento emitido por el servicio de Inteligencia Artificial para despachar Notificaciones Push al celular del usuario informando el veredicto.

## ⚙️ Desarrollo
1. Copiar `.env.example` a `.env` y llenar el `DATABASE_URL` (esperando aprovisionamiento del contenedor DB).
2. Sincronizar esquema de base de datos: `npx prisma db push`
3. Instalar dependencias: `npm install`
4. Arrancar en modo desarrollo: `npm run dev`
