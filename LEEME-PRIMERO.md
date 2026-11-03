# Qori Talento — Versión consolidada para comenzar el desarrollo

**Paquete:** SDD Base de Desarrollo v1.0 · **Preparado:** 2026-11-03  
**Estado real:** documentación de las fases 1–5 consolidada y verificada; **sin implementación funcional del ATS**.  
**Importante:** «versión final» significa paquete documental único y listo para iniciar trabajo técnico, **no** que todas las decisiones de negocio estén aprobadas o que la aplicación esté terminada.

## 1. ¿Qué recibiste?

- Requisitos originales inalterados: PDF del sistema y TXT de interfaz, más las matrices y auditoría.
- Registro de decisiones aprobadas y de decisiones pendientes (B-01 a B-10).
- Ocho carpetas `specs/`: `spec.md`, `plan.md`, `tasks.md`; módulo 06 incluye `addendum-ia-v04.md`.
- Diseño técnico: arquitectura, seguridad, persistencia conceptual, exámenes, evaluación IA, frontend, despliegue y pruebas.
- Contrato OpenAPI 3.1 **borrador** y diagramas Mermaid.
- 120 tareas del backlog SDD: 24 transversales + 85 funcionales + 11 de validación.
- Herramientas *opcionales* para verificar entorno/documentación; archivos `.env.example` **sin secretos**.

**No contiene** frontend Astro operativo, backend Express operativo, migraciones SQL ejecutables, servidor MySQL, aplicación Figma exportada, proveedor SMS ni sistema de IA calibrado. Son trabajos de implementación posteriores.

## 2. Instalación (Windows, VS Code)

1. Guarda o realiza un respaldo de tu repositorio actual. No elimines `frontend/` ni `backend/`.
2. Extrae este ZIP en una carpeta temporal.
3. Copia a la **raíz** de `qori-talento/` las carpetas `docs/`, `specs/`, `contratos/`, `diagramas/`, `config-ejemplos/`, `herramientas/`, `ejemplos/` y `LEEME-PRIMERO.md`, `README-SDD.md`, `README.md`. Compara antes de sobrescribir archivos homónimos existentes.
4. Si aún no existen `frontend/` y `backend/`, créalas vacías o mediante el proceso de scaffold documentado en `docs/implementation/00-arranque-tecnico.md`. **No copies** `specs/` dentro de `frontend/src/` o `backend/src/`.
5. Ejecuta desde la raíz del repositorio uno de estos comandos (opcionales; solo comprueban):

```powershell
python herramientas/verificar-sdd.py
powershell -ExecutionPolicy Bypass -File .\herramientas\verificar-entorno.ps1
```

6. Si usas Git, revisa `git status` y crea un commit con la línea documental antes de hacer cambios de código. Nunca agregues `.env` con credenciales ni CV reales.

## 3. Lectura mínima, en orden

1. `docs/decisions/decisiones-aprobadas.md` — reglas de producto ya confirmadas.
2. `docs/decisions/00-acta-decisiones-pendientes.md` — B-01 a B-10, **no aprobadas**.
3. `docs/constitution-borrador.md` — guía SDD pendiente de ratificación.
4. `docs/architecture/01-arquitectura-sistema.md` y `docs/architecture/04-seguridad-privacidad.md`.
5. `docs/implementation/00-arranque-tecnico.md` — entorno, carpetas y primer trabajo.
6. `docs/implementation/fase5-secuencia.md`, `fase5-backlog-transversal.md`, `fase5-definition-ready-done.md`.
7. Para cada módulo: `specs/NN-modulo/spec.md` → `plan.md` → `tasks.md`. Para M06 leer también `addendum-ia-v04.md`.

Los requisitos originales se conservan en `docs/requirements/sources/` y prevalecen salvo cambios explícitamente aprobados y trazados. Los documentos de versiones antiguas están archivados en `docs/historico/`.

## 4. Orden correcto para empezar

**Paso 0 — Control documental:** resolver y registrar las decisiones necesarias para el primer módulo. Se puede preparar el repositorio y las pruebas sin asumir decisiones pendientes.  
**Paso 1 — Tareas M00-10 a M00-24:** acordar la arquitectura definitiva, preparar frontend/backend, migraciones, API, pruebas, sesiones, seguridad y diseño base. Ejecutar solo lo que tenga ADR/puertas aprobadas.  
**Paso 2 — M01:** usuarios, registro, activación, roles y **propiedad individual** de ofertas y postulaciones; B-03 y B-09 afectan las reglas.  
**Paso 3 — M02:** ofertas y moderación; B-01 y B-02 son obligatorios.  
**Paso 4 — M03 + M04 entrelazados:** PDF digital → extracción clásica → revisión/confirmación → postulación.  
**Paso 5 — M05:** exámenes: servidor controla hora y guardado aceptado antes del límite.  
**Paso 6 — M06:** nota objetiva; evaluación IA mediante Ollama local `qwen2.5:7b-instruct` cuando se apruebe y valide rúbrica B-06.  
**Paso 7 — M07 + M08:** decisiones por reclutador y seguimiento.  
**Paso 8 — V00:** seguridad, accesibilidad, RNF, integraciones, consistencia, regresión y liberación.

## 5. Reglas ya aprobadas que no debes cambiar en código

- Dos tipos de reclutador: empresa (correo corporativo) y particular (teléfono verificado); todos requieren verificar email.
- Particular: máximo dos ofertas activas simultáneamente y primera oferta moderada (faltan definición de activa y moderador).
- Cada reclutador solo accede a sus **propias ofertas/candidatos**, incluso si pertenece a la misma empresa; autorización en Express, no solo ocultar botones.
- PDF digital y extracción clásica sin OCR/IA en MVP; candidato revisa/corrige, reclutador no modifica la fuente.
- Reloj de examen definitivo en servidor, guardado por pregunta; respuestas fuera de plazo rechazadas.
- La IA **propone** puntaje orientativo y breve explicación con evidencias; decisión de contratación exclusivamente humana. No publicar puntuación real sin rúbrica y validación aprobadas.
- Estados UI por sección: Ideal, Vacío, Parcial, Carga y Error; tema Sky + Inter + Flowbite, roles separados; sin menú «Estados de UI».

## 6. Primer commit recomendado

```powershell
git status
git add docs specs contratos diagramas config-ejemplos herramientas ejemplos LEEME-PRIMERO.md README-SDD.md README.md
git commit -m "docs: consolidar SDD y preparar inicio de desarrollo"
```

Si copias `.gitignore` sugerido, inclúyelo también después de **comparar** con el que ya tienes. Solo ejecuta `git commit` si configuraste Git y deseas registrar estos archivos.

## 7. Puertas / definiciones de finalización

- Ninguna tarea `tasks.md` está completada: todas empiezan como `[ ]`.
- Ninguna propuesta ADR es automáticamente decisión aprobada.
- Los bloqueos B-01 a B-10 de la Fase 4 continúan abiertos **según los documentos disponibles**, hasta que registres su aprobación.
- Para dar una tarea por hecha: implementación, pruebas positivas y negativas, permisos y evidencia; ver `docs/implementation/fase5-definition-ready-done.md`.
- Figma sigue siendo referencia visual. Hay 20 enlaces entre roles identificados en la auditoría inicial que requieren revisión y corrección.

## 8. Índice rápido

| Necesitas... | Abre... |
|---|---|
| Reglas confirmadas | `docs/decisions/decisiones-aprobadas.md` |
| Decisiones que faltan | `docs/decisions/00-acta-decisiones-pendientes.md` |
| Arquitectura | `docs/architecture/01-arquitectura-sistema.md` |
| API propuesta | `contratos/openapi-3.1-draft.yaml` |
| Diagrama de datos | `diagramas/modelo-er.mmd` |
| Orden de desarrollo | `docs/implementation/fase5-secuencia.md` |
| Primeras acciones | `docs/implementation/00-arranque-tecnico.md` |
| Tareas específicas | `specs/<módulo>/tasks.md` |
| Comprobar carpeta | `herramientas/verificar-sdd.py` |
| Verificar Ollama y entorno | `herramientas/verificar-entorno.ps1` |

**Estado:** listo para **empezar la implementación controlada** del scaffold y las tareas no bloqueadas, no para desplegar el producto terminado.
