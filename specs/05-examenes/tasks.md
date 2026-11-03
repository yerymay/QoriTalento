# TASKS-F5-05 — Exámenes con reloj y guardado servidor

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF17–RSF21**. UI: **RF-06, RF-07, RF-18**. Bloqueos identificados: **B-05**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (12)

- [ ] **M05-01 · Definir política completa de intentos/examen**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-06`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Confirmar cantidad de intentos, publicación/edición, desbloqueo de candidato, expiración y orden de respuestas por revisión.
  - **Destino propuesto:** `docs/decisions/, specs/05-examenes/spec.md`.
  - **Verificación exigida:** EX-01 a EX-11, E01–E05 tienen resultados inequívocos.

- [ ] **M05-02 · Persistir exámenes, preguntas, opciones e intentos**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-01`, `M02-02`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Esquema con versión de cuestionario, clave separada, start/deadline fijo y revisiones por respuesta.
  - **Destino propuesto:** `backend/src/modules/exams/, backend/migrations/`.
  - **Verificación exigida:** No cambia el intento activo al editar plantilla; constraints verificables.

- [ ] **M05-03 · Crear examen solo para oferta propia**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-02`, `M01-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Validar que creador de oferta gestione examen y duración positiva; proteger respuestas correctas.
  - **Destino propuesto:** `POST /api/v1/recruiter/jobs/{jobId}/exams`.
  - **Verificación exigida:** EX-01–EX-03; reclutador ajeno 404/403 sin revelar claves.

- [ ] **M05-04 · Mostrar catálogo de exámenes autorizados**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M05-03`, `M03-07`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Presentar únicamente exámenes habilitados para candidato correspondiente; nunca enviar answer keys en payload.
  - **Destino propuesto:** `GET /api/v1/candidate/exams`.
  - **Verificación exigida:** E05; carga no incluye claves ni datos de otros postulantes.

- [ ] **M05-05 · Iniciar/reanudar intento con reloj servidor**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-02`, `M05-04`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** En transacción registrar inicio y deadline; reintento de iniciar no regenera tiempo ni intento vigente.
  - **Destino propuesto:** `POST /api/v1/candidate/exams/{examId}/attempts`.
  - **Verificación exigida:** E01; original deadline inmutable tras reload y múltiples POST.

- [ ] **M05-06 · Guardar respuesta por pregunta de modo seguro**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-05`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Validar pregunta/intento/actor, deadline y versión/revisión; persistir y devolver confirmación server; escrituras atrasadas no ganan.
  - **Destino propuesto:** `PUT /api/v1/candidate/attempts/{attemptId}/answers/{questionId}`.
  - **Verificación exigida:** EX-05–EX-06, T-07/T-08: revisión antigua no sobrescribe nueva.

- [ ] **M05-07 · Restaurar intento exclusivamente desde servidor**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M05-06`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Devolver server_now_utc, deadline, respuestas confirmadas y estado; no confundir borrador local con respuesta aceptada.
  - **Destino propuesto:** `GET /api/v1/candidate/attempts/{attemptId}`.
  - **Verificación exigida:** E01/E03/T-09; reloj del cliente manipulado no extiende tiempo.

- [ ] **M05-08 · Finalizar manualmente de forma idempotente**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-06`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Una transacción marca cierre y rechaza escrituras nuevas, sin doble registro en carreras.
  - **Destino propuesto:** `POST /api/v1/candidate/attempts/{attemptId}/finish`.
  - **Verificación exigida:** E04; dos cierres concurrentes dejan uno lógico.

- [ ] **M05-09 · Expirar por servidor sin navegador abierto**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-08`, `M00-17`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Proceso de expiración a deadline, tolerante a reintentos y reinicios; no acepta sincronización local tardía.
  - **Destino propuesto:** `backend/src/workers/exam-expiration/`.
  - **Verificación exigida:** E02/T-10: offline posterior a límite no cuenta, haya o no navegador.

- [ ] **M05-10 · Constructor Flowbite de exámenes**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M05-03`, `M00-20`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Pantallas para preguntas/alternativas, duración y confirmación de publicación con errores por campo.
  - **Destino propuesto:** `frontend/src/pages/recruiter/, components/domain/`.
  - **Verificación exigida:** EX-01–EX-03; guardado real y permisos backend, no mocks de producción.

- [ ] **M05-11 · Runner con reloj y guardado explícito**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M05-07`, `M05-08`, `M05-09`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Mostrar countdown derivado de servidor, por pregunta confirmada/pendiente, reconexión, advertencia y envío manual.
  - **Destino propuesto:** `frontend/src/pages/candidate/, components/domain/`.
  - **Verificación exigida:** E01–E04; latencia visual no altera deadline, cambios locales tardíos claramente rechazados.

- [ ] **M05-12 · Probar límites temporales, carreras y seguridad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-09`, `M05-11`, `M00-18`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Fijar reloj en test, enviar en frontera, invertir revisiones, paralelizar cierres, alterar tiempo local y buscar claves en respuestas.
  - **Destino propuesto:** `tests/integration/exams/, tests/e2e/exams/`.
  - **Verificación exigida:** T-07–T-10, E01–E05 pasan y aportan evidencia de BD.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
