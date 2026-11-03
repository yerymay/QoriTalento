# Qori Talento — Anexo de decisiones SDD (borrador v0.1)

**Estado:** consolidación de decisiones aportadas por el propietario y propuestas pendientes de validación. No sustituye ni modifica los documentos RF/RNF vigentes. No se ha implementado código ni modificado Figma.

## Matriz de decisiones

| Clave | Tema | Decisión aportada | Ajuste de especificación pendiente |
|---|---|---|---|
| D-01 | Registro reclutador | Doble vía empresas y personas naturales; empresas correo corporativo; particulares teléfono verificado; activación por correo; limitación y moderación para particulares; aislamiento backend | Definir entidad propietaria/tenant, mecanismo de validación de empresas, moderador responsable, estados de cuenta y ofertas, máximo 1 o 2 ofertas activas |
| D-03 | Exámenes | El servidor fija `hora_inicio` y `hora_limite`; cada respuesta se persiste; reingreso conserva respuestas sin detener reloj; cierre por expiración | Políticas para respuestas offline al expirar, cierre idempotente y concurrencia, sesiones, sincronización y pruebas de reloj |
| D-06 | Compatibilidad y puntaje | IA apoya evaluación; algoritmo aún no decidido | Propuesta: extracción verificable y coincidencia por criterios publicados/evidencia; evaluación humana; política de ponderaciones, niveles y requisitos no demostrados pendiente |
| D-09 | Correcciones del CV | Postulante corrige datos extraídos antes de enviar; reclutador audita, anota o complementa sin cambiar el perfil original | Reconciliar RSF16/RF-05/HU-01; definir revisión, historial, ajustes de evaluación autorizados, recálculo y notificación |

## Especificaciones candidatas — sin aprobar

### D-01 Registro
- Cada cuenta nace `pendiente_correo`; particulares además requieren `pendiente_telefono`. Solo pasa a `activa` cuando satisface ambas verificaciones que correspondan.
- Crear ofertas exige cuenta activa y entidad reclutadora autorizada; primera oferta de persona natural requiere revisión antes de hacerse pública.
- Separar estado de cuenta, estado de moderación de oferta y estado de publicación de oferta.
- El backend obtiene identidad y membresía a partir de sesión verificada; jamás confía en `owner_id` suministrado por cliente. Las consultas y mutaciones comprueban ámbito de propiedad/autorización.
- Estructura conceptual candidata: `usuarios`, `entidades_reclutadoras`, `miembros_reclutadora`, `ofertas`, `verificaciones`, `moderaciones`.
- **Por aprobar:** si las empresas compartirán ofertas entre miembros o si cada reclutador verá únicamente las que creó. Por defecto mantener acceso mínimo.

### D-03 Exámenes
- El backend registra inicio/límite con hora de servidor, en UTC, y devuelve el vencimiento al frontend.
- Cada respuesta aceptada antes del vencimiento se guarda con clave única de intento y pregunta, versión/idempotencia y confirmación.
- Tras expirar, un proceso o consulta de estado realiza finalización idempotente basada en respuestas ya persistidas; no se aceptan modificaciones tardías.
- El cliente muestra temporizador informativo sincronizado, persiste temporalmente cambios en conexión interrumpida y distingue `local` de `confirmado en servidor`.
- **Por aprobar:** qué hacer con respuestas guardadas solo localmente cuando se vence el tiempo, porque aceptación tardía y tiempo estricto son políticas incompatibles sin reglas adicionales.
- Estructura conceptual candidata: `examenes`, `preguntas`, `alternativas`, `intentos_examen`, `respuestas_intento`, `eventos_examen`.

### D-06 Extracción y valoración
- MVP de extracción: validar PDF, extraer texto embebido con parser Node, identificar campos mediante reglas, mostrar origen y permitir corrección del candidato. Marcar `no detectado` cuando falte evidencia. No inventar datos.
- IA opcional: modelo local con salida JSON validada por esquema para mejorar extracción/normalización; alternativa API de bajo consumo solo tras revisar privacidad y costo.
- Compatibilidad: matriz de evidencias de requisitos pertinentes a la oferta (demostrado/no encontrado/pendiente de revisar), con posible porcentaje explicable sujeto a validación. Evitar atributos protegidos, inferencias de personalidad, rechazo automático y uso de la IA como decisor final.
- Puntaje final: si se usa una combinación entre examen y compatibilidad, las ponderaciones y los umbrales requieren aprobación y verificación de equidad; distinguir `sin evidencia` de `no cumple`.
- Estructura candidata: `documentos_cv`, `datos_extraidos`, `versiones_perfil`, `criterios_oferta`, `evidencias_criterio`, `evaluaciones_compatibilidad`, `resultados_examen`.

### D-09 Correcciones y auditoría
- Postulante puede corregir la extracción antes de confirmar. Conservar PDF original, datos sugeridos, versión confirmada y auditoría de cambios.
- Reclutador solo ve el perfil autorizado y puede crear notas/observaciones separadas. No sobreescribe el perfil del postulante.
- Cualquier rectificación significativa posterior a una evaluación debería producir versión y revisión/recalculo trazables, nunca una modificación silenciosa de resultado final.
- **Conflicto documental:** RF-05 y HU-01 de UI prevén corrección por reclutador. Hace falta control de cambios formal para adaptarlos a la decisión actual.

## Restricciones de alcance y seguridad
- El documento base no comprometía notificaciones automáticas. El correo de activación y OTP son nuevas funciones necesarias para D-01; deben añadirse formalmente a RF/RNF y presupuesto de servicios.
- OCR de CV escaneados no queda comprometido: se debe decidir si se incorpora o si la primera versión se limita a PDFs con texto extraíble.
- Los CVs contienen datos personales: mínimo privilegio, protección de archivos, avisos de tratamiento, período de retención, auditoría, limitación del envío de información a servicios externos y evaluación de marco normativo peruano.
- Separar `status de negocio` (p. ej. `oferta_publicada`) de `estados operativos de UI` (`ideal/vacío/carga/parcial/error`).

## Próxima actividad SDD
1. Solicitar/aprobar decisiones residuales: moderador, cuota particular, compañía multiusuario, política offline y puntuación/umbrales.
2. Crear solicitudes de cambio de requisitos existentes, con identificadores y criterios EARS/Gherkin.
3. Actualizar matriz de trazabilidad y emitir constitución, plan conceptual de arquitectura y specs por módulo.
