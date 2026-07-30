# Notifications & Messaging Service — Corvus Platform

Este microservicio pertenece a la plataforma **CORVUS**. Es el motor de **Notificaciones Push FCM, Correos Electrónicos y Mensajería en Tiempo Real** para alertas de proyectos, solicitudes de equipo y códigos de verificación.

---

## 🎯 Función en el Ecosistema CORVUS
* **Notificaciones Push FCM:** Integración con Firebase Cloud Messaging para enviar alertas móviles en tiempo real.
* **Mensajería asíncrona:** Consumidor de eventos con RabbitMQ (`config_updates`, `proposal_submitted`, `request_received`).
* **Envío de Emails:** Plantillas HTML responsivas para confirmaciones de cuenta y restablecimiento de contraseña.
* **Base de Datos Dedicada:** Opera sobre su base de datos PostgreSQL aislada **`corvus_notifications_db`** (`UserDevice`, `UserNotificationStatus`, `GlobalNotification`).

---

## ⚙️ Tecnologías
* **Lenguaje & Framework:** Node.js, Express, TypeScript.
* **Notificaciones Push:** Firebase Admin SDK (FCM).
* **Cola de Mensajes:** RabbitMQ (`amqplib`).
* **ORM:** Prisma ORM.
* **Base de Datos:** PostgreSQL (`corvus_notifications_db`).

---

## 🛠️ Ejecución Local Independiente

### 1. Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:
```env
PORT=3003
DATABASE_URL="postgresql://corvus_user:password@localhost:5432/corvus_notifications_db?schema=public"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
```

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Migraciones de Prisma
```bash
npx prisma migrate dev
```

### 4. Iniciar Servidor en Desarrollo
```bash
npm run dev
```
Servidor ejecutándose localmente en `http://localhost:3003`.

---

## 🐳 Ejecución con Docker

```bash
docker build -t corvus-notifications-service .
docker run -p 3003:3003 --env-file .env corvus-notifications-service
```

---

## 🔗 Integración con la Orquestación de CORVUS
Desplegado y orquestado vía **`orchestration-back-corvus`**, escuchando eventos en RabbitMQ y expuesto en el API Gateway (`/api/v1/notifications`).
