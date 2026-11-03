# Fase 5 — Definition of Ready (DoR) / Definition of Done (DoD)

## Preparado para desarrollar (DoR por tarea)

- [ ] Identificador y requisito origen (RSF/RF/RNF) trazables, caso Gherkin cuando aplique.
- [ ] Actores, estados de negocio, errores, datos de entrada/salida y permisos del backend descritos.
- [ ] Contrato REST/recurso/índice o UI revisado y sus dependencias reconocidas.
- [ ] No quedan bloqueos `B-*` que cambien el comportamiento de esta tarea; aprobación con fecha/autoridad registrada.
- [ ] Casos positivos y negativos reproducibles, con fixtures **sintéticos**, preparados.
- [ ] Riesgos de privacidad, concurrencia y tratamiento de PII identificados y documentados.
- [ ] Aprobadas decisiones técnicas ADR necesarias para la tarea; Figma es referencia visual, no contrato de permisos.

## Completado (DoD por tarea)

- [ ] Código/comportamiento efectivamente implementado en la ruta acordada, sin código huérfano ni mock productivo.
- [ ] Pruebas unidad/integración/contrato (según tipo) y caso negativo de autorización aprobados, con evidencia real.
- [ ] Transacciones, reintentos, estados y errores probados ante fallos y carreras cuando apliquen.
- [ ] UI pertinente conserva datos válidos en Parcial/Error, tiene skeleton estructural y acciones accesibles.
- [ ] Existe código de estado/API registrado; sin filtración de CV, OTP, claves de examen, secrets o PII en logs.
- [ ] Contratos OpenAPI/diagramas/spec/plan actualizados si se detectaron cambios y control de versión registrado.
- [ ] Test de regresión incorporado en CI; revisión de otro desarrollador si equipo lo permite.
- [ ] Evidencias reportadas: `task_id`, commit, casos de prueba, entorno y resultado; **no marcar `[x]` por crear un archivo solamente**.

## Preparado para release (DoD global)

- [ ] Requisitos RSF01–32 cubiertos o explícitamente diferidos con aprobación.
- [ ] RNF críticos instrumentados y medidos, no declarados por inspección de Figma.
- [ ] T-01 a T-16 de Fase 4 validados (o excepciones aprobadas y documentadas).
- [ ] Política privacidad, retención, backups y permisos verificada; datos reales no usados para tests.
- [ ] IA de ranking/score deshabilitada mientras no pase B-06 y validación documentada.
- [ ] Comprobación accesibilidad, responsive, tema, navegación por rol y cinco estados por región.
- [ ] Migraciones, rollback, health checks y procedimiento de incidentes revisados.
