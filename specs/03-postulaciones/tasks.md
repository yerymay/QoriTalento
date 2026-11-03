# TASKS-F5-03 — Postulación y adjunto PDF

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF09–RSF12**. UI: **RF-04, RF-10, RF-15**. Bloqueos identificados: **B-04, B-08**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (10)

- [ ] **M03-01 · Aprobar cardinalidad y estado de postulación**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-05`, `M00-08`.
  - **Puerta de ejecución:** `B-04`, `B-08`.
  - **Acción:** Definir duplicados de candidato/oferta, estados iniciales y política de reenvío; coordinar transiciones con M08.
  - **Destino propuesto:** `docs/decisions/ y specs/03-postulaciones/spec.md`.
  - **Verificación exigida:** Regla idempotencia definida; escenarios P01–P04 inequívocos.

- [ ] **M03-02 · Persistencia de postulación/snapshot**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M03-01`, `M02-02`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Esquemas applications y snapshot de perfil confirmado, FK a oferta/candidato, constraints según cardinalidad aprobada.
  - **Destino propuesto:** `backend/src/modules/applications/, backend/migrations/`.
  - **Verificación exigida:** No es posible relacionar CV con postulación de otro propietario.

- [ ] **M03-03 · Iniciar postulación en oferta habilitada**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M03-02`, `M02-09`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Crear borrador de postulación solo para candidato autenticado cuando la oferta acepte; comprobar al empezar y al confirmar.
  - **Destino propuesto:** `POST /api/v1/jobs/{jobId}/applications`.
  - **Verificación exigida:** P01/P03; oferta no publicada o cerrada es denegada en backend.

- [ ] **M03-04 · Carga PDF y validación server**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M03-03`, `M00-16`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Admitir PDF conforme a MIME real, firma, límites y escaneo aprobado; validar propiedad y guardar metadatos.
  - **Destino propuesto:** `POST /api/v1/candidate/applications/{appId}/cv`.
  - **Verificación exigida:** P02; archivos no válidos no entran al almacenamiento privado.

- [ ] **M03-05 · Descarga privada y titularidad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M03-04`, `M01-10`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Validar candidato dueño u oferta de reclutador creador; denegar acceso a CV de otra postulación.
  - **Destino propuesto:** `endpoint de lectura CV de contrato F4`.
  - **Verificación exigida:** P04 y T-06; URLs directas no revelan archivos.

- [ ] **M03-06 · Sincronizar fase de revisión de CV con M04**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M03-04`, `M04-06`.
  - **Puerta de ejecución:** `B-04`, `B-07`.
  - **Acción:** No permitir submit definitivo sin versión de datos confirmada por candidato; conservar el snapshot y su referencia.
  - **Destino propuesto:** `backend/src/modules/applications/`.
  - **Verificación exigida:** PO-05; PDF original preservado; manipulación de ID o versión rechazada.

- [ ] **M03-07 · Confirmación final con idempotencia**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M03-06`, `M02-09`.
  - **Puerta de ejecución:** `B-04`, `B-08`.
  - **Acción:** POST final debe ser atómico ante doble clic, reintento y cierre de oferta durante el formulario.
  - **Destino propuesto:** `POST /api/v1/candidate/applications/{appId}/submit`.
  - **Verificación exigida:** P03/PO-08; no duplicar ni enviar si oferta se cerró.

- [ ] **M03-08 · Listado/detalle de mis postulaciones**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M03-02`, `M01-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Filtrar por identidad de candidato, sin confiar en IDs de query y sin mezclar postulaciones ajenas.
  - **Destino propuesto:** `GET /api/v1/candidate/applications y /{appId}`.
  - **Verificación exigida:** PO-06; candidato B no obtiene expediente de A.

- [ ] **M03-09 · Pantallas de postulación y subida**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M03-07`, `M00-20`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Formulario PDF y revisión, progreso confirmado/pendiente, confirmación final contextual y cinco estados aplicables.
  - **Destino propuesto:** `frontend/src/pages/candidate/, components/domain/`.
  - **Verificación exigida:** P01–P04 desde UI; errores no borran campos; no placeholders irreales.

- [ ] **M03-10 · Pruebas archivo ajeno, duplicados y carrera**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M03-08`, `M03-09`, `M00-18`.
  - **Puerta de ejecución:** `B-04`, `B-08`.
  - **Acción:** Con fixtures de PDF sin datos reales, probar cambios de oferta durante envío, descarga de otro usuario y reintentos.
  - **Destino propuesto:** `tests/integration/applications/, tests/security/`.
  - **Verificación exigida:** P01–P04 y T-15; BD no conserva registros incoherentes.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
