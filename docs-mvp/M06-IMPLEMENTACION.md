# M06 — Calificación y evaluación asistida

Implementación del alcance solicitado el 2026-11-22. Se accede desde **Mis ofertas → Postulantes → Evaluar perfil**. La interfaz conserva el acceso al perfil confirmado y al PDF de M04.

## Comportamiento implementado

- La calificación objetiva se obtiene de las respuestas persistidas de M05 y la clave del examen publicado. Todas las preguntas tienen el mismo peso; las omitidas o inválidas aportan cero. Solo se califican intentos enviados o vencidos; nunca intentos abiertos. Se comprueba que la respuesta pertenezca a la pregunta y que haya sido aceptada desde el inicio, antes del plazo y no después del envío.
- La lectura de M06 calcula automáticamente la nota objetiva. Preparar la evaluación, solicitar asistencia o guardar una revisión persiste esa nota en `exam_grades`, idempotente por intento y versión `m06-equal-questions-v1`. M06 no altera respuestas ni plazos de M05.
- Se compara el perfil **confirmado asociado a la postulación**, no una extracción pendiente ni el último perfil de otra oferta. Los criterios incluyen `job_requirements` y, cuando existen, los campos de experiencia y formación exigidas.
- Las fuentes profesionales permitidas son resumen, formación, experiencia, habilidades e idiomas. No se envían al modelo los campos de nombre, correo, teléfono, ubicación ni DNI; el nombre confirmado sí identifica el expediente en la interfaz autorizada. El texto libre puede contener datos personales, por lo que el prompt prohíbe usarlos para evaluar y la revisión humana sigue siendo indispensable.
- Ollama propone por requisito `MEETS`, `PARTIAL`, `DOES_NOT_MEET` o `INSUFFICIENT_EVIDENCE`, referencias exactas a las fuentes y explicación. Referencias ajenas o inexistentes, criterios omitidos/duplicados y valoraciones sin evidencia se rechazan. Comprobar que una referencia existe no demuestra que la interpretación del modelo sea correcta.
- Cada sugerencia se distingue de la valoración humana. «Usar como borrador de revisión» rellena campos; guardar requiere la confirmación explícita en la UI. El servidor conserva la valoración, explicación, referencias, autor y fecha en un historial de revisiones.
- Con un examen **publicado**, el perfil suma hasta 60 y el examen hasta 40; sin examen publicado, el perfil suma hasta 100. Los borradores no cuentan como examen administrado. Las modalidades se identifican por separado.
- Pesos iguales por defecto, repartidos en centésimas para sumar exactamente 60/100. El reclutador puede ajustar los pesos **de esta evaluación**: no negativos, máximo dos decimales y suma exacta. No se crea una rúbrica global ni un ranking entre postulantes.
- Cumple aporta 100 % del peso, parcial 50 % y no cumple 0 %. Toda valoración distinta de «sin evidencia suficiente» exige referencias y explicación. Se redondea a dos decimales solo al presentar los puntos, no cada contribución.
- El total permanece nulo si falta cualquier revisión/evidencia, incluso con peso cero, si el examen no finalizó, si hay varios exámenes/intentos sin una regla de combinación o si cambian las fuentes.
- Las preguntas filtro no se incluyen en la entrada del modelo ni en la fórmula; no suman ni descartan. Este módulo no crea una API nueva para preguntas filtro.
- No se generan niveles Alta/Media/Baja, rankings, decisiones de contratación ni cambios de estado de la postulación.

## Seguridad, capas y concurrencia

`controllers → services → repositories → persistence`, con composición en `server.ts` y rutas montadas únicamente en `app.ts`. El servicio depende de interfaces; MySQL y Ollama se inyectan mediante adaptadores.

Las cuatro operaciones exigen sesión activa, rol RECRUITER y propiedad individual de la oferta. No se acepta `user_id`, estado, nota del examen ni puntaje final del cliente. Mutaciones con JSON y `X-Qori-Client: web`; se rechazan solicitudes de origen cruzado. Respuestas privadas con `Cache-Control: no-store`; errores estándar con `X-Request-ID`, sin detalles de MySQL o del modelo.

La preparación es idempotente y las revisiones usan control optimista de versión bajo bloqueo de postulación/oferta. Se conserva el historial en `m06_evaluation_revisions`. Ollama se ejecuta fuera de la transacción; antes de persistir se vuelven a comprobar propiedad, revisión y huella de fuentes. Una respuesta tardía no sobrescribe una revisión concurrente. Una nueva asistencia tampoco sustituye la valoración humana ya guardada.

La huella incluye versión confirmada, fuentes profesionales, requisitos y exámenes publicados. Si cambian, la evaluación anterior queda visible como histórica y se bloquean nuevas mutaciones sobre ella. **B-07 sigue pendiente:** no se inventa una política de reevaluación.

## API implementada

Contrato único: `Backend/openapi-implemented.yaml`, versión 0.6.0. Base:

`/api/v1/recruiter/applications/{applicationId}/evaluation`

- `GET`: fuentes de la evaluación guardada, calificaciones objetivas, desglose, total indicativo o motivos pendientes.
- `POST` con `{}`: preparar la evaluación y persistir las notas objetivas disponibles.
- `POST /assist` con `{ "revision": 1 }`: solicitar sugerencias locales y registrar otra revisión.
- `PUT /review`: guardar la revisión humana de todos los criterios y sus pesos, junto con la revisión esperada.

Los conflictos de revisión o fuentes devuelven 409; la IA no disponible, 503; respuesta estructuralmente inválida, 502; entrada demasiado extensa, 422; capacidad ocupada, 429. Los fallos conservan la revisión anterior y permiten continuar manualmente.

## Preparación local

1. Aplicar `database/07_m06_evaluacion.sql` después del esquema y migraciones anteriores, con una cuenta administradora de migraciones. Es aditiva e idempotente: solo crea la tabla de historial. La cuenta de aplicación conserva sus permisos DML mínimos. En la base local verificada esta tabla ya existía con el esquema esperado.
2. Iniciar Ollama local y disponer de `qwen2.5:7b-instruct` (`ollama pull qwen2.5:7b-instruct` si no está descargado). El backend llama exclusivamente a `http://127.0.0.1:11434/api/chat`, sin redirecciones.
3. Iniciar Backend y Frontend con sus comandos habituales. Para una instalación estática se debe configurar el proxy de API de producción; el proxy Astro es solo de desarrollo.

El adaptador usa salida JSON estructurada, temperatura cero, contexto de 16384 tokens y límite de 6000 tokens de salida. Rechaza entradas superiores a 24000 bytes sin truncarlas; limita la respuesta a 128000 bytes, espera hasta 120 segundos y admite dos llamadas simultáneas por instancia. El cliente espera hasta 130 segundos solo para esta operación. No descarga ni instala el modelo automáticamente.

Referencia del protocolo: [salidas estructuradas de Ollama](https://ollama.com/blog/structured-outputs).

## Verificación reproducible

Desde `Backend/`:

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
$env:TEST_MYSQL='1'
npx.cmd vitest run tests/evaluacion.mysql.test.ts
Remove-Item Env:TEST_MYSQL
npx.cmd tsc --noEmit --target ES2022 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck --strict --noUncheckedIndexedAccess tests/evaluacion.test.ts tests/evaluacion.fake.ts tests/evaluacion.mysql.test.ts
```

Desde `Frontend/`:

```powershell
npm.cmd run check
npm.cmd run build
node tests/evaluacion.browser.mjs http://127.0.0.1:4321
```

La prueba de MySQL crea usuarios/oferta/postulación/perfil/examen sintéticos y elimina solo esos registros. La prueba de navegador simula la API, no evalúa personas reales.

## Límites pendientes

Ollama no estuvo disponible durante esta implementación: el adaptador se verificó con respuestas controladas, errores y datos sintéticos. No se ha medido precisión, latencia real ni sesgo del modelo. La validación de casos por un reclutador y los umbrales de B-06 siguen pendientes; tampoco se implementó la combinación de varios exámenes o la reevaluación de B-07. Los resultados son indicativos y no acreditan una rúbrica validada para uso real.

RSF22 está verificado. RSF23/RSF24 permanecen parciales por la validación pendiente, y RSF25/rankings no se implementa. La revisión de interfaz no sustituye una evaluación IHC con usuarios ni una auditoría integral de accesibilidad.
