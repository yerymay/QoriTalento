# Primera iteración recomendada — sin fechas ficticias

## Objetivo

Pasar de artefactos SDD a un repositorio que pueda ejecutar pruebas automáticas, sin anticipar reglas de negocio no aprobadas. **La iteración inicial se considera terminada cuando hay evidencia técnica**, no por fecha ni por número de carpetas creadas.

### Trabajo de gobernanza (bloqueante)

- [ ] Resolver/registrar B-10 y ADR-001 a ADR-004, ADR-008 relevantes.
- [ ] Resolver B-03 y B-09 antes de registro/roles productivos.
- [ ] Marcar explícitamente como no disponibles los flujos M02/M05/M06/M07/M08 que dependen de bloques abiertos.

### Infraestructura mínima (M00)

- [ ] `M00-10`: estructura de frontend/backend y comandos de desarrollo documentados.
- [ ] `M00-11`: configuración por entorno, ejemplos sin secretos, exclusión `.env`.
- [ ] `M00-12`: elección de migraciones, esquema físico y test de rollback (no usar ER como SQL ejecutable).
- [ ] `M00-13`: validar OpenAPI previo a generar controladores.
- [ ] `M00-14`: proteger recursos por ID de dueño, roles y cuenta activa.
- [ ] `M00-15`: errores JSON uniformes, logging con redacción de PII.
- [ ] `M00-18` y `M00-19`: pruebas negativas y CI.
- [ ] `M00-20` y `M00-21`: tokens y componentes base Flowbite con cinco estados regionales.

### Criterios observables

- [ ] `GET /health` o equivalente creado tras ADR, medido sin revelar secretos.
- [ ] Migración y rollback repetibles en **base local de pruebas**.
- [ ] Prueba 403/404 para recurso ajeno antes de habilitar endpoints de candidatos.
- [ ] Plantilla de UI que siga diseño Figma, no placeholders visuales inventados.
- [ ] Registro de decisiones y cambios hecho en Git.

## Después de esta iteración

Avanzar hacia M01 según B-03/B-09. Las tareas restantes, incluidas las de IA, se ejecutan siguiendo `docs/implementation/fase5-secuencia.md` y sus puertas. No establecer umbrales ni ranking de selección sin aprobar B-06.
