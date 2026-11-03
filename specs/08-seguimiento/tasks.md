# TASKS-F5-08 — Seguimiento y estado de postulaciones

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF30–RSF32**. UI: **RF-08, RF-10, RF-13**. Bloqueos identificados: **B-08, B-09**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (8)

- [ ] **M08-01 · Aprobar estados y transiciones de postulación**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-08`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Matriz de transiciones para estados inicial/En revisión/Preseleccionado/Avanza/No avanza y reglas de reversión; permisos por rol.
  - **Destino propuesto:** `docs/decisions/, specs/08-seguimiento/spec.md`.
  - **Verificación exigida:** S03; transición inválida genera error sin mutación.

- [ ] **M08-02 · Almacenar eventos de estado inmutables**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M08-01`, `M03-02`.
  - **Puerta de ejecución:** `B-08`.
  - **Acción:** Crear application_status_events con actor, transición, fecha y referencia de postulación; preservar historial coherente.
  - **Destino propuesto:** `backend/src/modules/tracking/, backend/migrations/`.
  - **Verificación exigida:** Cambio concurrente no inserta dos estados vigentes; auditoría trazable.

- [ ] **M08-03 · Consultar postulaciones por oferta propia**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M08-02`, `M01-10`.
  - **Puerta de ejecución:** `B-09`.
  - **Acción:** Endpoint reclutador filtra usando autor autenticado de la oferta, no ID de empresa.
  - **Destino propuesto:** `GET /api/v1/recruiter/jobs/{jobId}/applications`.
  - **Verificación exigida:** S01/S02; reclutador B de misma empresa denegado.

- [ ] **M08-04 · Actualizar estado desde backend con concurrencia**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M08-02`, `M07-05`.
  - **Puerta de ejecución:** `B-08`.
  - **Acción:** Aplicar máquina de estados autorizada con control de versión y evento inmutable; no inventar notificaciones externas.
  - **Destino propuesto:** `contrato de actualización a revisar en OpenAPI`.
  - **Verificación exigida:** S03; transiciones inválidas y stale update son rechazadas.

- [ ] **M08-05 · Exponer timeline del candidato propio**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M08-02`, `M03-08`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** GET retorna último estado validado y secuencia autorizada, sin detalles privados internos ni notas reclutador.
  - **Destino propuesto:** `GET /api/v1/candidate/applications/{appId}/timeline`.
  - **Verificación exigida:** S04/T-15; candidato A no ve eventos de B.

- [ ] **M08-06 · Pipeline reclutador y filtros autorizados**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M08-03`, `M08-04`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Tabla o Kanban solo si lo justifica prototipo, con filtros por estado; score solo si M06 validado.
  - **Destino propuesto:** `frontend/src/pages/recruiter/, components/domain/`.
  - **Verificación exigida:** S01/S02; Vacío de filtro distinto de sin postulaciones, sin filas ajenas.

- [ ] **M08-07 · Mis postulaciones y timeline candidato**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M08-05`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Mostrar estado vigente, etapas y eventos pertinentes sin inventar avance cuando IA está pendiente.
  - **Destino propuesto:** `frontend/src/pages/candidate/, components/domain/`.
  - **Verificación exigida:** S04; estados Ideal/Vacío/Parcial/Carga/Error con CTA contextual.

- [ ] **M08-08 · Pruebas de transiciones, propiedad y consistencia**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M08-06`, `M08-07`, `M00-18`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Verificar estado stale, lectura ajena, cambios concurrentes y consulta posterior; audit logs sin PII innecesaria.
  - **Destino propuesto:** `tests/integration/tracking/, tests/e2e/tracking/`.
  - **Verificación exigida:** S01–S04, T-15/T-16; timeline coincide con historial real.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
