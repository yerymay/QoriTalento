# Solicitud de cambio y trazabilidad — RF/RNF Qori Talento

**CR-SDD-2026-001 · Versión v0.2 · 2026-11-02**  
**Estado:** propuesta de redacción de requisitos derivada de reglas de negocio aprobadas; pendiente integrar formalmente al PDF/TXT fuente.  
**Regla de control:** conservar los IDs históricos (`RSFxx`, `RSNFxx`, `RF-xx`, `RNF-xx`, `HU-xx`), documentar las ampliaciones y no sumar dos veces requisitos UI como requisitos nuevos del sistema.

## 1. Requisitos funcionales de sistema impactados

| ID | Acción | Cambio a incorporar | Decisión | Prioridad |
|---|---|---|---|---|
| RSF01 | Ampliar | Registro de reclutador empresa/particular con validaciones distintas, activación por correo, teléfono para particulares | DEC-01 | Alta |
| RSF02 | Precisar | Solo cuentas verificadas/activas pueden operar funciones protegidas; informar estado de verificación | DEC-01 | Alta |
| RSF04 | Ampliar (crítico) | Autorización horizontal por creador de oferta y postulaciones asociadas, aun entre reclutadores de misma empresa; no basta validación de rol | DEC-03 | Crítica |
| RSF05 | Ampliar | Al registrar oferta se asigna creador desde autenticación del backend | DEC-03 | Alta |
| RSF07 | Ampliar | Publicación de particular limitada a 2 ofertas activas; primera oferta requiere moderación previa; revalidar cupo de forma atómica | DEC-02 | Alta |
| RSF08 | Precisar | El postulante ve únicamente ofertas efectivamente publicadas; no mostrar pendientes de moderación | DEC-02 | Alta |
| RSF09 / RSF11 | Precisar | Vincular postulación a oferta y al reclutador propietario para autorización sin filtrar datos ajenos | DEC-03 | Alta |
| RSF13 | Precisar método | Primera versión extrae texto de PDF digital (sin OCR/IA generativa como parte del MVP) | DEC-04 | Alta |
| RSF14 | Precisar método | Extracción determinista de campos; ausencias explícitas, sin datos fabricados | DEC-04 | Alta |
| RSF15 | Ampliar | Campos sugeridos se verifican/corrigen por postulante; conservar versión presentada | DEC-07 | Alta |
| RSF16 | Conservar y precisar | **No exige edición**: reclutador visualiza, coteja con PDF y anota observaciones; no sobreescribe el perfil original | DEC-07 | Alta |
| RSF19 | Precisar | Duración de cada intento se calcula a partir del inicio y límite fijados por servidor | DEC-06 | Alta |
| RSF20 | Ampliar | Persistencia por pregunta confirmada por servidor; reingreso sin extensión del intento | DEC-05/06 | Crítica |
| RSF21 | Reformular cierre | Finalizar al vencer según servidor, usando solo respuestas oportunamente aceptadas; rechazar entregas fuera de plazo | DEC-05/06 | Crítica |
| RSF22 | Precisar | Calificar solo respuestas válidas de intento terminado/expirado | DEC-05/06 | Alta |
| RSF23 / RSF24 | **No resuelto** | Se mantienen en alcance, pero falta aprobar método de compatibilidad, fórmula, umbrales y papel de IA. No confundir con la extracción del CV | DEC-08 pendiente | Crítica |
| RSF30 | Precisar | Acceso a postulaciones de una oferta exclusivamente por reclutador creador, además del rol | DEC-03 | Alta |

## 2. Requisitos no funcionales de sistema impactados

| ID | Acción | Texto/criterio agregado o alterado | Estado |
|---|---|---|---|
| RSNF05 | Ampliar | Verificar identidad y estado activo antes de funciones protegidas; controlar activación | Propuesto |
| RSNF06 | Ampliar | Autorización por rol **y propiedad por creador** en cada consulta/mutación; pruebas contra IDOR/acceso horizontal | Propuesto |
| RSNF07 | Ampliar | Archivos y resultados accesibles únicamente al autor legítimo y al reclutador propietario de la oferta | Propuesto |
| RSNF08 | Conservar y precisar | Contraseñas almacenadas de forma segura; nunca reutilizar el enlace/código de activación como credencial | Propuesto |
| RSNF12 | Ampliar | Consistencia y atomicidad en cuotas y guardado de respuestas concurrentes; auditoría de cambios | Propuesto |
| RSNF15 | Precisar | Conservar respuestas confirmadas por servidor y resultados; distinguir borradores locales no admitidos por vencer | Propuesto |
| RSNF16 | Precisar | Validar PDF, informar fallo si no existe texto extraíble; definir tamaño máximo y protección contra archivo malicioso | Propuesto |
| RSNF17 | Ampliar | Hora límite inmutable de servidor; finalización idempotente sin depender del frontend | Propuesto |
| RSNF18 | Ampliar | Datos personales y CV aislados por propiedad; notas del reclutador separadas del perfil | Propuesto |
| RSNF03 / RSNF04 | Evaluar | Determinar carga normal y medir tiempos de extracción clásica, sin prometer rendimiento de archivos no procesables | Pendiente de métrica |
| RSNF09 | Evaluar | Disponibilidad de servidor crítico para exámenes estrictos; no se concede prórroga por caída salvo nuevo cambio aprobado | Pendiente |

## 3. Cambios UI funcionales y no funcionales

| ID UI | Acción | Diferencia requerida respecto de la fuente | Relación |
|---|---|---|---|
| RF-11 | **Modificar** | Registro de reclutador incluye selección Empresa/Particular, verificaciones apropiadas y estados de activación, no solo selector simple de rol | RSF01 |
| RF-01 / RF-13 | Precisar | Inicio de sesión/módulos solo para cuenta activa; no presentar recursos de otro propietario | RSF02/04 |
| RF-02 / RF-14 | **Modificar** | Mostrar cuota 2, estado pendiente de moderación de primera oferta y restricción de publicación para particular; no publicar tras solo validar campos | RSF05/07 |
| RF-03 | Precisar | Solo ofertas publicadas y visibles al postulante | RSF08 |
| RF-05 | **Reemplazar interacción de edición** | Reclutador lee PDF y datos confirmados, agrega notas; **no edita datos del postulante** | RSF16 |
| RF-16 | Precisar | El texto `Leyendo currículum…` representa extracción clásica; indicar `No detectado` sin inferencias | RSF13/14 |
| RF-17 | **Reforzar** | Candidato corrige y confirma antes del envío; mostrar origen sugerido y versión confirmada | RSF15 |
| RF-07 | **Modificar** | Contador visual y cierre por límite de servidor; mostrar confirmación del resultado aceptado, no afirmar envío exitoso de respuestas que no llegaron | RSF21 |
| RF-18 | **Modificar** | Estados por respuesta: guardado confirmado / pendiente offline / no contabilizado por plazo; conservar avance solo de respuestas confirmadas | RSF20 |
| RF-08 / RF-09 / RF-19 | **Pendiente** | Mantener espacio visual para compatibilidad y puntaje; no simular una fórmula como aprobada | RSF23/24 |
| RNF-04 | **Modificar** | ±1 s visual frente al servidor; autoritarismo del límite y cierre backend; aclarar métrica `envío <=3 s` cuando no hay conexión | RSNF17 |
| RNF-09 | **Reemplazar promesa incompatible** | Durante desconexión conservar borrador local **sin garantía de aceptación tardía**; advertir que solo respuestas confirmadas antes del vencimiento puntúan. No decir `sin pérdida de datos` como equivalencia de entrega | RSNF15/17 |
| RNF-15 | **Reforzar** | Privacidad entre distintos reclutadores de la misma empresa y autorización del backend; notas separadas de perfil | RSNF06/07/18 |
| RNF-05 / RNF-07 | Precisar | Errores de activación, cuota, moderación, extracción sin texto, vencimiento y conflicto de sincronización, por región de pantalla | RSNF02 |

## 4. Historias de usuario impactadas

| HU | Cambio |
|---|---|
| HU-01 | Sustituir «reclutador edita dato CV» por «reclutador revisa PDF/datos, registra nota, candidato conserva autoridad de edición». |
| HU-02 | Cierre de examen por servidor; texto debe indicar respuestas **aceptadas**, no asumir que todas las respuestas locales llegaron. |
| HU-05 | Primera oferta particular no pasa directamente a Publicada; estado de moderación y cupo. |
| HU-06 / HU-07 | Registro/activación condicionados a tipo de reclutador y estado de verificación. |
| HU-08 | Enviar postulación con CV validado y revisión de información confirmada. |
| HU-12 | Al reconectar, solo sincronizar respuestas antes de vencimiento; las tardías quedan no contabilizadas e informadas. |
| HU-13 | Porcentaje y niveles deben esperar definición verificable de RSF23/24. |

## 5. Funcionalidad adicional frente a documentos originales

Los documentos fuente explicitaban que ciertas notificaciones automáticas no formaban parte del alcance inicial. Estas funciones se **añaden por decisión posterior del propietario**, no se deben presentar como si ya estuvieran definidas en RSF originales:

| ID provisional | Requisito adicional propuesto | Dependencias |
|---|---|---|
| ADD-RF-01 | Enlace de verificación de correo para reclutadores nuevos, con cuenta inactiva hasta validación | RSF01, RSNF05 |
| ADD-RF-02 | Código SMS/WhatsApp obligatorio para reclutadores personas naturales | RSF01, RSNF05 |
| ADD-RF-03 | Revisión manual de primera oferta de particular antes de publicación | RSF07 |
| ADD-RF-04 | Control de cuota de dos ofertas activas con protección contra carreras | RSF07, RSNF12 |
| ADD-RNF-01 | Tokens/códigos de verificación de un solo uso, protegidos y caducables; plazos por definir | RSNF05/07/08 |
| ADD-RNF-02 | Prohibición verificable de acceso horizontal entre reclutadores de una misma empresa | RSNF06/07/18 |
| ADD-RNF-03 | Integridad e idempotencia de escrituras de respuestas y cierre de exámenes | RSNF12/15/17 |

**No agregar esos IDs a los 85 originales hasta que se apruebe la nueva línea base documental.** `ADD` registra solicitudes adicionales identificadas, no un cambio silencioso de la numeración.

## 6. Efectos en Figma antes del desarrollo

1. `Auth · Registro`: variantes de empresa/particular, pantalla de confirmación de correo y teléfono, inactivo/activo.
2. `Reclutador · Nueva oferta` y `Ofertas de empleo`: cuota de dos, estado pendiente de moderación, acción bloqueada con motivo.
3. `Candidato · Datos extraídos`: edición y confirmación de campos por candidato; `Reclutador · Revisión del currículum`: solo lectura y notas.
4. `Candidato · Examen en línea`: confirmada/pending local/fuera de plazo; expiración mostrada de modo correcto.
5. `Candidato` estados Vacío/Error: corregir saltos existentes a pantallas del reclutador detectados en auditoría Fase 1, sin añadir «Estados de UI» al sidebar.

## 7. Pruebas necesarias para aceptar los cambios

- Acceso del reclutador A a datos del reclutador B, inclusive en la misma empresa, debe ser rechazado por backend.
- Particular con dos ofertas publicadas no publica tercera; dos publicaciones simultáneas no saltan cuota.
- Primera oferta particular no queda visible hasta aprobación manual; no inventar moderador no definido.
- PDF con texto extrae candidatos a campos; sin texto produce estado y edición manual, sin inventar valores.
- Reclutador puede anotar pero nunca reescribir perfil candidato.
- Reingreso en examen mantiene límite original; respuestas confirmadas aparecen; respuesta que llega tarde es rechazada.
- Al expirar sin conexión el backend finaliza con datos recibidos y la UI no promete sincronización exitosa.

## 8. Estado documental

**Aprobado:** reglas DEC-01 a DEC-07 indicadas en registro.  
**Redacción propuesta de cambio:** este documento y las `spec.md` del paquete.  
**Pendiente:** aprobación formal de línea base RF/RNF actualizada; RSF23/24, moderador, semántica «activa» y proveedor/privacidad de verificaciones.  
**No ejecutado:** cambios en Figma, base de datos física, APIs o código.
