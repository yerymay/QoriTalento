# PLAN-F4 · Extracción y revisión CV

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/04-extraccion-cv/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF13–RSF16**.
- Servicio lógico Express: `cv` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-04, A-05`.
- Bloqueos aún abiertos: `B-04, B-07`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: cv_documents, cv_extraction_runs, candidate_profile_versions, recruiter_notes.
- Endpoints candidatos de `/api/v1`: POST /candidate/applications/{appId}/cv; GET /candidate/applications/{appId}/cv-extraction; PUT /candidate/applications/{appId}/profile-confirmation.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Pdf digital con texto; no detectado; candidato confirma; reclutador notas solo; historial inmutable.

## Secuencia sugerida para futuras `tasks.md`

P0 → reglas PDF

P1 → almacenamiento seguro

P2 → extractor clásico versionado

P3 → UI revisión y tests.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-04, B-07`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
