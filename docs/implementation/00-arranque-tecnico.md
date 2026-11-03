# Guía de arranque técnico — Primer tramo de implementación

## Paso A · Respaldo y control de cambios

- [ ] Hacer copia/commit de `frontend/` y `backend/` existentes.
- [ ] Copiar `docs/`, `specs/`, `contratos/`, `diagramas/` y utilitarios a la **raíz** del repositorio.
- [ ] Ejecutar `python herramientas/verificar-sdd.py` si se dispone de Python; o comprobar manualmente la presencia de 8 `spec.md`/`plan.md`/`tasks.md`.
- [ ] Leer `docs/decisions/decisiones-aprobadas.md` y firmar B-10 antes de dar por final la constitución.

## Paso B · Entorno local

| Herramienta | Uso | Comprobación simple |
|---|---|---|
| Git | Historial y cambios | `git --version` |
| Node.js + npm | Astro y Express | `node --version`; `npm --version` |
| MySQL o Docker para MySQL | Persistencia | `mysql --version` o `docker --version` |
| Ollama | IA local | `ollama list`; `ollama ps` |
| VS Code | Trabajo en repositorio | Abrir carpeta raíz |
| Navegador | Pruebas UI | Acceder al localhost una vez creado frontend |
| Python 3 (opcional) | Verificar archivos SDD | `python --version` |

Asegurar que el runtime Node seleccionado es compatible con las versiones de Astro/Express que se instalen. Evitar seleccionar versiones o dependencias globalmente antes de confirmar arquitectura (ADR). **No es necesario instalar otro modelo:** ya existe `qwen2.5:7b-instruct`, además de `nomic-embed-text` y `qwen2.5-coder:7b`.

**Ollama:** la URL interna recomendada para comenzar a probar es `http://127.0.0.1:11434`. No abrir el puerto a Internet. Ejecuta el test opcional **con datos sintéticos** de `herramientas/probar-ollama.ps1`.

## Paso C · Rutas de proyecto, cuando se creen

```text
qori-talento/
  frontend/                 # Astro, Tailwind/Flowbite, componentes Sky
  backend/
    src/
      modules/              # módulos 01...08 (cada uno con controladores/servicios/puertos)
      shared/               # auth, autorización, validación, errores, auditoría
      workers/              # IA y vencimientos, si se aprueba ADR
    migrations/             # tablas definidas y aplicadas tras revisar ER
  tests/                    # unit/integration/contract/e2e/ai/a11y
  docs/                     # documentación SDD
  specs/                    # spec.md, plan.md, tasks.md por módulo
  contratos/
  diagramas/
  config-ejemplos/
  herramientas/
  ejemplos/
```

Si el repositorio ya tiene un frontend/backend, **adáptalo**: no elimines archivos existentes ni dupliques la aplicación. La propuesta anterior es una estructura objetivo, **no un scaffold ejecutable**.

## Paso D · Tareas concretas, primera entrega

| Orden | ID | Qué hacer | Evidencia mínima |
|---|---|---|---|
| 1 | M00-01 | Ratificar o comentar constitución | Acta o cambios pendientes |
| 2 | M00-02 | Revisar ADR-001 a ADR-010 | Registro de aprobaciones técnicas |
| 3 | M00-03 / M00-04 | Resolver B-03/B-09 y B-01/B-02 según módulo que arranque | Decisiones trazadas |
| 4 | M00-09 | Verificar requisitos ↔ especificaciones ↔ OpenAPI | Matriz revisada |
| 5 | M00-10 | Preparar `frontend/`/`backend/` (conservando existentes) | Comandos documentados + commit |
| 6 | M00-11 | Configurar secretos locales fuera de Git | `.env` local, ejemplo sin secretos |
| 7 | M00-12 | Elegir migraciones SQL y esquema físico desde ER | Migración revisada + rollback |
| 8 | M00-13 | Validar OpenAPI y errores comunes | Contrato validado y pruebas planificadas |
| 9 | M00-14 / M00-24 | Sesión, propiedad individual, CSRF/cookies | Pruebas 401/403 y cross-owner |
| 10 | M00-18 / M00-19 | Fixtures sintéticos y CI de tests | Pruebas ejecutadas y registro |

No ejecutar tareas funcionales bloqueadas sin su aprobación específica. Revisar el backlog completo `fase5-backlog-transversal.md` para prioridad, dependencia, ubicación y criterio de aceptación de cada ID.

## Paso E · Prueba de humo que debe pasar antes del módulo 01

- [ ] Astro disponible en localhost (cuando se cree); sin autenticaciones inventadas.
- [ ] Express devuelve health seguro (cuando se cree); sin revelar configuración sensible.
- [ ] Conexión a MySQL con cuenta de aplicación de mínimo privilegio (cuando se configure).
- [ ] Datos sintéticos en pruebas, sin CV ni teléfonos reales.
- [ ] Permisos deniegan acceso a recurso de otro reclutador.
- [ ] Ollama local disponible; caída de Ollama **no** inutiliza endpoints no relacionados.
- [ ] No hay claves/archivos de candidatos en el repositorio ni en logs.
- [ ] Frontend aplica Sky, Inter y componentes Flowbite desde un layout base; 5 estados según el diseño, sin item de sidebar «Estados de UI».

**Esta lista no significa que esos endpoints ya existan**: son las verificaciones para cuando se implementen.
