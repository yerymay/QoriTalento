# M04 — Extracción, corrección y confirmación de CV

## Alcance implementado

El CV digital se procesa automáticamente al registrar o reemplazar una postulación. El lector recupera texto de todas las páginas y aplica reglas de encabezados, contactos y secciones. Los documentos anteriores a M04 se procesan al abrir su revisión. No se utiliza OCR, IA generativa ni un servicio externo para procesar los datos.

Se proponen nueve grupos: nombre, correo de contacto, teléfono, ubicación, resumen, formación, experiencia, habilidades e idiomas. Cada grupo conserva evidencia textual y página. Formación y experiencia son listas de entradas de texto editables que conservan los detalles originales; esta versión no asegura una separación semántica de empresa, cargo, institución y fechas. Los valores ausentes o ambiguos no se inventan. El texto leído completo está disponible para recuperar información que las reglas no clasificaron.

El postulante abre «Editar datos», corrige y confirma. La confirmación crea una versión curricular, la vincula a esa postulación y actualiza nombre y teléfono de la cuenta en una sola transacción. El correo extraído se guarda como contacto curricular; no cambia el correo de inicio de sesión. «Mi perfil» muestra el perfil curricular confirmado más reciente.

El reclutador propietario de la oferta puede listar sus postulantes, abrir el PDF y consultar el perfil confirmado, además de agregar notas propias. No recibe la propuesta de extracción sin confirmar. Si un PDF fue reemplazado, la revisión del perfil anterior usa el documento original de esa versión.

## Persistencia y concurrencia

- Se reutilizan `cv_documents`, `cv_private_data`, `cv_extraction_runs`, `candidate_profile_versions`, `application_profile_snapshots` y `recruiter_notes`. Requiere `01_schema.sql` y la migración M03 `04_m03.sql`; no requiere una migración nueva.
- El PDF y la extracción se guardan dentro de la misma transacción de M03. El archivo sigue privado en MariaDB; no se publica en una carpeta web.
- Solo se confirma el CV vigente de una postulación `PENDING`. Se rechazan documentos reemplazados y confirmaciones hechas sobre una versión global del perfil obsoleta.
- Repetir la misma confirmación es idempotente. Las versiones confirmadas son inmutables; un CV nuevo requiere nueva revisión. B-07 sigue pendiente y no se recalculan evaluaciones.
- Una nueva confirmación no altera expedientes de otras postulaciones. Se comprueba propiedad de la postulación u oferta también al servir cada versión del PDF.

## Límites y precisión

Se conserva el máximo de 5 MB. El procesamiento limita a 40 páginas y 160.000 caracteres leídos para acotar recursos. La confirmación admite hasta 60.000 bytes JSON; 30 entradas de formación y experiencia (4.000 caracteres cada una) y 80 habilidades/idiomas (200 caracteres cada uno), además de los límites de los campos personales. Estos límites se validan en el servidor.

La separación de columnas detecta una franja vertical libre en el cuerpo de la página. Diseños complejos, títulos poco habituales y PDF con texto mal codificado pueden producir información parcial. La cobertura casi total y el margen de error mínimo son objetivos de calidad, no resultados demostrados sobre CV reales. Antes de afirmar un porcentaje, se necesita un conjunto representativo de CV consentidos o anonimizados y su anotación manual: medir precisión de los valores propuestos, cobertura de los campos presentes y correcciones por sección. La confirmación humana sigue siendo obligatoria.

## Verificación reproducible

- Backend: `npm.cmd run check`, `npx.cmd vitest run`, `npm.cmd run build` desde `Backend/`.
- Integración MariaDB: `$env:TEST_MYSQL='1'; npx.cmd vitest run tests/cv.mysql.test.ts`. Crea registros sintéticos identificados y elimina únicamente los registros creados al terminar.
- Frontend: `npm.cmd run check`, `npm.cmd run build` desde `Frontend/`.
- Navegador: con Astro activo, `node tests/cv.browser.mjs http://127.0.0.1:4321` desde `Frontend/`. Usa respuestas sintéticas, no datos reales, y deja capturas en `.impeccable/review/`.
- El contrato de las operaciones existentes se encuentra únicamente en `Backend/openapi-implemented.yaml`.

## Direction contract

THESIS: revisar el texto recuperado junto a su documento y confirmar los datos que actualizarán el perfil. Modo Operate, extensión del portal existente.

OWN-WORLD: componentes `Espacio`, `q-input`, `q-card`, `q-primary` y `q-secondary`; tipografía Inter, acentos Sky y superficies Slate en ambos temas.

STORY: el postulante ve el origen de cada grupo, corrige errores y confirma; el reclutador contrasta la versión confirmada y deja notas.

FIRST VIEWPORT: navegación y encabezado existentes, oferta y estado, PDF a la izquierda y formulario a la derecha en escritorio. En móvil se alternan mediante pestañas. Confirmación al final de la revisión, con aviso persistente de éxito.

FORM: composición determinada por el requisito UI-RF-05 y la referencia Figma `11123:985`, adaptada al flujo M03 existente. Extensión local, sin selección de una identidad visual nueva.

FINISH: revisión funcional y visual en escritorio y móvil, tema oscuro y estados vacíos, parciales, de carga y error; evidencia en PROGRESO.md. Se conservan los tokens existentes.

## Revisión visual de cierre

Disposición: `ship` en el alcance de las pantallas M04 y capturas revisadas. Revisión realizada en este hilo porque el subagente independiente falló por límite de uso; no es una revisión independiente.

- **persistence:** alcance y contrato documentados aquí; extensión del sistema ya existente, sin una identidad visual nueva ni cambios de tokens.
- **fidelity:** tipografía Inter, superficies Slate, acento Sky y navegación reutilizada coinciden con el portal. La composición PDF/formulario y las pestañas móviles corresponden al requisito UI-RF-05. La referencia Figma guía la jerarquía; el flujo respeta la carga M03 ya implementada.
- **ceiling:** controles, campos y estados propios de una pantalla operativa; la evidencia se limita a Chrome, 1440/390 px y tema claro/oscuro.
- **material_fixes:** sin correcciones materiales pendientes en las capturas finales inspeccionadas. La pestaña activa quedó diferenciada y se deshabilitaron transiciones solo durante la captura para evitar registrar el cambio de tema a medio terminar.
- **keep:** mantener la revisión explícita del postulante, la evidencia por campo, el documento junto al perfil y la conservación de cambios ante errores de guardado.
