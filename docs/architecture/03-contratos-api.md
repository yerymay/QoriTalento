# 03 · Contratos API REST — BORRADOR Fase 4

**Versión base:** `/api/v1` (propuesta; nunca presentada como API existente). Ver `contratos/openapi-3.1-draft.yaml`. Las rutas son nombres de contrato, **no endpoints construidos**. Todas las acciones privadas usan autenticación y comprobación de propietario en Express.

## Convenciones

- Datos `application/json` salvo upload `multipart/form-data`. HTTPS; fechas ISO-8601 UTC; IDs opacos; paginación `cursor`/`limit` propuesta; filtro/orden whitelist.
- Éxitos: `200` lectura/actualización, `201` creación, `202` trabajo asíncrono (parsing o IA), `204` cuando proceda. Errores: `400` petición incorrecta, `401` sin sesión, `403` acción no permitida, `404` recurso no encontrado o no visible por el principal, `409` conflicto de transición/cuota/intento, `410` intento expirado (propuesta), `422` validación, `429` límite de uso, `503` dependencia no disponible.
- Errores deben tener `code`, `message`, `request_id`, `field_errors` opcional; evitar enumeración de recursos ajenos. Ningún mensaje de error devuelve PII o clave de respuestas correctas.
- Reintentos de operaciones sensibles mediante `Idempotency-Key` y/o versión del recurso. Documentar expiración de claves antes de implementar.
- Política de sesión: **propuesta** token de sesión firmado/rotado en cookie HttpOnly/Secure/SameSite y mitigación CSRF si auth por cookie; JWT no constituye permiso por sí mismo. El `user_id` procede de la sesión validada y jamás del body como filtro de propietario.

## Mapa funcional de endpoints (borrador)

| Dominio | Operaciones candidatas | Validaciones / estado |
|---|---|---|
| Identidad | `POST /auth/recruiters/register`, `POST /auth/candidates/register`, `POST /auth/email/verify`, `POST /auth/phone/verify`, `POST /auth/login`, `POST /auth/logout`, `GET /me` | Activación, email, teléfono, rate-limit; proveedor OTP pendiente |
| Ofertas | `GET /jobs`, `GET /jobs/{jobId}`, `POST /recruiter/jobs`, `PATCH /recruiter/jobs/{jobId}`, `POST /recruiter/jobs/{jobId}/publish`, `POST /recruiter/jobs/{jobId}/close` | Publicadas visibles a candidato; CRUD propio; cuota/moderación |
| Moderación | `GET /moderation/jobs`, `POST /moderation/jobs/{jobId}/review` | **Ruta condicionada**: actor/rol autorizado aún no aprobado |
| Postulación | `POST /jobs/{jobId}/applications`, `GET /candidate/applications`, `GET /candidate/applications/{appId}`, `POST /candidate/applications/{appId}/submit` | Oferta publicada, candidato dueño, flujo confirmado; duplicados pendientes |
| CV | `POST /candidate/applications/{appId}/cv`, `GET /candidate/applications/{appId}/cv-extraction`, `PUT /candidate/applications/{appId}/profile-confirmation`, `GET /recruiter/applications/{appId}/cv`, `POST /recruiter/applications/{appId}/notes` | PDF validado; extracción clásica; confirmación candidato; lectura/notas reclutador |
| Exámenes | `POST /recruiter/jobs/{jobId}/exams`, `GET /candidate/exams`, `POST /candidate/exams/{examId}/attempts`, `GET /candidate/attempts/{attemptId}`, `PUT /candidate/attempts/{attemptId}/answers/{questionId}`, `POST /candidate/attempts/{attemptId}/finish` | Reloj DB, intento propio, versionado, idempotencia y cierre estricto |
| Evaluación IA | `POST /recruiter/applications/{appId}/ai-evaluations`, `GET /recruiter/applications/{appId}/ai-evaluations/{evaluationId}`, `GET /recruiter/jobs/{jobId}/results` | Solo propietario; IA `202` asincrónica; no puntaje final sin rúbrica validada |
| Selección | `POST /recruiter/applications/{appId}/decisions`, `GET /recruiter/applications/{appId}` | Actor humano, confirmación, registro de decisión; transición pendiente |
| Seguimiento | `GET /candidate/applications/{appId}/timeline`, `GET /recruiter/jobs/{jobId}/applications` | Propiedad propia / oferta creador, estados según máquina validada |

Los nombres `recruiter`/`candidate` son parte de la URL para legibilidad, pero **nunca sustituyen** middleware de rol y política de fila.

## Respuestas semánticas de UI

- `POST /.../ai-evaluations` → `202 {evaluation_id, status:'PENDING'}`; UI parcial/procesando; polling con control de frecuencia, sin prometer IA en menos de 3 s. `GET ...` → `PENDING`, `READY`, `NEEDS_REVIEW`, `FAILED`.
- `PUT .../answers/{questionId}` → `200 {saved:true, revision, accepted_at_utc, deadline_at_utc}` solo si aceptada; `409/410` si cerrada o fuera de plazo. `saved:false`/estado pendiente local es una condición de **frontend**, no éxito API.
- `GET /candidate/attempts/{attemptId}` → `server_now_utc`, `deadline_at_utc`, estado y respuestas aceptadas; nunca opciones correctas.
- `POST /recruiter/.../publish` → `409 LIMIT_REACHED` si particular ya tiene dos activas según regla contable **pendiente**; primera oferta va a moderación y no se publica hasta aprobar.
- `GET /recruiter/jobs` no recibe `owner_user_id` del cliente; backend deriva propietario de principal autenticado.

## Ejemplos de objetos ilustrativos

**Error de vencimiento:**

```json
{"error":{"code":"EXAM_EXPIRED","message":"El plazo del examen terminó. Las respuestas pendientes en este dispositivo no se contabilizan.","request_id":"<id>"}}
```

**Resultado IA tras validación, propuesta pendiente de rúbrica:**

```json
{
  "evaluation_id":"<id>",
  "status":"NEEDS_REVIEW",
  "model":"qwen2.5:7b-instruct",
  "score":null,
  "explanation":"No se pudo justificar un puntaje con la evidencia disponible.",
  "evidence":[],
  "missing_evidence":["requisito sin respaldo"],
  "human_decision_required":true
}
```

La salida estructurada con `score` `0..100` **solo** se admite cuando haya una rúbrica aprobada y los tests de evidencia/calibración hayan pasado. Si no, no mostrar un resultado cuantitativo fabricado. No confundir el puntaje sugerido por IA con la nota objetiva del examen.

## Contratos bloqueados

- Activación/caducidad de enlaces/OTP y proveedores; autorización de moderador; definición activa de cuota; multiplicidad de aplicaciones/exámenes; cambios de estado; política de re-evaluación; rúbrica/umbrales; acceso público a listados (si requiere login o no).

**Criterio de aprobación API:** revisión conjunta de estado de negocio, permisos negativos, errores, esquema y escenarios Gherkin de F3 antes de crear rutas reales.
