# Registro de decisiones — Qori Talento SDD

Versión **v0.2**. Estado de esta sección: **aprobadas por el propietario**, salvo las cuestiones marcadas explícitamente como pendientes. Mantener historial; no reescribir decisiones previas silenciosamente.

| ID | Estado | Decisión / regla | Consecuencia |
|---|---|---|---|
| DEC-01 | APROBADA | Reclutador: dos vías (empresa o persona natural). Empresa: correo corporativo no público; particular: verificación telefónica SMS/WhatsApp. Todas las cuentas nuevas inactivas hasta verificar correo; particulares requieren además confirmar teléfono. | Flujos de registro y validación; servicios de verificación necesarios. |
| DEC-02 | APROBADA | Particular: **máximo 2 ofertas activas simultáneamente**; primera oferta sujeta a revisión manual antes de ser pública. | El cupo y la moderación se validan en el backend. |
| DEC-03 | APROBADA | En empresa, cada reclutador consulta y administra **únicamente sus propias ofertas y los candidatos asociados a ellas**; no se comparten datos entre miembros. | Autorización por creador/propietario además del rol; denegación de lectura y escritura ajenas. |
| DEC-04 | APROBADA | Extracción de CV **clásica** en MVP: PDF con texto embebido, lectura de texto, reglas de extracción y corrección por postulante. Sin IA generativa ni OCR en esta etapa. | Se separa parsing de CV de RSF23/RSF24 (compatibilidad y puntaje). |
| DEC-05 | APROBADA | Examen: **plazo estricto**; cuentan únicamente las respuestas que el servidor recibió y aceptó **antes de `hora_limite`**. | Respuestas solo locales no se incluyen si llegan fuera de plazo. |
| DEC-06 | APROBADA | Hora de inicio y límite fijadas por el servidor; guardado por pregunta; reconexión continúa el mismo intento sin detener tiempo. | El reloj del frontend es informativo; cierre y corrección son autoritativos en backend. |
| DEC-07 | APROBADA | Postulante corrige los datos sugeridos del CV antes de confirmar; reclutador únicamente visualiza, audita y deja notas, sin modificar el perfil fuente. | Ajustar RF-05/HU-01; historial de versiones de perfil y observaciones separadas. |
| DEC-08 | PENDIENTE | Algoritmo, evidencias, ponderaciones, umbrales y alcance exacto de la IA para RSF23/RSF24. | No definir puntajes artificiales ni permitir decisión automática basada en ellos. |
| DEC-09 | PENDIENTE | Responsable y proceso de moderación de la primera oferta de particulares (sin agregar rol nuevo no aprobado). | La primera oferta no puede publicarse hasta definición de autoridad y procedimiento. |
| DEC-10 | PENDIENTE | Criterio de verificación de empresa más allá de dominio, lista de dominios públicos, cambio de dominio y política de dominios corporativos gratuitos. | Verificación de email no equivale a legitimidad empresarial. |
| DEC-11 | PENDIENTE | Semántica exacta de "oferta activa" y conteo de estados en la cuota; se **propone** contabilizar publicadas y revalidar el cupo al aprobar moderación. | Requiere aprobación antes de implementar bloqueo transaccional. |
| DEC-12 | PENDIENTE | Límites de tamaño PDF, reglas de archivo sin texto o protegido, retención, privacidad, proveedor de SMS/email, validez OTP/enlace. | Necesarios para NFR medibles y costos. |

## Separaciones obligatorias

1. `rol` (postulante/reclutador) ≠ `propietario` de oferta o candidato. Incluso dos reclutadores de la misma empresa no comparten ofertas bajo DEC-03.
2. `cuenta_inactiva/activa` ≠ `oferta_borrador/pendiente_moderación/publicada/cerrada` ≠ `UI_ideal/parcial/vacío/carga/error`.
3. `respuesta_guardada_localmente` ≠ `respuesta_confirmada_servidor` ≠ `respuesta_contabilizada`.
4. Extracción clásica de CV (DEC-04) **no cancela** por sí sola la función de comparación del perfil con la oferta contemplada en RSF23/RSF24.

## Registro de fuentes y vigencia

- **Requisitos de sistema v1.0:** 32 RSF / 18 RSNF, PDF fuente intacto.
- **Requisitos de UI fuente:** 20 RF UI / 15 RNF UI + 13 HU, TXT fuente intacto.
- **Figma v2:** diseño navegable de referencia, no especificación de seguridad ni aplicación implementada.
- **Decisiones de usuario:** estas DEC-01 a DEC-07 tienen prevalencia sobre contradicciones anteriores para producir el borrador actualizado; la aprobación formal del texto revisado de RF/RNF sigue siendo parte del control documental.
