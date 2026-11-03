# Constitución SDD — Qori Talento

**Borrador v0.1. NO APROBADO como línea base completa.** Este documento es el comienzo de la Fase 2; fija principios respaldados por requisitos y decisiones ya expresas, y no cierra aspectos técnicos aún pendientes.

## A. Principios innegociables

1. **Especificación antes de implementación.** Cada funcionalidad debe tener alcance, actores, estados de negocio, errores, permisos, criterios de aceptación y trazabilidad a requisitos originales.
2. **Permisos en backend.** Las pantallas Astro no son barrera de seguridad. Express comprueba identidad, rol, estado activo y propiedad por creador en todas las operaciones de oferta y candidatos.
3. **Propiedad individual.** Incluso miembros de una misma empresa solo acceden a ofertas y postulantes de las ofertas que cada uno creó; compartir recursos exige nuevo requisito aprobado.
4. **Protección del postulante.** CV y datos personales deben tratarse de forma limitada y protegida. El postulante confirma sus datos extraídos; el reclutador no reescribe el perfil ni el PDF originales.
5. **Extracción transparente.** MVP de PDF con texto embebido mediante extracción clásica/reglas; toda ausencia se indica sin inventar datos. IA/OCR requieren nueva aprobación si se incorporan.
6. **Evaluación responsable.** El algoritmo de compatibilidad/ponderaciones RSF23–RSF24 sigue pendiente. No inventar pesos, umbrales ni descartes automáticos de postulantes.
7. **Examen con reloj autoritativo.** El servidor fija inicio y límite; solamente respuestas recibidas y aceptadas antes del vencimiento cuentan. El frontend no puede extender tiempo ni equiparar guardado local con confirmación.
8. **Consistencia e integridad.** Cuota de dos ofertas activas para particulares, primera oferta moderada, y guardado/cierre de exámenes requieren operaciones seguras frente a concurrencia.
9. **Sistema visual trazable.** Reutilizar Flowbite y tokens Qori (Sky, Inter, temas claro/oscuro), y aplicar estados Ideal/Vacío/Parcial/Carga/Error por región cuando proceda; «Estados de UI» no es una opción del sidebar.
10. **No ampliar alcance silenciosamente.** Registro con correo/SMS y moderación se reconocen como cambios posteriores al documento fuente; nuevas entidades y APIs se justifican contra estos requisitos.
11. **Verificación antes de completar tareas.** Una tarea solo está finalizada si las pruebas de permisos, reglas, estados y casos negativos relevantes pueden ejecutarse y aprobarse.
12. **Separar diseño, código y evidencia.** El prototipo Figma no constituye prueba de backend; un test funcional no sustituye auditoría visual/accesibilidad.

## B. Reglas del repositorio futuro (propuesta)

- `/frontend` Astro + Tailwind + Flowbite; sin elección anticipada de islas adicionales.
- `/backend` Node.js + Express con separación de controlador, dominio/servicio, autorización y persistencia; sin fijar ORM aún.
- Base de datos MySQL, modelo físico pendiente de análisis detallado.
- `/docs` y `/specs` contienen la fuente de especificación y contratos de prueba; se mantienen versionados junto al código cuando exista repositorio.

## C. Criterios mínimos de salida por función

- Trazabilidad a al menos un requisito RSF/RNF o justificación formal de ADD.
- Caso normal, errores, permisos negativos y condición de concurrencia cuando corresponda.
- Estados operativos UI pertinentes y salidas de recuperación.
- Contratos de entrada/salida definidos en etapa de planificación API.
- Evidencia de que no se accede a recursos de reclutadores ajenos.
- Pruebas del servidor para límites de tiempo, integridad y privacidad donde apliquen.

## D. Bloqueos de aprobación

1. RSF23/24: método de compatibilidad y puntuación.
2. Moderador/flujo de aprobación de primera oferta particular.
3. Definición contable exacta de «oferta activa» para aplicar cuota de dos.
4. Proveedor/validez de correo y SMS, tratamiento de abuso y costos.
5. Régimen para revisión posterior de datos ya evaluados y política de retención.

**Estado:** puede servir de guía de planificación desde ya. Requiere revisión y aprobación antes de convertirse en constitución definitiva.
