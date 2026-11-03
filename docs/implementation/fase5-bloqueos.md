# Fase 5 — Registro operativo de bloqueos / decisiones

**Estado inicial:** los diez `B-01` a `B-10` siguen abiertos **según línea base Fase 4**, salvo aprobación posterior verificable. La elección de Ollama **sí** está aprobada para pruebas; la rúbrica de IA **no**.

| Bloqueo | Qué resolver | Tareas directamente condicionadas (ejemplos) | Regla de no suposición |
|---|---|---|---|
| `B-01` | Oferta activa: qué estados computan para dos activas | `M02-01, M02-06, M02-09` | Permite pruebas atómicas de cuota sin suposición |
| `B-02` | Quién modera, reglas de revisión y permisos | `M02-01, M02-07, M02-08, M02-09` | La primera oferta particular no se hace pública por defecto |
| `B-03` | Proveedores/verificación, validez, reintentos y activación | `M01-01 a M01-08; M00-24` | No activar usuario incompleto; OTP no reutilizable |
| `B-04` | PDF y política de duplicados, tamaño/seguridad/retención | `M03-01, M03-02, M03-04; M04-01, M04-02` | No aceptar archivos arbitrarios |
| `B-05` | Intentos, revisión de respuesta, reloj de borde y expiración | `M05-01 a M05-09` | Solo respuestas aceptadas antes de deadline |
| `B-06` | Rúbrica IA/umbrales/pruebas de equidad y evidencia | `M06-02 a M06-13 (excepto M06-01 objetivo)` | Bloquea publicar score real, no nota objetiva |
| `B-07` | Cambio de CV confirmado y reevaluación | `M04-06; M06-07, M06-10` | Histórico inmutable sin reevaluar silenciosamente |
| `B-08` | Transiciones y reversibilidad de postulación/decisión | `M03-01, M07-04/M07-05, M08-01/M08-04` | No implementar nuevas transiciones por conjetura |
| `B-09` | Acceso Jefe RRHH vs propiedad individual | `M01-01/M01-10, M07-01, M08-03` | No ampliar acceso de compañeros de empresa |
| `B-10` | Constitución F2 formalmente aprobada | `M00-01 y puertas globales` | No declarar gobernanza aprobada |

## Acta de resolución que debe registrarse

Para cerrar un bloqueo anotar `B-ID`, decisión exacta, responsable, fecha, evidencia de aprobación, módulos/RSF/RF afectados, cambios en `spec.md`/`plan.md`/OpenAPI y tests que se agregan. No basta cambiar esta tabla a «resuelto».

## Permisos de avance con bloqueos abiertos

- **Sí:** leer, modelar alternativas, crear fixtures sintéticos, programar pruebas de comportamiento conocido y preparar componentes visuales sin capacidad comprometida.
- **No:** publicar rankings IA reales, usar duración decidida por cliente, conceder propiedad por organización, publicar primera oferta sin moderación, inventar regla de cuota o ampliar autorización por un rol no definido.
