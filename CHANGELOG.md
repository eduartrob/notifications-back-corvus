# Changelog - Notifications Service

## [0.2.0] - 2026-06-23

### 🚀 Mejoras y Nuevas Características (Features)
- **Migración a Base de Datos Autónoma**: Se inicializó el entorno de Prisma ORM junto con la entidad de base de datos `UserDevice` (PostgreSQL) para dotar de independencia de almacenamiento a este microservicio en relación a los registros de tokens de dispositivos móviles (FCM).
- **Integración de Mensajería Asíncrona (RabbitMQ)**:
  - Instalación del cliente `amqplib` y despliegue del consumidor de colas (`rabbitmq.service.ts`).
  - Capacidad de escuchar el Exchange `corvus_events` para atrapar eventos de inicio de sesión (`auth.device.registered`) y cierre de sesión (`auth.device.unregistered`) desde el microservicio de autenticación.
- **Preparación Multi-dispositivo**: Lógica base implementada para recibir peticiones asíncronas vía RabbitMQ y posteriormente despachar correos (recuperación de contraseñas) y Push Notifications masivas.

## [0.1.0] - Versión Inicial
- Configuración básica de proyecto con Node.js y Typescript.
- Instalación de motores de envío de correos (`nodemailer`) e integraciones previas (`whatsapp-web.js`).
