# AGENTS.md — Qori Talento

## Objetivo
Implementar Qori Talento, un sistema ATS de reclutamiento, siguiendo las especificaciones SDD y los diseños aprobados.

## Tecnologías
- Frontend: Astro, Tailwind CSS y Flowbite.
- Backend: Node.js y Express.
- Base de datos: MySQL.
- IA local: Ollama con `qwen2.5:7b-instruct`.
- Extracción de CV: procesamiento clásico de PDF digital, sin IA ni OCR en el MVP.

## Fuentes de verdad
1. `docs/requirements/` — requisitos originales.
2. `docs/decisions/` — decisiones de negocio aprobadas.
3. `specs/<modulo>/spec.md` — comportamiento funcional.
4. `specs/<modulo>/plan.md` — diseño técnico.
5. `specs/<modulo>/tasks.md` — tareas de implementación.
6. `contratos/` — contratos API.
7. `diagramas/` — modelos arquitectónicos.

Antes de modificar código, revisar los archivos correspondientes y comprobar que no existan contradicciones.

## Reglas de implementación
- Implementar tareas pequeñas y verificables.
- No inventar funcionalidades, reglas de negocio ni endpoints.
- No cambiar decisiones aprobadas sin autorización.
- No modificar documentos SDD para justificar una implementación diferente.
- Si una tarea depende de una decisión pendiente, detener esa parte y reportar el bloqueo.
- Mantener separados `frontend/` y `backend/`.
- Utilizar componentes reutilizables y conservar la fidelidad visual al diseño Figma.
- Respetar Flowbite, la paleta Sky, la tipografía Inter y los temas claro/oscuro.
- No incluir la opción "Estados de UI" en el sidebar.
- Implementar los cinco estados operativos donde correspondan: ideal, vacío, parcial, carga y error.

## Seguridad
- Verificar roles y propiedad de recursos en el backend.
- Cada reclutador accede únicamente a sus propias ofertas y candidatos autorizados.
- No confiar en identificadores de usuario enviados por el frontend para determinar propiedad.
- Proteger CV, credenciales y datos personales.
- No subir secretos, archivos `.env` ni CV reales al repositorio.
- El servidor determina los tiempos y la validez de respuestas de examen.

## Inteligencia artificial
- Ollama se consulta desde el backend, nunca directamente desde el navegador.
- La IA genera evaluaciones orientativas con evidencias y explicaciones.
- No utilizar IA para decisiones automáticas de contratación o rechazo.
- No publicar puntajes reales sin una rúbrica validada.
- Guardar versión del modelo y datos de auditoría necesarios.

## Flujo de trabajo obligatorio
1. Leer la tarea y sus dependencias.
2. Revisar especificación, plan y contratos relevantes.
3. Explicar brevemente qué archivos se modificarán.
4. Implementar únicamente el alcance autorizado.
5. Ejecutar pruebas y verificaciones aplicables.
6. Mostrar archivos modificados y resultados.
7. Informar errores, riesgos y decisiones pendientes.
8. Esperar autorización antes de pasar al siguiente bloque.

## Criterios de terminado
Una tarea se considera completada únicamente si:
- Cumple sus criterios de aceptación.
- Respeta permisos y reglas de negocio.
- Tiene pruebas apropiadas que pasan.
- No introduce regresiones conocidas.
- Se documentan las limitaciones y verificaciones no ejecutadas.
