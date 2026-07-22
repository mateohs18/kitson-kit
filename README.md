# 🎮 Kitson Kit

Tienda de recargas de pavos, cosméticos y suscripciones de **Fortnite** con entrega automatizada, para México, Colombia, Perú y el resto del mundo.

**En producción:** https://kitson-kit.store

## Qué hace

- 🛒 **Catálogo propio + Tienda Diaria** sincronizada en vivo con la tienda oficial de Fortnite, con margen de ganancia configurable desde el admin.
- 💰 **Billetera Kitson**: los clientes cargan saldo (Binance, Yape, Nequi, OXXO, transferencia) y compran al instante.
- 🤖 **Entrega automática**: los pagos con saldo disparan un bot que envía los regalos dentro del juego.
- 🎟️ **Cupones de descuento** con límite de usos, mínimo de compra y vencimiento.
- 🤝 **Programa de referidos**: link único por cliente, crédito para ambos al concretarse la primera compra.
- 📧 **Emails transaccionales** (confirmación, entrega, recordatorio de 48hs de amistad) vía Brevo.
- 🔔 **Alertas a Discord** con botón de "Marcar como Entregado" para el equipo.
- ⚡ **Tiempo real** con Supabase Realtime (toast de compras en vivo sin polling).
- 🌎 **Multi-moneda** (MXN, COP, PEN, USD) con tasas editables desde el panel.
- 🛡️ Precios validados en el servidor, saldo con operaciones atómicas y rate limiting por IP.

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS 4 |
| Base de datos | Supabase (Postgres + Realtime + Storage) |
| Autenticación | NextAuth (Google, Discord y credenciales) |
| Estado | Zustand |
| Emails | Brevo |
| Hosting | Railway |

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar con tus claves
npm run dev
```

## Variables de entorno

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Operaciones de servidor (⚠️ nunca exponer) |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | Sesiones |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login con Google |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Login con Discord |
| `DISCORD_BOT_TOKEN` / `DISCORD_CHANNEL_ID` / `DISCORD_ADMIN_IDS` / `DISCORD_PUBLIC_KEY` | Alertas y botones en Discord |
| `ADMIN_EMAIL` | Correo con acceso al panel /admin |
| `BREVO_API_KEY` / `EMAIL_USER` | Envío de emails (remitente verificado en Brevo) |
| `BOT_DELIVERY_URL` / `BOT_DELIVERY_SECRET` | Bot de entregas automáticas |
| `CRON_SECRET` | Protege los endpoints de tareas programadas |

## Base de datos

Los scripts SQL para crear tablas, funciones y triggers están en la carpeta [`supabase/`](./supabase). Correrlos en orden desde el SQL Editor del panel de Supabase:

1. `descontar_saldo.sql` — pagos con saldo atómicos
2. `site_config.sql` — configuración editable (margen, referidos)
3. `feed_compras.sql` — feed de compras en tiempo real
4. `aviso_amistad.sql` — recordatorio de 48hs
5. `cupones.sql` — sistema de cupones
6. `referidos.sql` — programa de referidos

## Tareas programadas

`GET /api/cron/amistades` (cada hora, con header `Authorization: Bearer CRON_SECRET`): avisa por email a los clientes cuyas 48 horas de amistad de Epic ya se cumplieron. Se puede programar gratis con [cron-job.org](https://cron-job.org).

## CI

Cada push a `main` corre verificación de tipos y build completo con GitHub Actions ([`.github/workflows/ci.yml`](./.github/workflows/ci.yml)). Si aparece una ❌ en el commit, no desplegar hasta arreglarlo.
