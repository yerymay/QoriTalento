# 12 · Plan de ejecución futuro — puente a Fase 5

Este plan **no autoriza implementación en Fase 4**. Proporciona dependencias lógicas, entregables futuros y puertas de verificación.

## Orden propuesto

| Ola | Módulos | Trabajo previsto tras aprobación | Prueba de salida |
|---|---|---|---|
| 0 | Gobernanza | aprobar Constitución F2, cerrar bloqueos A/B relevantes; validar OpenAPI y ER | acuerdos registrados, diffs requisitos |
| 1 | 01 | estructura frontend/backend, sesión, registro, verificación, separación de roles | usuario inactivo sin acceso; permisos negativos |
| 2 | 02 | CRUD propio, estados, cuota y moderación | 2 ofertas máx; no acceso horizontal; publicación moderada |
| 3 | 03–04 | postulación, PDF, extracción clásica, perfil versionado | PDF sin texto gestionado; propietario y versión |
| 4 | 05 | exámenes, preguntas, intentos, guardados, finalización por servidor | concurrencia, recarga, deadline estricto |
| 5 | 06 | nota examen + worker IA Ollama + validación y rúbrica | pruebas de evidencia, reproducibilidad y sesgos aprobadas |
| 6 | 07–08 | resultados, evaluación explicada, decisión humana, timeline | validación de estados y autorizaciones |
| 7 | transversal | accesibilidad, 5 estados, tema, seguridad, cargas y despliegue | RNF completos con evidencias |

**Advertencia:** la ola 5 requiere aprobar B-06; la ola 2 requiere B-01/B-02; la ola 1 requiere B-03; la ola 6 requiere B-08/B-09. Se puede diseñar arquitectura conceptual mientras estén abiertos, **no cerrar su implementación** por suposición.

## Estructura propuesta de futuro repositorio

```text
qori-talento/
  frontend/           # Astro + Flowbite/Tailwind
  backend/            # Node + Express (módulos + worker)
  docs/               # Constitución, ADR, arquitectura, ER, seguridad
  specs/              # 8 módulos: spec.md, plan.md, tasks.md (en F5)
  contratos/          # OpenAPI y esquemas de resultados
  tests/              # contratos, integración, e2e, accesibilidad, IA
```

## Definición de preparado para implementar (Definition of Ready)

- Especificación y criterios Gherkin aprobados.
- Modelo de propiedad y reglas de transición sin contradicciones.
- Contrato HTTP revisado, errores y permisos explícitos.
- Datos mínimos/casos de prueba sintéticos disponibles.
- Atributos RNF cuantificables donde afectan a módulo.
- Seguridad/privacidad de CV y candidatos contemplada y bloqueos críticos resueltos.

## Siguiente entregable SDD (Fase 5)

Crear `tasks.md` por módulo a partir de planes revisados, estimación/dependencias, plan de pruebas y secuencia de implementación, sin saltarse puertas de negocio. No existe código en estos documentos y no se garantiza que Ollama esté corriendo durante esta sesión.
