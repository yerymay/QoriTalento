# Qori Talento — Requerimientos consolidados del MVP académico

**Alcance:** ocho módulos, frontend Astro, API Express y MySQL/MariaDB.

**Convención:** `[ ]` pendiente, `[x]` implementado y comprobado. Marcar solo después de probar en el proyecto. El código `RSF`/`RSNF` procede del documento original de sistema; los códigos `UI-RF`/`UI-RNF` corresponden a `RF`/`RNF` del documento original de interfaz (se añade `UI-` solo para evitar confusión entre nomenclaturas). No se reescriben los originales.

**Fuentes:** `docs/requirements/sources/requerimientos-sistema-original.pdf` y `docs/requirements/sources/requisitos-ui-original.txt`, extraídos del paquete SDD v1.0; decisiones aprobadas `docs/decisions/decisiones-aprobadas.md`. **Estas listas mantienen el alcance documentado, no afirman que todo esté implementado.**

## A. Requerimientos funcionales del sistema (32)

### Módulo 01 — Usuarios y autenticación

- [x] **RSF01 — Registro de usuario con rol.** El sistema debe permitir crear una cuenta de usuario indicando el rol que tendrá: reclutador o postulante. El registro guarda los datos de acceso y el rol asociado, que después determinará qué funciones serán visibles para esa persona.
- [ ] **RSF02 — Inicio y cierre de sesión.** El sistema debe permitir a un usuario registrado iniciar sesión con sus credenciales y cerrar la sesión al terminar. Mientras la sesión está activa, el usuario opera dentro de las funciones que su rol le permite.
- [x] **RSF03 — Gestión de datos básicos del usuario.** El sistema debe permitir consultar y actualizar los datos básicos de un usuario registrado, como nombre, correo electrónico y datos de contacto.
- [ ] **RSF04 — Diferenciación de permisos por rol.** El sistema debe mostrar y habilitar únicamente las funciones correspondientes al rol del usuario que inició sesión. Un postulante no accede a la administración de ofertas y un reclutador no accede al formulario de postulación.

### Módulo 02 — Ofertas laborales

- [x] **RSF05 — Registro de oferta de empleo.** El sistema debe permitir al reclutador crear una oferta de empleo, generando un registro único que la identifica frente al resto de ofertas del sistema.
- [x] **RSF06 — Registro de datos y requisitos de la oferta.** El sistema debe permitir ingresar el cargo, la descripción, los requisitos, la experiencia y la formación exigidos, así como las demás condiciones de la oferta. Estos campos alimentan la comparación con el currículum del postulante.
- [ ] **RSF07 — Publicación, edición y cierre de la oferta.** El sistema debe permitir modificar una oferta en cualquier momento y cambiar su estado entre borrador, publicada y cerrada. Una oferta cerrada deja de recibir postulaciones.
- [x] **RSF08 — Visualización de ofertas disponibles.** El sistema debe mostrar al postulante el listado de ofertas que se encuentran publicadas, con la información principal de cada una para que pueda decidir a cuál postular.

### Módulo 03 — Postulaciones y archivos PDF

- [ ] **RSF09 — Registro de postulación a una oferta.** El sistema debe permitir al postulante seleccionar una oferta publicada y registrar su postulación a ella. Queda abierta una postulación en estado inicial, pendiente de currículum y de evaluación.
- [ ] **RSF10 — Carga del currículum en PDF.** El sistema debe permitir al postulante adjuntar su currículum en formato PDF como parte de su postulación. El archivo se almacena asociado al registro de postulación.
- [ ] **RSF11 — Asociación del CV con la oferta.** El sistema debe vincular el currículum cargado con la oferta específica a la que el postulante se postula, de modo que la información se interprete siempre en relación con los requisitos de esa vacante.
- [ ] **RSF12 — Consulta del estado de una postulación.** El sistema debe permitir al postulante consultar en qué situación se encuentra su postulación dentro del proceso de selección.

### Módulo 04 — Extracción, corrección y confirmación de CV

- [x] **RSF13 — Lectura automática del CV.** Al cargarse un PDF de CV válido, el sistema debe leer automáticamente su texto sin intervención manual. Solo se aceptan PDF digitales con texto; no se usa OCR ni IA generativa para extraerlo.
- [x] **RSF14 — Extracción asistida de datos del CV.** A partir del texto leído, el sistema debe proponer la mayor cantidad posible de datos verificables: nombre, correo, teléfono, ubicación, resumen profesional, formación académica, experiencia laboral, habilidades e idiomas. Debe usar reglas y patrones por sección para reducir errores. Cuando un valor no exista, sea ambiguo o no pueda extraerse con seguridad, debe indicarse como “No detectado” o pendiente de revisión; nunca debe inventarse un dato. **Verificación:** base funcional con PDF sintéticos; todavía no se ha medido precisión/cobertura sobre CV reales representativos.
- [x] **RSF15 — Autocompletado del perfil del postulante.** El sistema debe organizar los datos propuestos en los campos del perfil del postulante para evitar que tenga que transcribirlos manualmente. Los campos extraídos deben identificarse como tales y conservar su origen en el CV hasta que el usuario los confirme.
- [x] **RSF16 — Corrección y confirmación por el postulante.** El postulante propietario debe poder revisar, editar y confirmar todos los datos propuestos antes de que actualicen su perfil. Al confirmar, el perfil queda actualizado con los valores corregidos. Un reclutador autorizado únicamente puede consultar el PDF y los datos confirmados, además de registrar notas; no puede alterar los datos fuente.
- [x] **RSF16.1 — Nueva extracción al reemplazar el CV.** Si el postulante reemplaza su CV cuando el estado de la postulación lo permite, el sistema debe ejecutar una nueva extracción, conservar el perfil confirmado vigente y requerir una nueva revisión y confirmación antes de sustituirlo. La reevaluación posterior permanece pendiente de B-07.

### Módulo 05 — Exámenes

- [ ] **RSF17 — Creación de exámenes asociados a una oferta.** El sistema debe permitir al reclutador crear un examen y vincularlo a una oferta concreta, de modo que solo los postulantes de esa vacante lo realicen.
- [ ] **RSF18 — Registro de preguntas y alternativas.** El sistema debe permitir registrar el conjunto de preguntas del examen, cada una con sus alter- nativas de respuesta y con la alternativa correcta.
- [ ] **RSF19 — Definición del tiempo límite.** El sistema debe permitir asignar a cada examen un tiempo límite en minutos, dentro del cual el postulante debe completar la evaluación.
- [ ] **RSF20 — Desarrollo del examen por el postulante.** El sistema debe permitir al postulante responder el examen vinculado a la oferta, dentro del tiempo establecido. Las respuestas se registran a medida que se marcan.
- [ ] **RSF21 — Finalización automática por tiempo.** El sistema debe cerrar y enviar automáticamente la evaluación cuando se agota el tiempo límite, sin que el postulante tenga que confirmar el envío de forma manual y mostrar un aviso de que la evaluación fue enviada.

### Módulo 06 — Calificación y evaluación asistida

- [ ] **RSF22 — Calificación automática de respuestas.** El sistema debe comparar automáticamente las respuestas registradas por el postulante con las alternativas correctas de cada pregunta y obtener la calificación del examen.
- [ ] **RSF23 — Comparación del CV con los requisitos de la oferta.** El sistema debe confrontar la información extraída del currículum con los requisitos definidos en la oferta y determinar el nivel de compatibilidad del perfil con la oferta (Alta, Media o Baja). Esta comparación es la parte inteligente del sistema. **Condicionado B-06:** no exponer rankings/puntajes IA reales sin rúbrica validada.
- [ ] **RSF24 — Cálculo de la calificación o puntaje.** El sistema debe calcular un puntaje para cada postulante a partir de la calificación del examen y de la comparación entre su currículum y los requisitos de la oferta. El puntaje acompaña al postulante durante todo el proceso. **Condicionado B-06:** no exponer rankings/puntajes IA reales sin rúbrica validada.
- [ ] **RSF25 — Ordenamiento de postulantes por resultados.** El sistema debe permitir ordenar y filtrar la lista de postulantes de una oferta según su puntaje, para que el reclutador revise primero a los perfiles mejor evaluados. **Condicionado B-06:** no exponer rankings/puntajes IA reales sin rúbrica validada.

### Módulo 07 — Resultados y selección

- [ ] **RSF26 — Visualización de resultados por postulante.** El sistema debe mostrar al reclutador el resultado obtenido por cada postulante de la oferta, agrupados de manera que permita comparar a los evaluados.
- [ ] **RSF27 — Ficha de resultados del postulante.** El sistema debe presentar en una sola vista la información extraída del currículum, el resultado del examen y la calificación obtenida, de modo que el reclutador tenga el expediente completo del postulante.
- [ ] **RSF28 — Revisión y selección de postulantes.** El sistema debe permitir al reclutador revisar los postulantes de una oferta y decidir cuáles cumplen con el perfil requerido, siguiendo el orden de resultados como apoyo y no como decisión automática.
- [ ] **RSF29 — Registro del resultado final.** El sistema debe registrar la decisión final sobre cada postulante, dejando constancia de si avanza o no avanza en el proceso de selección.

### Módulo 08 — Seguimiento

- [ ] **RSF30 — Consulta de postulaciones por oferta.** El sistema debe mostrar al reclutador todas las postulaciones recibidas para una oferta determi- nada, con la información necesaria para gestionarlas en conjunto.
- [ ] **RSF31 — Actualización del estado de una postulación.** El sistema debe permitir al reclutador cambiar el estado de una postulación a medida que avan- za por las etapas del proceso de selección (En revisión, Preseleccionado, Avanza, No avanza), quedando el estado visible para el postulante.
- [ ] **RSF32 — Consulta del estado por el postulante.** El sistema debe permitir al postulante consultar en qué estado se encuentra su proceso de selec- ción, sin intervención del reclutador.

## B. Requerimientos no funcionales del sistema (18)

- [ ] **RSNF01 — Interfaz clara e intuitiva.** El sistema debe presentar una interfaz clara e intuitiva que permita a reclutadores y postulantes realizar sus actividades sin conocimientos técnicos avanzados.
- [ ] **RSNF02 — Mensajes claros de error.** El sistema debe mostrar mensajes claros cuando se produzcan errores al registrar información, cargar un CV o realizar un examen, indicando al usuario qué ocurrió y qué puede hacer al respecto.
- [ ] **RSNF03 — Tiempo razonable de procesamiento del CV.** El sistema debe procesar y mostrar la información de un CV cargado en un tiempo razonable, evitando esperas innecesarias para el usuario.
- [ ] **RSNF04 — Tiempo máximo de respuesta de 3 segundos.** El sistema debe responder a las operaciones habituales de navegación, registro y consulta de información en un tiempo máximo de 3 segundos, bajo condiciones normales de uso. Las pantallas de listado deben mostrar el esqueleto de carga en menos de 200 ms.
- [ ] **RSNF05 — Autenticación de acceso.** El sistema debe requerir autenticación para acceder a las funciones correspondientes a cada tipo de usuario. Ninguna función queda disponible sin una sesión iniciada.
- [ ] **RSNF06 — Restricción de acceso por rol.** El sistema debe restringir el acceso a las funciones y datos de acuerdo con el rol del usuario, de modo que ningún actor visualice ni modifique información que le corresponde a otro.
- [ ] **RSNF07 — Protección de currículums, resultados y calificaciones.** Los currículums, datos personales, resultados de exámenes y calificaciones deben mantenerse protegidos frente a accesos no autorizados, de modo que solo los usuarios legitimados puedan consultarlos.
- [x] **RSNF08 — Almacenamiento seguro de contraseñas.** Las contraseñas de los usuarios deben almacenarse de forma segura mediante mecanismos de cifrado o hash. Ninguna contraseña se guarda en texto legible.
- [ ] **RSNF09 — Disponibilidad durante el horario de uso.** El sistema debe encontrarse disponible durante el horario de utilización definido para el proceso de reclutamiento, permitiendo a los postulantes realizar sus postulaciones y evaluaciones.
- [ ] **RSNF10 — Navegadores web actuales.** El sistema debe funcionar correctamente en los principales navegadores web actuales, como Goo- gle Chrome, Microsoft Edge y Mozilla Firefox.
- [ ] **RSNF11 — Adaptabilidad a distintos tamaños de pantalla.** La interfaz debe adaptarse a diferentes tamaños de pantalla, permitiendo su utilización desde computadoras, laptops y dispositivos móviles.
- [ ] **RSNF12 — Integridad de la información registrada.** El sistema debe garantizar que la información registrada de los postulantes, ofertas, exámenes y resultados no sea modificada de manera accidental o no autorizada.
- [ ] **RSNF13 — Escalabilidad de la arquitectura.** La arquitectura del sistema debe permitir incorporar posteriormente nuevas funcionalidades, tipos de evaluación o métodos de análisis de candidatos sin modificar completamente el sistema.
- [ ] **RSNF14 — Organización modular del sistema.** El sistema debe estar organizado en módulos independientes que faciliten su mantenimiento, corrección de errores y actualización.
- [ ] **RSNF15 — Conservación de resultados y calificaciones.** El sistema debe conservar correctamente los resultados obtenidos en los exámenes y las califica- ciones de los postulantes una vez finalizada la evaluación.
- [ ] **RSNF16 — Validación del archivo de currículum.** El sistema debe validar que los archivos cargados como currículum correspondan al formato PDF y rechazar archivos que no cumplan con las condiciones establecidas.
- [ ] **RSNF17 — Funcionamiento continuo del temporizador.** Durante los exámenes, el temporizador debe funcionar de manera continua y finalizar automáti- camente la evaluación cuando se alcance el tiempo establecido.
- [ ] **RSNF18 — Privacidad de la información personal.** El sistema debe limitar el acceso a la información personal de los postulantes únicamente a los usuarios autorizados que participan en el proceso de selección.

## C. Requerimientos funcionales de interfaz (20)

- [ ] **UI-RF-01.** La interfaz debe presentar un formulario de inicio de sesión (correo y contraseña) y, tras autenticar, redirigir al usuario a su panel según su rol: el reclutador al panel de ofertas y el postulante al listado de ofertas disponibles, mostrando solo las opciones de menú de su rol. *(Origen: RSF02; prioridad original: Alta).*
- [ ] **UI-RF-02.** La interfaz debe ofrecer al reclutador un formulario para registrar una oferta (cargo, descripción, requisitos, experiencia y formación) con un selector de estado (Borrador, Publicada o Cerrada); el botón *Publicar* permanece deshabilitado hasta completar los campos obligatorios. *(Origen: RSF05, RSF06; prioridad original: Alta).*
- [ ] **UI-RF-03.** La interfaz debe mostrar al postulante las ofertas publicadas en tarjetas (cargo, resumen de requisitos y fecha), y presentar un botón *Postular* en cada una. *(Origen: RSF08; prioridad original: Media).*
- [ ] **UI-RF-04.** La interfaz debe presentar una zona de arrastrar y soltar para cargar el currículum, aceptar únicamente archivos PDF, mostrar una barra de progreso durante la carga con las opciones *Cancelar* y *Reintentar*, y rechazar de inmediato, con un mensaje, cualquier archivo que no sea PDF. *(Origen: RSF10; prioridad original: Alta).*
- [x] **UI-RF-05.** La interfaz debe mostrar al reclutador, en dos paneles lado a lado (en pestañas en pantallas estrechas), el PDF original del currículum y los datos extraídos por el sistema (datos personales, formación, experiencia y habilidades), permitiéndole identificar y corregir datos incorrectos. *(Origen: RSF16; prioridad original: Alta).* **Cambio aprobado DEC-07:** la edición del CV por el reclutador descrita en la fuente queda sustituida por corrección/confirmación del postulante; el reclutador revisa y agrega notas.
- [ ] **UI-RF-06.** La interfaz debe permitir al reclutador crear un examen vinculado a una oferta: agregar, editar y eliminar preguntas con sus alternativas, marcar la alternativa correcta y definir el tiempo límite en minutos. *(Origen: RSF17, RSF18, RSF19; prioridad original: Media).*
- [ ] **UI-RF-07.** La interfaz debe mostrar al postulante un temporizador regresivo siempre visible durante el examen, que cambie a color rojo cuando queden 60 segundos o menos y que, al llegar a cero, envíe el examen automáticamente y muestre un mensaje de confirmación. *(Origen: RSF21; prioridad original: Alta).* **DEC-05/06:** el frontend informa y solicita cierre, pero solo cuentan respuestas aceptadas por el servidor antes del límite.
- [ ] **UI-RF-08.** La interfaz debe mostrar al reclutador una tabla de postulantes por oferta (calificación del examen, compatibilidad CV–oferta y puntaje final) con ordenamiento por columna, filtro por nivel de compatibilidad e insignia de color con texto (Alta: verde, Media: amarillo, Baja: rojo). *(Origen: RSF25, RSF26, RSF30; prioridad original: Alta).* **Pendiente B-06:** no mostrar nivel, score o filtros IA como reales antes de aprobar rúbrica.
- [ ] **UI-RF-09.** La interfaz debe presentar, en una sola vista, la ficha del postulante con los datos extraídos del CV, el resultado del examen, la compatibilidad y el puntaje final, junto con los botones para preseleccionar o descartar. *(Origen: RSF27; prioridad original: Alta).*
- [ ] **UI-RF-10.** La interfaz debe permitir al reclutador cambiar el estado de una postulación mediante un selector (En revisión, Preseleccionado, Avanza, No avanza) y mostrar al postulante el estado actual en una línea de progreso con la etapa vigente resaltada. *(Origen: RSF12, RSF31, RSF32; prioridad original: Media).*
- [x] **UI-RF-11.** La interfaz debe presentar un formulario de registro de cuenta (nombre, correo y contraseña) con un selector de rol (Reclutador o Postulante) y un indicador de fortaleza de la contraseña; el botón *Registrar* permanece deshabilitado hasta completar los campos obligatorios. *(Origen: RSF01; prioridad original: Alta).*
- [ ] **UI-RF-12.** La interfaz debe ofrecer una pantalla de perfil con nombre, correo y datos de contacto editables; al pulsar *Guardar cambios* muestra la confirmación “Cambios guardados” y deja los campos en solo lectura. *(Origen: RSF03; prioridad original: Media).*
- [ ] **UI-RF-13.** La interfaz debe mostrar un menú lateral (en móvil, un menú desplegable) con únicamente las opciones del rol activo, resaltar la sección vigente y mantener visible la opción *Cerrar sesión*. *(Origen: RSF04; prioridad original: Alta).*
- [ ] **UI-RF-14.** La interfaz debe permitir al reclutador editar una oferta y cambiar su estado desde el listado mediante un menú de acciones; cada oferta muestra su código único y una insignia de estado, y una oferta cerrada deja de mostrar el botón *Postular* al postulante. *(Origen: RSF05, RSF07; prioridad original: Alta).*
- [ ] **UI-RF-15.** La interfaz debe abrir, al pulsar *Postular*, la pantalla de postulación con el resumen de la oferta; el botón *Enviar postulación* permanece deshabilitado mientras no exista un CV válido y, al pulsarlo, un modal solicita confirmación; al confirmar notifica “Postulación registrada” y la agrega a *Mis postulaciones*. *(Origen: RSF09, RSF11; prioridad original: Alta).*
- [x] **UI-RF-16.** La interfaz debe indicar con el mensaje animado “Leyendo currículum…” que el CV se está procesando y, al terminar, mostrar los datos extraídos por secciones; las secciones no detectadas muestran “No detectado” en lugar de ocultarse. *(Origen: RSF13, RSF14; prioridad original: Alta).*
- [x] **UI-RF-17.** La interfaz debe autocompletar el perfil del postulante con los datos extraídos del CV, marcar los campos autocompletados y permitir editarlos con el botón *Editar* antes de confirmar. *(Origen: RSF15; prioridad original: Media).*
- [ ] **UI-RF-18.** La interfaz debe mostrar el examen con el avance (por ejemplo, “7 de 20 respondidas”), resaltar la alternativa marcada, guardar cada respuesta al instante y mantener visible el botón *Enviar examen*, que pide confirmación antes de enviar. *(Origen: RSF20; prioridad original: Alta).*
- [ ] **UI-RF-19.** La interfaz debe mostrar la calificación del examen, la compatibilidad CV–oferta (porcentaje y nivel Alta, Media o Baja con color y texto) y el puntaje final, y actualizarlos automáticamente tras calificar el examen. *(Origen: RSF22, RSF23, RSF24; prioridad original: Alta).* **Pendiente B-06:** no mostrar nivel, score o filtros IA como reales antes de aprobar rúbrica.
- [ ] **UI-RF-20.** La interfaz debe pedir confirmación en un modal cuando el reclutador registra una decisión (Avanza o No avanza), cambiar el color de la fila según la decisión, mostrar el resultado final con su fecha y deshabilitar el botón tras confirmar. *(Origen: RSF28, RSF29; prioridad original: Alta).*

## D. Requerimientos no funcionales de interfaz (15)

- [ ] **UI-RNF-01 — Rendimiento.** Las pantallas de listado deben mostrar la vista esqueleto (*skeleton loading*) en menos de 200 ms y completar la carga de datos en un máximo de 3 s bajo condiciones normales de uso. *(Origen: RSNF03, RSNF04).*
- [ ] **UI-RNF-02 — Accesibilidad.** Todo texto debe tener un contraste mínimo de 4.5:1 respecto de su fondo (WCAG 2.1 AA) y ninguna información debe transmitirse únicamente mediante color. *(Origen: RSNF01).*
- [ ] **UI-RNF-03 — Responsividad.** La interfaz debe ser utilizable desde pantallas de 360 px de ancho hasta escritorio, sin desplazamiento horizontal de la página. *(Origen: RSNF11).*
- [ ] **UI-RNF-04 — Fiabilidad.** El temporizador del examen debe actualizarse cada segundo, mantener una desviación máxima de ±1 s respecto del reloj del servidor aunque la pestaña pierda el foco o se recargue, y completar el envío automático en un máximo de 3 s. *(Origen: RSNF17).*
- [ ] **UI-RNF-05 — Usabilidad.** Los mensajes de error deben aparecer en menos de 1 s junto al campo afectado, en lenguaje claro, con ícono y texto, sin borrar los datos ya ingresados. *(Origen: RSNF02).*
- [ ] **UI-RNF-06 — Consistencia visual.** Todos los componentes deben provenir del sistema de diseño Flowbite (Tailwind CSS) con una única paleta, tipografía y escala de espaciado definidas como tokens; no se admiten estilos de componente aislados. *(Origen: RSNF01, RSNF14).*
- [ ] **UI-RNF-07 — Estados de la UI.** Cada pantalla que muestra datos debe contemplar los cinco estados operativos (ideal, vacío, carga con *skeleton*, error y parcial o borde), cada uno con un mensaje claro y una acción de salida. *(Origen: RSNF01, RSNF02).*
- [ ] **UI-RNF-08 — Retroalimentación.** Toda acción del usuario debe producir una respuesta visual en menos de 100 ms (estado presionado o indicador de espera) y una notificación (*toast*) en menos de 1 s tras finalizar la operación. *(Origen: RSNF04).*
- [ ] **UI-RNF-09 — Conectividad.** Ante la pérdida de conexión, la interfaz debe mostrar un aviso persistente, conservar localmente los datos ingresados y las respuestas del examen, y reintentar el envío automáticamente al recuperar la conexión, sin pérdida de datos. *(Origen: RSNF09, RSNF15).* **DEC-05:** nunca reintentar una respuesta de examen después del límite como si estuviera aceptada.
- [ ] **UI-RNF-10 — Accesibilidad táctil.** Los botones y controles interactivos deben medir al menos 44×44 px y mantener una separación mínima de 8 px entre sí. *(Origen: RSNF11).*
- [ ] **UI-RNF-11 — Navegación por teclado.** Toda funcionalidad debe poder operarse con teclado, con orden de tabulación lógico, foco visible y etiquetas accesibles en los controles que solo tienen ícono (WCAG 2.1.1 y 2.4.7). *(Origen: RSNF01).*
- [ ] **UI-RNF-12 — Compatibilidad.** La interfaz debe verse y funcionar igual en las dos últimas versiones estables de Google Chrome, Microsoft Edge y Mozilla Firefox. *(Origen: RSNF10).*
- [ ] **UI-RNF-13 — Legibilidad.** El texto base debe ser de 16 px como mínimo con interlineado de 1.5, y la interfaz debe ofrecer tema claro y oscuro, respetando por defecto la preferencia del sistema y manteniendo el contraste 4.5:1 en ambos temas. *(Origen: RSNF01, RSNF11).*
- [ ] **UI-RNF-14 — Prevención de errores.** Las acciones irreversibles o de alto impacto (enviar el examen manualmente, registrar la decisión final, cerrar una oferta) deben pedir confirmación explícita en un modal que describa la consecuencia, y los formularios deben validar en línea antes del envío. *(Origen: RSNF02, RSNF12).*
- [ ] **UI-RNF-15 — Privacidad y sesión.** La interfaz debe enmascarar la contraseña (con opción de mostrarla), avisar con un modal al menos 60 s antes de que expire la sesión por inactividad sin interrumpir un examen en curso, y no mostrar datos personales de un postulante a usuarios sin rol autorizado. *(Origen: RSNF05, RSNF07, RSNF18).* Política exacta de duración de sesión pendiente de aprobación.

## E. Evidencia mínima al marcar una casilla

Anotar en `docs-mvp/PROGRESO.md`: ID, archivos, comando de prueba, resultado, fecha y captura cuando corresponda. Un frontend estático **no** completa un requisito que exige persistencia/seguridad. Un mock **no** demuestra autorización real.

## F. Condiciones no cerradas

B-01 a B-10 siguen pendientes según el SDD v1.0, salvo que el propietario registre una aprobación posterior en `REGLAS-NEGOCIO.md`. Una funcionalidad puede prepararse sin activar comportamientos sujetos a esas decisiones.


## Propuesta complementaria: retroalimentación multimodal

- [ ] Evaluar la aplicación de respuesta visual, sonido y vibración en acciones importantes, según cada caso y con controles accesibles; ver [guía multimodal](RETROALIMENTACION-VIBRACION.md). Existe un componente reutilizable integrado para prueba en el perfil; no modifica los requisitos originales.
