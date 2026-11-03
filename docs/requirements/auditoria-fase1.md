# Qori Talento — Fase 1: auditoría y trazabilidad SDD

> **Estado:** auditoría documental y estructural del prototipo realizada; validación funcional y de accesibilidad de producción pendiente.
> **Fecha de ejecución:** 2 de noviembre de 2026 (fecha local de la sesión). Los archivos fuentes pueden incluir otras fechas de edición.

## 1. Objetivo y alcance

Contrastar requisitos del sistema, requisitos de UI, historias de usuario y la estructura de Figma para localizar representaciones de diseño, inconsistencias y decisiones pendientes. **No se modificó Figma ni se creó código**. Las asociaciones requisito → pantalla son trazas candidatas, no certificaciones de cumplimiento.

### Fuentes auditadas

- **PDF:** `1__Requerimientos_Funcionales_y_no_funcionales_COMPLETO.pdf` (24 páginas). Contiene 32 RSF, 18 RSNF y ocho módulos.
- **Texto UI:** `Texto pegado(5).txt` (fuente LaTeX). Contiene 20 RF UI, 15 RNF UI, 13 historias y una RTM previa.
- **Figma, fundamentos:** [QORI · Fundamentos](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=7116-2).
- **Figma, prototipo:** [QORI · Prototipo navegable · v2](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11106-2).
- **Contexto tecnológico confirmado:** Astro, Node.js/Express, MySQL y Flowbite/Tailwind; no hay código fuente, esquema físico ni endpoints.

## 2. Inventario y trazabilidad

| Elemento | Cantidad | Evidencia y alcance |
|---|---:|---|
| Requisitos funcionales RSF | 32 | Fuente PDF, fichas y prioridades |
| Requisitos no funcionales RSNF | 18 | Fuente PDF, medibilidad heterogénea |
| Requisitos funcionales UI | 20 | Fuente UI; asociaciones a RSF |
| Requisitos no funcionales UI | 15 | Fuente UI; asociaciones a RSNF |
| Historias de usuario | 13 | Con escenarios de aceptación textuales |
| Vistas principales Figma | 22 | 2 Auth, 10 Reclutador, 10 Candidato |
| Variantes Ideal/Parcial/Vacío/Carga/Error | 110 | 5 estructuras por cada vista |
| Interacciones de las 110 variantes inspeccionadas | 1.388 | Reacciones de navegación y overlays |
| Destinos inexistentes encontrados | 0 | Solo para el conjunto inspeccionado |
| Enlaces Candidato → Reclutador | **20** | Anomalía confirmada en estados Vacío/Error |

Los **85 requisitos** no son 85 funciones independientes: los RF/RNF UI detallan la presentación y cualidades de parte de los RSF/RSNF. Todas las implementaciones reales están pendientes porque el producto todavía no tiene código. La matriz XLSX conserva los 85 IDs y su asociación candidata con pantallas.

### Relación por módulos

| Módulo | RSF | Principales vistas asociadas |
|---|---|---|
| Gestión de usuarios | RSF01–RSF04 (4) | Auth · Registro, Auth · Inicio de sesión, Reclutador · Mi perfil, Candidato · Mi perfil… |
| Gestión de ofertas de empleo | RSF05–RSF08 (4) | Reclutador · Nueva oferta, Reclutador · Ofertas de empleo, Candidato · Ofertas disponibles, Candidato · Detalle de oferta |
| Postulación y gestión de CV | RSF09–RSF12 (4) | Candidato · Detalle de oferta, Candidato · Postulación y PDF, Candidato · Datos extraídos, Candidato · Mis postulaciones… |
| Lectura y extracción de información del CV | RSF13–RSF16 (4) | Candidato · Postulación y PDF, Candidato · Datos extraídos, Candidato · Mi perfil, Reclutador · Revisión del currículum… |
| Gestión de exámenes en línea | RSF17–RSF21 (5) | Reclutador · Crear examen, Reclutador · Exámenes por oferta, Candidato · Examen en línea, Candidato · Examen enviado |
| Evaluación y calificación | RSF22–RSF25 (4) | Reclutador · Resultados y comparación, Reclutador · Ficha del postulante |
| Resultados y selección | RSF26–RSF29 (4) | Reclutador · Resultados y comparación, Reclutador · Ficha del postulante, Reclutador · Pipeline de selección |
| Seguimiento de postulaciones | RSF30–RSF32 (3) | Reclutador · Pipeline de selección, Reclutador · Resultados y comparación, Candidato · Seguimiento, Candidato · Mis postulaciones |

## 3. Auditoría de Figma

**Fundamentos encontrados:** Inter, Sky (incluida la familia 50–950), colores semánticos independientes, temas claro/oscuro y espaciado estandarizado. Aparecen estilos locales anteriores `QORI / Sitio` con tipografía Noto Sans. No se concluye que todos esos estilos estén aplicados a las pantallas actuales.

**Prototipo:** existen 22 grupos de pantallas, cada uno con cinco estados. Comprobación de interacciones: 1.388 reacciones revisadas para las variantes principales; todos sus destinos consultados existen, pero hay 20 conexiones que saltan del candidato a pantallas del reclutador. La presencia de destino no garantiza semántica correcta.

**Ejemplo reproducible H-01:** [Candidato → Ofertas disponibles / Vacío](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-7050) muestra la acción visual «Actualizar oportunidades»; la reacción configurada en el nodo de acción navega a [Reclutador → Nueva oferta / Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-1886). Es una incoherencia entre etiqueta visual, destino y rol.

**Simulaciones declaradas por el propio prototipo:** [inicio de sesión](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-2) indica que no se requieren credenciales; [examen en línea](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-9941) indica que temporizador y guardado no son reales. Estas simulaciones deben convertirse en escenarios verificables en la especificación, no asumirse como código existente.

### Inventario de 22 vistas

| Rol | Vista | Estados | Enlace |
|---|---|---|---|
| Auth | Auth · Inicio de sesión | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-2) |
| Auth | Auth · Registro | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-180) |
| Reclutador | Reclutador · Resumen | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-373) |
| Reclutador | Reclutador · Ofertas de empleo | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-1243) |
| Reclutador | Reclutador · Nueva oferta | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-1886) |
| Reclutador | Reclutador · Pipeline de selección | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-2460) |
| Reclutador | Reclutador · Resultados y comparación | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-3348) |
| Reclutador | Reclutador · Ficha del postulante | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-4159) |
| Reclutador | Reclutador · Crear examen | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-4750) |
| Reclutador | Reclutador · Mi perfil | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-5332) |
| Reclutador | Reclutador · Revisión del currículum | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-5818) |
| Reclutador | Reclutador · Exámenes por oferta | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-6359) |
| Candidato | Candidato · Ofertas disponibles | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-6848) |
| Candidato | Candidato · Detalle de oferta | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-7307) |
| Candidato | Candidato · Postulación y PDF | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-7765) |
| Candidato | Candidato · Datos extraídos | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-8195) |
| Candidato | Candidato · Mis postulaciones | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-8663) |
| Candidato | Candidato · Seguimiento | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-9062) |
| Candidato | Candidato · Mis evaluaciones | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-9527) |
| Candidato | Candidato · Examen en línea | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-9941) |
| Candidato | Candidato · Examen enviado | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-10494) |
| Candidato | Candidato · Mi perfil | 5/5 estructuras | [Ideal](https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11107-10884) |

## 4. Hallazgos priorizados

| ID | Severidad | Hallazgo | Acciones de resolución |
|---|---|---|---|
| H-01 | Crítica | **Navegación entre roles:** 20 acciones en variantes Vacío/Error de Candidato enlazan a vistas de Reclutador; ejemplo: actualización de oportunidades conduce a gestión de ofertas. | Corregir acciones y reejecutar auditoría de conexiones antes de validar navegación. |
| H-02 | Alta | **Login simulado:** Auth indica que no se requieren credenciales; inicio de sesión no prueba autenticación ni permisos reales. | Especificar política de autenticación, sesiones y pruebas de permisos. |
| H-03 | Alta | **Temporizador y guardado simulados:** El prototipo del examen declara que ni el temporizador ni el guardado son reales. | Definir tiempo oficial servidor, persistencia, expiración y escenarios offline. |
| H-04 | Alta | **Criterio de puntaje indeterminado:** RSF23/24 requieren compatibilidad y puntaje, pero no fijan fórmula, umbrales, ponderación ni explicación. | Definir y aprobar modelo verificable de puntuación y trazabilidad de criterios. |
| H-05 | Alta | **Revisión versus edición del CV:** RSF16 asigna al reclutador revisar los datos extraídos; RF-17 añade edición de datos por postulante sin regla de autorización explícita. | Clarificar quién edita, qué campos, en qué momento y si afecta puntajes ya calculados. |
| H-06 | Alta | **Registro libre de reclutadores:** RSF01/UI RF-11 permiten elegir rol durante el registro. No está definida la autorización para crear una cuenta privilegiada. | Decidir aprobación/invitación/administración de altas sin inventar roles nuevos. |
| H-07 | Alta | **Requisito offline exigente:** RNF-09 exige respuestas guardadas y sincronizadas después de desconexión; no existe arquitectura/política de conflictos. | Especificar persistencia cliente, colas, reconciliación e idempotencia. |
| H-08 | Media | **Cinco estados en formularios y Auth:** Figma tiene cinco estados incluso en login/registro. Debe validarse si Vacío significa sin datos o formulario inicial y si Carga usa la región correcta. | Aprobar matriz de estados operativos por pantalla/región, evitando forzar estados que no correspondan. |
| H-09 | Media | **Estados del negocio no normalizados:** En revisión, Preseleccionado, Avanza, No avanza aparecen como opciones; falta definir transiciones y carácter terminal de No avanza. | Crear máquina de estados de postulación y criterios de autorización por cambio. |
| H-10 | Media | **Tipografía no totalmente uniforme:** Fundamentos tipográficos Qori usan Inter; permanecen estilos QORI / Sitio en Noto Sans. | Determinar cuáles estilos se usan y normalizar referencias antes de implementar tokens. |
| H-11 | Media | **Diseño desktop no prueba responsividad:** Las 22 vistas principales auditadas presentan ancho de 1440 px; se requieren puntos 360, 390, 768 y 1280. | Auditar variantes o constraints responsive; preparar pruebas de 360 px. |
| H-12 | Media | **Faltan verificaciones medibles:** Figma no prueba respuesta 3 s, skeleton 200 ms, contraste 4.5:1, teclado ni controles 44×44. | Definir protocolos de prueba de rendimiento, accesibilidad y compatibilidad. |
| H-13 | Media | **Subroles humanos ambiguos:** Documento distingue Analista de Selección y Jefe de Gestión Humana, ambos bajo Reclutador; falta matriz de permisos granular. | Definir si es un rol con atribuciones idénticas o permisos diferenciados. |
| H-14 | Media | **IA sin diseño operacional:** No se definió motor IA, estrategia de extracción de PDF, manejo de errores ni actualización de puntajes ante correcciones. | Especificar entradas, salidas, calidad esperada y tratamiento de datos faltantes. |
| H-15 | Baja | **Metadatos temporales por verificar:** Documento de requisitos figura fechado 03-11-2026; no equivale a fecha validada o aprobación del alcance. | Confirmar versión aprobada y responsable de cambios, sin asumir firma o aprobación. |

## 5. Riesgos de coherencia documental

1. **Requisitos de seguridad:** RSF01 + RF-11 permiten elegir el rol en el registro. Antes de construir una API debemos establecer quién puede convertirse en Reclutador.
2. **Extracción vs edición:** RSF16 define la revisión por Reclutador, mientras RF-17 propone que Postulante edite sus datos autocompletados. No se modifica el alcance unilateralmente: se solicita decisión.
3. **Compatibilidad y puntaje:** RSF23/RSF24 describen la finalidad pero no un algoritmo ni ponderaciones. El porcentaje mostrado en UI es representación, no especificación matemática.
4. **Estados operativos vs estados de negocio:** Ideal, Vacío, Parcial, Carga, Error describen disponibilidad de UI; Borrador/Publicada/Cerrada o En revisión/Preseleccionado/Avanza/No avanza son estados del proceso y requieren máquinas de estados independientes.
5. **Alcance protegido:** el PDF restringe el CV a **PDF**; lectura DOCX/imágenes y notificaciones automáticas externas no forman parte del alcance comprometido. Los toasts contextuales de UI no implican notificaciones automáticas externas.
6. **Rendimiento:** hay umbrales explícitos (respuesta habitual 3 s; skeleton <200 ms; feedback UI <100 ms; temporizador ±1 s) pero faltan metodología, carga y ambiente de medición.

## 6. Decisiones que bloquean el diseño técnico

| ID | Prioridad | Pregunta | Requisitos |
|---|---|---|---|
| D-01 | Alta | **Autenticación:** ¿Puede cualquiera registrar rol Reclutador o requiere invitación/aprobación? | RSF01, RSF04, RF-11 |
| D-02 | Alta | **Roles y permisos:** ¿Analista y Jefe de Gestión Humana comparten todos los permisos del rol Reclutador? | RSF04, RSNF06 |
| D-03 | Crítica | **Exámenes:** ¿Cuándo comienza el tiempo oficial y cómo se valida la expiración frente a recarga/desconexión? | RSF21, RNF-04, RNF-09 |
| D-04 | Alta | **Postulación:** ¿Cuándo se crea el registro inicial y cuándo se considera enviado definitivamente? ¿Se permiten múltiples postulaciones? | RSF09..RSF11, RF-15 |
| D-05 | Alta | **CV/IA:** ¿Qué campos mínimos se extraen, cómo se tratan ausencias/fallos y con qué tecnología de procesamiento? | RSF13..RSF16 |
| D-06 | Crítica | **Puntaje:** ¿Cuáles son ponderaciones y umbrales para examen, compatibilidad y puntaje final? | RSF22..RSF24 |
| D-07 | Alta | **Oferta:** ¿Qué ocurre con exámenes y postulaciones abiertas al cerrar/editar una oferta? | RSF07, RSF17 |
| D-08 | Alta | **Estados negocio:** ¿Cuáles transiciones están permitidas entre En revisión, Preseleccionado, Avanza y No avanza? | RSF29..RSF32 |
| D-09 | Alta | **Datos extraídos:** ¿El postulante edita datos del CV y el reclutador también? ¿Se guardan revisiones y recalcula puntaje? | RSF15..16, RF-05, RF-17 |
| D-10 | Alta | **Disponibilidad/seguridad:** ¿Qué políticas de sesión, conservación, privacidad y ciclo de vida de datos se requieren? | RSNF05..RSNF09, RNF-15 |
| D-11 | Alta | **Restricciones técnicas:** ¿Cómo se manejarán archivos PDF, almacenamiento seguro, colas y servicios IA en Express? | RSNF07, RSNF14, RSNF16 |
| D-12 | Media | **Diseño responsive:** ¿Qué pantallas y controles específicos están aprobados para móvil y dark mode? | RSNF11, RNF-03, RNF-13 |

## 7. Criterios de salida de la fase 1

- [x] Inventario de 50 requisitos del sistema y 35 de interfaz.
- [x] Asociación **candidata** de los 85 requisitos con módulos/vistas o con arquitectura transversal en la matriz.
- [x] Identificación estructural de 22 vistas y 110 variantes.
- [x] Auditoría de 1.388 interacciones de esas variantes para detectar destinos inexistentes y saltos entre roles.
- [x] Registro de 15 hallazgos priorizados y 12 decisiones pendientes.
- [ ] Validación funcional real (no posible: no existe código).
- [ ] Prueba manual exhaustiva de todos los recorridos y las 110 variantes visuales.
- [ ] Certificación de responsive, contraste, teclado, seguridad, rendimiento o disponibilidad.
- [ ] Aprobación del dueño del producto sobre las ambigüedades de reglas de negocio.

**Resultado:** fase 1 documental y estructural concluida como **línea base preliminar**. No se puede dar por aprobada la funcionalidad de Figma ni construir contratos API definitivos sin resolver D-01 a D-09.

## 8. Próximo paso recomendado

1. Corregir en Figma los **20 enlaces entre roles** (previo respaldo, sin cambiar funcionalidades).
2. Resolver primero D-01 (alta de reclutadores), D-03 (tiempo de examen), D-06 (puntaje) y D-09 (edición de datos).
3. Elaborar la constitución (`constitution.md`), las especificaciones del primer flujo y el modelo conceptual de datos; aún no diseñar tablas definitivas.
4. Conservar la matriz viva, vinculando más adelante cada requisito a historias, contratos API, componentes y pruebas.

### Archivos generados

- `Qori_Talento_Fase_1_Auditoria_SDD.md` — informe ejecutivo y hallazgos.
- `Qori_Talento_Fase_1_Matriz_Trazabilidad.xlsx` — 10 hojas: resumen, 85 requisitos, 22 vistas, historias, hallazgos, decisiones y criterios.
