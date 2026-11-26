# M07 — Resultados y selección humana

Implementado localmente el 2026-11-25. Acceso: **Resultados y comparación** en el menú del reclutador, ruta `/reclutador/resultados`. Admite `?job=<id>` para abrir una oferta.

## Alcance

- Selector de ofertas propias, búsqueda literal por nombre/correo, filtro por estado y paginación de 20 postulaciones.
- Orden administrativo por nombre, estado o fecha. No se ordena por score ni se generan niveles Alta/Media/Baja.
- Resultados obtenidos con las reglas de M06: notas objetivas de exámenes, puntos de perfil y total indicativo cuando está disponible. No se llama a Ollama desde M07.
- Ficha dentro de la pantalla con perfil confirmado de la postulación, resultados, pendientes, vínculos al CV/notas y a la evidencia de M06, selección e historial.
- Un perfil sin valoración humana se muestra «Por revisar». Un cero se presenta solo cuando corresponde a una valoración realizada. Las fuentes desactualizadas y los totales incompletos se identifican explícitamente.
- En móvil se sustituye la lista por la ficha; Cerrar devuelve a los resultados. Los filtros permanecen disponibles.

## Flujo aprobado B-08

Solo el reclutador propietario:
- PENDING → IN_REVIEW.
- IN_REVIEW → SHORTLISTED.
- PENDING, IN_REVIEW o SHORTLISTED → ADVANCES o NOT_ADVANCES.

Cada acción exige confirmación y el estado esperado por el cliente. Los finales admiten un motivo opcional, registran autor y fecha del servidor y no pueden revertirse. No hay decisiones automáticas por puntaje. Se bloquean acciones sobre procesos finalizados y estados desconocidos.

## Arquitectura y persistencia

Cuatro capas en `Backend/src/modules/seleccion/`. El servicio recibe las interfaces SeleccionRepository y EvaluacionRepository; reutiliza la función de presentación de M06 sin duplicar la fórmula. La composición se realiza en server.ts y el montaje únicamente en app.ts.

Se utilizan las tablas existentes `applications`, `recruitment_decisions` y `application_status_events`. **No hace falta una migración adicional** sobre la base con las migraciones previas aplicadas. No se modificó el esquema inicial.

Estado, decisión e historial se guardan en una transacción, con bloqueo de oferta/postulación. Dos acciones concurrentes sobre el mismo estado producen un guardado y un 409; los reintentos no duplican la decisión ni el historial. La finalización de oferta comparte el bloqueo.

## API implementada

Contrato: `Backend/openapi-implemented.yaml`, versión 0.7.0; base `/api/v1`.

- GET `/recruiter/selection/jobs`.
- GET `/recruiter/jobs/{jobId}/results`: search, status, sort (name/status/date), direction y page.
- GET `/recruiter/applications/{applicationId}/selection`.
- POST `/recruiter/applications/{applicationId}/selection`: state, expected_status, confirmed=true y reason opcional.

Sesión activa, rol y propiedad verificados en servidor. Respuestas privadas no-store, SQL parametrizado, rechazo de campos extra, JSON y X-Qori-Client en mutaciones, rechazo de solicitudes cross-site y errores con request_id. Nunca se acepta autor, nota o fecha del formulario.

## Verificación

Desde Backend: `npm run check`, `npm test`, `npm run build`. Suite normal: 128 aprobadas y 9 pruebas MySQL optativas omitidas. M07 aporta 14 casos API/servicio. Los archivos de pruebas M07 también pasaron TypeScript estricto por separado.

Integración real: `TEST_MYSQL=1 npx vitest run tests/seleccion.mysql.test.ts`: 1 prueba aprobada contra MariaDB local, con aislamiento de propietarios, búsqueda literal, reversión de transacción y concurrencia. Solo creó y eliminó sus propios registros sintéticos.

Desde Frontend: `npm run check` (0 errores/advertencias/hints), `npm run build` (21 rutas), `node tests/seleccion.browser.mjs http://127.0.0.1:3009`. Navegador con API simulada: claro/oscuro, 1440/390, teclado, filtros, ficha, cinco estados, cancelar, guardar, error conservando formulario, conflicto, bloqueo final, foco tras actualizar y limpieza al expirar. Muestras de texto de resultados, campos y badges: contraste mínimo 7.04:1 entre las cuatro variantes. No equivale a auditoría integral de accesibilidad.

Capturas locales en `.impeccable/review/m07-{1440,390}-{light,dark}.png`, más detalle escritorio/móvil y `m07-browser-result.json`. Datos sintéticos legibles; no se expusieron expedientes reales.

## Límites

B-06 conserva pendientes los umbrales y validación para uso real; B-07 la reevaluación y B-09 permisos transversales. Los pesos de M06 pueden diferir entre postulantes, por lo que no constituyen una rúbrica común ni un ranking validado.

RSF26, RSF27 y RSF29 verificados en el alcance descrito. RSF28 sigue parcial por la dependencia de ordenamiento por resultados; UI-RF-08/09/20 y el cierre integral de M07 requieren completar los aspectos pendientes y la validación IHC. M08 no se implementa: M07 registra el historial necesario, pero no añade una pantalla de seguimiento del postulante.

La prueba de navegador usa API simulada y la persistencia se prueba por separado con MariaDB; no se afirma una sesión real de extremo a extremo en navegador.
