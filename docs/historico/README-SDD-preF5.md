# Qori Talento — Documentación SDD integrada (pre-Fase 5)

**Fecha de preparación:** 2026-11-03. **Estado:** documentación de planificación, NO código implementado.

Este paquete fue consolidado a partir de los documentos originales y las entregas de las Fases 1 a 4.
Se ha mantenido el contenido de origen sin modificarlo; solo se han reubicado o renombrado archivos.
No reemplaza archivos del proyecto que ya existan ni constituye aprobación formal de reglas pendientes.

## Instalación en tu proyecto

1. Haz una copia de seguridad del repositorio y revisa `git status` antes de copiar.
2. Abre la raíz del proyecto `qori-talento/` (donde están o estarán `frontend/` y `backend/`).
3. Copia desde este paquete **las carpetas** `docs/`, `specs/`, `contratos/`, `diagramas/` y el archivo `README-SDD.md` a esa raíz. Si existe algún destino homónimo, COMPARA antes de sobrescribir.
4. No copies los documentos a `frontend/src`, `backend/src` ni `frontend/public`.
5. Si tienes Git, registra la documentación en una rama/commit antes de iniciar Fase 5.
6. No crees tablas, endpoints ni código a partir de estas propuestas sin resolver los bloqueos críticos.

## Lectura recomendada (en este orden)

1. `docs/requirements/sources/` — requisitos originales de sistema y UI, fuente de verdad inicial.
2. `docs/requirements/auditoria-fase1.md`, `docs/requirements/matriz-impacto-v02.xlsx`, `docs/requirements/impacto-rf-rnf-v02.md` — auditoría y modificaciones derivadas de decisiones del usuario.
3. `docs/decisions/decisiones-aprobadas.md`, `docs/constitution-borrador.md`, `docs/architecture/10-decisiones-y-bloqueos.md` — reglas aprobadas y bloqueos pendientes. Constitución NO aprobada todavía.
4. `specs/<módulo>/spec.md` — Fase 3; comportamiento previsto y criterios de aceptación.
5. `specs/<módulo>/plan.md` — Fase 4; diseño técnico previsto. El módulo 06 tiene además `addendum-ia-v04.md` que actualiza el alcance de IA.
6. `docs/architecture/01-arquitectura-sistema.md`, `02-modelo-datos-conceptual.md`, `03-contratos-api.md`, `04-seguridad-privacidad.md` y demás capítulos — arquitectura propuesta.
7. `contratos/openapi-3.1-draft.yaml` y `diagramas/*.mmd` — documentación de interfaz y diagramas, **NO API funcional**.
8. `docs/architecture/12-plan-ejecucion.md` — puente hacia tareas de Fase 5.

## Módulos y rutas canónicas

| Módulo | Qué | Cómo | Próxima F5 |
|---|---|---|---|
| 01-gestion-usuarios | `spec.md` | `plan.md` | `tasks.md` |
| 02-ofertas | `spec.md` | `plan.md` | `tasks.md` |
| 03-postulaciones | `spec.md` | `plan.md` | `tasks.md` |
| 04-extraccion-cv | `spec.md` | `plan.md` | `tasks.md` |
| 05-examenes | `spec.md` | `plan.md` | `tasks.md` |
| 06-evaluacion | `spec.md` + `addendum-ia-v04.md` | `plan.md` | `tasks.md` |
| 07-resultados-seleccion | `spec.md` | `plan.md` | `tasks.md` |
| 08-seguimiento | `spec.md` | `plan.md` | `tasks.md` |

Todos estos archivos están en `specs/<módulo>/`. Aún no existe `tasks.md`.

## Precauciones

- **No confundir Fase 2 con Fase 3:** las cinco especificaciones `v0.2` están bajo `docs/historico/v02-specs/` para preservar antecedentes. No se usan como fuente vigente de planes, porque los ocho `spec.md` de Fase 3 son la base modular actual.
- **No asumir Constitución aprobada:** `docs/constitution-borrador.md` debe revisarse y ratificarse, luego podría transformarse en `docs/constitution.md`.
- **No asumir IA validada:** Fase 4 propone Ollama + `qwen2.5:7b-instruct`, pero la rúbrica, calidad, equidad y explicaciones requieren validación; no hay autorización para descarte automático.
- **No asumir que el prototipo es correcto:** auditoría F1 detectó transiciones de navegación candidato→reclutador incorrectas.
- **No copiar fuentes históricas como specs vigentes:** `docs/historico/` conserva referencias antiguas con contexto de su momento.
- **No publicar datos reales de candidatos ni secretos:** aquí solo debe existir documentación y datos de prueba sintéticos; los CV reales deben mantenerse fuera de Git.
- **No confundir decisiones aprobadas con propuestas F4:** consulta `docs/architecture/10-decisiones-y-bloqueos.md` antes de implementar.

## Fase 5 (pendiente)

En Fase 5 se crearán y priorizarán `tasks.md` por módulo, incluyendo pruebas, dependencias, criterios de completado y bloqueos. No se debe iniciar programación de funcionalidades bloqueadas con valores arbitrarios.
