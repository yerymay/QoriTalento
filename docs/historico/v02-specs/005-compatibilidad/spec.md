# SPEC-005 — Compatibilidad CV-oferta y puntaje (pendiente)

**Estado:** SIN APROBAR, análisis para siguiente fase. **IDs:** RSF22–RSF25, RF-08, RF-09, RF-19, HU-03, HU-13. **Figma:** `Reclutador · Resultados y comparación`, `Reclutador · Ficha del postulante`.

## Hechos ya definidos

- RSF22: comparación automática de respuestas de exámenes con alternativas correctas.
- RSF23: comparación de información del CV con requisitos de la oferta y nivel de compatibilidad (Alta/Media/Baja).
- RSF24: puntaje a partir del examen y la compatibilidad.
- La elección de **extracción clásica** solo determina cómo se obtienen los datos del CV, **no** la fórmula de RSF23/RSF24 ni la tecnología final para la comparación.

## Propuesta para evaluar, NO aprobada

- Representar los requisitos de la oferta como criterios verificables y separados de atributos no pertinentes.
- Confrontar información **confirmada** por el postulante con cada criterio, mostrando evidencia y ausencias de evidencia de forma diferenciada.
- Calcular la nota del examen por respuestas correctas conforme RSF22.
- Proponer después una metodología explicable y evaluable para compatibilidad y puntaje final; no asignar pesos, porcentajes ni umbrales por defecto.
- Mantener al reclutador como responsable de la decisión; no automatizar descartes.

## Decisiones que bloquean el paso a implementación

1. Tipo de criterios y evidencia admisible.
2. Método de cálculo y ponderaciones por oferta; significado de Alta/Media/Baja.
3. Estrategia de prueba con casos reales consentidos/sintéticos, revisión de sesgos, trazabilidad y explicaciones.
4. Si RSF23 requiere efectivamente aprendizaje automático o puede comenzar como sistema determinista de reglas, dado el objetivo académico de IA del proyecto.
5. Cuándo puede recalcularse un resultado si el postulante corrige datos y cómo se conserva el historial.

**No construir API de cálculo ni clasificación real hasta aprobar estos puntos.**
