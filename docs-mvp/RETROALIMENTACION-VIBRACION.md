# Retroalimentación multimodal: sonido y vibración

## Objetivo

Complementar la respuesta visual de acciones importantes con sonido y vibración para que la confirmación pueda percibirse por más de un sentido. La información debe seguir siendo comprensible sin sonido ni vibración.

## Aplicación según el caso

- **Acción exitosa:** al recibir la confirmación real de la operación, mostrar un mensaje accesible y, si están habilitados, reproducir un sonido no verbal breve y solicitar una vibración corta. Ejemplos: guardar datos, publicar una oferta o enviar una postulación.
- **Error o datos incompletos:** mostrar qué ocurrió y cómo corregirlo. Un patrón distinto de sonido o vibración es opcional y debe definirse y probarse antes de utilizarse.
- **Confirmación previa:** mantener el diálogo y su mensaje; abrirlo no significa que la operación haya terminado. Evaluar si un pulso adicional aporta valor.
- **Acciones frecuentes:** evitar sonidos o vibraciones en cada tecla, desplazamiento o actualización de progreso para no generar molestias.

## Criterios para implementar

1. Crear el componente en Astro con controles semánticos, nombre y función claros para lectores de pantalla (WCAG 4.1.2). Añadir una respuesta visual al interactuar y respetar la preferencia de movimiento reducido.
2. Usar un sonido no verbal distintivo de menos de un segundo, con un control para activarlo o desactivarlo (WCAG 1.4.2).
3. Usar un patrón de vibración breve cuando el dispositivo lo permita. En la web se puede solicitar desde el navegador, sin una API de backend ni servicio externo. Si no está disponible o está desactivada, la acción debe seguir funcionando.
4. Coordinar las señales con el mismo evento: una señal de éxito solo se presenta después de confirmar la operación. Mantener siempre una respuesta visual y textual accesible.
5. Auditar el componente visible con Lighthouse, WAVE o una herramienta equivalente y registrar resultados y limitaciones respecto de WCAG 2.1. Probar también teclado, lector de pantalla y dispositivos físicos compatibles.

## Entregables y estado

- Un componente `.astro` adaptado a la acción elegida.
- Un reporte de auditoría con herramienta, alcance, resultados y pruebas pendientes.

Existe un botón reutilizable en `Frontend/src/modules/compartido/components/BotonMultimodal.astro`, integrado para prueba en la edición del perfil. El [reporte anterior](AUDITORIA-COMPONENTE-MULTIMODAL.md) es histórico y no audita esta integración nueva.

## Uso del componente

```astro
---
import BotonMultimodal from '../modules/compartido/components/BotonMultimodal.astro';
---
<BotonMultimodal id="guardar" texto="Guardar cambios" tipo="submit" sonido={true} vibracion={true} />
```

El ejemplo activa ambos canales: la pantalla que lo use debe ofrecer controles accesibles para que la persona pueda activarlos o desactivarlos, y actualizar `data-sonido` y `data-vibracion` a `"true"` o `"false"`. Ambos están desactivados por defecto. `tono` admite `exito`, `advertencia` y `peligro`; `tipo` admite `button`, `submit` y `reset`.

El clic prepara el audio cuando está habilitado, pero no anuncia éxito automáticamente. Cuando la operación termine, la pantalla debe mostrar su mensaje accesible y solicitar la señal correspondiente:

```ts
boton.dispatchEvent(new CustomEvent('qori:retroalimentacion', { detail: { tono: 'exito' } }));
```

Para un error o advertencia, enviar el tono que corresponda. `alActivar={true}` emite la señal al pulsar el botón; usarlo solo para respuestas inmediatas, nunca para anticipar el éxito de una operación pendiente. En todos los casos, el sonido y la vibración pueden ser ignorados por el navegador o el dispositivo.

Antes de integrar el botón en una pantalla, definir la acción, los controles de preferencia y el mensaje visual; después auditar el estado integrado y probarlo con dispositivos reales.

## Audios del perfil

El servicio `Frontend/src/modules/compartido/confirmacion-multimodal.ts` asigna los archivos `Frontend/public/audio/exito.mp3`, `advertencia.mp3` y `error.mp3` a los tonos respectivos. Para reemplazarlos, conservar los nombres o actualizar las rutas del servicio; verificar duración menor a un segundo y licencia. El perfil ofrece controles para sonido y vibración en «Opciones de confirmación», cerradas inicialmente: el sonido y la vibración empiezan activados. Las preferencias se mantienen durante la visita y se restablecen al recargar. La advertencia acompaña el diálogo de confirmación, el éxito sigue a una respuesta exitosa y el error acompaña una respuesta fallida. El navegador o dispositivo puede bloquear estas señales; los mensajes visuales permanecen disponibles.
