# M08 — Seguimiento de postulaciones

Implementado en la copia local el 2026-11-25. El postulante accede desde **Mis postulaciones**, ruta `/postulante/postulaciones`; admite `?application=<id>` para abrir directamente un seguimiento propio.

## Alcance y flujo

- Lista de postulaciones propias, búsqueda por título de oferta, filtro por estado y paginación de 20 registros.
- Ficha en la misma pantalla con estado vigente, fecha, avance por etapas e historial. En móvil la ficha sustituye la lista; Cerrar devuelve al control que la abrió.
- Solo se marcan etapas registradas. Una decisión directa desde Pendiente no inventa pasos de revisión o preselección. Un historial antiguo incompleto se identifica como parcial.
- Se diferencia el cierre de recepción de la finalización del proceso. Ninguno se presenta como rechazo automático; una postulación activa en un proceso finalizado indica que no tiene decisión individual final registrada.
- Accesos a datos del CV, oferta y pruebas existentes. Reemplazo de CV únicamente en PENDING, conforme a M03.
- Consulta automática cada 30 segundos mientras la página está visible y hay conexión, más actualización manual. Ante fallos se conserva el último resultado válido con un aviso de posible desactualización; al expirar la sesión se limpia la información privada.
- El reclutador consulta y cambia estados mediante M07, con el flujo B-08 ya aprobado. M08 no agrega cambios arbitrarios, reversión ni decisiones automáticas.

## Arquitectura y autorización

Cuatro capas en `Backend/src/modules/seguimiento/`: controlador HTTP, servicio, interfaz `SeguimientoRepository` y persistencia MySQL. Se inyecta en `server.ts` y se monta únicamente en `app.ts`.

La sesión determina el postulante. El SQL restringe tanto lista como detalle por propietario; otro postulante obtiene 404 para un expediente ajeno. Rol reclutador, solicitudes cross-site, identificadores inválidos y filtros no admitidos se rechazan. Respuestas privadas con `Cache-Control: no-store` y errores con `request_id`.

La respuesta usa una lista explícita de campos públicos. No incluye motivos internos de la decisión, notas del reclutador, autor de eventos, evaluaciones, puntajes ni datos de otros postulantes.

Lecturas consistentes de listado/conteo y estado/historial mediante transacciones REPEATABLE READ. Tablas existentes: `applications`, `jobs`, `application_status_events` y nombre del CV en `cv_documents`. **No requiere nueva migración** sobre la base con las migraciones previas aplicadas.

El frontend compone la ruta con `MisPostulaciones.astro`; UI, estados y consumo HTTP residen en `modules/seguimiento/`. Conserva los tokens Inter/Sky y los componentes compartidos de DESIGN.md.

## API implementada

Contrato ejecutable: `Backend/openapi-implemented.yaml`, versión 0.8.0; prefijo `/api/v1`.

- GET `/candidate/applications/tracking`: filtros `search`, `status`, `page`; devuelve registros, total, página y fecha de consulta.
- GET `/candidate/applications/{applicationId}/tracking`: estado público, historial real, indicador de historial completo y fecha de consulta.

Ambas operaciones son de solo lectura. La escritura sigue perteneciendo al endpoint de selección de M07.

## Evidencia de verificación

- Backend: `npm run check`, `npm test` y `npm run build`. Suite normal: **142 pruebas aprobadas**, 10 pruebas MySQL optativas omitidas; 14 casos nuevos API/servicio de M08.
- Los dos archivos de pruebas M08 pasan TypeScript estricto por separado.
- Integración MariaDB: `TEST_MYSQL=1 npx vitest run tests/seguimiento.mysql.test.ts`: **1 prueba aprobada**. Crea sesiones reales y comprueba M07 → M08 por HTTP, aislamiento entre postulantes, paginación 20+2, búsqueda literal, finalización sin rechazo implícito y ausencia de notas privadas. Limpia únicamente sus registros sintéticos.
- Frontend: `npm run check` con 119 archivos, 0 errores, advertencias o sugerencias; npm run build genera 21 rutas.
- `node tests/seguimiento.browser.mjs http://127.0.0.1:3009`: aprobado. Verifica 1440/390 px, claro/oscuro, foco con teclado, cinco estados UI, filtros, paginación, historial parcial, decisiones directas, errores conservando datos, desconexión/reconexión, respuestas tardías, actualización real tras 30 segundos y limpieza al expirar.
- Regresión `node tests/postulante-ui.browser.mjs http://127.0.0.1:3009`: aprobada; preserva búsqueda por voz/teclado, recuperación y limpieza de sesión.

Capturas: `.impeccable/review/m08-{1440,390}-{light,dark}.png`, más `m08-list-desktop.png` y `m08-list-mobile.png`. Se usan expedientes sintéticos. Las pruebas de navegador usan API simulada; la integración HTTP/MySQL se verifica por separado. No se afirma un recorrido con cuenta real desde navegador.

## Límites

M08 cubre RSF30, RSF31, RSF32 y UI-RF-10 mediante su consulta, línea de progreso y la gestión M07. La validación integral IHC con usuarios sigue pendiente, al igual que los asuntos abiertos de otros módulos: umbrales y validación B-06, reevaluación B-07, acceso transversal B-09 y retención automatizada.
