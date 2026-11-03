# Matriz de autorización y separación de estados — Fase 3

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

La tabla define permisos **funcionales previstos**, no roles adicionales ya aprobados. Todo se hace cumplir en backend, no en menús Astro.

| Operación | Postulante propio | Reclutador dueño de oferta | Otro reclutador de la misma empresa | No autenticado |
|---|---|---|---|---|
| Ver ofertas publicadas | Sí | Sí | Sí (información pública) | Según política de consulta pública (pendiente) |
| Crear/editar/cerrar oferta | No | Sí, sujeto a cuenta activa, cuota/moderación | No | No |
| Ver candidatos de una oferta | Solo sus postulaciones y datos propios | Sí | No | No |
| Descargar PDF de candidato | Su propio PDF | Sí, asociado a su oferta | No | No |
| Corregir perfil original CV | Sí, antes de confirmar | No (solo notas) | No | No |
| Crear examen de oferta | No | Sí | No | No |
| Rendir examen autorizado | Sí, intento propio | No como candidato | No | No |
| Ver notas y resultado del postulante | Propio cuando fase lo permita (pendiente) | Sí, candidatos de oferta propia | No | No |
| Registrar decisión Avanza/No avanza | No | Sí, con confirmación | No | No |
| Ver seguimiento | Propio | Postulaciones de oferta propia | No | No |

## Dimensiones de estado separadas

1. **Cuenta de reclutador**: Inactiva / Activa, condicionada a comprobaciones correo/teléfono (regla aprobada).
2. **Oferta**: Borrador / Publicada / Cerrada, más Pendiente_de_moderación para primera oferta particular (regla aprobada). «Activa» todavía no tiene definición contable.
3. **Postulación**: estado inicial pendiente de CV/confirmación y estados de seguimiento En revisión / Preseleccionado / Avanza / No avanza. Transiciones por aprobar.
4. **Intento de examen**: En_progreso / Terminado / Expirado. Separar del estado de confirmación de cada respuesta.
5. **Respuesta de examen**: pendiente local / aceptada por servidor / no contabilizada por plazo; solo la segunda es puntuable.
6. **UI**: Ideal / Vacío / Parcial / Carga / Error. Estados de presentación por región, nunca autorizaciones ni fases del negocio.

## Riesgos explícitos encontrados en Figma Fase 1

Hay 20 conexiones identificadas del candidato a pantallas de reclutador en variantes Vacío/Error. Se debe corregir el prototipo, pero **antes de la implementación** los requisitos de permisos ya prohíben esos saltos operativos. El inicio de sesión y el reloj del examen son simulados: no se pueden utilizar como prueba de backend.
