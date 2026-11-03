# TASKS-F5-04 — Extracción clásica y confirmación de CV

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF13–RSF16**. UI: **RF-05, RF-16, RF-17**. Bloqueos identificados: **B-04, B-07**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (10)

- [ ] **M04-01 · Especificar extracción y manejo de documentos**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-05`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Aprobar política de PDF digital, excepciones de protegido/escaneado, campos detectables y calidad aceptable sin OCR.
  - **Destino propuesto:** `docs/decisions/, specs/04-extraccion-cv/spec.md`.
  - **Verificación exigida:** Casos C01/C02 documentados; no prometer 100% de extracción.

- [ ] **M04-02 · Diseñar persistencia de texto/resultado y versiones**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M04-01`, `M03-02`.
  - **Puerta de ejecución:** `B-04`, `B-07`.
  - **Acción:** Metadatos del PDF original, resultado estructurado, fuentes, perfil confirmado y eventos sin exponer texto completo innecesario.
  - **Destino propuesto:** `backend/src/modules/cv/, backend/migrations/`.
  - **Verificación exigida:** Integridad por postulación y versión, datos privados por defecto.

- [ ] **M04-03 · Extraer únicamente texto embebido**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M04-02`, `M03-04`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Aplicar parser clásico a PDF digital sin OCR/LLM y manejar sin texto, corruptos y protegidos.
  - **Destino propuesto:** `backend/src/modules/cv/parse/`.
  - **Verificación exigida:** C02/T-05; sin texto retorna estado recuperable y no inventa campos.

- [ ] **M04-04 · Sugerir campos con reglas verificables**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M04-03`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Mapear contacto, formación, experiencia y habilidades solo si hay evidencia en texto, registrando incertidumbre y origen.
  - **Destino propuesto:** `backend/src/modules/cv/extract/`.
  - **Verificación exigida:** C01; ausencia marcada No detectado, no completada con suposición.

- [ ] **M04-05 · Exponer resultado y edición solo candidato**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M04-04`, `M01-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Endpoint candidato devuelve campos sugeridos/procedencia y permite borrador de corrección; otro usuario no puede leer.
  - **Destino propuesto:** `GET /api/v1/candidate/applications/{appId}/cv-extraction`.
  - **Verificación exigida:** CV-03/CV-04; datos incompletos permanecen corregibles.

- [ ] **M04-06 · Confirmar perfil/versiones inmutables**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M04-05`.
  - **Puerta de ejecución:** `B-07`.
  - **Acción:** Persistir exactamente la versión corregida/confirmada; original PDF sin mutación; gestionar versionado posterior según regla aprobada.
  - **Destino propuesto:** `PUT /api/v1/candidate/applications/{appId}/profile-confirmation`.
  - **Verificación exigida:** C03; guarda corrección auditable y fuente original.

- [ ] **M04-07 · Revisión de CV solo lectura para reclutador**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M04-06`, `M03-05`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Visor protegido PDF y datos confirmados; notas separadas sin permiso de actualizar perfil candidato.
  - **Destino propuesto:** `GET /api/v1/recruiter/applications/{appId}/cv; POST /notes`.
  - **Verificación exigida:** C04/T-06; API de edición de datos confirmado denegada incluso vía petición manual.

- [ ] **M04-08 · Estados y recuperación del parser**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M04-03`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Distinguir procesando, parcial, sin texto, fallo y datos completos; fallos localizados por región.
  - **Destino propuesto:** `backend/src/modules/cv/ y frontend/src/components/domain/`.
  - **Verificación exigida:** C02; recuperación no afirma haber leído PDF escaneado.

- [ ] **M04-09 · Pantallas de datos extraídos y revisión**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M04-06`, `M04-07`, `M04-08`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Candidato corrige por campo, reclutador visualiza con notas, responsive pestañas, estados por sección y origen visible.
  - **Destino propuesto:** `frontend/src/pages/candidate/, frontend/src/pages/recruiter/`.
  - **Verificación exigida:** C01–C04, sólo candidato puede editar; uso teclado.

- [ ] **M04-10 · Pruebas del parser y privacidad de CV**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M04-09`, `M00-18`.
  - **Puerta de ejecución:** `B-04`, `B-07`.
  - **Acción:** Fixtures sintéticos digital/incompleto/sin texto/corrupto; permisos negativos y conservación versión.
  - **Destino propuesto:** `tests/unit/cv/, tests/integration/cv/`.
  - **Verificación exigida:** T-05/T-06, C01–C04; reclutador ajeno sin acceso.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
