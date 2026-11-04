# Qori Talento — Progreso por etapas

**Estado inicial del paquete:** infraestructura de ejemplo creada en archivos, pero no instalada ni probada contra tu MySQL local. Ningún requisito RSF/RSNF/UI marcado completo sin pruebas.

**Estado actual (2026-11-03):** infraestructura instalada y verificada contra MariaDB 12.2.2 en `127.0.0.1:3306`; Etapa 0 completada. Base de M01 implementada y comprobada (registro inactivo, sesiones, perfil y control de rol). La activación sigue pendiente de B-03; M02–M08 y la validación IHC siguen pendientes.

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
- [ ] M02: ofertas, requisitos, edición y publicación conforme a reglas aprobadas.
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
