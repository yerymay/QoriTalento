# Qori Talento — Progreso por etapas

**Estado inicial del paquete:** infraestructura de ejemplo creada en archivos, pero no instalada ni probada contra tu MySQL local. Ningún requisito RSF/RSNF/UI marcado completo sin pruebas.

## Etapa 0 — Preparar y conectar

- [ ] Respaldar el repositorio; no sobrescribir `Backend/`, `Frontend/` ni documentación existente.
- [ ] Ejecutar `database/01_schema.sql` en MySQL 8/MariaDB 10.6+ y comprobar 24 tablas.
- [ ] Instalar dependencias en `Backend/` y `Frontend/`.
- [ ] Iniciar Express; probar `/health` y `/api-docs`.
- [ ] Iniciar Astro; visualizar conexión API.
- [ ] Probar `/api/v1/system/db-check` con base de datos disponible.
- [ ] Ejecutar `npm run check`/`npm run build` y pruebas disponibles.
- [ ] Registrar la evidencia y recién entonces marcar esta etapa.

## Implementación funcional por módulos

- [ ] M01: usuarios, registro, inicio/cierre, perfiles y permisos.
- [ ] M02: ofertas, requisitos, edición y publicación conforme a reglas aprobadas.
- [ ] M03: postular a ofertas y adjuntar CV PDF.
- [ ] M04: extraer PDF con texto, revisar y confirmar perfil.
- [ ] M05: exámenes con guardado por pregunta y plazo autoritativo.
- [ ] M06: calificación objetiva y evaluación asistida con Ollama (rúbrica pendiente).
- [ ] M07: resultados y decisión humana.
- [ ] M08: consulta, actualización y seguimiento de estados.
- [ ] Validación IHC: tareas con usuarios, heurísticas, responsive, accesibilidad, recuperación y cinco estados UI.

## Registro de evidencia (copiar por tarea)

```text
Fecha:
ID de requisito/tarea:
Funcionalidad:
Archivos principales:
Pruebas ejecutadas (comandos):
Resultado real:
Captura/enlace local:
Problemas abiertos:
Estado: [ ] Pendiente / [ ] En curso / [ ] Bloqueado / [ ] Hecho
```

**Regla:** terminar un endpoint requiere implementación (4 capas), contrato OpenAPI, prueba de integración/caso negativo y pantalla cuando corresponda. Una ruta Swagger sin código no está implementada.
