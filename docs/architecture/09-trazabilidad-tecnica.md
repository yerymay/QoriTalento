# 09 · Trazabilidad técnica v0.4

Esta matriz enlaza requisitos del PDF original con áreas técnicas **propuestas**, no código existente. Los 35 requisitos UI detallan estas capacidades; ver la matriz original Fase 1/3 para correspondencia pantalla/historia.

| ID | Obligación funcional resumida | Dominio backend | Datos propuestos | API candidata / prueba clave |
|---|---|---|---|---|
| RSF01 | Registrar usuarios y roles | identity | users, recruiter_profiles, verification_challenges | registro por tipo, email/teléfono, estado |
| RSF02 | Inicio y cierre de sesión | identity | users, sesión | login/logout; cuenta inactiva no opera |
| RSF03 | Datos básicos de perfil | identity | users / perfil | GET/PATCH me; solo propio |
| RSF04 | Roles y permisos | shared/auth | users, jobs | pruebas de aislamiento horizontal |
| RSF05 | Crear oferta | jobs | jobs | POST recruiter/jobs; owner del servidor |
| RSF06 | Requisitos de oferta | jobs | job_requirements | validación de datos laborales |
| RSF07 | Publicar/editar/cerrar | jobs | jobs, moderation_reviews | cuota 2, moderación primera, carrera |
| RSF08 | Ver ofertas disponibles | jobs | jobs | GET jobs solo publicadas |
| RSF09 | Registrar postulación | applications | applications | crear para oferta elegible |
| RSF10 | Cargar PDF | cv | cv_documents | multipart, archivo válido |
| RSF11 | Asociar CV con oferta | applications | applications, cv_documents | relación propia por FK |
| RSF12 | Consultar estado | tracking | applications | GET propias, línea de estado |
| RSF13 | Leer CV | cv | cv_extraction_runs | parser clásico PDF digital |
| RSF14 | Extraer campos | cv | cv_extraction_runs | datos con evidencia / No detectado |
| RSF15 | Organizar perfil | cv | profile_versions, snapshots | confirmación candidato |
| RSF16 | Revisar extracción | cv | recruiter_notes | reclutador solo lectura/notas |
| RSF17 | Crear examen | exams | exams | dueño de oferta |
| RSF18 | Preguntas/alternativas | exams | questions, options | evitar cuestionarios incompletos |
| RSF19 | Definir plazo | exams | exams | duración válida, no editable en intento |
| RSF20 | Desarrollar examen | exams | attempts, answers | guardado pregunta a pregunta |
| RSF21 | Cierre por tiempo | exams | attempts, answers | servidor rechaza tarde |
| RSF22 | Nota de examen | evaluation | exam_grades | claves + respuestas aceptadas |
| RSF23 | Compatibilidad CV/oferta con IA | evaluation | ai_evaluations, evidence | Qwen analiza solo evidencias laborales |
| RSF24 | Puntaje final y explicación IA | evaluation | ai_evaluations | rúbrica/consistencia por aprobar |
| RSF25 | Orden por resultados | evaluation | ai_evaluations | solo scores validados; no ranking falso |
| RSF26 | Mostrar resultados | selection | grades, ai_evaluations | dueño de oferta |
| RSF27 | Ficha de candidato | selection | applications, notes, evaluations | nota examen + evidencias + score |
| RSF28 | Revisar/seleccionar | selection | recruitment_decisions | no decisión automática IA |
| RSF29 | Registrar resultado final | selection | recruitment_decisions, audit_events | confirmación y auditoría |
| RSF30 | Consultar postulaciones por oferta | tracking | applications, jobs | filtrado propietario |
| RSF31 | Cambiar estado | tracking | status_events | transición válida por aprobar |
| RSF32 | Consultar estado como candidato | tracking | status_events | timeline propio |

## Transversales de calidad relevantes

| Requisitos | Tratamiento técnico y prueba |
|---|---|
| RSNF01/02, RNF-02/05/07/10/11/13 | Flowbite, estados regionales, accesibilidad, errores específicos, Inter Sky Light/Dark |
| RSNF03/04, RNF-01/08 | medidas 3s / 200ms / 100ms; IA asíncrona separada de API normal |
| RSNF05–08, RSNF12, RSNF18, RNF-15 | sesión, role + owner por fila, hashing, privacidad y protección CV |
| RSNF09/15/17, RNF-04/09 | resiliencia, tiempo DB y solamente respuestas a tiempo; backups/ensayo |
| RSNF10/11, RNF-03/12 | navegadores actuales, responsive ≥360px, pruebas en breakpoints |
| RSNF13/14 | modularidad, monolito mantenible, eventual worker/cola |
| RSNF16 | tipo/tamaño PDF, análisis seguro y archivo privado |
| RNF-06 | componentes Flowbite reutilizables, tokens centralizados |
| RNF-14 | confirmación expresa de acciones irreversibles |

## Revisión de cambio pendiente

Las fuentes originales afirman extracción mediante IA en algunas descripciones generales; la decisión reciente aprobó extracción clásica, y la IA se concentra en compatibilidad/puntaje. Registrar esta modificación en el control de cambios de requisitos antes de congelar especificaciones.
