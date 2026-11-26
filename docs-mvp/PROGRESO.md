# Qori Talento — Progreso por etapas

**Estado inicial del paquete:** infraestructura de ejemplo creada en archivos, pero no instalada ni probada contra tu MySQL local. Ningún requisito RSF/RSNF/UI marcado completo sin pruebas.

**Estado actual (2026-11-25):** infraestructura y bases M01–M04 implementadas. La copia local también contiene M05 (exámenes), M06 (evaluación indicativa con revisión humana) y M07 (resultados y flujo de selección aprobado sin reversión). M07 fue comprobado con pruebas API, MariaDB y navegador; ver evidencia al final. Siguen pendientes la validación de precisión/rúbrica y umbrales de B-06, B-07, retención automatizada, cierre IHC integral y M08.

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
- [ ] M06: calificación objetiva y evaluación asistida con Ollama. B-06 aprobada parcialmente: fórmula 60/40 con examen o perfil sobre 100 sin examen, y preguntas filtro como apoyo; aprobados niveles por requisito y pesos ajustables; pendientes umbrales y validación.
- [ ] M07: resultados y decisión humana implementados en el alcance aprobado; RSF26/27/29 verificados. Pendientes ranking/umbrales de B-06 y validación IHC integral. Ver evidencia del 2026-11-25.
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

## Evidencia — Tarjetas del postulante y wizard (2026-11-10)

- Se rediseñaron las tarjetas de ofertas para el postulante con departamento, modalidad/ubicación, descripción de dos líneas y acceso directo «Postularme ahora». Se conserva Inter, Sky y los temas claro/oscuro. La API aún no proporciona logo o nombre de empresa; se utiliza un icono neutral.
- El flujo de postulación tiene tres pasos: cargar PDF, revisar/corregir los nueve grupos de datos extraídos y confirmar el envío con consentimiento para compartir el CV. Por decisión explícita del usuario se mantiene PDF digital con texto, hasta 5 MB; no se añadió DOCX.
- Nuevo endpoint autenticado `POST /api/v1/candidate/cv-preview`, documentado en `Backend/openapi-implemented.yaml`. El controlador llama al servicio de validación/extracción existente; la vista previa trabaja en memoria y no necesita una operación de repositorio/persistencia porque no registra datos ni archivos. El registro definitivo conserva las cuatro capas de M03 y la confirmación de perfil de M04.
- La postulación solo se registra desde el tercer paso. La confirmación del perfil se realiza después mediante la API existente. Si falla esta segunda operación, la UI distingue el éxito parcial y permite reintentar sin registrar otra postulación. Ante un envío de resultado incierto por red se pide consultar Mis postulaciones.
- La casilla describe el uso de datos de esta postulación; no se inventaron documentos legales, condiciones de retención ni enlaces a políticas inexistentes.

Verificación:
- Backend: `npm run check`, `npm test`, `npm run build`: correctos. 65 pruebas aprobadas; 6 pruebas optativas de MySQL omitidas. Las pruebas nuevas verifican extracción sin registro, sesión/rol/origen, PDF inválido, tamaño y rechazo de campos adicionales.
- Frontend: `npm run check`: 0 errores, 0 advertencias, 0 sugerencias (59 archivos). `npm run build`: correcto, 14 rutas.
- OpenAPI parseado con YAML; endpoint de vista previa presente.
- `node tests/application-wizard.browser.mjs http://127.0.0.1:3010`: correcto con API y datos sintéticos. Comprueba enlaces de tarjetas, PDF, error/reintento de extracción, ausencia de envío anticipado, correcciones conservadas al retroceder, consentimiento, resumen, reintento de confirmación sin duplicados, reemplazo de CV, nombre obligatorio y limpieza de sesión. Sin errores JavaScript ni desbordamiento horizontal.
- Capturas inspeccionadas a 1440 y 390 px, incluido tema oscuro: `.impeccable/review/candidate-cards-*.png` y `candidate-wizard-*.png`. Detector de diseño sin hallazgos en los componentes modificados.
- Límites de la evidencia: no se ejecutó el recorrido completo contra MySQL ni se midió la precisión del extractor con CV reales; las pruebas de interfaz utilizan API simulada.

## Se?ales multimodales en m?dulos implementados (2026-11-13)

Se integraron se?ales de progreso, ?xito, error y cancelaci?n seg?n la acci?n en registro, perfil, ofertas, postulaciones y revisi?n de CV. El espacio de trabajo permite controlar sonido y vibraci?n; las preferencias se guardan localmente y la vibraci?n empieza desactivada. Los mensajes visuales existentes se conservan. Verificaci?n t?cnica: `npm run check` y `npm run build` del frontend. Pendientes: pruebas con backend real, dispositivos f?sicos y lectores de pantalla.


### Detalle ampliado de ofertas — 2026-11-15

- Registro y edición de modalidad separada, jornada, funciones y beneficios opcionales; selección de beneficios frecuentes y texto personalizado. Las ofertas antiguas conservan su descripción y ubicación; la modalidad heredada se interpreta solo cuando coincide con el formato reconocido.
- API documentada en openapi-implemented.yaml; migración aditiva database/06_job_content.sql. Ver instrucciones en M02-OFERTAS.md.
- Verificación: comprobación y compilación de frontend y backend, 67 pruebas backend aprobadas (6 omitidas), prueba MySQL de ofertas aprobada con datos sintéticos y prueba de navegador con API simulada, incluidos los campos nuevos.
- Pendiente: validación de usabilidad con usuarios y pruebas adicionales del formulario con lector de pantalla.

## Evidencia — M06, evaluación asistida (2026-11-22)

- Implementadas las cuatro capas de `Backend/src/modules/evaluacion/`, adaptador local Ollama, composición en `server.ts` y cuatro endpoints exclusivamente en `Backend/openapi-implemented.yaml` (0.6.0).
- Nota objetiva de exámenes finalizados calculada desde M05; perfil confirmado por postulación desde M04; requisitos con evidencia y explicación; sugerencias separadas de la revisión humana; fórmula 60/40 o 100, pesos ajustables y total pendiente cuando falta evidencia/revisión. No se cambia ningún estado de selección.
- Migración aditiva `database/07_m06_evaluacion.sql`: historial inmutable de revisiones con actor/fecha. La tabla ya estaba presente al verificar la base local y coincidía con el esquema; no se alteraron tablas existentes.
- Autorización de sesión/rol/propiedad, protección de origen, rechazo de campos adicionales, notas idempotentes y revisiones concurrentes. Huella de fuentes para conservar evaluaciones históricas sin inventar reevaluaciones de B-07. Varios exámenes se califican individualmente; total combinado pendiente de regla.
- UI integrada desde cada postulante, como confirmó el usuario: `/reclutador/evaluacion?application=...`. Tokens Sky/Inter y marco Tailwind/Flowbite existentes; estados de carga, vacío, parcial, contenido y error. Revisión humana, pesos, recuperación sin perder cambios y limpieza por expiración. Se consultó Figma, ficha `11107:4159`, como guía de jerarquía; no se trasladaron decisiones M07 ni umbrales simulados.
- Verificación backend: `npm.cmd run check`, `npm.cmd test` y `npm.cmd run build` correctos. Suite: **114 pruebas aprobadas, 8 MySQL optativas omitidas**; M06 aporta **34 pruebas**. Chequeo TypeScript estricto separado de los tres archivos de pruebas M06 correcto.
- `TEST_MYSQL=1 npx.cmd vitest run tests/evaluacion.mysql.test.ts`: **1 prueba aprobada**, con nota objetiva, aislamiento, preparación concurrente idempotente, revisión concurrente, historial, rollback y conservación de la versión de perfil por postulación. Limpieza de los fixtures al terminar.
- Frontend: `npm.cmd run check` con **0 errores, 0 advertencias y 0 sugerencias**; `npm.cmd run build` correcto (**20 rutas**).
- `node tests/evaluacion.browser.mjs http://127.0.0.1:4321`: aprobado con API sintética. Preparación, sugerencias, revisión, fallo al guardar sin pérdida, fuentes obsoletas, perfil sin confirmar, caducidad de sesión y limpieza. Capturas inspeccionadas a 1440 y 390 px, claro/oscuro, sin errores JavaScript ni desbordamiento horizontal: `.impeccable/review/m06-*.png`. Detector Impeccable ejecutado una vez: sin hallazgos.
- **Límite de evidencia:** Ollama local no estaba disponible. No se presentan las respuestas sintéticas como prueba del modelo real ni como validación de B-06 por un reclutador. Permanecen pendientes la precisión/sesgo/latencia reales, los umbrales, B-07 y la evaluación IHC integral.
- RSF22 marcado con esta evidencia. RSF23/24 permanecen parciales y RSF25 pendiente. Guía: [M06-IMPLEMENTACION.md](M06-IMPLEMENTACION.md).

- Revisión independiente de interfaz: detectó que el aviso de guardado quedaba fuera de vista en móvil. Se corrigió llevando foco y vista al aviso en éxito y error; la prueba de navegador verificó ambos con teclado y conservación de campos. La segunda revisión independiente no pudo completarse por límite de uso; no se afirma un dictamen independiente final.


## Evidencia — componentes UI, DESIGN §2, §6 y §7 (2026-11-22)

- Alcance aprobado: tokens de capas, elevación, radios, espaciado y movimiento; nueve componentes compartidos; migración de primitivas visuales manteniendo rutas, estructura y lógica de negocio. Fuente: DESIGN suministrado como adjunto por el usuario, no incorporado al repositorio.
- Biblioteca en `Frontend/src/modules/compartido/components/ui/`, con guía de props y uso en `README.md`. Estilos únicos en `Frontend/src/styles/ui.css` tanto para Astro como para contenido generado por JavaScript; retiradas las definiciones duplicadas de botones/paneles/avisos/etiquetas.
- Componentes: Button, Panel, Badge, Switch, Alert, Toast, Skeleton, EmptyState y Menu. Button conserva enlaces con href dinámico y el estado nativo de botones habilitados por los formularios. Menús con navegación por teclado; avisos con cierre, roles accesibles, pausa, máximo tres y espacio propio bajo la cabecera.
- `/dev/componentes` disponible exclusivamente en desarrollo, sin acceso desde navegación y ausente del resultado estático. Galería con variantes, cinco estados UI, claro/oscuro y movimiento reducido.
- Verificación final: `npm run check` (0 errores, 0 advertencias, 0 sugerencias), `npm run build` (20 rutas) y `git diff --check` correctos.
- Pruebas aprobadas con API sintética: `componentes.browser.mjs`, `ui-ofertas.browser.mjs`, `examenes.browser.mjs`, `evaluacion.browser.mjs`, `cv.browser.mjs`, `application-wizard.browser.mjs` y `nueva-oferta-wizard.browser.mjs`. Incluyen navegación, error/reintento sin pérdida, sesión, enlaces dinámicos, teclado, temas y móvil. La prueba antigua `ofertas.browser.mjs` se detiene en un selector que busca visible el enlace «Gestionar…» antes de abrir el menú Acciones; no se presenta esa prueba como aprobada. La nueva prueba de regresión usa los controles actuales.
- Capturas inspeccionadas: `.impeccable/review/componentes-{1440,390}-{claro,oscuro}.png`, sin desbordamiento horizontal. Detector Impeccable ejecutado una vez sobre la biblioteca: sin hallazgos.
- Límite: la revisión independiente no pudo ejecutarse por límite de uso del agente. Se realizó revisión propia de código y de las capturas; no se afirma un dictamen independiente. No se validó con lectores de pantalla físicos.
- Sin cambios de API, base de datos, reglas de puntuación ni decisiones de selección. Se conservaron los cambios previos del usuario en `.gitignore`.


## Evidencia — shell §3 y Configuración, plantilla E (2026-11-22)

- Sidebar agrupado por Reclutamiento y Cuenta, contraíble a iconos en escritorio y Drawer en móvil. Eliminada la tarjeta «Mi espacio / Tu cuenta» y el cierre de sesión del sidebar. Pie con Configuración y ayuda contextual dentro de Configuración.
- Topbar de 56 px con breadcrumb y menú de usuario: perfil, configuración y cierre de sesión. Se retiraron los controles globales de tema/contraste y la opción de tema del menú de usuario.
- Configuración con navegación de secciones: Apariencia, Idioma, Sonido y vibración, Cuenta. Apariencia incluye tema claro/oscuro/sistema con previsualización y radios nativos, y alto contraste mediante Switch. Preferencias persistentes en el navegador, seguimiento de cambios del sistema y sincronización entre pestañas.
- Corregida la clave de traducción estática del nombre dinámico del usuario y retiradas las referencias a elementos eliminados. La carga de cuenta muestra nombre/rol al resolver; ante fallo muestra estado de error y Reintentar, con acceso privado oculto. Una sesión inválida solicita iniciar sesión.
- Verificado el login completo sin toast. Se conserva su señal multimodal existente.
- Validación: `npm run check` (0 errores/advertencias/sugerencias), `npm run build` (20 rutas), `git diff --check`. Pruebas con API sintética: `configuracion.browser.mjs` y regresión `evaluacion.browser.mjs` aprobadas. Incluyen roles, error/reintento, sesión, traducción sin sobrescribir nombre, tema Sistema, persistencia, switches, teclado en menú, navegación móvil y ausencia de desbordamiento.
- Capturas inspeccionadas a 1440 y 390 px en claro/oscuro: `.impeccable/review/configuracion-*.png`. No se modificaron endpoints ni reglas de negocio.


## Evidencia — Mis ofertas, plantilla A (2026-11-22)

- Encabezado sobre canvas con título, contexto y Crear oferta a la derecha. Slot de acciones del encabezado compartido; la acción aparece tras validar sesión y se oculta al expirar o en vacío sin filtros, donde queda un único CTA centrado.
- Búsqueda del reclutador con icono, debounce de 300 ms y chips Todas/Publicadas/Borradores/Cerradas; sin botón Buscar. Conserva el foco durante las consultas, reinicia paginación al filtrar y descarta respuestas anteriores mediante la época de carga existente.
- Tabla en Panel, filas clicables mediante el enlace nativo del título, badge de estado, conteo alineado a la derecha y menú de icono de tres puntos. Acción de gestionar visible al hover/foco y disponible en pantallas táctiles. Los clics en controles de la fila no activan su navegación. Se conservan las confirmaciones de acciones destructivas.
- Estados: contenido, vacío con CTA, parcial con aviso de datos pendientes en borradores, carga Skeleton y error Alert con reintento. Vacío por filtros ofrece Limpiar filtros. Conteo y paginación al pie.
- Móvil: desplazamiento horizontal contenido en la tabla; se corrigió el desbordamiento de etiquetas accesibles posicionadas fuera de su contenedor.
- Verificación: `npm run check` (0 errores/advertencias/sugerencias), `npm run build` (20 rutas), `git diff --check` correctos. `mis-ofertas.browser.mjs` aprobado con API sintética: estados, debounce, concurrencia, chips, paginación, menú/teclado, filas, sesión y capturas. Regresiones `application-wizard.browser.mjs` y `ui-ofertas.browser.mjs` aprobadas; esta última abre ahora la sección Sonido de Configuración explícitamente.
- Capturas revisadas a 1440/390 px en claro/oscuro y estados vacío/error/carga: `.impeccable/review/mis-ofertas-*.png`. Datos sintéticos identificados en la prueba; no se crearon ofertas reales ni se alteraron endpoints o reglas de negocio.


## Evidencia — Mi perfil, plantilla D (2026-11-22)

- Cabecera sobre canvas con avatar de iniciales, nombre, badge de rol y Editar. Datos personales y Datos de contacto en grilla de dos columnas, con edición inline por sección y una sección activa a la vez.
- DNI enmascarado con los últimos cuatro dígitos y controles Mostrar/Ocultar. El campo de edición comienza oculto; se vuelve a enmascarar al guardar, cancelar o cambiar de pestaña. Los campos y textos de datos personales se limpian al terminar la sesión.
- Lógica de edición en `Frontend/src/modules/auth/account-profile.ts`, separada del marco de sesión. Usa el endpoint de cuenta existente y conserva los valores de la otra sección. Validación al salir del campo y al enviar; confirmación de cambios sensibles conservada.
- Guardado inline `Guardando… → Guardado`, sin toast. Bloqueo de campos durante envío, retorno del foco al botón de edición y Alert con reintento sin pérdida de lo escrito ante error. Se conservan las señales multimodales configuradas por el usuario.
- Verificación: `npm run check` (0 errores/advertencias/sugerencias) y `npm run build` (20 rutas) correctos. `perfil.browser.mjs` aprobado con API sintética: máscara DNI, validación, guardado, error/reintento, cancelación, confirmación de cambio de correo y teléfono obligatorio, roles y limpieza por expiración. Regresiones `cv.browser.mjs` y `configuracion.browser.mjs` aprobadas.
- Capturas inspeccionadas a 1440/390 px en claro y oscuro: `.impeccable/review/perfil-{1440,390}-{claro,oscuro}.png`; captura adicional de error conservando los campos. Sin desbordamiento horizontal.
- No se modificaron endpoints ni reglas de negocio. La edición de datos curriculares confirmados conserva el flujo existente de revisión de CV.


## Evidencia — editor de preguntas y revisión de pruebas (2026-11-22)

- Estado vacío de pruebas centrado, con CTA y sin panel anidado. Vacío de preguntas con una sola acción para crear la primera.
- Reemplazados Subir/Bajar por asas en los chips de preguntas. Orden mediante arrastre con eventos de puntero y atajos Alt + flechas / Inicio / Fin, anuncio de posición y conservación de la pregunta seleccionada, sus alternativas y su clave correcta.
- Eliminar pregunta y eliminar alternativa dentro de menús de tres puntos con teclado y Escape. Se conserva la confirmación cuando corresponde y se explica el mínimo de dos alternativas.
- Alternativas compactas con etiqueta visible Correcta y selección única; paginador del editor como chips. Textareas ajustadas a su contenido y distribución móvil sin desbordamiento.
- Revisión con Alert de advertencia, detalle de pendientes y enlaces Ir a la pregunta N que llevan el foco al enunciado. Publicar prueba deshabilitado mientras falta configuración o contenido, con motivo visible y asociado mediante aria-describedby.
- Guardado de borrador exclusivamente inline: Guardando… / Borrador guardado; se retiró el Alert de éxito del guardado. Toast de éxito únicamente al publicar.
- Validación: `npm run check` (0 errores/advertencias/sugerencias), `npm run build` (20 rutas) y `git diff --check` correctos. `editor-preguntas.browser.mjs` aprobado con API sintética: arrastre y teclado persistidos, selección y contenido conservados, menús, advertencias/enlaces, bloqueo/motivo, reintento y toast solo al publicar. Regresión completa `examenes.browser.mjs` aprobada, incluidos intentos, guardado de respuestas, envío, caducidad y sesión.
- Capturas inspeccionadas: `.impeccable/review/preguntas-{1440,390}-{claro,oscuro}.png`, vacío y revisión pendiente. No se escribieron exámenes reales ni se modificaron endpoints o reglas de negocio. El arrastre se verificó con ratón en navegador; no se afirma una prueba en dispositivo táctil físico.


## Evidencia — editor de ofertas: voz, acciones y progreso (2026-11-22)

- Micrófonos integrados en los campos de texto y desplegables; retirada la tarjeta grande de voz y la nota de reclutador particular. Respuesta compacta de dictado con deshacer, aclaración ante conflicto con teclado y recuperación tras fallos. Cada micrófono dicta exclusivamente en su campo y conserva la frase completa. Se mantiene el motor y el uso de preferencias de sonido/vibración existentes.
- Enlace de retorno integrado en el breadcrumb Mis ofertas / Nueva oferta o Gestionar oferta.
- Barra de acciones fija al pie, ajustada al sidebar normal/contraído y al ancho móvil. Espacio reservado según su altura y desplazamiento del campo enfocado para que el teclado no lo deje detrás de la barra.
- Guardado inline Guardando… / Guardado; sin Alert ni toast de éxito del borrador. Los errores conservan el contenido y permiten reintentar.
- Stepper con contador y progress accesible calculados desde los datos. Recorrer una sección incompleta no la marca como completa; cambiar datos invalida el estado de revisión guardada. Condiciones se completa tras revisarla y la revisión termina al guardar. Los estados se reinician al terminar sesión.
- Verificación: `npm run check` (0 errores/advertencias/sugerencias), `npm run build` (20 rutas) y `git diff --check` correctos. `oferta-editor.browser.mjs` aprobado con API y reconocimiento de voz sintéticos: dictado por campo, deshacer, conflicto, aislamiento entre campos, fallo de permiso con continuidad por teclado, breadcrumb, barra fija, progreso, guardado, reintento y sesión. `nueva-oferta-wizard.browser.mjs` aprobado; expectativa actualizada al estado inline.
- Capturas inspeccionadas a 1440/390 px en claro/oscuro: `.impeccable/review/oferta-editor-{1440,390}-{claro,oscuro}.png`. La prueba de reconocimiento es simulada; no se afirma precisión del micrófono real ni del servicio de voz del navegador.
- Sin cambios de endpoints, permisos de publicación o reglas de negocio.


## Evidencia — ofertas y postulaciones del candidato según DESIGN.md (2026-11-22)

- Ofertas: encabezado compacto sobre el canvas sin introducción duplicada, búsqueda automática con micrófono dentro del campo y una acción primaria Ver oferta por tarjeta. La voz conserva dictado, deshacer, aclaración ante conflicto con teclado y recuperación por teclado cuando se deniega el micrófono. Se reutiliza VozInline en el buscador y el editor de ofertas.
- Mis postulaciones: una acción primaria Revisar datos del CV por tarjeta; oferta, pruebas, seguimiento y reemplazo de CV en menú de tres puntos. El reemplazo conserva la condición PENDING. Seguimiento horizontal accesible con registro, estado recibido del servidor y evaluación aún no disponible; se explica que no existe historial, sin inferir avances.
- Wizard: un único Alert visible por paso que también presenta errores y advertencias de extracción. Chips Detectado del CV / Completa tú en todos los campos; datos ausentes vacíos y placeholders de instrucción o ejemplo, con contraste en ambos temas. Acción final Enviar postulación; el reemplazo conserva Actualizar CV.
- Éxito con check dibujado y respeto por movimiento reducido. Tras recuperarse de un fallo de confirmación, se ocultan las acciones de recuperación. Se conserva el envío únicamente al confirmar, consentimiento, edición al retroceder y reintento de confirmación sin duplicar la postulación.
- Verificación: npm run check (107 archivos, 0 errores/advertencias/sugerencias), npm run build (20 rutas) y git diff --check correctos. Cinco pruebas de navegador aprobadas: application-wizard.browser.mjs, postulante-ui.browser.mjs, ui-ofertas.browser.mjs, oferta-editor.browser.mjs y componentes.browser.mjs. Cubren positivos, validación negativa, permiso de micrófono, estados vacío/carga/error/reintento, teclado, sesión y regresión de componentes compartidos.
- Capturas de las tres pantallas a 1440/390 px en claro/oscuro: .impeccable/review/m06-ui-{ofertas,postulaciones,wizard}-{1440,390}-{light,dark}.png; éxito en m06-ui-wizard-success.png. Inspección visual sin desbordamiento horizontal.
- API y reconocimiento simulados en las pruebas; no se enviaron postulaciones reales ni se evaluó la precisión de un micrófono físico. Sin cambios de endpoints ni reglas de negocio.


## Evidencia — login y registro: DESIGN.md §5, §7, §8 y §12 (2026-11-22)

- Retirados los controles de Tema y Alto contraste en ambas pantallas. Su apariencia sigue exclusivamente prefers-color-scheme y prefers-contrast, incluso cuando existen preferencias manuales guardadas; Configuración > Apariencia conserva sus controles y persistencia.
- Login sin mensaje ni toast de sesión iniciada: botón de altura y ancho estables con spinner/Iniciando sesión…, check/Acceso correcto durante 300 ms y redirección por rol. Campos y controles bloqueados durante la petición; no se duplica el envío. Registro muestra ejecución y Cuenta registrada en su botón.
- Alert compartido encima del correo con icono, título, detalle y role=alert. Credenciales: Correo o contraseña incorrectos, sin identificar el campo fallido. Red: Sin conexión con Reintentar; límite: Demasiados intentos; error general de servidor con reintento. Se conserva el correo y se limpian las contraseñas, con foco en la contraseña y ocultación de su contenido.
- Validación negativa al salir del campo y al intentar enviar; se retiran errores ya corregidos sin añadir validaciones positivas al escribir. Eliminados Formato de correo válido y los indicadores positivos de contraseña.
- Neutralización del autocompletado mediante fondo inset, color de texto y caret según superficie/tema. Ojo y ojo tachado con etiqueta dinámica; el texto Tu cuenta queda lista al registrarte… queda en registro, visible también en móvil.
- Alert con entrada de opacidad y desplazamiento de 8 px en 200 ms; spinner y transiciones respetan prefers-reduced-motion. El botón conserva su color primario durante ejecución/éxito y los colores de alto contraste cuando el sistema lo solicita.
- Verificación: npm run check (109 archivos, 0 errores/advertencias/sugerencias), npm run build (20 rutas), git diff --check, auth-ui.browser.mjs y regresión configuracion.browser.mjs aprobados. API simulada, sin crear cuentas ni sesiones reales; temporizador de 300 ms comprobado con reloj virtual.
- Entrega visual: 64 capturas en .impeccable/review/auth, con galería index.html. Login y registro × 1440/390 px × claro/oscuro × reposo, campo inválido, respuesta inválida, red, límite, servidor, ejecución y éxito. Sin desbordamiento horizontal; inspección de distribución, foco y contraste en ambos temas.

## Evidencia — M07, resultados y selección humana (2026-11-25)

- B-08 aprobada expresamente en conversación: PENDING → IN_REVIEW → SHORTLISTED; finales ADVANCES/NOT_ADVANCES desde cualquiera de los tres estados activos, propietario exclusivamente y sin reversión.
- Implementadas cuatro capas, cuatro operaciones documentadas en OpenAPI 0.7.0 y una pantalla /reclutador/resultados con ficha lateral, confirmación, motivo opcional, autor/fecha e historial. Se reutilizan resultados indicativos M06; no se habilitan rankings, niveles ni decisiones automáticas.
- No hay cambios de esquema: se utilizan recruitment_decisions y application_status_events existentes, con transacción y bloqueo para impedir doble decisión. Bloqueo de procesos finalizados, comprobación de estado esperado y recuperación ante 409.
- Backend: check/build correctos; 128 pruebas aprobadas, 9 MySQL optativas omitidas. M07: 14 pruebas API/servicio. TypeScript estricto de las pruebas M07 correcto. Prueba MySQL M07 separada: 1 aprobada contra MariaDB real; aislamiento, búsqueda literal, rollback y concurrencia con datos sintéticos propios eliminados.
- Frontend: Astro check 0 errores, 0 advertencias, 0 hints; build 21 rutas. Prueba de navegador con API simulada aprobada: cinco estados, filtros, ficha, decisiones, cancelación, fallo sin pérdida, conflicto, foco tras guardar/409/cierre, perfil pendiente distinguido de cero y limpieza por expiración. Contraste mínimo medido 7.04:1 en muestras de campos, resultados y badges en las cuatro variantes; no es auditoría integral.
- DESIGN.md proporcionado por el usuario, guardado localmente (ignorado por la configuración Git existente). Se preservan Inter/Sky y tokens compartidos; plantillas de lista/detalle, estados y foco. Capturas verificadas: .impeccable/review/m07-1440-light.png, m07-1440-dark.png, m07-390-light.png, m07-390-dark.png, m07-detail-desktop.png y m07-detail-mobile-dark.png.
- Salud local: /health responde OK, db-check connected=true, página de resultados responde 200. No se consultó ni desplegó la versión en nube.
- RSF26, RSF27 y RSF29 marcados con esta evidencia. RSF28 y requisitos UI dependientes de compatibilidad/ranking siguen parciales; M07 no se declara íntegramente cerrado por B-06 e IHC. M08 pendiente. Ver M07-IMPLEMENTACION.md.
