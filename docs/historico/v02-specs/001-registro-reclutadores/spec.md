# SPEC-001 — Registro y autorización de reclutadores

**Estado:** especificación propuesta derivada de decisiones aprobadas. **IDs base:** RSF01, RSF02, RSF04, RSNF05, RSNF06, RSNF08, RSNF18; UI RF-01, RF-11, RF-13, RNF-05, RNF-15; HU-06, HU-07. **Figma:** `Auth · Registro`, `Auth · Inicio de sesión`, `Reclutador · Mi perfil`.

## Objetivo

Admitir reclutadores como personas naturales o usuarios de empresa, exigir las verificaciones correspondientes y negar la operación a cuentas inactivas.

## Reglas normativas EARS

- **REG-01:** CUANDO un usuario elija registrarse como reclutador, EL SISTEMA DEBE solicitar `Empresa` o `Persona natural`; el postulante conserva su flujo independiente.
- **REG-02:** SI el perfil es `Empresa`, EL SISTEMA DEBE exigir correo de dominio corporativo no público, rechazar dominios públicos conocidos y verificar el control del correo mediante enlace. **Nota:** no declarar verificada la existencia legal de una empresa basándose solamente en su dominio.
- **REG-03:** SI el perfil es `Persona natural`, EL SISTEMA DEBE aceptar correos públicos y exigir verificación telefónica mediante código SMS/WhatsApp, además de la verificación por enlace de correo.
- **REG-04:** CUANDO se cree la cuenta, EL SISTEMA DEBE mantenerla `Inactiva` hasta completar todas sus verificaciones aplicables. La caducidad de enlaces/códigos es **pendiente de especificación**.
- **REG-05:** MIENTRAS la cuenta esté inactiva, EL BACKEND DEBE denegar las operaciones protegidas de reclutamiento, aunque el menú/cliente intente activarlas.
- **REG-06:** CUANDO un reclutador activo inicie sesión, EL BACKEND DEBE resolver su identidad autenticada y utilizarla para la autorización; nunca confiar en un identificador de creador enviado por el cliente.
- **REG-07:** SI el solicitante intenta acceder a recursos ajenos, EL SISTEMA DEBE denegar acceso sin revelar contenido ni datos privados.

## Estados de negocio

Cuenta: `Inactiva` → `Activa` tras verificaciones correctas; tratamiento de cuenta suspendida, duplicada o reactivada queda pendiente. UI: mantener separadamente las variantes de carga, error, parcial, vacío, ideal cuando correspondan.

## Criterios de aceptación

```gherkin
Escenario: Alta de empresa con correo público
  Dado que un usuario selecciona "Reclutador — Empresa"
  Cuando intenta registrarse con un dominio público bloqueado
  Entonces el registro es rechazado con una explicación contextual

Escenario: Particular sin teléfono confirmado
  Dado que una persona natural verificó su correo pero no su teléfono
  Cuando intenta publicar una oferta
  Entonces el backend deniega la operación porque la cuenta permanece inactiva

Escenario: Activación correcta de particular
  Dado que el reclutador particular verificó correo y teléfono
  Cuando el servidor verifica ambas evidencias
  Entonces la cuenta pasa a activa

Escenario: Acceso horizontal no permitido
  Dado que existen dos reclutadores activos de la misma empresa
  Cuando uno solicita una oferta creada por el otro
  Entonces el backend rechaza el acceso y no devuelve datos privados
```

## Límites / dependencias no resueltas

Pendientes proveedor de correo/SMS/WhatsApp, prevención de abuso, registro repetido, validez de verificaciones, comprobación de legitimidad empresarial y procedimiento de moderación. La elección de JWT, cookies u otro mecanismo se realizará en el plan técnico, no en esta spec funcional.
