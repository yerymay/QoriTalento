# PLAN-F4 · Gestión de usuarios

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/01-gestion-usuarios/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF01–RSF04**.
- Servicio lógico Express: `identity` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-01, A-03`.
- Bloqueos aún abiertos: `B-03, B-09`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: users, recruiter_profiles, organizations (informativa), verification_challenges.
- Endpoints candidatos de `/api/v1`: POST /auth/recruiters/register; POST /auth/candidates/register; POST /auth/login; GET /me.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Registro por tipo; email/phone; activación inactiva; sesión válida; acceso horizontal denegado.

## Secuencia sugerida para futuras `tasks.md`

P0 → contratos de auth y autorización

P1 → política de sesión

P2 → adaptadores proveedores

P3 → verificación de permisos negativos.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-03, B-09`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
