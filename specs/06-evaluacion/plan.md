# PLAN-F4 · Evaluación y calificación

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/06-evaluacion/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF22–RSF25**.
- Servicio lógico Express: `evaluation` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-07, A-08`.
- Bloqueos aún abiertos: `B-06, B-07`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: exam_grades, ai_evaluations, ai_evaluation_evidence.
- Endpoints candidatos de `/api/v1`: POST /recruiter/applications/{appId}/ai-evaluations; GET /recruiter/applications/{appId}/ai-evaluations/{evaluationId}; GET /recruiter/jobs/{jobId}/results.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Nota objetiva independiente; ia propone score+explicación; modelo/versión/evidencia; no descarte auto.

## Secuencia sugerida para futuras `tasks.md`

P0 → rúbrica/dataset

P1 → esquema JSON

P2 → worker Ollama

P3 → validación de sesgos y coherencia.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-06, B-07`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
