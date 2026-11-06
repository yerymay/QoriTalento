# Qori Talento — Reglas de negocio y decisiones

## Reglas confirmadas (no modificar sin decisión explícita)

- **RN-01 (DEC-01, actualizado 2026-11-06).** Rol postulante o reclutador. Toda cuenta nueva queda activa al registrarse y puede iniciar sesión de inmediato; no requiere aprobación de superadministrador, OTP ni verificación previa. Reclutador de empresa: correo corporativo no público; particular: teléfono de contacto obligatorio.
- **RN-02 (DEC-02, actualizado 2026-11-06).** Cualquier reclutador puede crear y publicar directamente varias ofertas propias completas, sin cuota ni moderación previa. No inventar límites o aprobaciones adicionales.
- **RN-03 (DEC-03).** Un reclutador solo ve y administra ofertas creadas por él, y los expedientes de candidatos de esas ofertas. Compartir empresa **no** concede acceso. En backend se verifica propietario en cada operación.
- **RN-04 (DEC-04).** CV únicamente PDF digital con texto; extracción clásica (sin OCR ni IA generativa para extraer). Documentos almacenados fuera de la carpeta pública.
- **RN-05 (DEC-05/06).** Servidor determina inicio/límite de examen; respuestas recibidas y aceptadas antes del límite; guardado por pregunta. Reconectar no suspende el reloj; la UI no controla el resultado oficial.
- **RN-06 (DEC-07, precisada 2026-11-06).** El postulante revisa, corrige y confirma los datos propuestos a partir de su CV. La extracción debe asistir el llenado del perfil y minimizar errores mediante reglas y patrones sobre el texto del PDF, pero no inventa datos ni reemplaza la revisión humana. Al confirmar, los valores editados actualizan el perfil del postulante. El reclutador solo consulta el PDF y los datos confirmados, y deja notas; no modifica el perfil fuente.
- **RN-07.** El cálculo de compatibilidad/score con IA (Ollama `qwen2.5:7b-instruct`) es indicativo, documenta evidencia y nunca decide contrataciones. El reclutador autorizado registra la decisión humana. Sin B-06 aprobada, resultados IA solo con datos sintéticos/estado pendiente de revisión.
- **RN-08.** Estados operativos UI Ideal, Vacío, Parcial, Carga y Error son independientes de estados de negocio. No crear opción "Estados de UI" en la navegación.
- **RN-09.** Dos roles de acceso definidos: reclutador y postulante. La mención al jefe de RRHH en documentación original **no otorga por sí sola** acceso transversal mientras B-09 esté abierto.

## Decisiones pendientes — no inferir

| ID | Pregunta pendiente | Bloquea |
|---|---|---|
| B-01 | Resuelta 2026-11-06: no hay máximo de ofertas activas para reclutadores. | no bloquea M02 |
| B-02 | Resuelta 2026-11-06: no hay moderación previa de ofertas. | no bloquea M02 |
| B-03 | Resuelta 2026-11-06: no hay activación externa; el registro activa la cuenta de inmediato. | no bloquea M01 |
| B-04 | Decisión parcial aprobada 2026-11-06: máximo 5 MB, validación estricta de PDF real, bloqueo de duplicados activos, reemplazo de CV en estado inicial y conservación de 2 años tras finalizar el concurso. Sin antivirus obligatorio por ahora; estados activos y finalización definidos parcialmente en B-08. | implementar y verificar las obligaciones aprobadas |
| B-05 | Cantidad de intentos, versión de examen, edición y borde de expiración | operación completa M05 |
| B-06 | Rúbrica, pesos, evidencias y umbrales de evaluación IA | puntuación IA real M06 |
| B-07 | Reevaluación tras actualizar perfil confirmado | M04/M06 |
| B-08 | Parcialmente aprobada 2026-11-06: estados para duplicados y reemplazo, y finalización explícita. Pendientes: transiciones completas, actores y reversión. | M07/M08 y finalización del proceso |
| B-09 | Permisos de jefe RRHH frente a propiedad individual | M01/M07 |
| B-10 | Ratificación de constitución y métricas RNF | formalidad documental |

### Alcance precisado de M04 — 2026-11-06

- El perfil inicial puede contener solo los datos indispensables del registro. La información curricular se completa de forma asistida después de cargar un CV PDF con texto.
- M04 debe intentar extraer nombre, correo, teléfono, ubicación, resumen profesional, formación, experiencia, habilidades e idiomas. Los valores ambiguos o ausentes se presentan para revisión como “No detectado” o pendientes; no se generan datos ficticios.
- Los datos extraídos son propuestas editables. Solo los valores confirmados por el postulante actualizan el perfil y se consideran la fuente de consulta para el reclutador.
- Si se reemplaza el CV en el estado permitido, se genera una nueva propuesta que debe confirmarse. Hasta esa confirmación se conserva el perfil vigente. B-07 sigue bloqueando cualquier reevaluación automática por ese cambio.


### B-04 — decisión parcial aprobada el 2026-11-06

- Cada PDF de CV tiene un tamaño máximo de 5 MB y debe someterse a validación estricta de su estructura y texto. Por ahora no se exige antivirus; esta validación no garantiza que el archivo esté libre de malware.
- Si existe una postulación activa a la misma oferta, no crear otra; informar su estado y permitir actualizar o reemplazar el CV únicamente mientras la postulación esté en estado inicial, pendiente de evaluación.
- Conservar los CV y registros asociados durante el proceso de selección y por dos años desde la finalización del concurso; después corresponde eliminación segura o anonimización.
- Los estados activos son pendiente de evaluación, en revisión y preseleccionado; avanza y no avanza son finales. Si una oferta sigue publicada, se permite volver a postular después de un resultado final. El reclutador propietario finaliza explícitamente el proceso; cerrar la oferta por sí solo no inicia el plazo de conservación.
- Aprobado por el usuario del proyecto en conversación el 2026-11-06. Efecto previsto: M03–M04, persistencia privada, API y pruebas de validación, propiedad y duplicados. No implica implementación verificada.
### B-08 — decisión parcial aprobada el 2026-11-06

- La postulación se crea pendiente de evaluación. Solo en ese estado el postulante puede reemplazar su CV.
- Pendiente de evaluación, en revisión y preseleccionado bloquean una nueva postulación a la misma oferta. Avanza y no avanza son resultados finales, y permiten volver a postular mientras la oferta siga publicada.
- El reclutador propietario finaliza el proceso de forma explícita; ese evento impide nuevas postulaciones y fija el inicio de la conservación por dos años. Cerrar la recepción de la oferta no equivale a finalizar el proceso.
- Las transiciones completas y su reversión siguen sin definir. Esta decisión no autoriza cambios de estado arbitrarios.

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
