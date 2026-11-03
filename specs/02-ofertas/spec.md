# SPEC-F3-02 — Gestión de ofertas de empleo

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF05–RSF08  
**UI de origen:** RF-02, RF-03, RF-14  
**RNF relacionados:** RSNF06, RSNF12; RNF-05, RNF-07, RNF-14, RNF-15  
**Estado del módulo:** Condicionada a moderación y definición de oferta activa

## 1. Propósito, actores y límites

**Objetivo.** Crear, definir requisitos, editar, publicar y cerrar ofertas preservando su propietario individual y una cuota de dos ofertas activas de particulares.

**Actores.** Reclutador propietario (Empresa o Persona natural); Postulante; autoridad de moderación por definir.

**Referencias Figma.** Reclutador · Ofertas de empleo; Reclutador · Nueva oferta; Candidato · Ofertas disponibles; Candidato · Detalle de oferta. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **OF-01** · `RSF05, DEC-03` — CUANDO un reclutador activo cree una oferta, EL BACKEND DEBE crear un identificador único y asignar el creador usando exclusivamente la identidad autenticada.
- **OF-02** · `RSF06, RF-02` — CUANDO se complete el formulario de oferta, EL SISTEMA DEBE capturar cargo, descripción, requisitos, experiencia, formación y demás condiciones indicadas en la fuente; no publicar si faltan campos obligatorios.
- **OF-03** · `RSF07, RF-14` — CUANDO el creador edite una oferta, EL BACKEND DEBE autorizarlo por propiedad individual y registrar el estado de negocio; una oferta cerrada no puede recibir nuevas postulaciones.
- **OF-04** · `RSF07, DEC-02` — SI el creador es persona natural, EL SISTEMA DEBE impedir superar dos ofertas activas simultáneamente, incluyendo solicitudes concurrentes; el conjunto exacto de estados que cuentan como activos sigue pendiente.
- **OF-05** · `RSF07, DEC-02` — CUANDO una persona natural intente publicar su primera oferta, ESTA DEBE quedar pendiente de revisión manual y no hacerse visible hasta aprobación de autoridad autorizada aún no definida.
- **OF-06** · `RSF07, RSNF12` — ANTES de permitir transición a estado público, EL BACKEND DEBE revalidar de forma atómica propiedad, moderación y cuota. Una validación visual del frontend no basta.
- **OF-07** · `RSF08, RF-03` — CUANDO un postulante liste ofertas, EL SISTEMA DEBE mostrar solamente las efectivamente Publicadas y habilitadas para recibir postulaciones.
- **OF-08** · `RSF04, RSF30, DEC-03` — SI un reclutador consulta, edita, cierra o intenta recuperar candidatos de una oferta ajena, EL BACKEND DEBE denegar acceso sin divulgar datos del otro creador.
- **OF-09** · `RF-14, RNF-14` — CUANDO el usuario intente cerrar una oferta, LA INTERFAZ DEBE explicar el efecto de dejar de recibir postulaciones y pedir confirmación antes de aplicar el cambio.

## 3. Estados y reglas de autorización

Oferta: Borrador, Publicada, Cerrada (fuente); Pendiente_de_moderación para primera oferta particular (ampliación DEC-02). La cuota cuenta «ofertas activas», conjunto por aprobar. No confundir con UI Ideal/Vacío/Parcial/Carga/Error.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Listado con filtro y badge de estado, ficha editable por propietario, CTA publicar contextual y bloqueado con razón, indicación de cuota; lista pública solo Publicadas. En vacío de candidato: actualizar búsqueda; nunca CTA de crear oferta ni enlace a vistas de reclutador.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### O01 · Propiedad por creador
```gherkin
Escenario: Propiedad por creador
  Dado una oferta creada por la reclutadora A
  Cuando el reclutador B de la misma empresa intenta editarla
  Entonces el backend rechaza la operación
```

### O02 · Tercera activa de particular
```gherkin
Escenario: Tercera activa de particular
  Dado un particular con dos ofertas que cumplen la definición de activas aprobada
  Cuando intenta publicar una tercera
  Entonces el sistema bloquea el cambio y muestra motivo
```

### O03 · Primera en moderación
```gherkin
Escenario: Primera en moderación
  Dado un particular sin ofertas anteriores
  Cuando solicita publicar su primera oferta
  Entonces queda pendiente de revisión y no aparece en la lista pública
```

### O04 · Oferta cerrada
```gherkin
Escenario: Oferta cerrada
  Dado una oferta Cerrada
  Cuando un postulante intenta enviar una nueva postulación incluso vía API
  Entonces el backend la rechaza
```

### O05 · Cupo bajo concurrencia
```gherkin
Escenario: Cupo bajo concurrencia
  Dado un particular al que queda un solo cupo
  Cuando llegan dos publicaciones al mismo tiempo
  Entonces se admite como máximo una transición adicional a activa
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Definir «oferta activa» (propuesta no aprobada: Publicada); quién modera, con qué permiso, qué ocurre ante rechazo y apelación; edición permitida de oferta ya Publicada; criterio de primera oferta; vigencia y archivos adjuntos no definidos.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
