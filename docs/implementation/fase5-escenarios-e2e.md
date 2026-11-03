# Fase 5 — Plan E2E / pruebas de aceptación

**Estado:** casos de prueba por ejecutar; datos siempre sintéticos.

## Camino candidato (V00-04)

1. Registro candidato y login (M01): separar cuenta/rol. **Negativo:** sesión inválida o rol alterado.
2. Explorar ofertas publicadas (M02): catálogo y detalle sin borrador ni primera oferta sin moderación. **Negativo:** URL de oferta no visible.
3. Crear borrador postulación y subir PDF digital (M03): ligar CV y postulación propia. **Negativo:** archivo no PDF, oferta cerrada durante el envío.
4. Extraer texto y confirmar perfil (M04): campos no detectados quedan vacíos editables, evidencia intacta. **Negativo:** PDF escaneado sin texto, parser fallido.
5. Confirmar envío (M03): versión confirmada y postulación durable. **Negativo:** doble clic/reintento y carrera con cierre de oferta.
6. Realizar examen (M05): fecha límite oficial, guardado por pregunta, reload, pendiente de sincronización. **Negativo:** respuesta recibida tarde, cambio reloj, revisiones fuera de orden.
7. Consultar seguimiento (M08): propio y último estado confirmado. **Negativo:** postulación ajena y avances inexistentes.

## Camino reclutador (V00-05)

1. Registro empresa/particular y verificación (M01). **Negativo:** dominio público empresa, particular sin teléfono verificado.
2. Crear/editar/publicar/cerrar ofertas (M02). **Negativo:** cuota particular, primera moderación, concurrencia.
3. Consultar CV de sus postulantes y añadir notas (M04). **Negativo:** modificación del perfil candidato y oferta de compañero.
4. Configurar examen de oferta propia (M05). **Negativo:** acceso a claves desde cliente candidato.
5. Ver nota objetiva e invocar IA únicamente tras aprobación de B-06 (M06). **Negativo:** JSON incorrecto, alucinación, timeout, sesgo/falta de evidencia.
6. Consultar ficha (M07), decidir explícitamente (si B-08 aprobado), auditar actor. **Negativo:** IA no puede decidir y no hay acceso cruzado.
7. Ver pipeline/estado (M08) y verificar correlación con lo que ve el candidato.

## UI/región (V00-01 a V00-03)

- Para cada pantalla y región pertinente, Ideal, Vacío, Parcial, Carga y Error; evitar vacío artificial de formulario.
- Flowbite reutilizable, Sky/Inter, light/dark, teclado, 360/390/768/1280/1440/1920, sin item de menú «Estados de UI».
- Revisión de 20 enlaces defectuosos hallados en Figma F1 antes de afirmar que el prototipo refleja flujos correctos.

## Plantilla de evidencia

| Campo | Descripción |
|---|---|
| test_id | Caso fuente Gherkin U/O/P/C/E/V/R/S o T-01..16 |
| task_id | M00/M01..M08/V00 |
| commit | Hash real de implementación |
| entorno | DB, build, navegador, configuración y modelo IA (si aplica) |
| resultado | pasa/falla/bloqueada, con motivo verificable |
| evidencia | reporte y log depurado, sin PII ni credenciales |
