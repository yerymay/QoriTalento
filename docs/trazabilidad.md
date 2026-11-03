# Matriz maestra de trazabilidad — Fase 3

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

Los 32 RSF conservan IDs y nombre original del PDF. Los 20 RF de UI y 18 RSNF + 15 RNF de UI se mapean sin duplicar su alcance. `ADD-*` de v0.2 es cambio posterior trazado, no fue parte del alcance inicial.

## Cobertura de 32 RSF

| RSF | Nombre (fuente) | Módulo F3 | Reglas EARS | Estado |
|---|---|---|---|---|
| RSF01 | Registro de usuario con rol | 01 | US-01, US-02, US-03, US-04, US-05 | Listo para revisión / condiciones en spec |
| RSF02 | Inicio y cierre de sesión | 01 | US-05, US-06 | Listo para revisión / condiciones en spec |
| RSF03 | Gestión de datos básicos del usuario | 01 | US-07 | Listo para revisión / condiciones en spec |
| RSF04 | Diferenciación de permisos por rol | 01 | US-08, US-09 | Listo para revisión / condiciones en spec |
| RSF05 | Registro de oferta de empleo | 02 | OF-01 | Listo para revisión / condiciones en spec |
| RSF06 | Registro de datos y requisitos de la oferta | 02 | OF-02 | Listo para revisión / condiciones en spec |
| RSF07 | Publicación, edición y cierre de la oferta | 02 | OF-03, OF-04, OF-05, OF-06, OF-09 | Listo para revisión / condiciones en spec |
| RSF08 | Visualización de ofertas disponibles | 02 | OF-07 | Listo para revisión / condiciones en spec |
| RSF09 | Registro de postulación a una oferta | 03 | PO-01, PO-02, PO-05 | Listo para revisión / condiciones en spec |
| RSF10 | Carga del currículum en PDF | 03 | PO-03 | Listo para revisión / condiciones en spec |
| RSF11 | Asociación del CV con la oferta | 03 | PO-04, PO-05 | Listo para revisión / condiciones en spec |
| RSF12 | Consulta del estado de una postulación | 03 | PO-06 | Listo para revisión / condiciones en spec |
| RSF13 | Lectura automática del CV | 04 | CV-01, CV-09 | Listo para revisión / condiciones en spec |
| RSF14 | Extracción de datos del CV | 04 | CV-02, CV-03 | Listo para revisión / condiciones en spec |
| RSF15 | Organización de la información en el perfil | 04 | CV-04, CV-05, CV-08 | Listo para revisión / condiciones en spec |
| RSF16 | Revisión de la información extraída | 04 | CV-06, CV-07 | Listo para revisión / condiciones en spec |
| RSF17 | Creación de exámenes asociados a una oferta | 05 | EX-01 | Listo para revisión / condiciones en spec |
| RSF18 | Registro de preguntas y alternativas | 05 | EX-02 | Listo para revisión / condiciones en spec |
| RSF19 | Definición del tiempo límite | 05 | EX-03 | Listo para revisión / condiciones en spec |
| RSF20 | Desarrollo del examen por el postulante | 05 | EX-04, EX-05, EX-06, EX-07, EX-09, EX-10, EX-11 | Listo para revisión / condiciones en spec |
| RSF21 | Finalización automática por tiempo | 05 | EX-08 | Listo para revisión / condiciones en spec |
| RSF22 | Calificación automática de respuestas | 06 | EV-01, EV-02 | Listo para revisión / condiciones en spec |
| RSF23 | Comparación del CV con los requisitos de la oferta | 06 | EV-03 (BLOQUEADO) | BLOQUEADO: fórmula |
| RSF24 | Cálculo de la calificación o puntaje | 06 | EV-04 (BLOQUEADO) | BLOQUEADO: fórmula |
| RSF25 | Ordenamiento de postulantes por resultados | 06 | EV-05 (DEPENDIENTE) | CONDICIONADO a fórmula |
| RSF26 | Visualización de resultados por postulante | 07 | RS-01 | CONDICIONADO a fórmula |
| RSF27 | Ficha de resultados del postulante | 07 | RS-02 | CONDICIONADO a fórmula |
| RSF28 | Revisión y selección de postulantes | 07 | RS-03, RS-04 | Listo para revisión / condiciones en spec |
| RSF29 | Registro del resultado final | 07 | RS-05, RS-07 | Listo para revisión / condiciones en spec |
| RSF30 | Consulta de postulaciones por oferta | 08 | SE-01, SE-02 | Listo para revisión / condiciones en spec |
| RSF31 | Actualización del estado de una postulación | 08 | SE-03, SE-04 | Listo para revisión / condiciones en spec |
| RSF32 | Consulta del estado por el postulante | 08 | SE-05, SE-06 | Listo para revisión / condiciones en spec |

## Cobertura de 20 RF de UI

| RF UI | Módulos F3 | Observación |
|---|---|---|
| RF-01 | 01 | Criterio UI heredado; revisar en aceptación |
| RF-02 | 02 | Criterio UI heredado; revisar en aceptación |
| RF-03 | 02 | Criterio UI heredado; revisar en aceptación |
| RF-04 | 03 | Criterio UI heredado; revisar en aceptación |
| RF-05 | 04 | Cambiar edición del reclutador por lectura/notas, DEC-07 |
| RF-06 | 05 | Criterio UI heredado; revisar en aceptación |
| RF-07 | 05 | Reloj autoritativo; aviso no puede prometer respuestas tardías aceptadas |
| RF-08 | 06, 07, 08 | Tabla y filtros sin puntaje ficticio; bloqueada si depende de fórmula |
| RF-09 | 07 | Criterio UI heredado; revisar en aceptación |
| RF-10 | 03, 08 | Transiciones del pipeline por aprobar |
| RF-11 | 01 | Segmentación empresa/particular y activación |
| RF-12 | 01 | Criterio UI heredado; revisar en aceptación |
| RF-13 | 01, 08 | Criterio UI heredado; revisar en aceptación |
| RF-14 | 02 | Moderación + cuota |
| RF-15 | 03 | Criterio UI heredado; revisar en aceptación |
| RF-16 | 04 | Extracción clásica y ausencia de datos detectados |
| RF-17 | 04 | Postulante confirma y edita |
| RF-18 | 05 | Sincronizado vs pendiente vs tardío |
| RF-19 | 06, 07 | Fórmula de compatibilidad pendiente |
| RF-20 | 07 | Confirmación humana y auditoría |

## Cobertura transversal 18 RSNF de sistema

| RSNF | Nombre fuente | Tratamiento en Fase 3 |
|---|---|---|
| RSNF01 | Interfaz clara e intuitiva | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF02 | Mensajes claros de error | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF03 | Tiempo razonable de procesamiento del CV | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF04 | Tiempo máximo de respuesta de 3 segundos | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF05 | Autenticación de acceso | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF06 | Restricción de acceso por rol | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF07 | Protección de currículums, resultados y calificaciones | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF08 | Almacenamiento seguro de contraseñas | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF09 | Disponibilidad durante horario de uso | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF10 | Navegadores web actuales | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF11 | Adaptabilidad a distintos tamaños de pantalla | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF12 | Integridad de información registrada | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF13 | Escalabilidad de arquitectura | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF14 | Organización modular | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF15 | Conservación de resultados y calificaciones | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF16 | Validación del archivo de currículum | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF17 | Funcionamiento continuo del temporizador | Documento transversal de calidad; aplica según módulo y contexto |
| RSNF18 | Privacidad de información personal | Documento transversal de calidad; aplica según módulo y contexto |

## Cobertura transversal 15 RNF de UI

| RNF UI | Tema | Documento |
|---|---|---|
| RNF-01 | Rendimiento de skeleton y listados | `docs/atributos-calidad.md` |
| RNF-02 | Contraste y significado no solo por color | `docs/atributos-calidad.md` |
| RNF-03 | Responsividad desde 360px | `docs/atributos-calidad.md` |
| RNF-04 | Fiabilidad temporizador y envío | `docs/atributos-calidad.md` |
| RNF-05 | Errores visibles sin borrar datos | `docs/atributos-calidad.md` |
| RNF-06 | Consistencia Flowbite/tokens | `docs/atributos-calidad.md` |
| RNF-07 | Cinco estados operativos por región | `docs/atributos-calidad.md` |
| RNF-08 | Retroalimentación visual y toast | `docs/atributos-calidad.md` |
| RNF-09 | Conectividad y almacenamiento local | `docs/atributos-calidad.md` |
| RNF-10 | Accesibilidad táctil | `docs/atributos-calidad.md` |
| RNF-11 | Navegación por teclado | `docs/atributos-calidad.md` |
| RNF-12 | Compatibilidad navegadores | `docs/atributos-calidad.md` |
| RNF-13 | Legibilidad y temas | `docs/atributos-calidad.md` |
| RNF-14 | Confirmación acciones de alto impacto | `docs/atributos-calidad.md` |
| RNF-15 | Privacidad, contraseña y sesión | `docs/atributos-calidad.md` |

## Criterio de lectura

**«Trazado»** = existe especificación y caso de prueba propuesto. **No significa** desarrollo realizado, implementación aprobada, algoritmo resuelto ni pantalla validada visualmente. Los enlaces de Figma provienen de la auditoría anterior; navegación y estados fueron catalogados, no corregidos.
