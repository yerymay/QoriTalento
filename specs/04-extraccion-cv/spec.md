# SPEC-F3-04 — Lectura, extracción y revisión del CV

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF13–RSF16  
**UI de origen:** RF-05 (modificada), RF-16, RF-17  
**RNF relacionados:** RSNF03, RSNF07, RSNF16, RSNF18; RNF-01, RNF-05, RNF-07  
**Estado del módulo:** Lista para revisión con límites de parsing pendientes

## 1. Propósito, actores y límites

**Objetivo.** Extraer texto de PDFs digitales mediante método clásico, sugerir campos estructurados sin inventar valores y permitir corrección del postulante antes de confirmar.

**Actores.** Postulante propietario de sus datos; reclutador propietario de la oferta (lectura y notas); servicio de extracción determinista.

**Referencias Figma.** Candidato · Datos extraídos; Reclutador · Revisión del currículum; Candidato · Postulación y PDF. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **CV-01** · `RSF13, DEC-04` — CUANDO se reciba PDF admitido, EL SERVIDOR DEBE intentar lectura de texto embebido sin OCR ni modelo generativo en el MVP.
- **CV-02** · `RSF14, DEC-04` — CUANDO exista texto utilizable, EL SERVIDOR DEBE aplicar reglas reproducibles para sugerir nombre/contacto, formación, experiencia y habilidades cuando se sustenten en texto; una coincidencia dudosa no debe inventarse.
- **CV-03** · `RSF14, RF-16` — SI no hay evidencia suficiente para un campo, LA INTERFAZ DEBE mostrar «No detectado» y permitir completar la información manualmente.
- **CV-04** · `RSF15, RF-17, DEC-07` — ANTES de confirmar el envío de postulación, EL SISTEMA DEBE mostrar campos sugeridos con su procedencia y permitir al postulante corregirlos y confirmar su versión.
- **CV-05** · `RSF15, RSNF12` — CUANDO el postulante confirme sus datos, EL SISTEMA DEBE conservar la versión confirmada y el archivo PDF original de forma protegida, sin reemplazar el contenido original del documento.
- **CV-06** · `RSF16, RF-05, DEC-07` — CUANDO el reclutador propietario abra una postulación, DEBE poder consultar PDF y datos confirmados lado a lado o en pestañas en móvil y crear observaciones separadas; NO DEBE poder modificar el perfil fuente.
- **CV-07** · `RSF04, RSNF06, DEC-03` — SI un reclutador intenta acceder o editar datos de candidatos de oferta ajena, EL BACKEND DEBE impedirlo. Tampoco puede utilizar su rol para editar el perfil original de candidato de oferta propia.
- **CV-08** · `RSF15, DEC-07` — SI un dato confirmado cambiara tras una evaluación, EL SISTEMA DEBE preservar el histórico y abstenerse de sobrescribir silenciosamente calificaciones previas; el flujo de reevaluación queda pendiente.
- **CV-09** · `RSF13, RSNF16` — SI el PDF no contiene texto extraíble o está protegido, EL SISTEMA DEBE comunicar la limitación con una recuperación compatible con la política de archivos que se apruebe, sin afirmar falsamente que lo ha procesado.

## 3. Estados y reglas de autorización

Procesamiento de CV: por procesar / procesando / información parcial / procesado / fallo de lectura. UI Ideal/Vacío/Parcial/Carga/Error se representa por región del documento y datos; la no detección de un campo no equivale siempre a fallo global.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Vista de extracción con campos editables únicamente para postulante, origen distinguible; panel reclutador de solo lectura y notas; skeleton estructural por secciones; error específico por archivo. No mostrar un spinner genérico como única estructura.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### C01 · PDF con datos incompletos
```gherkin
Escenario: PDF con datos incompletos
  Dado un PDF digital válido que contiene nombre y correo pero omite experiencia
  Cuando se aplica la extracción clásica
  Entonces se proponen únicamente los datos reconocidos y experiencia figura No detectado
```

### C02 · PDF sin texto digital
```gherkin
Escenario: PDF sin texto digital
  Dado un PDF escaneado sin texto embebido
  Cuando se intenta extraer texto
  Entonces el sistema indica la limitación y ofrece la recuperación definida sin inventar contenido
```

### C03 · Confirmación del postulante
```gherkin
Escenario: Confirmación del postulante
  Dado un perfil sugerido con error de experiencia
  Cuando el postulante corrige y confirma
  Entonces la versión confirmada conserva la corrección y el PDF fuente queda inalterado
```

### C04 · Reclutador en solo lectura
```gherkin
Escenario: Reclutador en solo lectura
  Dado un reclutador propietario que revisa el expediente
  Cuando intenta cambiar un campo del perfil mediante API
  Entonces el backend rechaza el cambio y permite exclusivamente observaciones separadas
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Calidad mínima y evaluación de exactitud del extractor, formatos PDF admitidos, OCR excluido, retención/versionado, corrección posterior al envío y efecto sobre evaluación; no asegurar 100% de extracción.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
