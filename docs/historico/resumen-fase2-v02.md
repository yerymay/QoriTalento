# Qori Talento — Actualización SDD v0.2

**Objetivo:** integrar cuatro decisiones adicionales al resultado de la Fase 1, identificar cambios RF/RNF y avanzar la planificación sin código.

## Decisiones ratificadas

1. Reclutador particular: máximo **2 ofertas activas**. Su primera oferta requiere revisión manual previa a publicación.
2. Reclutador en empresa: **solo sus propias ofertas y sus candidatos**, aunque otros reclutadores pertenezcan a la misma empresa. Autorizar por creador en backend, no solo por rol.
3. CV: extracción **clásica** de texto y campos en PDF digital, corrección por postulante. Sin IA generativa en el MVP; OCR no comprometido.
4. Examen: tiempo fijo en servidor y respuestas aceptadas únicamente **antes del vencimiento**. Borradores offline fuera de plazo no se califican.

## Cambios documentales fundamentales

- **Sistema:** RSF01/02/04/05/07/08/13/14/15/16/19/20/21/22/30; RSNF05/06/07/12/15/16/17/18. RSF23/24 pendientes de algoritmo.
- **UI:** RF-11/01/13/02/14/05/16/17/07/18; RNF-04/09/15 (con efectos sobre RNF-05/07).
- **Historias:** HU-01, HU-02, HU-05–HU-08, HU-12, HU-13.
- **Conflicto puntual:** RSF16 no exige que el reclutador edite; **RF-05 y HU-01** sí, y deben revisarse.
- **Exámenes offline:** RNF-09/HU-12 prometían ausencia de pérdida y sincronización; ahora se debe comunicar la diferencia entre guardado local y aceptación antes de plazo.
- **Alcance nuevo:** activación por correo, verificación telefónica y moderación manual no estaban comprometidas en el documento inicial; registrar adiciones.

## Entregables

- Paquete estructurado `QoriTalento_SDD_v02/` con **5 especificaciones**, registro de decisiones, matriz de impacto textual y plan de continuación.
- Matriz `Qori_Talento_SDD_v02_Matriz_Cambios.xlsx` para revisar y aprobar cada afectación.
- El paquete es **documental**; no se ha cambiado Figma, ningún esquema MySQL, los contratos API ni el código.

## Bloqueos pendientes

Definición de compatibilidad/puntaje de RSF23/24, persona autorizada para moderación, semántica de «oferta activa» (propuesta: publicada), proveedores/validez de correo y SMS, y límites de archivos PDF. No se inventaron ponderaciones ni reglas no decididas.

## Siguiente fase

Validar control de cambios y aprobar una **constitución SDD**, luego precisar specs por módulos; después modelar datos, contratos y tareas para Astro/Express/MySQL. No comenzar implementación hasta resolver decisiones bloqueantes.
