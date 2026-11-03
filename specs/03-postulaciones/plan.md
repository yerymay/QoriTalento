# PLAN-F4 · Postulaciones

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/03-postulaciones/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF09–RSF12**.
- Servicio lógico Express: `applications` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-03, A-05`.
- Bloqueos aún abiertos: `B-04, B-08`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: applications, application_profile_snapshots.
- Endpoints candidatos de `/api/v1`: POST /jobs/{jobId}/applications; POST /candidate/applications/{appId}/submit; GET /candidate/applications.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Solo publicadas; registro no duplicado según regla que se apruebe; envío con cv confirmado; timeline propio.

## Secuencia sugerida para futuras `tasks.md`

P0 → cardinalidad

P1 → modelo y snapshot

P2 → API con confirmación

P3 → pruebas de titularidad.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-04, B-08`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
