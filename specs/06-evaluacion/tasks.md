# TASKS-F5-06 — Calificación de exámenes y evaluación IA

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md) y [addendum-ia-v04.md](addendum-ia-v04.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF22–RSF25**. UI: **RF-08, RF-19**. Bloqueos identificados: **B-06, B-07**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (13)

- [ ] **M06-01 · Calcular nota objetiva del examen**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M05-08`, `M05-09`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Calificar solo respuestas aceptadas y clave/version asociada al intento cerrado; preservar cálculo y evidencia de forma independiente de IA.
  - **Destino propuesto:** `backend/src/modules/evaluation/exam-grading/`.
  - **Verificación exigida:** V01; no integra respuestas postdeadline, no reescribe nota por cambio de plantilla.

- [ ] **M06-02 · Formalizar rúbrica de compatibilidad IA**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-07`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Aprobar campos evaluables, escala y explicaciones, política de atributos irrelevantes, límites de certeza y dataset sintético con evaluación humana.
  - **Destino propuesto:** `docs/decisions/, specs/06-evaluacion/addendum-ia-v04.md`.
  - **Verificación exigida:** B-06 cerrado formalmente; hasta entonces no publicar puntajes de candidatos reales.

- [ ] **M06-03 · Definir esquema JSON y validación de evidencias**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M06-02`, `M00-13`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Modelar score, explicación breve, requisitos coincidentes/ausentes, referencias a fuente, versión de modelo/prompt/rúbrica y estado NEEDS_REVIEW.
  - **Destino propuesto:** `contratos/ y backend/src/modules/evaluation/schema/`.
  - **Verificación exigida:** JSON inválido/falta evidencia => rechazo y score no publicable (T-11/T-13).

- [ ] **M06-04 · Preparar adaptador Ollama local**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M06-03`, `M00-17`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Invocar API interna de Ollama con qwen2.5:7b-instruct y timeouts, límites de contexto y mocks de test; no exponer puerto públicamente.
  - **Destino propuesto:** `backend/src/modules/evaluation/ollama-adapter/`.
  - **Verificación exigida:** Con modelo disponible responde esquema; sin Ollama retorna error controlado sin afectar examen.

- [ ] **M06-05 · Minimizar entradas y defender prompt injection**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-03`, `M04-06`, `M06-01`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Enviar solo datos confirmados pertinentes, oferta y nota objetiva; excluir atributos protegidos/datos no necesarios; tratar texto CV como datos no instrucciones.
  - **Destino propuesto:** `backend/src/modules/evaluation/input-builder/`.
  - **Verificación exigida:** Intento de instrucciones dentro de CV no cambia reglas ni accede a secretos.

- [ ] **M06-06 · Procesar IA como trabajo asíncrono**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M06-04`, `M06-05`, `M00-17`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Crear evaluación PENDING, ejecutar worker/reintentos limitados, GET por id en 202/polling controlado con propietario.
  - **Destino propuesto:** `POST /api/v1/recruiter/applications/{appId}/ai-evaluations, GET .../{evaluationId}`.
  - **Verificación exigida:** Timeout o fallo NO bloquea consultas ni modifica nota objetiva; T-12.

- [ ] **M06-07 · Persistir resultado, versión y referencias**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-06`, `M00-12`.
  - **Puerta de ejecución:** `B-06`, `B-07`.
  - **Acción:** Guardar estado READY/NEEDS_REVIEW/FAILED, modelo exacto, prompt/rúbrica, referencias a evidencia verificable, timestamps y snapshot.
  - **Destino propuesto:** `backend/src/modules/evaluation/, backend/migrations/`.
  - **Verificación exigida:** Reprocesar no sobrescribe histórico silenciosamente.

- [ ] **M06-08 · Validar y rechazar afirmaciones no sustentadas**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-07`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Verificar formato, escala, IDs evidencia, referencias y coherencia; si inventa una certificación => NEEDS_REVIEW sin score publicable.
  - **Destino propuesto:** `backend/src/modules/evaluation/validators/`.
  - **Verificación exigida:** T-11/T-13; un JSON estructurado válido no se considera correcto por sí mismo.

- [ ] **M06-09 · Calibrar reproducibilidad y equidad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-08`, `M00-18`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Ejecutar benchmark sintético, comparación humana, invariancia ante atributos irrelevantes, estabilidad y explicaciones, con umbrales aprobados.
  - **Destino propuesto:** `tests/ai/, docs/quality/ai-evaluation.md`.
  - **Verificación exigida:** Se documentan métricas y rechazo/aceptación; no certificar uso real si falla.

- [ ] **M06-10 · Definir reevaluación al variar perfil/versión**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M06-07`.
  - **Puerta de ejecución:** `B-07`.
  - **Acción:** Preservar resultados previos y asociar score a versión confirmada; solo ejecutar reevaluación conforme autorización.
  - **Destino propuesto:** `backend/src/modules/evaluation/versioning/`.
  - **Verificación exigida:** CV cambia y nota antigua no desaparece ni se aplica en silencio al perfil nuevo.

- [ ] **M06-11 · Publicar resultados/ranking solo si validados**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M06-08`, `M06-09`, `M06-10`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Exponer score orientativo y explicación con evidencia y limitación; no clasificar ni rechazar automáticamente; filtro/orden solo si habilitado.
  - **Destino propuesto:** `GET /api/v1/recruiter/jobs/{jobId}/results`.
  - **Verificación exigida:** V02/V04; score bloqueado no aparece como resultado real, restricción de dueño.

- [ ] **M06-12 · UI evaluación parcial y explicabilidad**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M06-01`, `M06-06`, `M06-11`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Panel separa nota objetiva y IA pendiente/lista/necesita revisión/fallida; skeleton parcial, error, explicación y detalle de sustento.
  - **Destino propuesto:** `frontend/src/pages/recruiter/, components/domain/`.
  - **Verificación exigida:** T-12; error Ollama no borra nota del examen, nunca muestra descarte automático.

- [ ] **M06-13 · Pruebas de IA, permisos y regresiones**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-09`, `M06-12`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Simular JSON roto, timeout, evidencia inventada, prompt inyectado, drift por versión y acceso horizontal; registrar dataset de evaluación.
  - **Destino propuesto:** `tests/ai/, tests/integration/evaluation/`.
  - **Verificación exigida:** T-11–T-13, V01–V04 y controles de equidad documentados.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
