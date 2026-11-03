# Qori Talento — Fase 5 SDD v0.5

**Fecha:** 2026-11-03. **Tipo:** plan de tareas, sin código ejecutable.

## Entrega

- **120 tareas planificadas**: 24 de gobernanza/plataforma, 85 de módulos de negocio y 11 de validación transversal.
- Ocho `tasks.md` bajo las mismas rutas canónicas de `spec.md` y `plan.md`, sin modificar esos documentos previos.
- Matriz de secuencia/dependencias, DoR/DoD, registro de bloqueos, trazabilidad, escenarios E2E y diagrama Mermaid.
- Respeta Ollama local + `qwen2.5:7b-instruct`, nota objetiva independiente, score orientativo sin automatizar decisiones, fecha límite estricta de examen y propietario individual.

## Alcance y precaución

Todos los checklist `[ ]` representan **tareas por implementar**, no actividades completadas. Los diez bloqueos B-01 a B-10 de Fase 4 siguen abiertos **según documentación fuente**. Puede prepararse trabajo documental y de infraestructura sin atribuir una decisión de negocio no aprobada; los cambios funcionales bloqueados deben esperar su aprobación.

## Cómo integrar sin sobrescribir documentación previa

1. Descomprimir el ZIP incremental.
2. Desde dentro, copiar `specs/`, `docs/` y `diagramas/` a la raíz del proyecto, **fusionando carpetas**. Como solo hay archivos nuevos con nombres de Fase 5, no borrar los originales `spec.md`/`plan.md`.
3. Verificar `specs/01-gestion-usuarios/tasks.md` y `docs/implementation/fase5-secuencia.md`.
4. Leer `docs/implementation/fase5-bloqueos.md` y registrar las aprobaciones antes de programar comportamientos dependientes.
5. Guardar commit documental antes de iniciar la implementación.

## Ruta de lectura

1. `docs/implementation/fase5-secuencia.md` — fases y dependencias.
2. `docs/implementation/fase5-indice-tareas.md` — resumen y prioridades.
3. `docs/implementation/fase5-bloqueos.md` — qué requiere decisión.
4. `docs/implementation/fase5-backlog-transversal.md` — gobierno y plataforma.
5. `specs/<módulo>/tasks.md` — trabajo implementable por requisito, con tests concretos.
6. `docs/implementation/fase5-definition-ready-done.md` y `fase5-escenarios-e2e.md` — criterios de aceptación.

## Inicio recomendado de la siguiente etapa

Aprobar constitución + ADR y B-03/B-09 de identidad, luego construir infra mínima y M01 con pruebas de propiedad. Resolver B-01/B-02 antes de publicación de ofertas. Validar B-06 antes de usar ranking IA de candidatos reales.

**No creado:** frontend, backend, migraciones, rutas reales, tests ejecutados, servidor Ollama, modificaciones de Figma ni conexiones de producción.
