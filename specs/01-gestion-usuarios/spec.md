# SPEC-F3-01 — Gestión de usuarios, acceso y autorización

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF01–RSF04  
**UI de origen:** RF-01, RF-11, RF-12, RF-13  
**RNF relacionados:** RSNF05, RSNF06, RSNF07, RSNF08, RSNF18; RNF-05, RNF-11, RNF-15  
**Estado del módulo:** Condicionada a políticas operativas de verificación

## 1. Propósito, actores y límites

**Objetivo.** Gestionar registro y perfil por rol, autenticación, activación específica de reclutadores y acceso exclusivamente a recursos autorizados.

**Actores.** Postulante; reclutador empresa; reclutador persona natural; servicios de verificación.

**Referencias Figma.** Auth · Inicio de sesión; Auth · Registro; Reclutador · Mi perfil; Candidato · Mi perfil. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **US-01** · `RSF01, RF-11, DEC-01` — CUANDO alguien cree una cuenta de postulante, EL SISTEMA DEBE registrar identidad básica y rol postulante; no debe convertir automáticamente ese registro en reclutador.
- **US-02** · `RSF01, RF-11, DEC-01` — CUANDO se elija registro de reclutador, EL SISTEMA DEBE solicitar tipo Empresa o Persona natural y aplicar validaciones específicas de ese tipo.
- **US-03** · `RSF01, DEC-01` — SI un reclutador Empresa utiliza un dominio de correo público bloqueado, EL SISTEMA DEBE rechazar el alta con mensaje contextual; un dominio corporativo no certifica la legitimidad de la empresa.
- **US-04** · `RSF01, DEC-01` — CUANDO un reclutador Particular se registre, EL SISTEMA DEBE permitir correo público, exigir verificación telefónica mediante SMS o WhatsApp y verificar el correo mediante enlace.
- **US-05** · `RSF01, RSF02, DEC-01` — MIENTRAS un reclutador no complete todas las verificaciones aplicables, SU CUENTA DEBE permanecer Inactiva y el backend debe denegar funciones protegidas de reclutamiento; al completar verificaciones debe pasar a Activa.
- **US-06** · `RSF02, RF-01` — CUANDO una cuenta habilitada introduzca credenciales válidas, EL SISTEMA DEBE iniciar sesión y mostrar el panel correspondiente; CUANDO cierre sesión, DEBE invalidar el acceso activo según mecanismo a definir.
- **US-07** · `RSF03, RF-12` — CUANDO un usuario autenticado consulte o actualice sus datos básicos, EL SISTEMA DEBE operar únicamente sobre el perfil del propietario y confirmar el resultado sin alterar datos ajenos.
- **US-08** · `RSF04, RF-13, DEC-03` — ANTE cualquier operación protegida, EL BACKEND DEBE comprobar identidad, rol, estado y propiedad efectiva del recurso; los IDs aportados por el cliente no sustituyen la identidad de sesión.
- **US-09** · `RSF04, RSNF06, DEC-03` — SI dos reclutadores pertenecen a la misma empresa, EL BACKEND NO DEBE conceder acceso a ofertas o candidatos creados/recibidos por el otro, salvo un cambio formal futuro de permisos.
- **US-10** · `RSNF08, ADD-RNF-01` — SI se envía un enlace de correo o código telefónico, DEBE impedirse su reutilización y exposición; validez temporal, frecuencia de reenvío, proveedores y límites contra abuso pendientes de concretar.

## 3. Estados y reglas de autorización

Usuario: registrado; para reclutador Inactiva/Activa. Verificación de correo/teléfono: pendiente/completada (estado representativo, no enum de BD). Sesión: autenticada/no autenticada. Estados operativos de UI independientes.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Formulario con roles; opciones Empresa/Particular; explicación de verificación pendiente; error por dominio inválido; perfil editable; sidebar contextual sin «Estados de UI». Cinco estados solo donde su semántica tenga sentido: formulario inicial no representa listado vacío.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### U01 · Empresa con correo público
```gherkin
Escenario: Empresa con correo público
  Dado un registro de reclutador de tipo Empresa y un dominio catalogado como público
  Cuando intenta registrarse
  Entonces el sistema rechaza el formulario sin crear una cuenta activa
```

### U02 · Particular solo con correo verificado
```gherkin
Escenario: Particular solo con correo verificado
  Dado un reclutador particular con correo confirmado y teléfono no verificado
  Cuando intenta crear una oferta
  Entonces el backend deniega la operación y mantiene la cuenta Inactiva
```

### U03 · Dos usuarios en empresa
```gherkin
Escenario: Dos usuarios en empresa
  Dado dos reclutadores activos de la misma empresa y una oferta creada por el primero
  Cuando el segundo intenta consultar sus candidatos
  Entonces el backend bloquea la consulta sin revelar información privada
```

### U04 · Perfil propio
```gherkin
Escenario: Perfil propio
  Dado un usuario autenticado
  Cuando actualiza sus datos de contacto
  Entonces únicamente su perfil cambia y se informa la confirmación
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Validez/reenvío/caducidad de verificaciones; proveedor correo/SMS/WhatsApp, costos y protección contra abuso; política de verificación de legitimidad empresarial; mecanismo concreto de sesión (JWT u otro), expiración y recuperación; activación de postulantes no determinada por DEC-01.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
