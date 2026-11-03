# Plan de transición a Fase 4 (sin implementación)

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

Esta fase 3 NO aprueba todavía interfaces REST ni modelos físicos. Fase 4 será planificación técnica de Astro/Express/MySQL, una vez resueltas decisiones de negocio relevantes.

## Secuencia recomendada

1. Aprobar Constitución SDD de Fase 2 (`docs/constitution-borrador.md` de v0.2) o registrar divergencias; no darla por aprobada por silencio.
2. Resolver D-02, D-03, D-04: moderación y cuota/registros. Definir caso de uso de la autoridad de moderación sin agregar roles no autorizados.
3. Resolver D-05/D-07/D-09: límites de archivo, multiplicidad de postulaciones/intentos, concurrencia de guardado de respuestas.
4. Resolver D-06/D-10: permisos de supervisor y máquina de estados de las postulaciones.
5. Resolver D-01 para RSF23/24: algoritmo verificable y evaluación de sesgos, rol de IA, pesos, niveles y versión; si no se resuelve, mantener M06/M07 parcialmente bloqueados sin falsear resultados.
6. Elaborar arquitectura lógica `frontend/` Astro + Flowbite/Tailwind; `backend/` Express por dominio; MySQL con entidades de usuarios, propietarios, ofertas, postulaciones, CV, exámenes, intentos, respuestas, resultados y auditoría.
7. Modelar ER con propiedad por creador y restricciones de integridad; definir almacenamiento y protección de PDF.
8. Proponer contratos API por operación, errores de autorización y estados de negocio; revisar con `spec.md` y escenarios de aceptación.
9. Descomponer en `plan.md`/`tasks.md` por módulo, añadir pruebas y definición de terminado.
10. Solo después iniciar implementación en frontend/backend.

## Riesgos que no debemos resolver sin aprobación

- No introducir sistema de recomendación/contratación automática, nuevos roles o compatibilidad inventada.
- No elegir proveedores SMS/WhatsApp o sistemas de correo por suposiciones de costos.
- No convertir enlaces Figma de pruebas en lógica de permisos real.
- No prometer offline sin pérdida cuando existe vencimiento estricto.
