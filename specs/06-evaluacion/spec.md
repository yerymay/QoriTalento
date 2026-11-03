# SPEC-F3-06 — Evaluación, compatibilidad y calificación

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF22–RSF25  
**UI de origen:** RF-08, RF-19  
**RNF relacionados:** RSNF07, RSNF12, RSNF15, RSNF18; RNF-02, RNF-07  
**Estado del módulo:** PARCIAL / BLOQUEADA para RSF23–RSF25 hasta aprobar algoritmo

## 1. Propósito, actores y límites

**Objetivo.** Calificar respuestas objetivas, analizar compatibilidad CV-oferta y calcular puntaje final con trazabilidad; la fórmula de compatibilidad aún no ha sido aprobada.

**Actores.** Sistema de calificación; reclutador propietario; postulante como titular del perfil.

**Referencias Figma.** Reclutador · Resultados y comparación; Reclutador · Ficha del postulante. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **EV-01** · `RSF22` — CUANDO un intento quede terminado o expirado, EL SISTEMA DEBE comparar sus respuestas oportunamente aceptadas con claves correctas y obtener la calificación del examen; si no hay regla para pregunta sin respuesta, documentar el tratamiento en la especificación técnica.
- **EV-02** · `RSF22, RSNF15` — CUANDO se calcule una nota, EL SISTEMA DEBE conservar la evidencia de respuestas, clave utilizada, versión y fecha, sin recalcular silenciosamente por cambios posteriores.
- **EV-03** · `RSF23, DEC-08 PENDIENTE` — CUANDO se compare un CV con los requisitos de oferta, EL SISTEMA DEBERÁ usar únicamente criterios aprobados y datos confirmados por el postulante; el método de comparación y niveles Alta/Media/Baja están PENDIENTES y NO se implementan en esta fase.
- **EV-04** · `RSF24, DEC-08 PENDIENTE` — CUANDO estén disponibles evaluación de examen y compatibilidad según fórmula aprobada, EL SISTEMA DEBERÁ calcular el puntaje final; pesos, escalas y umbrales siguen BLOQUEADOS.
- **EV-05** · `RSF25, RF-08` — CUANDO existan puntajes finales válidos, EL SISTEMA DEBERÁ permitir filtrar y ordenar postulantes de ofertas propias; mientras no exista algoritmo aprobado no mostrará puntajes o rankings ficticios como resultados reales.
- **EV-06** · `RSF04, RSNF06, DEC-03` — ANTE cualquier consulta de notas, compatibilidad o ranking, EL BACKEND DEBE comprobar que el reclutador es creador de la oferta; no debe devolver expedientes ajenos.
- **EV-07** · `RSF23, DEC-07` — SI los datos de CV cambian después de una calificación previa, EL SISTEMA DEBE conservar el resultado histórico e indicar que una reevaluación requiere política explícita; no sobreescribir decisión anterior automáticamente.
- **EV-08** · `RSF28` — NINGÚN cálculo de compatibilidad DEBE tomar por sí solo la decisión «Avanza/No avanza»; esa decisión corresponde al reclutador conforme RSF28.

## 3. Estados y reglas de autorización

Calificación de examen: pendiente/calculada/error. Compatibilidad y puntaje: sin fórmula aprobada/no calculado; nunca rellenar con datos sintéticos en producción. Nivel Alta/Media/Baja solo tras umbrales aprobados.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Bloque de nota de examen separable del bloque de compatibilidad, con evidencia; tabla de resultados solo valores calculados válidos, estados parciales si falta evaluación. No usar únicamente color para niveles.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### V01 · Corrección de examen
```gherkin
Escenario: Corrección de examen
  Dado un intento finalizado con respuestas confirmadas y claves definidas
  Cuando se ejecuta la calificación
  Entonces se determina la nota conforme a las claves y se conserva evidencia trazable
```

### V02 · Sin fórmula aprobada
```gherkin
Escenario: Sin fórmula aprobada
  Dado un postulante con examen calificado y CV confirmado
  Cuando se consulta la ficha sin algoritmo de compatibilidad aprobado
  Entonces la nota del examen puede mostrarse pero no se presenta porcentaje ni puntaje final inventado
```

### V03 · Acceso horizontal
```gherkin
Escenario: Acceso horizontal
  Dado que un reclutador A intenta listar resultados de una oferta de B
  Cuando consulta la clasificación
  Entonces el backend deniega el acceso a todos los registros de B
```

### V04 · Decisión humana
```gherkin
Escenario: Decisión humana
  Dado un resultado calculado para un candidato
  Cuando se revisa la ficha
  Entonces el sistema no cambia automáticamente su estado a Avanza o No avanza
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

BLOQUEANTE DEC-08: método (determinista/IA), criterios de evidencia, ponderaciones, escala, umbrales Alta/Media/Baja, criterios de validación de sesgos, aceptación académica, redondeos, ausencia de información, reproducibilidad, versionado del algoritmo y recálculos.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
