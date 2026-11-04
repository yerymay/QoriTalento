# Qori Talento — Catálogo planificado de endpoints para los 8 módulos

> **NO IMPLEMENTADOS**: las rutas de esta tabla proceden del contrato OpenAPI original de SDD Fase 4. No son rutas funcionales de este scaffold. Swagger de rutas funcionales: `Backend/openapi-implemented.yaml` servido en `/api-docs/`.

El prefijo del contrato planeado es `/api/v1`. No probar en producción ni asumir autorización definida para rutas bloqueadas.

## M01 · Usuarios

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/auth/recruiters/register` | ☐ Pendiente |
| `POST` | `/api/v1/auth/candidates/register` | ☐ Pendiente |
| `POST` | `/api/v1/auth/email/verify` | ☐ Pendiente |
| `POST` | `/api/v1/auth/phone/verify` | ☐ Pendiente |
| `POST` | `/api/v1/auth/login` | ☐ Pendiente |
| `POST` | `/api/v1/auth/logout` | ☐ Pendiente |
| `GET` | `/api/v1/me` | ☐ Pendiente |

## M02 · Ofertas

| Método | Ruta prevista | Estado |
|---|---|---|
| `GET` | `/api/v1/jobs` | ☐ Pendiente |
| `GET` | `/api/v1/jobs/{jobId}` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/jobs` | ☐ Pendiente |
| `POST` | `/api/v1/recruiter/jobs` | ☐ Pendiente |
| `PATCH` | `/api/v1/recruiter/jobs/{jobId}` | ☐ Pendiente |
| `POST` | `/api/v1/recruiter/jobs/{jobId}/publish` | ☐ Pendiente |
| `POST` | `/api/v1/recruiter/jobs/{jobId}/close` | ☐ Pendiente |
| `GET` | `/api/v1/moderation/jobs` | ☐ Pendiente |
| `POST` | `/api/v1/moderation/jobs/{jobId}/review` | ☐ Pendiente |

## M03 · Postulaciones

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/jobs/{jobId}/applications` | ☐ Pendiente |
| `GET` | `/api/v1/candidate/applications` | ☐ Pendiente |
| `GET` | `/api/v1/candidate/applications/{appId}` | ☐ Pendiente |
| `POST` | `/api/v1/candidate/applications/{appId}/submit` | ☐ Pendiente |

## M04 · CV

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/candidate/applications/{appId}/cv` | ☐ Pendiente |
| `GET` | `/api/v1/candidate/applications/{appId}/cv-extraction` | ☐ Pendiente |
| `PUT` | `/api/v1/candidate/applications/{appId}/profile-confirmation` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/applications/{appId}/cv` | ☐ Pendiente |
| `POST` | `/api/v1/recruiter/applications/{appId}/notes` | ☐ Pendiente |

## M05 · Exámenes

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/recruiter/jobs/{jobId}/exams` | ☐ Pendiente |
| `GET` | `/api/v1/candidate/exams` | ☐ Pendiente |
| `POST` | `/api/v1/candidate/exams/{examId}/attempts` | ☐ Pendiente |
| `GET` | `/api/v1/candidate/attempts/{attemptId}` | ☐ Pendiente |
| `PUT` | `/api/v1/candidate/attempts/{attemptId}/answers/{questionId}` | ☐ Pendiente |
| `POST` | `/api/v1/candidate/attempts/{attemptId}/finish` | ☐ Pendiente |

## M06 · Evaluación

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/recruiter/applications/{appId}/ai-evaluations` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/applications/{appId}/ai-evaluations/{evaluationId}` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/jobs/{jobId}/results` | ☐ Pendiente |

## M07 · Selección

| Método | Ruta prevista | Estado |
|---|---|---|
| `POST` | `/api/v1/recruiter/applications/{appId}/decisions` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/applications/{appId}` | ☐ Pendiente |

## M08 · Seguimiento

| Método | Ruta prevista | Estado |
|---|---|---|
| `GET` | `/api/v1/candidate/applications/{appId}/timeline` | ☐ Pendiente |
| `GET` | `/api/v1/recruiter/jobs/{jobId}/applications` | ☐ Pendiente |

**Total:** 38 operaciones planeadas. Cambiar `contratos/openapi-3.1-draft.yaml` solo después de revisar reglas y documentar implementación real en Swagger.
