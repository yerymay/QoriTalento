# TASKS-F5-07 — Resultados y decisión humana

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF26–RSF29**. UI: **RF-08, RF-09, RF-19, RF-20**. Bloqueos identificados: **B-06, B-08, B-09**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (8)

- [ ] **M07-01 · Precisar qué datos puede ver y decidir reclutador**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-08`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Definir campos resultado, nota objetiva, estado IA, notas privadas y acciones sin asumir información inventada.
  - **Destino propuesto:** `specs/07-resultados-seleccion/spec.md, docs/decisions/`.
  - **Verificación exigida:** R01/R02, regla de propiedad individual y acceso del rol excepcional revisado.

- [ ] **M07-02 · Listado de resultados filtrado por propietario**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M07-01`, `M03-08`, `M06-01`.
  - **Puerta de ejecución:** `B-09`.
  - **Acción:** Consultar candidatos asociados solo a oferta creada por principal, incluir únicamente datos disponibles y no forzar score.
  - **Destino propuesto:** `GET /api/v1/recruiter/jobs/{jobId}/results`.
  - **Verificación exigida:** R01/T-01; ningún candidato de otro reclutador visible.

- [ ] **M07-03 · Ficha integrada con regiones de datos reales**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M07-02`, `M04-07`, `M06-12`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Unir perfil confirmado, PDF, notas, calificación del examen y IA si está validada; estados parciales por panel.
  - **Destino propuesto:** `GET /api/v1/recruiter/applications/{appId}`.
  - **Verificación exigida:** R02; cuando IA falla se preservan PDF y examen, sin inventar score.

- [ ] **M07-04 · Aprobar transiciones de decisión humana**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-08`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Documentar Avanza/No avanza, reversibilidad/rectificación, idempotencia y roles; evitar decisiones implícitas de IA.
  - **Destino propuesto:** `docs/decisions/, specs/07-resultados-seleccion/spec.md`.
  - **Verificación exigida:** R03/R04; tabla de transición valida cada paso.

- [ ] **M07-05 · Persistir decisión con actor, fecha y confirmación**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M07-04`, `M01-10`, `M00-15`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Guardar transacción idempotente con historial y control de concurrencia; no admitir actualización por ajeno.
  - **Destino propuesto:** `POST /api/v1/recruiter/applications/{appId}/decisions`.
  - **Verificación exigida:** R03/R04/T-14; una única decisión vigente, historial no ambiguo.

- [ ] **M07-06 · Asegurar separación IA frente a criterio humano**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M07-05`, `M06-11`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** El resultado de Ollama nunca escribe decisión ni modifica estados de postulación; mensaje explicita carácter orientativo.
  - **Destino propuesto:** `backend/src/modules/selection/`.
  - **Verificación exigida:** V04/T-14; ni score alto ni bajo cambian postulación automáticamente.

- [ ] **M07-07 · Diseñar interfaz de ficha y decisión**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M07-03`, `M07-05`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Flowbite: tabla de resultados, ficha, PDF/nota/IA y modal para confirmar decisión, con cinco estados por región.
  - **Destino propuesto:** `frontend/src/pages/recruiter/, components/domain/`.
  - **Verificación exigida:** R01–R04; sin acción de decisión antes de confirmación; foco accesible.

- [ ] **M07-08 · Pruebas de decisión, carrera y permisos**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M07-07`, `M00-18`.
  - **Puerta de ejecución:** `B-08`, `B-09`.
  - **Acción:** Dos envíos de decisión, condición 409, actor incorrecto, oferta ajena y caso IA pendiente; verificar auditoría.
  - **Destino propuesto:** `tests/integration/selection/, tests/e2e/selection/`.
  - **Verificación exigida:** T-14 y R01–R04; ningún proceso automático decide.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
