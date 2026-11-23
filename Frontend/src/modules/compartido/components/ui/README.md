# Componentes compartidos de Qori Talento

Implementación de las secciones 2, 6 y 7 del DESIGN suministrado por el usuario. Paleta Sky/Slate y tipografía Inter existentes.

## Tokens

`src/styles/ui.css` amplía `@theme` y se importa desde `global.css`.

- Capas: `bg-canvas`, `bg-panel`, `bg-floating`; cambian con la clase `dark` del documento.
- Elevación: `shadow-1` para paneles, `shadow-2` para menús/avisos y `shadow-3` para diálogos.
- Radios: `rounded-control` (8 px), `rounded-panel` / `rounded-floating` (12 px).
- Espaciado: `ui-tight` (8 px), `ui-group` (16 px), `ui-section` (24 px), `ui-region` (32 px), control (44 px).
- Movimiento: `--ui-duration-fast` (160 ms), `--ui-duration-enter` (200 ms), `--ease-ui-out`. Se respeta movimiento reducido.

## Uso

Importar componentes desde esta carpeta. Se conservan los atributos `data-*`, identificadores y eventos de los módulos.

- **Button**: `variant="primary|secondary|ghost|danger|icon"`, `loading`, `success`, `disabled`. Por defecto es `type="button"`; indicar `type="submit"` dentro de formularios. `href` produce un enlace. Usar **`as="a"` si el href se asignará por JavaScript**. Los botones nativos usan `disabled`, sin un `aria-disabled` redundante que pueda quedar obsoleto cuando un módulo los habilita. Los iconos necesitan `aria-label`.
- **Panel**: `as="section|article|div|aside"`, `class` y contenido. La separación se compone con utilidades; no crear paneles anidados.
- **Badge**: `tone="neutral|info|success|warning|error"`. Conserva compatibilidad con los estados `data-status` de ofertas y `data-state` de exámenes.
- **Switch**: checkbox nativo con `role="switch"`, `label`, `checked`, `disabled` y atributos del input. Si no se proporciona `label`, colocarlo dentro de una etiqueta existente con superficie táctil de al menos 44 px.
- **Alert**: `tone="info|success|warning|error"`, `title`, contenido y slot `action`. El error es `role="alert"`; el resto, `status`. Los avisos antiguos conservan sus nodos y usan la misma clase `ui-alert`.
- **Toast**: una instancia global desde BaseLayout. Llamar `showToast(detalle, tono, {title, action})`; la acción opcional tiene `label` y `run`. Máximo tres, mensajes anteriores compactos, éxito durante cinco segundos con barra, pausa en hover/foco y pestaña oculta; error/advertencia permanecen hasta cerrar. Se vacían al terminar la sesión. El área ocupa espacio después de la cabecera, sin superponer controles, y se lleva a la vista cuando estaba fuera de ella. Los mensajes se insertan como texto.
- **Skeleton**: `lines`, `heights`, `label`, `announce`. Usar `announce={false}` dentro de un contenedor que ya anuncia la carga.
- **EmptyState**: `title`, `description`, `align="center|start"`, slots `icon`, `title`, `description` y acción por defecto. Conserva los hooks existentes al migrar listas.
- **Menu**: `id`, `label` y opciones con `role="menuitem"`. Flechas, Inicio/Fin, Escape, Tab, cierre exterior y retorno del foco; omite opciones deshabilitadas.

Los avisos de publicación/cierre/eliminación de ofertas y publicación de pruebas usan Toast. El registro muestra éxito con Toast y errores en Alert. El inicio de sesión no genera Toast; conserva su señal multimodal. El guardado de borradores mantiene feedback en línea.

## Migración

`q-primary`, `q-secondary`, `q-card`, `q-notice`, `q-button-loading`, `q-job-badge`, `ex-panel`, `ex-button`, `ex-state` y `ex-icon` se sustituyeron por componentes Astro o las mismas clases compartidas `ui-*` en contenido creado mediante JavaScript. No hay una segunda hoja de estilos para los nodos dinámicos.

Se conservan `q-input`, `q-nav`, `q-link`, controles específicos de accesibilidad/voz y clases `ex-*` de preguntas, temporizador y distribución: sus funciones no corresponden a los nueve componentes extraídos. Los menús existentes de Flowbite conservan su comportamiento y consumen la superficie compartida donde se migraron.

## Galería y comprobación

`/dev/componentes` muestra variantes y estados, ambos temas y controles interactivos. La ruta dinámica solo devuelve un path durante desarrollo; la compilación estática no publica esta página ni añade un enlace de navegación.

Desde `Frontend/`, con Astro activo:

```powershell
npm run check
npm run build
node tests/componentes.browser.mjs http://127.0.0.1:4322
node tests/ui-ofertas.browser.mjs http://127.0.0.1:4322
```

El puerto es un argumento; ajustar al servidor disponible. Las capturas se guardan en `.impeccable/review/componentes-*.png` (1440 y 390 px, claro/oscuro). Las pruebas usan datos sintéticos; no crean postulaciones ni ofertas reales.
