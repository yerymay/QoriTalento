# Plan de continuación de SDD — Qori Talento

**Estado:** solo planificación, no implementación.

## Principios para la transición

- Conservar el alcance de 8 módulos y los 50 requisitos del sistema + 35 de UI originales; añadir cambios de forma trazable.
- No convertir un diseño Figma en autoridad sobre permisos, cálculos ni reglas críticas del servidor.
- El modelo visual (Flowbite, Sky, Inter, Light/Dark, cinco estados) es fuente para UI; los permisos y validaciones viven en backend.
- Arquitectura objetivo acordada: `/frontend` Astro, `/backend` Node.js/Express, MySQL. No seleccionar aún ORM, autenticación definitiva, proveedor OTP ni framework de islas.
- Respetar la propiedad individual de ofertas aun dentro de una empresa.

## Roadmap por fases con entregables y puertas de salida

| Fase | Actividad | Entregable verificable | Dependencia |
|---|---|---|---|
| F1b (ahora) | Aprobación y versionado de cambios derivados de DEC-01–07 | Registro de decisiones y solicitud CR-SDD-2026-001 + matriz deltas | Decisiones de usuario (recibidas) |
| F2 | Constitución SDD | `docs/constitution.md` con reglas de alcance, seguridad, accesibilidad, pruebas y control de cambios | F1b |
| F3 | Especificaciones detalladas y escenarios | `spec.md` por módulo con actores, estados, errores y criterios de aceptación | Constitución + aclaraciones pendientes |
| F4 | Plan de arquitectura y datos | `architecture.md`, ERD conceptual, aislamiento por creador, integridad examen y almacenamiento de CV | F3 |
| F5 | Contratos API propuestos | OpenAPI o contrato equivalente para autenticación, ofertas, CV, exámenes, evaluación | F4 |
| F6 | Descomposición de tareas | `tasks.md` por spec; matriz requisito → prueba; riesgos y estimaciones | F5 |
| F7 | Implementación futura | Carpetas `frontend/` y `backend/`, migraciones, código, CI y pruebas | Aprobación del plan |

## Decisiones pendientes ordenadas por bloqueo

1. **Compatibilidad y puntaje (RSF23/24):** qué evidencias se usarán, porcentaje/ponderaciones/umbrales y papel de IA en la parte inteligente del proyecto. Bloquea specs de evaluación y modelo final de resultados.
2. **Moderación de primera oferta de particulares:** quién revisa y quién puede aprobar; no sumar rol administrativo sin aprobación. Bloquea la definición definitiva de estados y permisos.
3. **Definición de oferta activa:** propuesto `Publicada`, que se revalida al aprobar la primera oferta; requiere aprobación. Bloquea exactitud de la cuota.
4. **Proveedor/seguridad de activación:** email y OTP telefónico, tasas y plazos de validez, recuperación, abuso, disponibilidad. Bloquea contrato externo y costo.
5. **Extracción clásica:** librería seleccionada tras pruebas con PDFs sintéticos/digitales, política de PDFs ilegibles, límites de tamaño y tratamiento de datos. No incluir OCR de escaneos sin solicitud de cambio.
6. **Reglas de modificación posterior del perfil:** cuándo la edición del postulante obliga a reevaluar y cómo se refleja en resultados existentes.
7. **NFR de conectividad:** resolver formulaciones que prometen `sin pérdida de datos` en examen sin conexión con una política de plazo estricto.

## Orden de especificación recomendado

1. Autenticación y permisos horizontales (transversal, base de seguridad).
2. Ofertas y postulación (dominio propietario de datos + cuota/moderación).
3. CV y perfil confirmado (flujo vertical comprobable con extracción clásica).
4. Exámenes y guardado (criticidad alta, reloj en servidor).
5. Comparación/resultado (requiere decisiones nuevas antes de implementar).
6. Seguimiento y decisiones de selección.

## Validación que inicia sin código

- Revisión de trazabilidad por IDs en documentos originales y su delta.
- Inspección de flujo Figma para corregir 20 enlaces de candidato→reclutador observados en Fase 1, cuando se aprueben cambios de diseño.
- Aprobación del texto formal de RF/RNF/HU modificados con responsables.
- Escenarios Gherkin firmados para acceso cruzado, límites concurrentes, extracción incompleta, temporizador y offline estricto.

## Definición de «lista para implementar»

Una especificación está lista solo si: (a) no contiene reglas críticas ambiguas; (b) tiene criterios de aceptación testables; (c) están definidos modelos/contratos y responsabilidades; (d) se trazó cada criterio a RSF/RNF/UI/HU; (e) se confirmaron reglas de privacidad y seguridad; y (f) existe aprobación explícita del plan de tareas. Actualmente ninguna spec de este paquete cumple todos esos criterios, por lo que **no debe comenzar código de producción**.
