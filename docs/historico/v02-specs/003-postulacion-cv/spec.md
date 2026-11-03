# SPEC-003 — Extracción clásica del CV y propiedad de los datos

**Estado:** propuesta funcional. **IDs base:** RSF09–RSF16, RSNF07, RSNF12, RSNF16, RSNF18; UI RF-04, RF-05, RF-15–RF-17, RNF-05, RNF-07, RNF-15; HU-01, HU-04, HU-08. **Figma:** `Candidato · Postulación y PDF`, `Candidato · Datos extraídos`, `Reclutador · Revisión del currículum`.

## Alcance aprobado

- Formato inicial: PDF con texto embebido que permita extracción clásica. **Sin OCR, sin IA generativa y sin lectura de DOCX/imágenes** en el MVP.
- La extracción del texto se procesa en backend y se estructura por reglas/heurísticas deterministas; se debe distinguir **dato extraído**, **dato no detectado** y **dato confirmado por el postulante**.
- Cuando el PDF no contenga texto suficiente, el sistema informa que no puede extraer automáticamente y permite completar manualmente los campos aplicables, sujeto a reglas de validación. No inventa contenido.
- El PDF original se conserva protegido; las versiones del perfil confirmado se auditan separadamente.

## Reglas normativas EARS

- **CV-01:** CUANDO se cargue un PDF, EL SISTEMA DEBE validar formato y comprobar que sea procesable; tamaño máximo y política de PDFs protegidos quedan pendientes.
- **CV-02:** CUANDO el PDF permita extracción de texto, EL SERVIDOR DEBE obtener el texto y usar reglas clásicas para sugerir datos de contacto, formación, experiencia y habilidades cuando haya evidencia suficiente.
- **CV-03:** SI una sección no se identifica, LA INTERFAZ DEBE mostrar `No detectado`, sin inferir ni inventar información.
- **CV-04:** ANTES de confirmar la postulación, EL SISTEMA DEBE permitir al postulante revisar, corregir y validar los datos sugeridos.
- **CV-05:** UNA VEZ enviado el perfil, EL SISTEMA DEBE conservar la versión presentada y sus cambios auditables sin modificar el documento PDF original.
- **CV-06:** CUANDO un reclutador revise un CV perteneciente a una de sus ofertas, EL SISTEMA DEBE permitir lectura del PDF, comparación con datos confirmados y creación de notas/observaciones separadas; NO DEBE permitirle sobrescribir los campos del perfil.
- **CV-07:** SI un reclutador intenta editar el perfil del candidato mediante la API, EL BACKEND DEBE denegarlo aunque la interfaz no muestre botones de edición.
- **CV-08:** SI hay un cambio de perfil tras evaluación previa, EL SISTEMA DEBE preservar evidencia/versiones de la evaluación y señalar que requiere revisión según una política aún por definir. No recalcular silenciosamente resultados finales.

## Criterios de aceptación

```gherkin
Escenario: PDF con texto, extracción parcial
  Dado que el postulante carga un PDF válido con algunos datos reconocibles
  Cuando termina el análisis clásico del documento
  Entonces ve los campos reconocidos y "No detectado" en los restantes
  Y puede corregirlos antes de confirmar

Escenario: PDF escaneado sin texto utilizable
  Dado que el archivo PDF no contiene texto extraíble
  Cuando finaliza el intento de extracción
  Entonces se informa la limitación y se ofrece completar los datos manualmente
  Y el sistema no inventa experiencias ni competencias

Escenario: Reclutador sin permiso de edición
  Dado que el reclutador es propietario de la oferta con la postulación
  Cuando consulta el CV
  Entonces puede ver el PDF y crear una nota interna
  Pero no puede modificar los campos confirmados por el postulante
```

## Cambio documental explícito

**RSF16 (sistema)** ya permite revisión y contraste, no exige edición. **RF-05 y HU-01 (UI)** sí describen modificación por reclutador: se propone sustituir esa edición por lectura y notas sin reescritura de perfil. **RF-17** se conserva y precisa como la corrección del postulante.
