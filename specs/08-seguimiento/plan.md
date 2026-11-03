# PLAN-F4 · Seguimiento

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/08-seguimiento/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF30–RSF32**.
- Servicio lógico Express: `tracking` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-03`.
- Bloqueos aún abiertos: `B-08, B-09`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: applications, application_status_events.
- Endpoints candidatos de `/api/v1`: GET /candidate/applications/{appId}/timeline; GET /recruiter/jobs/{jobId}/applications.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Línea de estado del candidato; reclutador ve solo ofertas propias; historial inmutable.

## Secuencia sugerida para futuras `tasks.md`

P0 → estados legales

P1 → eventos y consultas

P2 → UI progreso

P3 → autorización y accesibilidad.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-08, B-09`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
