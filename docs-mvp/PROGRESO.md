# Qori Talento — Progreso por etapas

**Estado inicial del paquete:** infraestructura de ejemplo creada en archivos, pero no instalada ni probada contra tu MySQL local. Ningún requisito RSF/RSNF/UI marcado completo sin pruebas.

**Estado actual (2026-11-06):** infraestructura verificada contra MariaDB local; Etapa 0 completada. M01 permite registro e inicio de sesión inmediato, sin aprobación externa. M02 permite a cualquier reclutador publicar varias ofertas propias, sin cuota ni moderación previa. M03 cuenta con registro, consulta y reemplazo de CV; sigue pendiente automatizar la eliminación según la política aprobada. M04 cuenta con extracción clásica, corrección y confirmación del perfil y revisión privada del reclutador con notas, verificado con pruebas y MariaDB. La precisión en un conjunto representativo de CV reales, M05-M08 y la validación IHC integral siguen pendientes.

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

- [ ] M01: usuarios, registro, inicio/cierre, perfiles y permisos. Registro activo e inicio inmediato; pendiente la validación IHC integral. Ver evidencia a continuación.
- [ ] M02: base de ofertas, requisitos, edición y publicación/cierre para cualquier reclutador implementada y comprobada; pendiente la validación IHC integral y M03 para recepción de postulaciones. Ver evidencia M02.
- [ ] M03: postular a ofertas y adjuntar CV PDF.
- [x] M04: base funcional de extracción, corrección y confirmación del perfil, revisión de PDF y notas; verificada con pruebas automatizadas, MariaDB y navegador. Pendiente medir precisión sobre CV representativos; B-07 sigue abierta.
- [ ] M05: exámenes con guardado por pregunta y plazo autoritativo.
- [ ] M06: calificación objetiva y evaluación asistida con Ollama (rúbrica pendiente).
- [ ] M07: resultados y decisión humana.
- [ ] M08: consulta, actualización y seguimiento de estados.
- [ ] Validación IHC: tareas con usuarios, heurísticas, responsive, accesibilidad, recuperación y cinco estados UI.

## Propuestas pendientes

- [ ] Retroalimentación multimodal: botón reutilizable integrado para prueba en el perfil; completar pruebas con dispositivos físicos y lectores de pantalla. Ver [guía](RETROALIMENTACION-VIBRACION.md).

## Evidencia histórica — componente multimodal retirado (2026-11-09)

Guardado de perfil con confirmación visual, sonido opcional y vibración opcional cuando el navegador la admite. Pruebas con respuestas simuladas: éxito, error, opciones, teclado y ausencia de API de vibración. axe-core 4.14.0: 0 infracciones en el componente visible; `npm run check` y `npm run build` completados. La prueba con hardware físico, lectores de pantalla y backend real sigue pendiente. Ver [reporte](AUDITORIA-COMPONENTE-MULTIMODAL.md).
## Botón multimodal reutilizable (2026-11-09)

Se retiró la integración anterior del perfil. El nuevo botón permite solicitar señales por activación o por evento explícito, con canales desactivados por defecto. En una página temporal con respuestas simuladas se verificaron múltiples instancias, teclado, confirmación explícita y ausencia de vibración. Pendiente integrar en un caso concreto y auditarlo con controles de preferencia, lectores de pantalla y dispositivos físicos.
## Audios en edición de perfil (2026-11-09)

La edición del perfil usa el botón reutilizable con los archivos de éxito, advertencia y error de `Frontend/public/audio/`. Una prueba de navegador con API simulada verificó los tres resultados, cancelación, controles y teclado; `npm run check` y `npm run build` pasaron. Pendiente comprobar percepción de sonido y vibración en dispositivos reales, lectores de pantalla y backend real.
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
Problemas abiertos: falta validación IHC integral en navegadores y usuarios reales; no se marcan requisitos completos que dependen de ella o de módulos posteriores.
Estado: [x] Base M01 implementada y probada / [ ] M01 completo por validación IHC integral
```

## Decisión de publicación M02 (2026-11-06)

- Decisión aprobada: cualquier reclutador puede publicar directamente una oferta propia completa; ya no se bloquea por `kind=INDIVIDUAL`.
- Condiciones conservadas: solo DRAFT → PUBLISHED, descripción y al menos un requisito; cerrar sigue siendo PUBLISHED → CLOSED y no hay reapertura.
- Evidencia: `Backend/npm.cmd run check`, `npm.cmd test` (44 pruebas aprobadas, 2 omitidas) y `npm.cmd run build`; `Frontend/npm.cmd run check` (0 errores) y `npm.cmd run build` (9 rutas).
- Decisiones registradas: B-01/B-02 quedan resueltas: no hay cuota ni moderación previa para las ofertas de reclutadores.

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
- Navegador Chrome automatizado: API sintética, sin alterar cuentas/ofertas reales. Crear, editar, conservar datos al fallar, publicar/cancelar/cerrar con confirmación, búsqueda/filtros, borrador incompleto, publicación de reclutador particular, detalle no disponible, información parcial, carga, vacío, error/reintento, tema oscuro, menú móvil, descarte confirmado, cierre voluntario con cambios y expiración. Sin errores JavaScript ni desbordamiento horizontal en las vistas capturadas a 1440 y 390 px.
- Evidencia visual local (ignorada por git): .impeccable/review/m02-*.png (7 capturas) y m02-browser-result.json. No es una prueba de sesión real de extremo a extremo en navegador: la integración real de persistencia se prueba por separado.
- Detector Impeccable ejecutado una vez: aviso de color base en badge, revisado como sobrescrito por el color de estado. Revisión independiente final: disposición ship en el alcance de código/capturas suministradas. Se corrigieron contraste de placeholder oscuro y pérdida de cambios al cerrar sesión. Se conservó la identidad visual existente, sin cambiar el sistema de diseño.

Estado de requisitos:

- [x] RSF05, RSF06 y RSF08 implementados y comprobados.
- [ ] RSF07/M02 completo: edición y publicación/cierre para cualquier reclutador implementados. La recepción de postulaciones y su rechazo en ofertas cerradas se implementaron posteriormente en M03; ver evidencia M03.
- [ ] UI-RF-02, UI-RF-03 y UI-RF-14 no se declaran completos: las transiciones usan acciones explícitas, no un selector arbitrario; el acceso a gestión se hace desde cada fila y Postular depende de M03.
- [x] B-03 resuelta: las cuentas nuevas quedan activas y pueden iniciar sesión de inmediato, sin OTP ni aprobación externa.
- [ ] Validación IHC integral con usuarios reales, todos los navegadores, dispositivos físicos y auditoría formal de accesibilidad continúa pendiente.

Guía de ejecución y contrato: [M02-OFERTAS.md](M02-OFERTAS.md).

## Decisión — acceso inmediato (2026-11-06)

- Cambio: las cuentas se crean con estado `ACTIVE`; `active()` sigue bloqueando `DISABLED` y roles inválidos. El registro responde "Cuenta creada. Ya puedes iniciar sesión." en cualquier entorno.
- Alcance: postulantes y reclutadores pueden registrarse e iniciar sesión de inmediato, sin OTP, verificación ni aprobación de superadministrador.
- Archivos: Backend/src/modules/auth/services/auth.service.ts; Backend/src/modules/auth/persistence/mysql-auth.repository.ts; Backend/tests/auth.test.ts; Frontend/src/modules/auth/components/{Acceso,Registro,Espacio}.astro; Backend/openapi-implemented.yaml; docs-mvp/REGLAS-NEGOCIO.md; docs-mvp/PROGRESO.md.
- Pruebas ejecutadas:
  - Backend: `npm run check` (OK); `npm test` (44 aprobadas, 2 omitidas; auth 14/14); `npm run build` (OK).
  - Frontend: `npm run check` (0 errores, 0 warnings, 0 hints); `npm run build` (9 rutas).
- Resultado: `npm.cmd run check`, `npm.cmd test` (44 pruebas aprobadas, 2 MySQL omitidas) y `npm.cmd run build` del backend correctos; `npm.cmd run check` y `npm.cmd run build` del frontend correctos. Postulante y reclutador pueden registrarse e iniciar sesión de inmediato en desarrollo y producción.
- Problemas abiertos: no se añadió OTP ni verificación porque la decisión vigente no las requiere.
Estado: [x] B-03 resuelta y validada

### Avance M03 — 2026-11-06

- Implementados registro y listado de postulaciones, sustitución de CV en estado inicial, verificación de propiedad y rol, validación estructural y de texto PDF, límite de 5 MB y rechazo transaccional de duplicados activos.
- Interfaz de postulación y listado con confirmación, progreso, cancelación y recuperación. Contrato registrado en `Backend/openapi-implemented.yaml`.
- Validado: `npm run check` y `npm run build` en ambos proyectos; suite del backend 49 pruebas aprobadas, 3 pruebas MySQL omitidas en la ejecución general; la prueba MySQL de M03 pasó por separado. Las pruebas M03 actuales usan repositorio falso.
- La base existente requiere aplicar `database/04_m03.sql`; aún no hay evidencia de integración de M03 con MySQL real.
- La migración 04 fue aplicada por el usuario con una cuenta administradora. La prueba de M03 con MySQL real pasó: aislamiento, envío concurrente, reemplazo y cierre de la oferta; los datos sintéticos se eliminaron al terminar.
- La acción de finalización de proceso fue verificada con MySQL real: comprueba propietario y mantiene la fecha en llamadas repetidas.
- Revisión visual con Playwright y datos simulados: formulario, archivo inválido, confirmación y resultado, listado vacío, tema oscuro y ausencia de desbordamiento horizontal a 390 px.
- Pendiente: eliminación segura o anonimización automática de todos los datos asociados a los dos años y validación IHC integral. M03 permanece sin marcar como completo; la política de conservación no está automatizada.

### Avance M04 — 2026-11-06

- Implementadas las cuatro capas de `Backend/src/modules/cv/`, inyectadas desde `server.ts` y montadas exclusivamente en `app.ts`. Contrato de nueve operaciones M04 en `Backend/openapi-implemented.yaml` (versión 0.4.0).
- La carga y el reemplazo de M03 extraen texto de todas las páginas, reconocen secciones y contactos, y guardan propuesta y PDF en la misma transacción. Los CV anteriores se procesan al abrir la revisión. Se conserva evidencia por página y texto original; no se utiliza OCR ni IA generativa.
- Confirmación del postulante con validación estricta, actualización atómica de perfil curricular/nombre/teléfono, versiones por postulación, idempotencia, control de CV reemplazado y detección de otra confirmación concurrente. El correo curricular no sustituye al correo de acceso.
- Revisión privada del reclutador propietario: lista de postulantes de su oferta, PDF original asociado al perfil confirmado y notas. No puede editar datos fuente ni recibir propuestas sin confirmar.
- UI conectada desde carga y listado de postulaciones, listado de ofertas y Mi perfil. Dos paneles en escritorio, pestañas con teclado en móvil, edición explícita, datos no detectados, confirmación, error recuperable y limpieza al cerrar sesión.
- `npm.cmd run check` y `npm.cmd run build`: aprobados en Backend y Frontend; Astro reporta 0 errores, 0 advertencias y 0 sugerencias. Las tres fuentes de pruebas M04 también pasaron un chequeo TypeScript estricto separado, ya que el tsconfig habitual excluye tests.
- `npx.cmd vitest run`: 59 pruebas aprobadas y 4 pruebas de integración omitidas por requerir `TEST_MYSQL=1`. Dentro de esas 59, M04 aporta 10 pruebas de extracción/API. Se mantuvieron las pruebas M01–M03.
- `TEST_MYSQL=1` con `tests/cv.mysql.test.ts`: 1 prueba de integración aprobada en MariaDB local. Verificó extracción persistida al cargar, confirmación simultánea sin duplicados, aislamiento de propietarios, notas, actualización de cuenta, reemplazo, conflicto de versión y conservación de expedientes de otras ofertas. Los registros sintéticos creados por la prueba se eliminaron al terminar. No fue necesaria una migración M04.
- `node tests/cv.browser.mjs http://127.0.0.1:4323`: aprobado con API sintética. Verificó carga, corrección, error de guardado sin perder entrada, confirmación, Mi perfil, parcial/vacío/error, pestañas con teclado, notas, expiración de sesión y ausencia de desbordamiento horizontal. Capturas inspeccionadas a 1440 px y 390 px, incluido tema oscuro, en `.impeccable/review/m04-*.png`. El puerto es el servidor de revisión de esta sesión; el script acepta cualquier URL local de Astro.
- Detector de diseño: sin hallazgos. Se conservaron Sky/Inter y componentes existentes. La revisión independiente solicitada a un subagente falló por límite de uso; fue sustituida por revisión en este hilo, sin presentarla como aprobación independiente. Las capturas finales muestran campos y controles legibles, pestaña activa diferenciada y PDF renderizado; no constituyen una auditoría de accesibilidad integral.
- Requisitos funcionales RSF13–RSF16.1 y UI-RF-05/16/17 marcados con esta evidencia. Límites y procedimiento reproducible en [M04-IMPLEMENTACION.md](M04-IMPLEMENTACION.md).
- Pendiente: medir precisión y cobertura con un conjunto representativo de CV reales consentidos o anonimizados. Las pruebas sintéticas no demuestran un porcentaje de exactitud en documentos arbitrarios. B-07 (reevaluación) y validación IHC integral continúan pendientes.

## Perfil de cuenta y DNI — 2026-11-10

- Perfil: consulta en lista descriptiva y edición separada de nombre, correo, teléfono y DNI opcional; el rol se muestra sin edición. Se conservó el perfil curricular existente.
- DNI: exactamente ocho dígitos cuando se proporciona, sin verificación de identidad externa. Migración separada `database/05_profile_dni.sql`; en la base local la columna `users.dni CHAR(8) NULL` ya existía, por lo que no se ejecutó ALTER.
- Teléfono de perfil: formato de 7 a 15 dígitos con código de país opcional. Se valida en UI y backend; no se comprueba que el número exista. Sigue siendo obligatorio para reclutadores particulares.
- Evidencia: pruebas del backend, comprobaciones de tipos y compilación; prueba `TEST_MYSQL=1 npx vitest run tests/profile.mysql.test.ts` aprobada con cuenta sintética eliminada al finalizar. Navegador: consulta, edición, cancelación y rechazo de DNI/teléfono inválidos con API simulada en móvil.

## Mis ofertas: postulantes, cierre y eliminación — 2026-11-10

- La lista propia incluye `applicant_count`: número de personas distintas con postulaciones de cualquier estado para cada oferta. No se expone en el listado público de postulantes.
- Se añadió `DELETE /api/v1/recruiter/jobs/{jobId}` con sesión, rol, propiedad y protección de origen. La eliminación transaccional bloquea ofertas con postulaciones, exámenes o revisiones asociadas; si procede elimina únicamente los requisitos y la oferta. No se eliminan CV ni expedientes.
- La tabla permite cerrar y eliminar mediante dos confirmaciones; el cierre del editor también requiere dos pasos y no finaliza el proceso. La creación de exámenes no se habilitó.
- Evidencia: pruebas de API con casos de propiedad, rol, origen y datos extra; prueba MySQL `TEST_MYSQL=1 npx vitest run tests/ofertas-delete.mysql.test.ts` con registros sintéticos eliminados al finalizar; comprobación de tipos, compilación y prueba de navegador con API simulada para cancelar, confirmar, proteger postulaciones y refrescar la lista.
