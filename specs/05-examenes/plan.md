# PLAN-F4 · Exámenes en línea

**Estado:** borrador técnico para revisión, **sin implementación**. Especificación fuente Fase 3: `specs/05-examenes/spec.md` del paquete v0.3. Este archivo es su continuación técnica, no reemplazo.

## Trazabilidad y límites

- Requisitos: **RSF17–RSF21**.
- Servicio lógico Express: `exams` dentro de monolito modular.
- Decisiones del usuario que condicionan el dominio: `A-06`.
- Bloqueos aún abiertos: `B-05`.

## Contratos / datos propuestos

- Tablas y entidades candidatas: exams, exam_questions, exam_options, exam_attempts, exam_answers.
- Endpoints candidatos de `/api/v1`: POST /recruiter/jobs/{jobId}/exams; POST /candidate/exams/{examId}/attempts; PUT /candidate/attempts/{attemptId}/answers/{questionId}; POST /candidate/attempts/{attemptId}/finish.
- A cada consulta de recursos propios se aplica autenticación + rol + vínculo real con propietario, no un identificador proporcionado por el cliente.
- Formularios y listados Astro/Flowbite deben manejar Ideal/Vacío/Parcial/Carga/Error por región cuando resulte pertinente.

## Comportamiento que debe comprobarse

Deadline db inmutable; guardado por pregunta; 410 al vencer; reconexión sin extensión; rev secuencial.

## Secuencia sugerida para futuras `tasks.md`

P0 → política de intentos

P1 → reloj DB + transacciones

P2 → respuestas versionadas

P3 → worker y estrés.

## Definición de preparado

Antes de generar tareas de código deben aprobarse `B-05`, revisar los esquemas API, registrar datos sintéticos y disponer de al menos una prueba de permiso negativo y una de fallo/recuperación. No se afirma cumplimiento de rendimiento hasta instrumentar mediciones.
