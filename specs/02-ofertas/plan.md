# PLAN-F4 · Ofertas de empleo

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/02-ofertas/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF05–RSF08**.
- Servicio lógico Express: `jobs` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-02, A-03`.
- Bloqueos aún abiertos: `B-01, B-02`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: jobs, job_requirements, job_moderation_reviews.
- Endpoints candidatos de `/api/v1`: POST /recruiter/jobs; POST /recruiter/jobs/{jobId}/publish; POST /recruiter/jobs/{jobId}/close; GET /jobs.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Cuota de 2 bajo concurrencia; primera oferta moderada; cerrar bloquea postulaciones; solo propietario.

## Secuencia sugerida para futuras `tasks.md`

P0 → estados/cuota

P1 → locks + modelo

P2 → API de propietario

P3 → moderación y pruebas.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-01, B-02`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
