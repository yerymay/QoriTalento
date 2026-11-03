# TASKS-F5-02 — Gestión de ofertas

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF05–RSF08**. UI: **RF-02, RF-03, RF-14**. Bloqueos identificados: **B-01, B-02**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (12)

- [ ] **M02-01 · Cerrar tabla de estados de oferta y cuota**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-04`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Precisar Publicada/Cerrada/Borrador/Pendiente de moderación, contabilidad de activas y condición de primera oferta; documentar invariantes.
  - **Destino propuesto:** `specs/02-ofertas/spec.md y docs/decisions/ (tras aprobación)`.
  - **Verificación exigida:** O02–O05 tienen reglas exactas para máquina de estados y locks.

- [ ] **M02-02 · Persistencia de ofertas, requisitos y revisiones**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M02-01`, `M01-01`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Crear esquema jobs, requisitos de oferta y revisiones de moderación con dueño individual.
  - **Destino propuesto:** `backend/src/modules/jobs/, backend/migrations/`.
  - **Verificación exigida:** FK y propietario obligatorio; índice por estado y creador.

- [ ] **M02-03 · Crear borrador con propietario de sesión**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M02-02`, `M01-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Guardar cargo, descripción, experiencia, formación y requisitos; dueño se deriva de identidad autenticada.
  - **Destino propuesto:** `POST /api/v1/recruiter/jobs`.
  - **Verificación exigida:** OF-01/OF-02; owner_user_id forzado en body no cambia dueño.

- [ ] **M02-04 · Validar y editar oferta propia**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M02-03`.
  - **Puerta de ejecución:** `B-01`.
  - **Acción:** Validaciones server y restricciones por estado; solo creador edita y ve drafts.
  - **Destino propuesto:** `PATCH /api/v1/recruiter/jobs/{jobId}`.
  - **Verificación exigida:** O01; B no edita oferta de A aun en misma empresa.

- [ ] **M02-05 · Listado/detalle público de ofertas admisibles**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M02-02`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Solo oferta realmente publicada y abierta según política; filtros no exponen drafts o primera no moderada.
  - **Destino propuesto:** `GET /api/v1/jobs y /api/v1/jobs/{jobId}`.
  - **Verificación exigida:** O03/O04; pendientes y cerradas sin CTA Postular habilitado.

- [ ] **M02-06 · Cuota transaccional de dos activas**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M02-02`, `M00-12`.
  - **Puerta de ejecución:** `B-01`.
  - **Acción:** Aplicar transacción/lock apropiado para la persona natural y revalidación al publicar.
  - **Destino propuesto:** `backend/src/modules/jobs/`.
  - **Verificación exigida:** O02/O05 y T-03: dos publicaciones paralelas con un cupo libre dejan como máximo una.

- [ ] **M02-07 · Primera oferta pasa por moderación**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M02-06`.
  - **Puerta de ejecución:** `B-02`.
  - **Acción:** Al primer intento de publicación de particular, crear solicitud pendiente y nunca hacerla visible sin aprobación.
  - **Destino propuesto:** `POST /api/v1/recruiter/jobs/{jobId}/publish`.
  - **Verificación exigida:** O03/T-04; no bypass por API paralela.

- [ ] **M02-08 · Moderación con rol y auditoría aprobados**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M02-07`, `M00-15`.
  - **Puerta de ejecución:** `B-02`, `B-09`.
  - **Acción:** Implementar cola/vista y revisión por autoridad definida, sin inventar un administrador de empresa que vea ofertas ajenas.
  - **Destino propuesto:** `GET /api/v1/moderation/jobs; POST /api/v1/moderation/jobs/{jobId}/review`.
  - **Verificación exigida:** Aprobación cambia publicación solo tras autorización; rechazo conserva evidencia.

- [ ] **M02-09 · Publicación y cierre atómicos**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M02-06`, `M02-08`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Confirmar propiedad, estado, moderación/cuota en transacción; cerrar bloquea futuras nuevas postulaciones.
  - **Destino propuesto:** `POST /api/v1/recruiter/jobs/{jobId}/publish y /close`.
  - **Verificación exigida:** O04/O05; publicación denegada al exceder cupo; cierre durable.

- [ ] **M02-10 · Pantallas de ofertas reclutador**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M02-04`, `M02-09`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Listado borrador/publicada/cerrada, formulario y modales con confirmación; cinco estados por región aplicable.
  - **Destino propuesto:** `frontend/src/pages/recruiter/, components/domain/`.
  - **Verificación exigida:** O01/O04; tabs y acción Cerrar sin desbordes.

- [ ] **M02-11 · Pantallas de búsqueda y detalle candidato**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M02-05`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Explorar ofertas publicadas, detalle y CTA contextual; no revelar borradores.
  - **Destino propuesto:** `frontend/src/pages/candidate/, components/domain/`.
  - **Verificación exigida:** OF-07, vacío sin CTA de reclutador, errores con recuperación.

- [ ] **M02-12 · Pruebas concurrencia y horizontalidad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M02-09`, `M02-11`, `M00-18`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Probar dos reclutadores misma empresa, carreras cuota/moderación, cierre mientras postulación y publicación repetida.
  - **Destino propuesto:** `tests/integration/jobs/, tests/e2e/jobs/`.
  - **Verificación exigida:** T-01/T-03/T-04 y O01–O05 automatizados.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
