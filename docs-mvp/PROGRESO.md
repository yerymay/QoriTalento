# Qori Talento — Progreso por etapas

**Estado inicial del paquete:** infraestructura de ejemplo creada en archivos, pero no instalada ni probada contra tu MySQL local. Ningún requisito RSF/RSNF/UI marcado completo sin pruebas.

**Estado actual (2026-11-04):** infraestructura verificada contra MariaDB local; Etapa 0 completada. Base M01 implementada y comprobada; en desarrollo el registro permite iniciar sesión de inmediato, mientras que en producción la activación sigue pendiente de B-03. M02 implementado en su alcance habilitado (borradores, edición, publicación/cierre de empresa y consulta); publicación particular pendiente de B-01/B-02. M03-M08 y validación IHC integral siguen pendientes.

## Etapa 0 — Preparar y conectar

- [x] Respaldar el repositorio; no sobrescribir `Backend/`, `Frontend/` ni documentación existente.
- [x] Ejecutar `database/01_schema.sql` en MySQL 8/MariaDB 10.6+ y comprobar 24 tablas.
- [x] Instalar dependencias en `Backend/` y `Frontend/`.
- [x] Iniciar Express; probar `/health` y `/api-docs`.
- [x] Iniciar Astro; visualizar conexión API.
- [x] Probar `/api/v1/system/db-check` con base de datos disponible.
- [x] Ejecutar `npm run check`/`npm run build` y pruebas disponibles.
- [x] Registrar la evidencia y recién entonces marcar esta etapa.

## Implementación funcional por módulos

- [ ] M01: usuarios, registro, inicio/cierre, perfiles y permisos. Base implementada y comprobada; activación de cuentas pendiente de B-03. Ver evidencia a continuación.
- [ ] M02: base de ofertas, requisitos, edición y publicación/cierre de empresa implementada y comprobada; publicación particular pendiente de B-01/B-02. Ver evidencia M02.
- [ ] M03: postular a ofertas y adjuntar CV PDF.
- [ ] M04: extraer PDF con texto, revisar y confirmar perfil.
- [ ] M05: exámenes con guardado por pregunta y plazo autoritativo.
- [ ] M06: calificación objetiva y evaluación asistida con Ollama (rúbrica pendiente).
- [ ] M07: resultados y decisión humana.
- [ ] M08: consulta, actualización y seguimiento de estados.
- [ ] Validación IHC: tareas con usuarios, heurísticas, responsive, accesibilidad, recuperación y cinco estados UI.

## Registro de evidencia (copiar por tarea)

```text
Fecha:
ID de requisito/tarea:
Funcionalidad:
Archivos principales:
Pruebas ejecutadas (comandos):
Resultado real:
Captura/enlace local:
Problemas abiertos:
Estado: [ ] Pendiente / [ ] En curso / [ ] Bloqueado / [ ] Hecho
```

## Evidencia — Etapa 0 (2026-11-03)

```text
Fecha: 2026-11-03
ID de requisito/tarea: Etapa 0
Funcionalidad: Preparar y conectar (schema, dependencias, Express, Astro, db-check, check/build/tests)
Archivos principales: database/01_schema.sql; Backend/src/app.ts; Backend/src/modules/system/*; Backend/tests/system.test.ts; Frontend/src/modules/compartido/components/EstadoConexion.astro; docs-mvp/PROGRESO.md
Pruebas ejecutadas (comandos):
- Backend: npm --prefix Backend run check
- Backend: npm --prefix Backend run test
- Backend: npm --prefix Backend run build
- Frontend: npm --prefix Frontend run check
- Frontend: npm --prefix Frontend run build
- GET http://127.0.0.1:3001/health
- GET http://127.0.0.1:3001/api/v1/system/health
- GET http://127.0.0.1:3001/api-docs/
- GET http://127.0.0.1:3001/api/v1/system/db-check
- GET http://127.0.0.1:4321/api/v1/system/db-check
- GET http://127.0.0.1:4321/
Resultado real:
- Backend check: OK (tsc --noEmit sin errores)
- Backend test: 4/4 pruebas aprobadas (1 archivo)
- Backend build: OK (tsc generó dist/)
- Frontend check: 0 errores, 0 warnings, 0 hints (5 archivos)
- Frontend build: OK (astro build; 1 página)
- GET /health: 200 {"status":"ok","service":"qori-talento-api"}
- GET /api/v1/system/health: 200 {"status":"ok","service":"qori-talento-api"}
- GET /api-docs/: 200 text/html; charset=utf-8 (Swagger UI)
- GET /api/v1/system/db-check: 200 {"connected":true}
- GET http://127.0.0.1:4321/api/v1/system/db-check: 200 {"connected":true}
- GET http://127.0.0.1:4321/: 200; contiene "Base de datos"
- MariaDB: 12.2.2-MariaDB en 127.0.0.1:3306; qori_talento con 24 tablas
- Repositorio: git main sincronizado con origin/main (commit f8d706b)
Captura/enlace local: http://127.0.0.1:3001/health; http://127.0.0.1:3001/api-docs/; http://127.0.0.1:4321/
Problemas abiertos: MySQL80 detenido y en inicio Disabled por decisión de entorno; MariaDB ocupa 3306. Backend/package-lock.json y Frontend/package-lock.json sin seguimiento en git (no se commiteó nada).
Estado: [x] Hecho
```

**Regla:** terminar un endpoint requiere implementación (4 capas), contrato OpenAPI, prueba de integración/caso negativo y pantalla cuando corresponda. Una ruta Swagger sin código no está implementada.

## Evidencia — M01 básico (2026-11-03)

```text
Fecha: 2026-11-03
ID de requisito/tarea: M01; RSF01–RSF04 (alcance básico); RSNF08; UI-RF-01, UI-RF-11–UI-RF-13 (pantallas preparadas)
Funcionalidad: registro de postulante/reclutador en estado PENDING_VERIFICATION, contraseña con scrypt, inicio/cierre de sesión para cuentas ya activas, cookie HttpOnly, perfil propio y control de acceso por rol. La interfaz muestra acceso, registro, perfil y paneles de llegada según el rol. Se aplicó database/02_auth_sessions.sql para sesiones persistentes.
Archivos principales: Backend/src/modules/auth/{controllers,services,repositories,persistence,routes}/*; Backend/src/app.ts; Backend/src/server.ts; Backend/openapi-implemented.yaml; Backend/tests/auth.test.ts; Backend/tests/auth.mysql.test.ts; database/02_auth_sessions.sql; Frontend/src/modules/auth/*; Frontend/src/pages/{login,registro,perfil}.astro; Frontend/src/pages/{reclutador,postulante}/ofertas.astro; Frontend/src/styles/global.css.
Pruebas ejecutadas (comandos):
- Backend/: npm run check; npm test; npm run build
- Backend/: TEST_MYSQL=1 npx vitest run tests/auth.mysql.test.ts (variable de entorno de PowerShell: $env:TEST_MYSQL='1')
- Frontend/: npm run check; npm run build
- Revisión en Chrome local de /login, /registro y /perfil a 1440 px y 390 px en tema claro y oscuro; perfil con datos sintéticos mediante interceptación de API.
- Interacción de registro en Chrome: botón deshabilitado inicialmente, habilitado con datos válidos, selector de reclutador visible y teléfono obligatorio para particular.
Resultado real:
- Backend: check y build correctos; 16 pruebas aprobadas en la suite normal (4 system + 12 auth), prueba MySQL optativa omitida en esa suite.
- Prueba MySQL optativa: 1 prueba aprobada contra MariaDB real; persistencia de ambos roles, rechazo de cuenta inactiva y duplicado, sesión, edición y revocación al cambiar correo. Se usaron y eliminaron cuentas sintéticas propias de la prueba.
- Frontend: Astro check sin errores ni advertencias; build de 6 rutas correcto.
- Chrome: sin desplazamiento horizontal en los dos anchos revisados; comportamiento del formulario conforme a las comprobaciones anteriores. Se ajustó el acceso móvil para mostrar el formulario antes del panel de marca, se redujo el espacio vacío del registro en escritorio y se distinguieron visualmente errores y éxitos. Perfil visual comprobado con datos sintéticos; no constituye prueba de sesión real en navegador.
- OpenAPI implementado actualizado solo con rutas funcionales de M01; la verificación no figura como implementada.
Captura/enlace local: capturas de revisión local de /login, /registro y /perfil (1440 px y 390 px); no se incorporaron al repositorio. Rutas locales: http://127.0.0.1:4321/login, /registro y /perfil cuando Astro usa el puerto predeterminado.
Problemas abiertos: B-03 (proveedor, caducidad, reintentos y activación por correo/SMS); cuentas recién registradas permanecen inactivas y no pueden iniciar sesión. Los paneles de ofertas son puntos de llegada de M01, no implementan ofertas de M02. Falta validación IHC integral en navegadores y usuarios reales; no se marcan requisitos completos que dependen de ella o de módulos posteriores.
Estado: [x] Base M01 implementada y probada / [ ] M01 completo por B-03
```

## Decisión de publicación M02 (2026-11-06)

- Decisión aprobada: cualquier reclutador puede publicar directamente una oferta propia completa; ya no se bloquea por `kind=INDIVIDUAL`.
- Condiciones conservadas: solo DRAFT → PUBLISHED, descripción y al menos un requisito; cerrar sigue siendo PUBLISHED → CLOSED y no hay reapertura.
- Evidencia: `Backend/npm.cmd run check`, `npm.cmd test` (44 pruebas aprobadas, 2 omitidas) y `npm.cmd run build`; `Frontend/npm.cmd run check` (0 errores) y `npm.cmd run build` (9 rutas).
- Pendientes sin cambio: B-01/B-02 solo definen una futura cuota o moderación; no bloquean la publicación directa aprobada.

## Evidencia - M02 ofertas (2026-11-04)

- Alcance implementado: crear borradores con código único; guardar cargo, descripción, área, ubicación/modalidad, experiencia, formación y requisitos ordenados; editar ofertas propias; publicar borradores de empresa; cerrar publicadas; buscar/paginar y consultar ofertas publicadas como postulante.
- Arquitectura: controllers → services → interfaces de repositorio → persistencia MySQL. Composición en server.ts y montaje en app.ts. Sesión activa y rol en las ocho operaciones; propiedad individual en consultas y mutaciones. Compartir empresa no concede permisos.
- Integridad: SQL parametrizado; oferta y requisitos en una transacción; bloqueo de la oferta para editar/publicar/cerrar; errores controlados con request_id. Estado y propietario no se aceptan en formularios. Publicación/cierre repetidos son idempotentes; no hay reapertura ni estados arbitrarios.
- Frontend: cinco rutas M02, componentes y servicio en modules/ofertas, marco compartido de M01. Sky/Inter, Tailwind v4 + Flowbite, claro/oscuro, carga inmediata, vacío, parcial, error y contenido. Búsqueda, filtros, confirmaciones, recuperación sin perder el formulario y protección de cambios ante salida voluntaria. Expiración limpia la sesión y oculta contenido privado.
- Referencias consultadas: Figma eoMSNdb9Cl0OmQU6BqKuZD, nodos 11107:1243, 11107:1886, 11107:6848 y 11107:7307. Se usaron como guía, conservando componentes/tokens existentes y eliminando controles de demostración y navegación fuera de alcance. Skills Impeccable y Emil Kowalski aplicadas de forma complementaria.
- Archivos: Backend/src/modules/ofertas/**; Backend/src/{app,server}.ts; Backend/openapi-implemented.yaml; Backend/tests/{ofertas.test,ofertas.mysql.test,migrate-ofertas}.ts; database/03_job_details.sql; Frontend/src/modules/ofertas/**; Frontend/src/modules/auth/{workspace.ts,components/Espacio.astro}; Frontend/src/pages/{reclutador,postulante}/*oferta*.astro; Frontend/tests/ofertas.browser.mjs.

Comprobaciones ejecutadas:

```powershell
# Desde Backend/
npm.cmd run check
npm.cmd test
npm.cmd run build
npx.cmd tsx tests/migrate-ofertas.ts
$env:TEST_MYSQL='1'
npx.cmd vitest run tests/ofertas.mysql.test.ts

# Desde Frontend/
npm.cmd run check
npm.cmd run build
# Con Astro en 127.0.0.1:4321
node tests/ofertas.browser.mjs
```

Resultados:

- Backend: check y build correctos; 42 pruebas aprobadas (26 M02, 12 auth, 4 system). Las dos pruebas MySQL optativas se omiten en la suite habitual.
- Integración MySQL optativa M02: 1 prueba aprobada contra la base local real. Comprueba persistencia de todos los campos, aislamiento por propietario, búsqueda literal/paginación, visibilidad de publicadas, bloqueo de particular, cierre, reversión completa tras fallo SQL y actualizaciones concurrentes sin perder campos. Solo crea/activa/elimina sus propios fixtures; no implementa activación de usuarios.
- Migración: area y location ya existían en la base local al comprobarla; el ejecutor no realizó ALTER. Para instalaciones nuevas es necesario aplicar 03_job_details.sql después de 01_schema.sql y 02_auth_sessions.sql. El ejecutor detecta migración completa o parcial.
- Frontend: Astro check con 0 errores, 0 warnings y 0 hints; build estático de 9 rutas correcto.
- Navegador Chrome automatizado: API sintética, sin alterar cuentas/ofertas reales. Crear, editar, conservar datos al fallar, publicar/cancelar/cerrar con confirmación, búsqueda/filtros, borrador incompleto, bloqueo particular, detalle no disponible, información parcial, carga, vacío, error/reintento, tema oscuro, menú móvil, descarte confirmado, cierre voluntario con cambios y expiración. Sin errores JavaScript ni desbordamiento horizontal en las vistas capturadas a 1440 y 390 px.
- Evidencia visual local (ignorada por git): .impeccable/review/m02-*.png (7 capturas) y m02-browser-result.json. No es una prueba de sesión real de extremo a extremo en navegador: la integración real de persistencia se prueba por separado.
- Detector Impeccable ejecutado una vez: aviso de color base en badge, revisado como sobrescrito por el color de estado. Revisión independiente final: disposición ship en el alcance de código/capturas suministradas. Se corrigieron contraste de placeholder oscuro y pérdida de cambios al cerrar sesión. Se conservó la identidad visual existente, sin cambiar el sistema de diseño.

Estado de requisitos:

- [x] RSF05, RSF06 y RSF08 implementados y comprobados.
- [ ] RSF07/M02 completo: edición y publicación/cierre de empresa implementados; publicación de particulares sigue bloqueada por B-01/B-02. La recepción de postulaciones y su rechazo en ofertas cerradas corresponde a M03, aún no implementado.
- [ ] UI-RF-02, UI-RF-03 y UI-RF-14 no se declaran completos: las transiciones usan acciones explícitas, no un selector arbitrario; el acceso a gestión se hace desde cada fila y Postular depende de M03.
- [ ] B-03 sigue pendiente: en producción las cuentas nuevas permanecen inactivas y no pueden iniciar sesión. No se añadieron OTP ni rutas de activación. En desarrollo se permite iniciar sesión con cuentas recién registradas como comodidad local.
- [ ] Validación IHC integral con usuarios reales, todos los navegadores, dispositivos físicos y auditoría formal de accesibilidad continúa pendiente.

Guía de ejecución y contrato: [M02-OFERTAS.md](M02-OFERTAS.md).

## Evidencia - Acceso inmediato en desarrollo (2026-11-04)

- Cambio: `active()` permite cuentas `PENDING_VERIFICATION` solo con `NODE_ENV=development`; sigue bloqueando `DISABLED` y roles inválidos. El registro responde "Cuenta creada. Ya puedes iniciar sesión." en desarrollo.
- Alcance: comodidad local para probar registro e inicio de sesión de postulante y reclutador. No implementa B-03, OTP, activación real ni rol administrador. En producción el comportamiento no cambia.
- Archivos: Backend/src/modules/auth/services/auth.service.ts; Backend/tests/auth.test.ts; Frontend/src/modules/auth/components/{Acceso,Registro}.astro; Backend/openapi-implemented.yaml; README-COMENZAR.md; docs-mvp/PROGRESO.md.
- Pruebas ejecutadas:
  - Backend: `npm run check` (OK); `npm test` (44 aprobadas, 2 omitidas; auth 14/14); `npm run build` (OK).
  - Frontend: `npm run check` (0 errores, 0 warnings, 0 hints); `npm run build` (9 rutas).
- Resultado: en desarrollo, postulante y reclutador pueden registrarse e iniciar sesión de inmediato; en entorno de pruebas/producción el login de cuentas pendientes sigue devolviendo 403.
- Problemas abiertos: B-03 sigue pendiente; la cuenta permanece `PENDING_VERIFICATION` en la base aunque el login se permita en desarrollo. No se repitió el login real en navegador en esta tarea.
Estado: [x] Comodidad de desarrollo implementada / [ ] B-03 pendiente
