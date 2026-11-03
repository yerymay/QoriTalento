# SPEC-F3-07 — Resultados y decisión de selección

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF26–RSF29  
**UI de origen:** RF-08 (tabla), RF-09, RF-19, RF-20  
**RNF relacionados:** RSNF06, RSNF07, RSNF12, RSNF18; RNF-14, RNF-15  
**Estado del módulo:** Condicionada a resultados RSF23/RSF24 y a transiciones

## 1. Propósito, actores y límites

**Objetivo.** Presentar el expediente del candidato y permitir que el reclutador propietario registre su evaluación y decisión final con confirmación.

**Actores.** Reclutador propietario; postulante como destinatario de seguimiento; sistema de evaluación.

**Referencias Figma.** Reclutador · Resultados y comparación; Reclutador · Ficha del postulante; Reclutador · Pipeline de selección. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **RS-01** · `RSF26, RF-08` — CUANDO un reclutador abra resultados de su oferta, EL SISTEMA DEBE mostrar solo sus postulantes y los resultados efectivamente disponibles, sin crear compatibilidades no calculadas.
- **RS-02** · `RSF27, RF-09` — CUANDO se abra una ficha autorizada, EL SISTEMA DEBE reunir PDF y datos confirmados, nota del examen, y compatibilidad/puntaje si están realmente calculados; la ausencia parcial se identifica por región.
- **RS-03** · `RSF28` — CUANDO el reclutador compare candidatos, EL SISTEMA DEBE permitir tomar decisión humana; ninguna puntuación debe activar descarte o avance automáticamente.
- **RS-04** · `RSF28, RF-20, RNF-14` — ANTES de una decisión final de impacto, LA INTERFAZ DEBE exigir confirmación explícita que explique la consecuencia.
- **RS-05** · `RSF29, RF-20` — CUANDO el reclutador confirme Avanza o No avanza, EL BACKEND DEBE guardar decisión, fecha y actor autorizado; la ficha debe mostrar el estado actualizado y evitar confirmaciones duplicadas.
- **RS-06** · `RSF04, DEC-03` — SI un reclutador intenta revisar o decidir sobre un candidato de una oferta ajena, EL BACKEND DEBE denegar lectura y escritura.
- **RS-07** · `RSNF12` — SI dos decisiones se registran casi a la vez, EL SISTEMA DEBE evitar estados finales contradictorios; la regla de reversión o corrección de una decisión es pendiente.
- **RS-08** · `DEC-07` — SI se observa información cuestionable del CV, EL RECLUTADOR PUEDE añadir una nota de revisión sin cambiar los datos confirmados por el candidato.

## 3. Estados y reglas de autorización

Decisiones citadas: En revisión, Preseleccionado, Avanza, No avanza; progresión permitida, reversibilidad y carácter terminal NO aprobados. Estado visual Ideal/Parcial/Vacío/Carga/Error independiente.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Tabla de comparación y ficha completa; acciones de Preseleccionar/Descartar, confirmación explícita para Avanza/No avanza, badges textuales; parcial cuando nota disponible pero compatibilidad bloqueada; no revelar datos de otros propietarios.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### R01 · Ficha parcial legítima
```gherkin
Escenario: Ficha parcial legítima
  Dado un candidato con nota de examen y sin compatibilidad aprobada
  Cuando el reclutador propietario abre su ficha
  Entonces ve la nota disponible y aviso específico de compatibilidad pendiente
```

### R02 · Decisión manual
```gherkin
Escenario: Decisión manual
  Dado un reclutador autorizado y una postulación revisada
  Cuando confirma una decisión final
  Entonces se registra el actor y momento y se actualiza el expediente
```

### R03 · Sin confirmación
```gherkin
Escenario: Sin confirmación
  Dado una acción irreversible en la ficha
  Cuando el reclutador cancela el modal
  Entonces no se registra ninguna decisión nueva
```

### R04 · Denegación por otra oferta
```gherkin
Escenario: Denegación por otra oferta
  Dado que una postulación pertenece a oferta de otro creador
  Cuando el reclutador consulta sus resultados o decide por API
  Entonces el servidor deniega el acceso
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Reglas exactas de transición y reversión, quién puede intervenir fuera del creador, acceso del jefe RRHH mencionado en documentos, significado de «Descartar» frente a «No avanza», efectos al modificar CV confirmado, dependencia de compatibilidad final.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
