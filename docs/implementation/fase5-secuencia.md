# Fase 5 — Secuencia de implementación propuesta (v0.5)

**Estado:** planificación, sin código. **Línea de base:** Fase 3 especificaciones v0.3 y Fase 4 arquitectura v0.4, con sus decisiones aún pendientes.

La tabla define **orden lógico**, no fechas, sprints garantizados ni autorización automática para ejecutar. Algunas tareas se pueden paralelizar una vez aprobadas sus puertas y contratos.

| Ola | Tareas | Entrega | Puerta de salida |
|---|---|---|---|
| 0 - Gobernanza y decisiones | `M00-01 a M00-09` | Constitución, ADR, reglas B-01 a B-10, trazabilidad | No implementar operaciones bloqueadas sin aprobación formal |
| 1 - Infraestructura compartida | `M00-10 a M00-24` | Scaffold, persistencia, auth común, API, almacenamiento, UI base, CI | ADR aprobados; test/fixtures, seguridad inicial |
| 2 - Identidad | `M01-01 a M01-12` | Registro y activación, sesión, aislamiento individual | B-03/B-09 resueltos; T-01/T-02 |
| 3 - Ofertas | `M02-01 a M02-12` | Borradores, cuota, moderación, publicación/cierre, catálogo | B-01/B-02; carreras de cuota T-03/T-04 |
| 4 - CV y postulaciones | `M03 + M04 (entrelazados)` | Borrador → PDF → extracción → confirmación → envío final | B-04/B-07/B-08; dependencia M03-06 ⇐ M04-06 |
| 5 - Exámenes | `M05-01 a M05-12` | Plantillas, intentos, guardado por pregunta, expiración | B-05; T-07–T-10 |
| 6 - Evaluación | `M06-01 a M06-13` | Calificación objetiva; IA local Ollama y validación de evidencias | Sin B-06 no publicar puntaje orientativo real |
| 7 - Selección y seguimiento | `M07 + M08 (entrelazados)` | Ficha, actor humano, decisiones, timeline | B-08/B-09; T-14–T-16 |
| 8 - Auditoría / salida | `V00-01 a V00-11` | E2E, accesibilidad, RNF, seguridad, resiliencia, IA | Evidencias; checklist de release |

## Dependencias críticas y paralelismo

- `M03` y `M04` **no son pasos puramente secuenciales**: M03 crea borrador/almacena PDF; M04 extrae y el candidato confirma; solo después M03 puede enviar definitivamente. Evita un ciclo entre tareas concretas.
- `M06-01` (calificación objetiva) puede desarrollarse tras `M05` aunque `B-06` bloquee la parte IA del puntaje. **No bloquear una nota objetiva por una rúbrica IA pendiente**.
- `M07-03` puede mostrar PDF y nota objetiva aunque todavía no exista evaluación validada; la decisión humana requiere estados aprobados `B-08`.
- `M08-05` puede mostrar timeline propio cuando haya historial; su escritura depende de transiciones aprobadas `B-08`.
- `M00-20` y `M00-21` pueden avanzar en paralelo con servicios, sin interpretar pantallas Figma como reglas de negocio.
- La corrección de 20 enlaces Figma es una tarea real de diseño todavía **pendiente**, no un cambio aplicado por esta entrega.

## Primer tramo de trabajo recomendado

1. Revisar y ratificar `docs/constitution-borrador.md` antes de copiarlo como `constitution.md`.
2. Resolver `B-03` y `B-09` para identidad; aprobar los ADR arquitectónicos que afectan el scaffold.
3. Ejecutar la ola 1 (scaffold/contrato/migraciones/fixtures) y luego identidad con seguridad negativa.
4. Continuar las olas sucesivas según bloqueos; no rellenar reglas con supuestos.

## Dependencias de infraestructura futuras (no creadas ahora)

| Tipo | Ruta propuesta | Responsabilidad |
|---|---|---|
| UI | `frontend/src/pages/`, `layouts/`, `components/`, `styles/` | Astro + Flowbite/Tailwind; Sky/Inter y cinco estados |
| API | `backend/src/modules/`, `shared/` | Express modular + autorización, validación y errores |
| Persistencia | `backend/migrations/`, `backend/src/db/` | MySQL, constraints, índices y transacciones |
| Background | `backend/src/workers/` | expiraciones/IA; procesamiento asíncrono seguro |
| Tests | `tests/` | unidad, integración, contrato, E2E, IA, a11y y carga |
| Especificación | `specs/<módulo>/tasks.md` | backlog, dependencias, aceptación y bloqueos |

**Advertencia:** `backend/src/*` y `frontend/src/*` son rutas de referencia, no archivos entregados en esta fase.
