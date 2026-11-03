# SPEC-F3-03 — Postulación y gestión de CV adjunto

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF09–RSF12  
**UI de origen:** RF-04, RF-10 (consulta), RF-15  
**RNF relacionados:** RSNF07, RSNF12, RSNF16, RSNF18; RNF-05, RNF-14, RNF-15  
**Estado del módulo:** Lista para revisión condicionada por límites de archivo y duplicados

## 1. Propósito, actores y límites

**Objetivo.** Permitir al postulante iniciar postulación a una oferta publicada, cargar su PDF, vincularlo a esa oferta y consultar el estado.

**Actores.** Postulante autenticado; reclutador dueño de la oferta; servicio de archivo.

**Referencias Figma.** Candidato · Detalle de oferta; Candidato · Postulación y PDF; Candidato · Mis postulaciones. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **PO-01** · `RSF09, RF-15` — CUANDO el postulante elija Postular en una oferta publicada, EL SISTEMA DEBE identificar inequívocamente oferta y postulante y crear o preparar la postulación en su fase inicial prevista por RSF09.
- **PO-02** · `RSF09, RSF07` — SI la oferta está Cerrada, no publicada o deja de admitir postulaciones antes del envío definitivo, EL BACKEND DEBE rechazar la confirmación y mostrar una explicación.
- **PO-03** · `RSF10, RF-04` — CUANDO un postulante cargue un CV, EL SISTEMA DEBE aceptar solo PDF conforme a validación real del servidor; la interfaz ofrece zona de carga, progreso, cancelación/reintento y mensajes de rechazo.
- **PO-04** · `RSF11` — CUANDO el CV sea aceptado, EL BACKEND DEBE asociar la referencia protegida del archivo a la postulación y oferta correctas, sin permitir intercambiar la propiedad mediante identificadores del navegador.
- **PO-05** · `RSF09, RSF10, RF-15, DEC-07` — ANTES del envío definitivo, EL SISTEMA DEBE exigir CV válido, revisión y confirmación por el postulante de los datos extraídos; el envío muestra un resumen y requiere confirmación.
- **PO-06** · `RSF12, RF-10` — CUANDO un postulante visite Mis postulaciones, EL SISTEMA DEBE mostrar solo sus propias postulaciones y su situación actual sin requerir intervención del reclutador.
- **PO-07** · `RSNF07, RSNF18` — SI un postulante o reclutador intenta abrir un archivo perteneciente a otra postulación no autorizada, EL BACKEND DEBE denegar el acceso incluyendo descarga del PDF.
- **PO-08** · `RSNF12` — CUANDO se produzca doble clic o reintento de envío, EL SISTEMA DEBE impedir registros contradictorios; la política exacta sobre múltiples postulaciones a una misma oferta queda pendiente.

## 3. Estados y reglas de autorización

Postulación: Inicial / Pendiente_de_CV / Registrada según RSF09 y confirmación del flujo UI (denominaciones a normalizar); estado de selección separado de estado de carga de CV. No asumir por defecto un único intento por oferta.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Resumen de oferta, dropzone PDF, estado de archivo y confirmación final; registro visible en Mis postulaciones; permisos por dueño de postulación en backend. Vacío: no tienes postulaciones; error: archivo/registro; parcial: CV listo y extracción pendiente.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### P01 · Postulación válida
```gherkin
Escenario: Postulación válida
  Dado un postulante autenticado ante una oferta Publicada y un PDF válido con datos revisados
  Cuando confirma el envío
  Entonces el sistema registra una postulación vinculada a esa oferta y la muestra en Mis postulaciones
```

### P02 · Archivo no PDF
```gherkin
Escenario: Archivo no PDF
  Dado un postulante en la carga de CV
  Cuando adjunta un archivo que no cumple la validación PDF
  Entonces el servidor rechaza el archivo y explica el motivo
```

### P03 · Oferta se cierra durante el formulario
```gherkin
Escenario: Oferta se cierra durante el formulario
  Dado un formulario abierto para una oferta
  Cuando la oferta se cierra antes de confirmar
  Entonces el servidor rechaza el envío sin generar una postulación confirmada
```

### P04 · Archivo ajeno
```gherkin
Escenario: Archivo ajeno
  Dado un postulante con sesión activa
  Cuando intenta acceder al PDF de otra persona
  Entonces el backend deniega lectura y descarga
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Tamaño máximo de PDF, PDFs cifrados o sin texto; reglas contra archivos maliciosos, almacenamiento y retención; duplicados y reenvío de una postulación; qué implica «registrar postulación» antes de subir CV frente a «enviar postulación» de RF-15.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
