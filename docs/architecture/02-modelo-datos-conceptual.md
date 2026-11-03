# 02 · Modelo de datos conceptual MySQL — propuesta Fase 4

**NO es una migración SQL ni un esquema aprobado.** La lista identifica entidades, claves, relaciones y reglas de integridad propuestas, sin cerrar tamaños de columnas, tipos de índices, motor ORM o retención.

## Entidades propuestas por dominio

| Módulo | Entidades lógicas | Claves/atributos esenciales | Restricciones |
|---|---|---|---|
| Identidad | `users` | `id`, `role`, `email_normalized`, `password_hash`, `account_state` | Única identidad; cuenta activa condiciona acceso |
| Identidad | `recruiter_profiles` | `user_id` FK, `kind` (EMPRESA/PARTICULAR), `organization_id` opcional, `phone_verified_at` | Cada reclutador es dueño individual de ofertas; organización NO concede acceso cruzado |
| Identidad | `organizations` (opcional) | `id`, `legal_name`, `verified_domain` | Asociación informativa, no multitenancy compartido |
| Identidad | `verification_challenges` | `id`, `user_id`, `type`, `secret_hash`, `expires_at`, `consumed_at`, `attempts` | Nunca guardar códigos OTP/links en claro; TTL y límite por aprobar |
| Ofertas | `jobs` | `id`, `owner_user_id` FK, `status`, `title`, `description`, `published_at` | Propiedad inmutable para consulta; cuota por propietario; estados activos por definir |
| Ofertas | `job_requirements` | `id`, `job_id`, `description`, `kind`, `importance` opcional | Importancia/pesos no aprobados |
| Ofertas | `job_moderation_reviews` | `id`, `job_id`, `status`, `reviewer_id`, `reason` | Primera oferta de particular requiere moderación; identidad del revisor pendiente |
| Postulación | `applications` | `id`, `job_id`, `candidate_user_id`, `status`, `submitted_at` | Oferta publicable y autorizada; unicidad por oferta/candidato **por decidir** |
| CV | `cv_documents` | `id`, `application_id`, `storage_key`, `sha256`, `mime`, `scan_status` | Binario privado fuera del webroot; tamaños/antivirus pendientes |
| CV | `cv_extraction_runs` | `id`, `cv_document_id`, `status`, `extractor_version`, `detected_json` | Parcial/error no es lo mismo que datos confirmados |
| CV | `candidate_profile_versions` | `id`, `candidate_user_id`, `source_cv_id`, `confirmed_at`, `data_json` | Solo candidato corrige; versiones inmutables |
| Postulación | `application_profile_snapshots` | `application_id`, `profile_version_id` | Identifica versión de datos usada al enviar/evaluar |
| CV | `recruiter_notes` | `id`, `application_id`, `author_user_id`, `body`, `created_at` | No modificar datos del perfil; solo dueño de oferta |
| Exámenes | `exams` | `id`, `job_id`, `time_limit_seconds`, `status` | Autor: dueño de oferta |
| Exámenes | `exam_questions`, `exam_options` | `exam_id`, `question_id`, `option_id`, `is_correct` protegido | Versionar estructura si hay exámenes en curso |
| Exámenes | `exam_attempts` | `id`, `exam_id`, `application_id`, `started_at_utc`, `deadline_at_utc`, `status` | Intentos múltiples: decisión pendiente; autoridad servidor |
| Exámenes | `exam_answers` | `attempt_id`, `question_id`, `option_id`, `client_revision`, `accepted_at_utc` | `UNIQUE(attempt_id,question_id)` propuesto; solo antes del deadline; idempotencia |
| Evaluación | `exam_grades` | `attempt_id`, `grade`, `grading_version`, `graded_at` | Derivada de respuestas aceptadas; histórico |
| Evaluación | `ai_evaluations` | `application_id`, `model_tag`, `prompt_version`, `rubric_version`, `score`, `explanation`, `status` | Score sugerido y auditable; aún sin rúbrica/umbrales aprobados |
| Evaluación | `ai_evaluation_evidence` | `ai_evaluation_id`, `criterion_id`, `source_ref`, `excerpt` | Trazabilidad a evidencias laborales y examen |
| Selección | `recruitment_decisions` | `application_id`, `actor_user_id`, `decision`, `reason`, `decided_at` | Exclusivamente acción humana autorizada |
| Seguimiento | `application_status_events` | `application_id`, `previous_state`, `next_state`, `actor_id`, `created_at` | Transiciones permitidas pendientes |
| Transversal | `audit_events` | `actor_id`, `resource_kind`, `resource_id`, `action`, `happened_at`, `trace_id` | Evitar datos sensibles innecesarios en logs |
| Transversal | `outbox_events` (propuesta) | `id`, `topic`, `payload_minimal`, `state`, `attempts` | Ejecución asíncrona/reintentos sin perder eventos |

**Notas:** `organization_id` puede existir para registrar empresa, pero no otorga acceso a recursos de otros usuarios. El concepto de postulante puede usar `users` con rol Postulante. Datos extensos en JSON son **propuesta**; algunos campos deberán normalizarse si las consultas lo requieren.

## Cardinalidades principales

- Usuario reclutador `1 → N jobs` (`owner_user_id`). Organización `1 → N recruiter_profiles` opcional, **sin propiedad compartida**.
- Oferta `1 → N requirements` y `1 → N applications`. Candidato `1 → N applications` (restricción por oferta pendiente).
- Postulación `1 → N cv_documents` (o 1→1 al concretar política), `1 → 1 snapshot` confirmada, `0 → N exam_attempts`, `0 → N ai_evaluations` versionadas y `0 → N notes`.
- Examen `1 → N questions`, pregunta `1 → N options`; intento `1 → N answers` (`question_id` única por intento).
- Postulación `1 → N application_status_events` y `0 → N recruitment_decisions` como historial si se admite reversión (pendiente).

## ÍNDICES / RESTRICCIONES candidatas

- `users(email_normalized) UNIQUE`; `jobs(owner_user_id,status,created_at)`; `applications(job_id,status,submitted_at)`; `applications(candidate_user_id,created_at)`.
- `exam_attempts(application_id,exam_id,status)`; `exam_answers(attempt_id,question_id) UNIQUE`.
- FK por todas las referencias; `ON DELETE RESTRICT` y borrado lógico/retención cuando preservar auditoría; política final pendiente.
- Índices que apoyen los filtros de propiedad y las lecturas bloqueantes, no solo filtros del frontend.

## Invariantes/transacciones principales

**I-01 · Recurso de reclutador:** consulta sobre ofertas solo si `jobs.owner_user_id = principal.user_id`. Postulaciones, PDF, examen, IA y decisión requieren JOIN al job propietario. La organización no evita esa comprobación.

**I-02 · Cuota particular:** serializar intento de publicación bloqueando `recruiter_profiles` del dueño (`SELECT … FOR UPDATE` dentro de transacción) → contar ofertas activas según definición **pendiente** → cambiar estado si quedan menos de dos. Moderación previa de primera oferta, sin visibilidad pública durante revisión. Dos solicitudes simultáneas no pueden publicar ambas si solo queda un cupo.

**I-03 · Intento de examen:** en una transacción comenzar intento con hora del servidor de DB en UTC; fijar `deadline_at_utc` una sola vez; para cada respuesta bloquear intento, comprobar estado y `UTC_TIMESTAMP(6) < deadline_at_utc` **en la transacción**; persistir una única respuesta por pregunta con versión; cerrar por envío o expiración idempotente. No confiar en hora del navegador.

**I-04 · Postulación:** snapshot del perfil confirmado ligado a CV/documento empleado; posterior corrección crea nueva versión, nunca modifica evidencia usada por evaluación previa.

**I-05 · Resultado IA:** versión de modelo/prompt/rúbrica, entrada minimizada referenciada y evidencia justificativa; no mutar decisiones humanas ni reemplazar puntuaciones históricas.

**I-06 · Auditoría:** registrar actor y momento de moderación, cambios de estados, intentos fallidos de autorización y decisiones humanas con controles de acceso. Los cambios de negocio y eventos asociados deben quedar sincronizados transaccionalmente cuando corresponda.

## Seguridad y privacidad de la persistencia

Almacenar el hash de contraseña con algoritmo moderno, claves OTP/activación como hash y archivos PDF en almacenamiento privado con permisos. Acceso a descargas siempre mediado por backend; separar DB de red pública; cifrado en tránsito; backups verificados y retención por definir. Evitar PII completa en auditoría y prompts cuando no sea necesaria.

## Decisiones que impiden pasar a SQL definitivo

- Moderador/permiso, política de primera oferta, definición de oferta activa y rechazo.
- Unicidad/multiplicidad de postulaciones e intentos; versión publicada del examen; edición posterior de perfil.
- Almacenamiento/retención y tamaño de PDF; correos/SMS/WhatsApp y expiraciones.
- Rúbrica, pesos, umbrales y política de reevaluación IA; índices finales conforme consultas reales.

Referencia de transacciones: [MySQL InnoDB locking reads](https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html).
