# M02 — Ofertas laborales

M02 permite que cualquier reclutador publique una oferta completa. Las definiciones futuras de cuota y moderación siguen pendientes de B-01/B-02; la activación de cuentas depende de B-03. No se añadieron reglas de cuota, pesos de requisitos, postulación ni reapertura.

## Preparación local

Desde `Backend/`, con las dependencias y `.env` configurados:

```powershell
npx.cmd tsx tests/migrate-ofertas.ts
npm.cmd run dev
```

La migración `database/03_job_details.sql` añade `area` y `location` opcionales a `jobs`. El SQL se ejecuta una sola vez; el ejecutor comprueba si ambas columnas ya existen y rechaza un estado parcial. No modifica `01_schema.sql` ni migra silenciosamente al iniciar el servidor. Las instalaciones nuevas necesitan 01, 02 y 03, en ese orden. El usuario que aplique el ALTER necesita ese permiso; no es necesario concedérselo permanentemente al usuario de la aplicación.

Desde `Frontend/`:

```powershell
npm.cmd run dev
```

API: `http://127.0.0.1:3001`. Frontend: `http://127.0.0.1:4321`. El proxy `/api` funciona solo en desarrollo; el despliegue estático requiere enrutar `/api` al backend bajo el mismo origen.

## Uso

- Reclutador: `/reclutador/ofertas`, `/reclutador/nueva-oferta` y `/reclutador/editar-oferta?id=...`.
- Postulante: `/postulante/ofertas` y `/postulante/oferta?id=...`.
- Las páginas cargan los datos tras validar una sesión activa del rol correcto. Registrar una cuenta no la activa; B-03 sigue abierto.
- Basta el cargo para guardar un borrador. Cualquier reclutador puede publicar una oferta con descripción y al menos un requisito. Área, ubicación/modalidad, experiencia y formación pueden completarse posteriormente; los datos ausentes se muestran como no especificados.
- Editar conserva el estado. Publicar y cerrar son acciones separadas, con confirmación. Cerrar retira la oferta del listado y del detalle de postulantes; no permite reabrirla.
- Guardar, publicar y cerrar bloquean envíos repetidos mientras se procesa la solicitud. Los errores de guardado conservan el formulario. Descartar y cerrar sesión con cambios requieren confirmación; la expiración invalida inmediatamente el acceso.

## API implementada

Contrato completo en `Backend/openapi-implemented.yaml`, disponible en `/api-docs/`.

- `GET /api/v1/jobs`: ofertas publicadas, rol postulante.
- `GET /api/v1/jobs/{jobId}`: detalle publicado, rol postulante.
- `GET /api/v1/recruiter/jobs`: solo ofertas propias.
- `GET /api/v1/recruiter/jobs/{jobId}`: detalle propio, incluido borrador/cerrada.
- `POST /api/v1/recruiter/jobs`: crear borrador.
- `PATCH /api/v1/recruiter/jobs/{jobId}`: editar datos; requisitos se sustituyen si se envían.
- `POST /api/v1/recruiter/jobs/{jobId}/publish`: publicar borrador propio.
- `POST /api/v1/recruiter/jobs/{jobId}/close`: cerrar publicada propia.

Las mutaciones exigen JSON y `X-Qori-Client: web`. Las acciones publicar/cerrar reciben `{}`. Los listados admiten `q`, `page` y `page_size`; solo el listado propio admite `status`. La identidad nunca se acepta desde el formulario. Una oferta ajena/no disponible devuelve 404; el propietario se omite de la respuesta del postulante.

Los límites de longitud y paginación son validaciones técnicas documentadas en OpenAPI. La integridad del contenido publicado se valida también al editarlo. Los estados reconocidos en este módulo son DRAFT, PUBLISHED y CLOSED; los estados heredados desconocidos no admiten mutaciones. No se crean rutas de moderación.

## Verificación

Backend: `npm.cmd run check`, `npm.cmd test` y `npm.cmd run build`. La suite normal usa repositorios falsos y no requiere MySQL. Para persistencia real, establecer `TEST_MYSQL=1` y ejecutar `npx.cmd vitest run tests/ofertas.mysql.test.ts`; utiliza fixtures sintéticos y los limpia al terminar.

Frontend: `npm.cmd run check` y `npm.cmd run build`. Con Astro activo y Chrome instalado, `node tests/ofertas.browser.mjs` ejecuta la comprobación de interfaz con API sintética y guarda evidencia en `.impeccable/review/`. No sustituye la validación con usuarios ni una prueba completa del navegador contra una cuenta real.

Resultados y límites: [PROGRESO.md](PROGRESO.md), evidencia del 2026-11-04.
