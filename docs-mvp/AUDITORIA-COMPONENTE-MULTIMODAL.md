# Reporte de auditoría: confirmación multimodal

**Nota histórica:** esta auditoría corresponde al componente de perfil retirado. No evalúa el nuevo botón reutilizable; se requiere una nueva auditoría al integrarlo.

**Fecha:** 2026-11-09  
**Alcance:** componente `Frontend/src/modules/compartido/components/ConfirmacionMultimodal.astro`, integrado en «Guardar cambios» de `/perfil`. La sesión y la respuesta de la API fueron simuladas en el navegador; no se modificaron datos reales.

## Diseño y funcionamiento

- El control principal es un `<button type="submit">` con el nombre accesible «Guardar cambios». Los controles de sonido y vibración son casillas con etiquetas y están agrupados en un `fieldset` con leyenda.
- Tras la respuesta exitosa, el mensaje «Cambios guardados» se muestra en un área `role="status"`; se aplica una microinteracción visual de 240 ms, desactivada si se solicita reducir movimiento. El botón conserva su respuesta visual al presionarse.
- El sonido no verbal se sintetiza localmente con Web Audio y dura aproximadamente 210 ms. Está desactivado inicialmente y la persona puede activarlo o desactivarlo antes de guardar. No se reproduce al cargar la página ni tras un error.
- Si la casilla está activa y el navegador lo admite, se solicita un pulso de 25 ms con `navigator.vibrate`. La ausencia de la API no bloquea el guardado. La respuesta real depende del navegador, dispositivo y configuración del sistema.
- La confirmación visual, auditiva y táctil se solicita al terminar correctamente el guardado. No es posible garantizar simultaneidad física exacta, audibilidad ni vibración efectiva en todos los dispositivos.

## Auditoría automatizada

- **Herramienta:** axe-core 4.14.0, ejecutado en Chrome con Playwright y ventana de 390 × 844 px. Se auditó el componente visible en modo edición, con las reglas etiquetadas `wcag2a`, `wcag2aa`, `wcag21a` y `wcag21aa`.
- **Resultado:** 0 infracciones, 5 comprobaciones aprobadas y 0 resultados incompletos dentro del alcance analizado. Esto no equivale a una certificación WCAG ni evalúa toda la página.
- **WCAG 4.1.2 (nombre, función y valor):** el análisis automatizado no reportó infracciones en el componente. El botón y las casillas usan controles HTML nativos y etiquetas visibles. Pendiente de comprobar su anuncio con lectores de pantalla.
- **WCAG 1.4.2 (control de audio):** señal iniciada por acción del usuario, desactivada por defecto y de menos de un segundo. La duración y el control se verificaron por código y mediante simulación; falta verificar la reproducción física. La regla de WCAG trata específicamente audio que se reproduce automáticamente durante más de tres segundos.
- **Movimiento:** la animación de confirmación se omite con `prefers-reduced-motion: reduce`; se comprobó el comportamiento de guardado con esa preferencia simulada.

## Pruebas funcionales

Se ejecutó `node tests/multimodal.browser.mjs` contra el servidor local, con sesión y respuestas simuladas. Resultado: éxito activa un pulso y un sonido cuando las opciones están seleccionadas; el error no activa ninguno; desactivar las opciones impide ambos; el guardado sigue funcionando sin `navigator.vibrate`; la casilla de sonido responde al teclado. No hubo errores JavaScript en la prueba.

También se ejecutaron `npm run check` (46 archivos, 0 errores, 0 advertencias) y `npm run build` (14 rutas generadas). El detector de interfaz del proyecto no reportó hallazgos en los componentes modificados.

## Limitaciones y pruebas pendientes

- Probar en un dispositivo móvil físico con navegador compatible y con sonido y vibración habilitados/deshabilitados en el sistema; comprobar percepción, duración y comodidad. La API puede ser ignorada.
- Verificar con lector de pantalla el nombre, estado de casillas y anuncio de éxito o error, además de recorrer todo el formulario usando solo teclado.
- Repetir la revisión con distintos navegadores y modos claro/oscuro, y ampliar la auditoría a toda la página. Las pruebas automatizadas no cubren todos los criterios WCAG 2.1.
- Verificar la acción con una cuenta de pruebas y backend real. Las pruebas aquí registradas usan respuestas simuladas.
