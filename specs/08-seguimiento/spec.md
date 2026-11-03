# SPEC-F3-08 — Seguimiento y consulta de postulaciones

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF30–RSF32  
**UI de origen:** RF-10, RF-08 (listado), RF-13  
**RNF relacionados:** RSNF05, RSNF06, RSNF15, RSNF18; RNF-07, RNF-15  
**Estado del módulo:** Especificación funcional preparada; transiciones por aprobar

## 1. Propósito, actores y límites

**Objetivo.** Permitir al reclutador consultar postulaciones de sus ofertas y actualizar estados, y al candidato seguir únicamente su proceso.

**Actores.** Reclutador creador de oferta; postulante propietario de postulación.

**Referencias Figma.** Reclutador · Pipeline de selección; Reclutador · Ofertas de empleo; Candidato · Mis postulaciones; Candidato · Seguimiento. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **SE-01** · `RSF30, DEC-03` — CUANDO un reclutador consulte postulaciones de una oferta, EL BACKEND DEBE comprobar su propiedad por creador y devolver únicamente candidatos inscritos en esa oferta.
- **SE-02** · `RSF30, RF-08` — CUANDO se presente el listado, LA INTERFAZ DEBE indicar candidato, estado y datos autorizados; filtros por nivel o puntaje únicamente cuando existan valores aprobados.
- **SE-03** · `RSF31, RF-10` — CUANDO el reclutador autorizado cambie un estado, EL SERVIDOR DEBE registrar nueva situación y mantener trazabilidad; las transiciones exactas requieren una tabla de reglas aprobada.
- **SE-04** · `RSF31, RF-10` — SI se solicita una transición prohibida o actualización por un reclutador ajeno, EL BACKEND DEBE rechazarla sin modificar la postulación.
- **SE-05** · `RSF32, RF-10` — CUANDO el postulante consulte Mis postulaciones o Seguimiento, EL SISTEMA DEBE mostrar exclusivamente postulaciones propias y etapa vigente con texto y progreso coherente.
- **SE-06** · `RSF12, RSF32` — SI una oferta o su evaluación tiene información parcial o pendiente, LA INTERFAZ DEBE conservar el último estado confirmado sin inventar avances.
- **SE-07** · `RSNF15` — CUANDO se actualice el estado, EL SISTEMA DEBE conservar historial suficiente para auditoría y consulta; política de retención pendiente.

## 3. Estados y reglas de autorización

Listado muestra estados En revisión, Preseleccionado, Avanza, No avanza; estado inicial de postulación antes de revisión aún debe normalizarse. No confundir estados operativos de UI con resultados de negocio.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Tabla y Kanban/Pipeline si está justificado, timeline candidato, filtros, mensajes de vacío diferentes para no tener postulaciones y para filtros sin resultados, error contextual; sin opción «Estados de UI» en sidebar.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### S01 · Consulta propia reclutador
```gherkin
Escenario: Consulta propia reclutador
  Dado una oferta creada por A con tres postulaciones
  Cuando A abre sus postulantes
  Entonces el servidor devuelve únicamente postulaciones de esa oferta
```

### S02 · Otro reclutador
```gherkin
Escenario: Otro reclutador
  Dado un reclutador B que comparte empresa con A
  Cuando B solicita el listado de A
  Entonces el backend rechaza el acceso
```

### S03 · Cambio y seguimiento
```gherkin
Escenario: Cambio y seguimiento
  Dado una postulación de un candidato en En revisión
  Cuando el reclutador autorizado cambia el estado mediante transición aprobada
  Entonces el candidato ve el nuevo estado y el historial registra el cambio
```

### S04 · Consulta del candidato
```gherkin
Escenario: Consulta del candidato
  Dado un postulante con varias postulaciones y otra ajena
  Cuando abre Mis postulaciones
  Entonces únicamente observa las suyas
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Máquina de estados de negocio con transiciones válidas, situaciones terminales, reversión, etapa inicial, permisos de jefe RRHH, comunicación de cambios fuera de plataforma (no comprometida salvo requisito nuevo), retención.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
