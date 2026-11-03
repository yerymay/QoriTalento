# Qori Talento — Plan inicial de adopción SDD

**Estado:** borrador de planificación; pendiente de aprobación.  
**Tipo de trabajo:** auditoría y especificación, sin cambios de Figma ni implementación.  
**Stack declarado:** Astro (frontend), Node.js + Express (backend), MySQL (persistencia), Tailwind CSS + Flowbite (UI prevista).

## 1. Fuentes de verdad identificadas

1. `1__Requerimientos_Funcionales_y_no_funcionales_COMPLETO.pdf` — documento de requisitos del sistema: **32 RSF** y **18 RSNF**, agrupados en **8 módulos**; todos figuran como pendientes.
2. `Texto pegado(5).txt` — documento de requisitos de UI: **20 RF de interfaz**, **15 RNF de interfaz** y **13 historias de usuario**, con referencias a pantallas S01–S12 y una matriz de trazabilidad.
3. Figma, página `7116:2` — `QORI · Fundamentos`: paleta Sky, tipografía Inter, escala de espacios, modos claro/oscuro y lineamientos de layout.
4. Figma, página `11106:2` — `QORI · Prototipo navegable · v2`: **22 vistas principales** con las cinco variantes operativas cada una (110 combinaciones nominales), más diálogos y pantallas auxiliares. Se detectaron interacciones de prototipo en pantallas inspeccionadas; **no** equivale a certificación de todos los recorridos.
5. Biblioteca Flowbite y página de componentes QORI dentro del mismo archivo de Figma.

**Enlaces Figma:**
- Fundamentos: https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=7116-2
- Prototipo: https://www.figma.com/design/eoMSNdb9Cl0OmQU6BqKuZD/New-Desing-DE-QORITALENTO--Copy---Copy---Copy-?node-id=11106-2

**Estado de ejecución declarado por el propietario:** aún no existe código fuente, base de datos, esquema ni contratos API. La implementación será desde cero, pero reutilizando las decisiones y diseños existentes.

## 2. Alcance funcional a preservar (PDF)

| Módulo | Identificadores | Objetivo |
|---|---|---|
| 1. Usuarios y roles | RSF01–RSF04 | Registro, inicio/cierre de sesión, perfil y permisos |
| 2. Ofertas de empleo | RSF05–RSF08 | Creación, datos de oferta, publicación/edición/cierre y consulta |
| 3. Postulaciones y CV | RSF09–RSF12 | Postular, cargar PDF, asociarlo con oferta y consultar estado |
| 4. Extracción del CV | RSF13–RSF16 | Lectura, extracción, perfil y revisión |
| 5. Exámenes | RSF17–RSF21 | Crear preguntas y exámenes, límite de tiempo, resolver y autoenviar |
| 6. Calificación | RSF22–RSF25 | Corregir examen, comparar CV/oferta, puntuar y ordenar |
| 7. Selección | RSF26–RSF29 | Resultados, ficha de candidato y decisión humana |
| 8. Seguimiento | RSF30–RSF32 | Postulaciones por oferta y actualización/consulta de estado |

El PDF establece CV **en formato PDF**. No compromete lectura de Word/imágenes, notificaciones automáticas ni anonimización de datos. No agregar estas capacidades sin un cambio de alcance. Los toasts y avisos **dentro de la interfaz** de los requisitos UI no equivalen por sí solos a notificaciones automáticas externas.

## 3. Hallazgos que deben resolverse antes del diseño técnico definitivo

| ID | Tema | Hallazgo sustentado | Decisión pendiente |
|---|---|---|---|
| D01 | Alta de reclutadores | RSF01 y RF-11 muestran selector de rol incluso en registro público; RSF04 y RSNF06 exigen separar permisos | ¿Cualquier persona puede activar el rol reclutador, o debe mediar invitación/aprobación? |
| D02 | Puntaje y compatibilidad | RSF23 y RSF24 exigen compatibilidad Alta/Media/Baja y puntaje final, pero no fijan algoritmo, ponderaciones ni umbrales | Acordar fórmula, límites, manejo de datos faltantes, explicación y mecanismo de revisión |
| D03 | Motor de extracción | RSF13–RSF15 indican extracción automática, sin proveedor ni procedimiento técnico seleccionado | Acordar enfoque para PDFs con texto y PDFs escaneados; costos y privacidad |
| D04 | Corrección del CV | RSF16 centra la revisión en el reclutador; RF-17 de UI añade edición por el postulante | Acordar quién modifica qué datos, origen de verdad y auditoría de correcciones |
| D05 | Ciclo de postulación | RSF09 crea una postulación inicial pendiente de CV; RF-15 habla de envío confirmado solo después de cargar un CV válido | Separar claramente borrador/inicio vs envío definitivo; decidir qué se persiste |
| D06 | Exámenes desconectados | RNF-04 exige temporizador vinculado al servidor; RNF-09 conservación local, sincronización y reenvío automático | Definir expiración en servidor, estrategia offline, almacenamiento seguro y prevención de duplicados |
| D07 | Estados de interfaz | RNF-07 exige cinco estados en pantallas con datos; Figma tiene variantes incluso de formularios de autenticación | Distinguir estado de datos (ideal, vacío, parcial, carga, error) del estado de formularios (validación, envío, error) |
| D08 | Tipografía | `QORI · Fundamentos` define Inter; estilos heredados `QORI / Sitio` usan Noto Sans | Confirmar Inter como estándar y migración de estilos heredados sin cambios innecesarios de pantalla |
| D09 | Trazabilidad de pantallas | UI usa códigos S01–S12, mientras el prototipo tiene 22 vistas principales | Mapear cada pantalla S a las vistas reales y sus variantes; evitar suponer equivalencia 1 a 1 |
| D10 | Calidad medible | El documento tiene RSNF concretos y cualitativos; UI incorpora métricas más específicas | Precisar condiciones de prueba (carga de red, volumen de datos, dispositivos, percentiles) |
| D11 | Alcance de IA | La calificación apoya una decisión humana (RSF28); no está definida la intervención humana sobre puntuaciones erróneas | Documentar explicabilidad, controles de revisión y criterios de aceptación sin decisión automática |
| D12 | Versiones y coherencia | Figma incluye prototipo v2, respaldo, componentes Flowbite y una variante anterior de prototipo fiel | Fijar página v2 como referencia primaria y fundamentos como referencia de estilo, sujetas a revisión |

## 4. Propuesta de organización del repositorio

```text
qori-talento/
├── frontend/                      # Astro; Tailwind/Flowbite; componentes/islas
├── backend/                       # Node.js + Express; módulos y API
├── docs/
│   ├── constitution.md            # Reglas globales y restricciones
│   ├── glossary.md                # Vocabulario de dominio y estados
│   ├── architecture.md            # Arquitectura aprobada
│   ├── design-system.md           # Tokens/typography/componentes
│   ├── decisions/                 # ADR: decisiones técnicas registradas
│   └── traceability.md            # RSF ↔ RF de UI ↔ pantallas ↔ APIs ↔ pruebas
├── specs/
│   ├── 001-usuarios-y-accesos/
│   ├── 002-ofertas/
│   ├── 003-postulaciones-cv/
│   ├── 004-extraccion-cv/
│   ├── 005-examenes/
│   ├── 006-evaluacion-puntaje/
│   ├── 007-resultados-seleccion/
│   └── 008-seguimiento/
├── tests/                         # Pruebas de integración y E2E compartidas
└── AGENTS.md                      # Instrucciones de trabajo para agentes de IA
```

Dentro de cada módulo `specs/<modulo>/`: `spec.md` (qué/criterios), `plan.md` (cómo), `tasks.md` (pasos), `verification.md` (pruebas/evidencias).

**Nota:** esto es una arquitectura documental propuesta, no carpetas actualmente creadas en un repositorio. El frontend puede usar islas interactivas de Astro cuando corresponda; **no elegir React/Vue/Svelte ni librerías adicionales sin una decisión técnica expresa**. Tampoco seleccionar todavía ORM, servicio de almacenamiento PDF o motor de IA.

## 5. Orden de especificación e implementación propuesto

1. **Fundamentos transversales:** constitución, catálogo de requisitos, trazabilidad, nomenclatura de estados, design system y política de seguridad.
2. **Usuarios/roles (RSF01–04):** acceso y autorización, previa resolución de D01.
3. **Ofertas (RSF05–08):** creación, estados y visibilidad por rol.
4. **Postulación y PDF (RSF09–12):** ciclo de vida, validación PDF y asociación a oferta.
5. **Extracción CV (RSF13–16):** proceso, errores, revisiones y privacidad.
6. **Exámenes (RSF17–21):** preguntas, duración, persistencia, envío automático y desconexiones.
7. **Calificación (RSF22–25):** examen, compatibilidad CV–oferta, fórmula documentada y filtros.
8. **Resultados/selección (RSF26–29):** ficha, revisión humana y decisión.
9. **Seguimiento (RSF30–32):** estado para ambos roles y trazabilidad.
10. **Pruebas integrales:** seguridad, accesibilidad, rendimiento y flujos extremo a extremo.

El orden de implementación puede ajustarse por dependencias y riesgos cuando se definan los planes técnicos. No constituye una decisión de recortar el alcance del documento.

## 6. Matriz de trazabilidad inicial (muestra)

| RSF de sistema | UI | Vista/flujo esperado | Pruebas propuestas |
|---|---|---|---|
| RSF01–04 | RF-01, RF-11, RF-13; RNF-15 | Auth; navegación por rol | Alta segura, acceso no autorizado denegado, sesión |
| RSF05–08 | RF-02, RF-03, RF-14 | Crear oferta, listado reclutador/candidato | Publicación válida, oferta cerrada no postulable |
| RSF09–12 | RF-04, RF-10, RF-15 | Postulación y PDF; mis postulaciones | Validación PDF, confirmación, seguimiento |
| RSF13–16 | RF-05, RF-16, RF-17 | Datos extraídos y revisión CV | Exitoso, parcial, fallo, revisión y permisos |
| RSF17–21 | RF-06, RF-07, RF-18 | Creación y rendición de examen | Temporizador, caducidad, respuestas sin pérdida |
| RSF22–25 | RF-08, RF-19 | Resultados y comparación | Puntuación reproducible, niveles y orden |
| RSF26–29 | RF-09, RF-20 | Ficha y decisión | Confirmación, autorización, resultado registrado |
| RSF30–32 | RF-08, RF-10 | Seguimiento y paneles | Consistencia de estado entre roles |

Esta matriz es preliminar: debe validarse contra las fichas detalladas y cada uno de los marcos del prototipo.

## 7. Política de cinco estados y excepciones

Los **estados operativos** (Ideal, Vacío, Parcial, Carga, Error) se aplican a **regiones/pantallas que presentan datos**. No son entradas del sidebar. Los **estados de negocio** (Borrador, Publicada, Cerrada, En revisión, Preseleccionado, Avanza, No avanza) son atributos del dominio y no se mezclan con los operativos.

- **Ideal:** datos completos y acciones disponibles conforme a permisos.
- **Vacío:** ausencia real de datos; mensaje y próxima acción contextual.
- **Parcial:** conserva los datos disponibles, identifica pendientes y ofrece recuperación cuando aplica.
- **Carga:** skeleton de la forma real del contenido; no un spinner genérico único.
- **Error:** identifica la tarea o región fallida; explica y ofrece acción de recuperación.

Para formularios, también hacen falta validaciones, bloqueos, envíos y confirmaciones específicos. No forzar un estado “vacío” de listado sobre un login solo para cubrir un conteo.

## 8. Criterio de cierre de cada especificación SDD

Una especificación de módulo estará **lista para plan técnico** cuando tenga:

- Requisitos RSF, RSNF, RF/RNF de UI y HU asociados.
- Actor(es), alcance y exclusiones.
- Reglas de negocio y transiciones de estado.
- Escenarios normales, alternativos, errores y excepciones.
- Criterios de aceptación en Gherkin o formulación verificable equivalente.
- Pantallas de Figma y variantes referenciadas.
- Contratos de datos esperados sin inventar campos no definidos.
- Reglas de acceso, privacidad, validaciones y trazabilidad.
- Decisiones abiertas registradas, sin fingir que están resueltas.

La implementación de cada módulo se considerará terminada solo cuando cumpla los criterios y sus pruebas automáticas/manuales exigidas, incluidas las negativas.

## 9. Próximos entregables de planificación

**P0 — Consolidación de fuentes:** inventario y página Figma de referencia congelada (sin editar); lista de requisitos fuente.  
**P1 — Análisis de brechas:** matriz completa de cobertura RSF ↔ UI ↔ prototipo; decisiones D01–D12 con prioridad.  
**P2 — Constitución v1:** reglas obligatorias de seguridad, dominio, UI, arquitectura y validación.  
**P3 — Arquitectura v1:** estructura de paquetes, límites Astro/Express, persistencia MySQL, subida y protección de PDF, sesiones, errores y pruebas.  
**P4 — Primer spec vertical:** usuarios/accesos o flujo prioritario aprobado, con `spec.md`, `plan.md`, `tasks.md` y verificaciones.  
**P5 — Inicio del código:** solo tras cerrar las decisiones críticas y la aprobación del spec correspondiente.

**Estado de este documento:** es un plan inicial fundamentado en los recursos recibidos. No implica que el prototipo o los documentos hayan sido corregidos ni que la arquitectura esté aprobada.
