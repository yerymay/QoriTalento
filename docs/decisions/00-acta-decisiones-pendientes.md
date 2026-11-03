# Acta para cerrar decisiones pendientes antes de codificar

**Este archivo es una plantilla de aprobación, no una aprobación.** Consulta detalles y riesgos en `docs/architecture/10-decisiones-y-bloqueos.md` y `docs/implementation/fase5-bloqueos.md`.

| ID | Decisión a tomar | Obligatoria antes de | Estado al empaquetar |
|---|---|---|---|
| B-01 | Qué estados computan para el máximo de dos ofertas activas del particular | cuota/publicación M02 | PENDIENTE |
| B-02 | Quién modera primera oferta particular, cómo aprueba/rechaza y quién tiene permiso | moderación M02 | PENDIENTE |
| B-03 | Proveedores y TTL/reintentos de email/SMS o WhatsApp, activación y abuso | registro real M01 | PENDIENTE |
| B-04 | Tamaño PDF, antivirus/validación, retención y duplicados de postulaciones | almacenamiento y envío M03/M04 | PENDIENTE |
| B-05 | Nº intentos, versiones de examen, edición de respuestas, sincronía y expiración de borde | M05 | PENDIENTE |
| B-06 | Rúbrica de score IA, evidencias, validación, reproducibilidad y equidad | mostrar score IA real M06 | PENDIENTE CRÍTICA |
| B-07 | Regla de reevaluación al cambiar perfil/CV confirmado | perfil/score versionado M04/M06 | PENDIENTE |
| B-08 | Transiciones de postulación, reversibilidad y actor de decisión | M03/M07/M08 | PENDIENTE |
| B-09 | Rol de jefe RRHH frente a propiedad individual estricta de reclutador | acceso M01/M07 | PENDIENTE |
| B-10 | Aprobación formal de constitución y criterios RNF medibles | gobernanza transversal | PENDIENTE |

## Registro de aprobación (duplicar este bloque para cada B-ID)

```text
ID: B-__
Decisión textual aprobada:
Responsable que aprueba:
Fecha:
Evidencia/enlace de aprobación:
Requisitos originales afectados:
Especificaciones, planes y contratos a actualizar:
Casos de prueba añadidos:
Estado: PENDIENTE / APROBADO / RECHAZADO
```

**No completar por inferencia.** Ejemplos: «solo Publicada cuenta como activa», «tres intentos», «70/100 aprueba» o «8 MB por PDF» serían decisiones nuevas, **no aprobadas aquí**. El uso de Ollama local sí fue elegido para pruebas; los criterios que convierten sus puntuaciones en comparables todavía no.
