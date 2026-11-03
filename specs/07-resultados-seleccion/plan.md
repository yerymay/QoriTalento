# PLAN-F4 · Resultados y selección

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/07-resultados-seleccion/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF26–RSF29**.
- Servicio lógico Express: `selection` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-03, A-05, A-07`.
- Bloqueos aún abiertos: `B-06, B-08, B-09`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: ai_evaluations, exam_grades, recruiter_notes, recruitment_decisions, audit_events.
- Endpoints candidatos de `/api/v1`: GET /recruiter/jobs/{jobId}/results; POST /recruiter/applications/{appId}/decisions.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Ficha separa nota/ia; decisión humana; confirmación, actor, fecha; solo propietario.

## Secuencia sugerida para futuras `tasks.md`

P0 → campos/visibilidad

P1 → decisión/estado

P2 → API y auditoría

P3 → pruebas E2E.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-06, B-08, B-09`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
