# Registro de decisiones y bloqueos — Fase 3

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

Este registro reproduce DEC-01..DEC-07 aprobadas en v0.2, sin introducir nuevas aprobaciones implícitas.

## Reglas aprobadas y conservadas

| DEC | Regla | Especificaciones afectadas |
|---|---|---|
| 01 | Reclutadores: Empresa con correo corporativo; particular con correo público y verificación telefónica; nuevas cuentas de reclutador inactivas hasta cumplir verificaciones aplicables. | 01 |
| 02 | Particular máx. 2 ofertas **activas** y moderación manual previa de primera oferta. | 02 |
| 03 | Incluso miembros de una misma empresa solo consultan y gestionan sus ofertas/candidatos propios. | 01, 02, 03, 04, 05, 06, 07, 08 |
| 04 | CV de PDF digital con extracción clásica y reglas; candidato confirma y corrige; sin OCR ni IA generativa en MVP. | 03, 04 |
| 05 | Exámenes con plazo estricto: solo respuestas admitidas por backend antes de hora límite. | 05, 06 |
| 06 | Hora de inicio/límite fijadas por servidor; guardado por pregunta; reconexión no extiende plazo. | 05 |
| 07 | Candidato corrige su perfil; reclutador solo revisa y anota sin modificar dato fuente. | 03, 04, 06, 07 |

## Bloqueos de aprobación (no resolver por inferencia)

| ID | Prioridad | Pregunta sin resolver | Afecta / puerta |
|---|---|---|---|
| D-01 | CRÍTICA | ¿Cómo se calcula compatibilidad CV-oferta (algoritmo, evidencias, límites IA, ponderaciones, niveles y versión)? | M06, M07, M08; bloquear puntaje/ranking. |
| D-02 | ALTA | ¿Quién modera la primera oferta de particulares y cómo se revisa/deniega/aprueba? | M02; bloquear publicación de primera oferta particular. |
| D-03 | ALTA | ¿Qué estados integran «2 ofertas activas» (solo Publicada u otros)? | M02; bloquear implementación de cuota. |
| D-04 | ALTA | ¿Quién y cómo verifica empresa fuera del dominio, TTL y límites OTP, proveedores de correo/SMS? | M01; bloquear puesta en producción del alta. |
| D-05 | ALTA | ¿Máximo PDF, política de PDFs protegidos/sin texto, seguridad de archivos, almacenamiento y retención? | M03/M04; bloquear política final de carga. |
| D-06 | ALTA | ¿Qué estados/transiciones son legales en postulación (incl. vuelta atrás/terminal)? | M07/M08; bloquear máquina de estados definitiva. |
| D-07 | ALTA | ¿Puede haber varias postulaciones a la misma oferta / varios intentos de un examen? | M03/M05; bloquear cardinalidad final. |
| D-08 | ALTA | ¿Cuál es la política al corregir datos CV después de registrar postulación/resultado? | M04/M06/M07; bloquear recálculo. |
| D-09 | MEDIA | ¿Regla de orden/idempotencia de cambios en la misma respuesta y manejo de caídas del servidor? | M05; bloquear contrato de persistencia definitiva. |
| D-10 | ALTA | ¿Cómo se concilia RSF28 rol Jefe RRHH y DEC-03 sin compartir candidatos entre reclutadores? | M01/M07; bloquear permisos de supervisión. |
| D-11 | MEDIA | ¿Métricas cuantificadas de RSNF03, RSNF09 y pruebas reales de carga? | Calidad; bloquear certificación RNF. |
| D-12 | MEDIA | ¿Se aprueba formalmente el borrador de constitución F2? | Gobernanza: ninguna spec se declara final sin ello. |

**Recomendación de secuencia:** resolver D-02/D-03/D-04 para Registro/Ofertas, D-05/D-07/D-09 para CV/Exámenes, D-01 antes de implementar compatibilidad y clasificación; D-06/D-08/D-10 antes de selección/seguimiento completo.
