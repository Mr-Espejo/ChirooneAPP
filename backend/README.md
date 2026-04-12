# ChiroOne Content Backend

Full-stack social media orchestration system with AI-driven ideation, blueprinting, and automated publishing.

## 🚀 Cómo correr el servidor

### 1. Requisitos Previos
Asegúrate de tener un archivo `.env` en esta carpeta con las siguientes llaves:
- `TRIGGER_API_KEY`: Tu API Key de Trigger.dev.
- `KIEAI_API_KEY`: Para la generación de imágenes y videos.
- `DATABASE_URL`: URL de conexión para SQLite/PostgreSQL.

### 2. Iniciar el servidor de Express
Este servidor maneja los webhooks y las rutas manuales para disparar procesos.
```bash
npm run dev
```
El servidor correrá en `http://localhost:3000`.

### 3. Iniciar el servidor de Trigger.dev
Para que las tareas en segundo plano (polling de media, video generation, cron jobs) funcionen localmente, debes correr el CLI de Trigger.dev:
```bash
npx trigger.dev@latest dev
```
Esto conectará tu código local con el dashboard de Trigger.dev y permitirá ejecutar los triggers.

---

## 🧪 Pruebas y Tests

### Simulación de Ideación (Dry Run)
Para probar que el flujo de ideación funciona sin gastar créditos de APIs (LLM/Kie.ai), usa el script de dry-run:
```bash
npx tsx tmp/test-ideation-dryrun.ts
```

---

## 📅 Automatización (Triggers)

El sistema cuenta con las siguientes tareas programadas:

1.  **Weekly Ideation (`weekly-ideation-task`)**:
    - **Cuándo**: Todos los Lunes a las 9:00 AM.
    - **Qué hace**: Genera la estrategia de la semana basada en el ADN de marca.
2.  **Daily Publishing (`daily-publishing-task`)**:
    - **Cuándo**: Cada 4 horas.
    - **Qué hace**: Busca publicaciones en estado `READY_TO_PUBLISH` y las sube a redes sociales (Instagram, TikTok, Facebook).

---

## 🛠️ Estructura del Proyecto

- `/modules`: Lógica de negocio core (Ideation, Publishing, Generation).
- `/triggers`: Definición de tareas para Trigger.dev.
- `/integrations`: Servicios externos (Composio, Kie.ai, etc.).
- `/utils`: Clientes globales (Prisma, LLM).
