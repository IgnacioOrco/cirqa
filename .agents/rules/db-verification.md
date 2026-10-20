# Verificación de Integridad de Base de Datos (CIRQA)

Antes de realizar cualquier modificación en el backend (`/Api`) o desplegar cambios a producción:

1. Ejecutar la verificación de base de datos:
   ```bash
   node check-db.js
   ```
   (Dentro de `/Api` o en el contenedor/entorno con `MONGO_URI` configurado). Alternativamente: `npm run check-db`.

2. Interpretar el resultado:
   - **Código de salida 0**: La base de datos está íntegra con sus colecciones (`products`, `orders`, `admins`, `coupons`) y esquemas validados. Proceder con los cambios/despliegue.
   - **Código de salida 1**: **DETENER** inmediatamente cualquier despliegue o pipeline, revisar los logs de inconsistencia reportados por el script y corregir antes de avanzar.
