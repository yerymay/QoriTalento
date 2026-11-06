# Qori Talento — Reglas de negocio y decisiones

## Reglas confirmadas (no modificar sin decisión explícita)

- **RN-01 (DEC-01).** Rol postulante o reclutador. Reclutador de empresa: correo corporativo no público; particular: verifica teléfono por SMS/WhatsApp. Toda cuenta nueva queda inactiva hasta verificar correo. Particular también necesita verificar teléfono.
- **RN-02 (DEC-02, actualizado 2026-11-06).** Cualquier reclutador puede publicar directamente una oferta completa. La definición futura de cuota de ofertas activas y de moderación no bloquea la publicación mientras B-01/B-02 siga abierta; no inventar reglas adicionales.
- **RN-03 (DEC-03).** Un reclutador solo ve y administra ofertas creadas por él, y los expedientes de candidatos de esas ofertas. Compartir empresa **no** concede acceso. En backend se verifica propietario en cada operación.
- **RN-04 (DEC-04).** CV únicamente PDF digital con texto; extracción clásica (sin OCR ni IA generativa para extraer). Documentos almacenados fuera de la carpeta pública.
- **RN-05 (DEC-05/06).** Servidor determina inicio/límite de examen; respuestas recibidas y aceptadas antes del límite; guardado por pregunta. Reconectar no suspende el reloj; la UI no controla el resultado oficial.
- **RN-06 (DEC-07).** El candidato revisa/corrige/confirma sus datos extraídos; el reclutador solo consulta y deja notas, sin modificar el perfil fuente.
- **RN-07.** El cálculo de compatibilidad/score con IA (Ollama `qwen2.5:7b-instruct`) es indicativo, documenta evidencia y nunca decide contrataciones. El reclutador autorizado registra la decisión humana. Sin B-06 aprobada, resultados IA solo con datos sintéticos/estado pendiente de revisión.
- **RN-08.** Estados operativos UI Ideal, Vacío, Parcial, Carga y Error son independientes de estados de negocio. No crear opción "Estados de UI" en la navegación.
- **RN-09.** Dos roles de acceso definidos: reclutador y postulante. La mención al jefe de RRHH en documentación original **no otorga por sí sola** acceso transversal mientras B-09 esté abierto.

## Decisiones pendientes — no inferir

| ID | Pregunta pendiente | Bloquea |
|---|---|---|
| B-01 | ¿Qué estados de oferta cuentan en un eventual máximo de 2 activas? | cuota futura M02; no bloquea publicación |
| B-02 | ¿Quién modera la primera oferta y cómo se autoriza? | moderación futura M02; no bloquea publicación |
| B-03 | Proveedor de correo/SMS, caducidad OTP, reintentos y activación | registro/activación real M01 |
| B-04 | Tamaño, antivirus/validación, retención, duplicados | envío/almacenamiento M03–04 |
| B-05 | Cantidad de intentos, versión de examen, edición y borde de expiración | operación completa M05 |
| B-06 | Rúbrica, pesos, evidencias y umbrales de evaluación IA | puntuación IA real M06 |
| B-07 | Reevaluación tras actualizar perfil confirmado | M04/M06 |
| B-08 | Máquina de estados, actor y reversión de decisiones | M03/M07/M08 |
| B-09 | Permisos de jefe RRHH frente a propiedad individual | M01/M07 |
| B-10 | Ratificación de constitución y métricas RNF | formalidad documental |

## Registro rápido de una decisión

```text
ID: B-__
Decisión aprobada (texto):
Aprobado por:
Fecha:
Efecto en requisitos, SQL, API y pruebas:
```

## Advertencia sobre la base de datos

El SQL de `database/01_schema.sql` es una **propuesta inicial ejecutable** basada en el modelo conceptual, no una aprobación de todas las políticas. Las columnas de estados son `VARCHAR` deliberadamente para no imponer flujos aún pendientes; las restricciones de cuota, moderación y scoring se implementarán cuando se aprueben reglas correspondientes.

**Fuentes:** `docs/decisions/decisiones-aprobadas.md`, `docs/decisions/00-acta-decisiones-pendientes.md`, modelo conceptual v0.4.
