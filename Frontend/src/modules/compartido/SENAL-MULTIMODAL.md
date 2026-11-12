# Señal multimodal reutilizable

`SenalMultimodal.astro` muestra un mensaje accesible y utiliza los audios de Material Design y patrones hápticos para `exito`, `error`, `cancelacion` y `progreso`. El sonido y la vibración están desactivados por defecto; el módulo que lo utiliza debe respetar las preferencias de la persona y proporcionar un mensaje visible.

## Ejemplo de uso

```astro
---
import SenalMultimodal from '../modules/compartido/components/SenalMultimodal.astro';
---
<button id="ejecutar" type="button">Guardar</button>
<SenalMultimodal id="resultado" textoInicial="Listo." />
<script>
  const resultado = document.querySelector<HTMLElement>('#resultado');
  document.querySelector('#ejecutar')?.addEventListener('click', () => {
    resultado?.dispatchEvent(new CustomEvent('qori:senal', {
      detail: { estado: 'exito', mensaje: 'Guardado correctamente.', sonido: true, vibracion: false, volumen: 0.35 }
    }));
  });
</script>
```

Usa valores obtenidos de las preferencias reales del usuario en lugar de activar audio sin su consentimiento. También se pueden indicar `sonido`, `vibracion` y `volumen` como propiedades del componente; los valores del evento prevalecen. El volumen está entre 0 y 1 y la reproducción se detiene como máximo a los 1,9 segundos. El evento se debe emitir tras una interacción del usuario; el navegador puede bloquear audio fuera de ella. Para controlar errores de reproducción se puede pasar `alFallarAudio` en el detalle.

Para flujos sin componente visual, importar `emitirSenal`, `detenerSenal` y `ajustarVolumenSenal` desde `senal-multimodal.ts` y proporcionar por separado un mensaje visual accesible. Las señales comparten un reproductor; una nueva emisión detiene la anterior. La vibración depende del dispositivo y navegador. La evaluación de las señales con participantes sigue pendiente.

Los audios proceden de una copia de terceros de recursos de Google Material Design. Consulta `Frontend/public/audio/FUENTES.md`: hay indicaciones contradictorias sobre la licencia y se debe confirmar antes de distribuirlos.
