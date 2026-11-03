# 07 · Frontend Astro + Tailwind + Flowbite

**Referente:** Figma `QORI · Fundamentos` (nodo `7116:2`) y `QORI · Prototipo navegable · v2` (`11106:2`), archivo `eoMSNdb9Cl0OmQU6BqKuZD`; 22 vistas principales con 5 estados cada una. La biblioteca Flowbite existe en el archivo. No supone que el prototipo sea una aplicación real ni que los vínculos actuales sean autorizaciones.

## Estructura frontend propuesta

```text
frontend/src/
  pages/               # Astro pages por rol (no recursos de otros propietarios)
  layouts/             # AuthLayout, RecruiterLayout, CandidateLayout
  components/
    ui/                # Flowbite adaptado/tokens: Button, Input, Modal, Table, Badge…
    domain/            # JobCard, CVReview, ExamTimer, EvaluationEvidence…
    states/            # Ideal/Empty/Partial/Loading/Error por región
  lib/api/             # cliente tipado, errores, serialización, sin datos mock en producción
  lib/auth/            # sesión/guards de UX (backend sigue siendo autoridad)
  styles/              # Tailwind + tokens Qori
```

## Reglas visuales verificadas/comprometidas

- Inter para escala Display 36/44; H1 30/38; H2 24/32; H3 20/28; Body 16/24. Sky como primario; semánticos independientes Success/Warning/Danger/Info; Light/Dark; espaciado base 4 px.
- Desktop base 1440×900 viewport; sidebar ~256 px; contenido fluido, scroll vertical. Mobile mínimo 360 px; evitar scroll horizontal global (tabla puede desplazarse dentro de su contenedor).
- Contraste de texto mínimo 4.5:1 para usos pertinentes; información no solo por color; foco visible, teclado, controles táctiles ≥44×44 y separación prevista.
- Reutilizar Flowbite, no duplicar sin vínculo; `Estados de UI` no aparece en menú: son variantes/regiones de páginas reales.

## Estados operativos vs negocio

| Operativo UI | Qué se renderiza | Ejemplo en oferta/candidato | Restricción |
|---|---|---|---|
| Ideal | datos completos y acciones permitidas | tabla con paginación y filtros | no implica estado laboral positivo |
| Vacío | sin datos y acción contextual | candidato sin ofertas: ajustar búsqueda | **nunca** “Crear oferta” para candidato |
| Parcial | conservar datos válidos y señalar pendientes | resultado examen disponible, IA en progreso | no inventar score |
| Carga | skeleton estructural similar al contenido final | tabla/ CV/ examen con estructura real | no reemplazar con spinner global |
| Error | descripción contextual + recuperación | falla parser, timeout IA, red | preservar datos útiles cuando proceda |

**No confundir con:** oferta BORRADOR/PUBLICADA/CERRADA/PENDIENTE_MODERACIÓN; postulación EN_REVISIÓN/PRESELECCIONADA/AVANZA/NO_AVANZA; intento EN_PROGRESO/TERMINADO/EXPIRADO; evaluación IA PENDING/READY/NEEDS_REVIEW/FAILED.

## Interactividad y prioridad

- Páginas personalizadas: Astro on-demand SSR; HTML inicial con estados apropiados. Carga de formularios o consultas no debe comprometer identidad.
- Piezas reactivas: usar JavaScript/TypeScript cliente cuando sea suficiente; evaluar islas con framework solo si mejora claramente mantenibilidad. Los `client:*` de Astro son selectivos.
- Temporizador: componente visual, sincronizado al cargar/reanudar desde `server_now_utc` y `deadline_at_utc`; nunca fuente de verdad para guardar respuestas.
- Evaluación IA: mostrar nota objetiva y estado parcial mientras worker procesa; al terminar mostrar score validado/evidencias o mensaje específico de revisión sin score.

## Deuda de diseño detectada en F1

La auditoría previa identificó **20 enlaces candidato→reclutador** en vistas Vacío/Error. Debe corregirse en Figma antes de afirmar que la navegación final es coherente, sin tocar automáticamente el archivo. Se localizaron estilos Qori heredados Noto Sans mientras fundamentos/frames principales usan Inter: auditar antes de uniformizar.

**Aceptación:** revisión visual Figma→Astro por pantalla/estado, teclado, tamaños 360/390/768/1280/1440/1920 y pruebas de acceso negativas independientes de ocultar botones.
