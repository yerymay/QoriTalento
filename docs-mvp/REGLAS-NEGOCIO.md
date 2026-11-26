# Qori Talento — Reglas de negocio y decisiones

## Reglas confirmadas (no modificar sin decisión explícita)

- **RN-01 (DEC-01, actualizado 2026-11-06).** Rol postulante o reclutador. Toda cuenta nueva queda activa al registrarse y puede iniciar sesión de inmediato; no requiere aprobación de superadministrador, OTP ni verificación previa. Reclutador de empresa: correo corporativo no público; particular: teléfono de contacto obligatorio.
- **RN-02 (DEC-02, actualizado 2026-11-06).** Cualquier reclutador puede crear y publicar directamente varias ofertas propias completas, sin cuota ni moderación previa. No inventar límites o aprobaciones adicionales.
- **RN-03 (DEC-03).** Un reclutador solo ve y administra ofertas creadas por él, y los expedientes de candidatos de esas ofertas. Compartir empresa **no** concede acceso. En backend se verifica propietario en cada operación.
- **RN-04 (DEC-04).** CV únicamente PDF digital con texto; extracción clásica (sin OCR ni IA generativa para extraer). Documentos almacenados fuera de la carpeta pública.
- **RN-05 (DEC-05/06).** Servidor determina inicio/límite de examen; respuestas recibidas y aceptadas antes del límite; guardado por pregunta. Reconectar no suspende el reloj; la UI no controla el resultado oficial.
- **RN-06 (DEC-07, precisada 2026-11-06).** El postulante revisa, corrige y confirma los datos propuestos a partir de su CV. La extracción debe asistir el llenado del perfil y minimizar errores mediante reglas y patrones sobre el texto del PDF, pero no inventa datos ni reemplaza la revisión humana. Al confirmar, los valores editados actualizan el perfil del postulante. El reclutador solo consulta el PDF y los datos confirmados, y deja notas; no modifica el perfil fuente.
- **RN-07 (B-06, decisión parcial aprobada 2026-11-22).** La IA (Ollama `qwen2.5:7b-instruct`) sugiere una evaluación por requisito basada en el perfil confirmado y muestra evidencia verificable; el reclutador la revisa y toma la decisión. La fórmula y los niveles por requisito están aprobados parcialmente; los umbrales de compatibilidad y la validación previa al uso real siguen pendientes.
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
| B-06 | Decisión parcial aprobada 2026-11-22: fórmula según exista examen y preguntas de apoyo; pendientes validación y umbrales. | puntuación IA real hasta completar y validar la rúbrica |
| B-07 | Reevaluación tras actualizar perfil confirmado | M04/M06 |
| B-08 | Flujo M07 aprobado 2026-11-25: propietario, transiciones activas y decisiones finales sin reversión; M08 consulta ese estado e historial. Ver ampliación al final. | no bloquea el alcance implementado M07/M08; no autoriza cambios arbitrarios |
| B-09 | Permisos de jefe RRHH frente a propiedad individual | M01/M07 |
| B-10 | Ratificación de constitución y métricas RNF | formalidad documental |


### B-06 — decisión parcial aprobada el 2026-11-22

- La IA compara cada requisito de la oferta con la información del perfil confirmada por el postulante. Para cada requisito presenta evidencia verificable del perfil, una explicación breve y una sugerencia: «evidencia encontrada», «evidencia parcial» o «sin evidencia suficiente».
- La ausencia de evidencia no implica que el postulante carezca de la habilidad. La IA no debe inventar ni completar información ausente.
- Las sugerencias son indicativas y deben ser revisadas por el reclutador autorizado, quien toma la decisión; la IA nunca decide contrataciones.
- La calificación objetiva del examen se calcula por separado. La ampliación de B-06 define la fórmula y los pesos; los umbrales y la validación previa al uso real siguen pendientes.
- Aprobado por el usuario del proyecto en conversación el 2026-11-22. Esta decisión define el alcance inicial de M06; no acredita implementación ni validación.

### B-06 — ampliación aprobada el 2026-11-22

- Con examen, la propuesta de puntuación asigna hasta 60 puntos a la afinidad del perfil confirmado con la oferta y hasta 40 puntos al examen. La nota del examen se calcula objetivamente según respuestas correctas.
- Sin examen, la evaluación se basa en el perfil confirmado y los requisitos de la oferta, expresada sobre 100 puntos. La interfaz debe identificar la modalidad; los resultados de ambas modalidades no son directamente equivalentes.
- La IA muestra evidencia por requisito, explicaciones y datos faltantes. La ausencia de evidencia se indica como tal y queda para revisión, sin asumir incumplimiento. El reclutador toma la decisión final.
- Las preguntas filtro son información de apoyo: sin puntaje ni descarte automático. Se ofrecen plantillas con opciones para marcar y una opción «Otro» que permite escribir una respuesta; el reclutador revisa las opciones y puede definir cada pregunta como obligatoria u opcional. En preguntas opcionales se ofrece «Prefiero responder después». La pretensión salarial puede usar rangos y permitir otra cantidad.
- La IA propone para cada requisito: cumple (100 % de sus puntos), cumple parcialmente (50 %) o no cumple (0 %, solo con evidencia explícita). La regla concreta aplicable a cada requisito debe ser visible para el reclutador, quien revisa la propuesta y su evidencia.
- Si falta evidencia suficiente, el requisito queda pendiente de revisión: se muestra el desglose disponible, pero no un puntaje final hasta que el reclutador revise el dato. No se considera automáticamente incumplido.
- Los puntos de perfil se distribuyen por igual entre requisitos por defecto. El reclutador puede ajustarlos; deben sumar 60 con examen o 100 sin examen.
- Antes de usar puntajes o rankings IA reales, validar con casos sintéticos de cumplimiento, cumplimiento parcial, incumplimiento y datos incompletos, revisados por un reclutador. Comprobar evidencia, datos personales ajenos al puesto y revisión humana. Los umbrales de niveles siguen pendientes. No implica implementación verificada.
- Aprobado por el usuario del proyecto en conversación el 2026-11-22.
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

### M06 — alcance de implementación solicitado el 2026-11-22

El usuario autorizó expresamente implementar la calificación objetiva y la comparación con el perfil confirmado mediante Ollama, con las cuatro valoraciones por requisito (cumple, parcial, no cumple y sin evidencia suficiente), evidencia, explicación, pesos ajustables y fórmula 60/40 o perfil sobre 100. La implementación distingue sugerencia de valoración humana y solo presenta un total indicativo cuando cada requisito está revisado con evidencia y el examen aplicable ha finalizado.

Esta autorización no resuelve los umbrales, la validación previa al uso real de B-06 ni la reevaluación de B-07. Tampoco define una combinación de varios exámenes; se mantienen notas separadas y un total pendiente en ese caso. No autoriza rankings ni cambios automáticos de estado. Los pesos editados se guardan en la evaluación concreta, sin crear una rúbrica global para comparar postulantes.

### B-08 — flujo M07 aprobado el 2026-11-25

Aprobado expresamente por el usuario en esta conversación: solo el reclutador propietario puede mover PENDING a IN_REVIEW, IN_REVIEW a SHORTLISTED, y decidir ADVANCES o NOT_ADVANCES desde cualquiera de esos tres estados activos. Las decisiones finales requieren confirmación, registran autor y fecha y no admiten reversión en M07. Se bloquean acciones si el proceso ya finalizó. La aprobación no resuelve los umbrales/rankings de B-06, la reevaluación B-07 ni el acceso transversal B-09.
