# TASKS-F5-01 — Gestión de usuarios, acceso y autorización

> **SDD Fase 5 · v0.5 · 2026-11-03 · ESTADO: BACKLOG PROPUESTO / NO IMPLEMENTADO.**
>
> Fuente del módulo: [spec.md](spec.md), [plan.md](plan.md). Especificación heredada F3 y plan F4 se conservan sin modificar.
>
> Requisitos de sistema: **RSF01–RSF04**. UI: **RF-01, RF-11, RF-12, RF-13**. Bloqueos identificados: **B-03, B-09**.

## Interpretación de tareas

- `[ ]` = aún **no ejecutada**, aunque su definición esté lista. No marcar como `[x]` hasta verificar evidencia real de pruebas y revisión.
- `P0` crítica/fundacional, `P1` funcional prioritaria, `P2` diferible; tamaños S/M/L son **estimaciones relativas**, no horas prometidas.
- `M00-*` tareas transversales en `docs/implementation/fase5-backlog-transversal.md`; `V00-*` calidad final en `docs/implementation/fase5-validacion-integral.md`.
- Un bloqueo `B-*` permite preparar especificaciones, fixtures y prototipos **sin** inventar el comportamiento bloqueado; debe cerrarse antes de implementar o afirmar completada la operación afectada.
- Todos los paths de frontend/backend son **destinos futuros propuestos**; la Fase 5 no crea código.

## Orden y tareas verificables (12)

- [ ] **M01-01 · Modelar identidad y perfiles**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-12`, `M00-03`.
  - **Puerta de ejecución:** `B-03`, `B-09`.
  - **Acción:** Esquemas de usuario, rol, estado activo, perfil reclutador empresa/particular, organización informativa y desafíos de verificación.
  - **Destino propuesto:** `backend/src/modules/identity/, backend/migrations/`.
  - **Verificación exigida:** FK/índices/únicos validados y activación inicialmente no privilegiada.

- [ ] **M01-02 · Registro de postulante**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-01`, `M00-13`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Validar formulario, identidad y rol candidato; impedir autoasignación del rol reclutador.
  - **Destino propuesto:** `POST /api/v1/auth/candidates/register`.
  - **Verificación exigida:** US-01; rol inmutable desde petición maliciosa.

- [ ] **M01-03 · Registro empresarial**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-01`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Registrar como reclutador Empresa y rechazar dominios públicos de correo según lista/política aprobada; correo corporativo no certifica empresa.
  - **Destino propuesto:** `POST /api/v1/auth/recruiters/register`.
  - **Verificación exigida:** U01; correo público rechazado, sin cuenta privilegiada.

- [ ] **M01-04 · Registro de particular**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-01`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Aceptar correo público para particular, exigir teléfono y generar verificación como requisito previo de activación.
  - **Destino propuesto:** `POST /api/v1/auth/recruiters/register`.
  - **Verificación exigida:** U02; solo correo verificado no activa cuenta de particular.

- [ ] **M01-05 · Implementar adaptador de confirmación por email**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-02`, `M01-03`, `M01-04`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Enviar/enlace un solo uso con vencimiento y reenvíos limitados según decisión; registrar auditoría sin token en logs.
  - **Destino propuesto:** `POST /api/v1/auth/email/verify`.
  - **Verificación exigida:** Enlace expirado/repetido rechazado; cuenta no activada por replay.

- [ ] **M01-06 · Implementar adaptador de SMS/WhatsApp**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M01-04`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Integrar proveedor seleccionado, control de caducidad/intentos y mensajes seguros; usar proveedor ficticio en tests.
  - **Destino propuesto:** `POST /api/v1/auth/phone/verify`.
  - **Verificación exigida:** Particular no accede sin verificación; no se exponen OTP; reintentos limitados.

- [ ] **M01-07 · Activación derivada de verificaciones**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-05`, `M01-06`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** El backend activa reclutador solo cuando se completan verificaciones del tipo; no delegar a frontend.
  - **Destino propuesto:** `backend/src/modules/identity/`.
  - **Verificación exigida:** U02; un reclutador inactivo obtiene denegación al crear oferta.

- [ ] **M01-08 · Inicio y cierre de sesión**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M01-07`, `M00-14`, `M00-24`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Implementar credenciales seguras, invalidación y cookies según ADR; mensajes no permiten enumeración de cuentas.
  - **Destino propuesto:** `POST /api/v1/auth/login, POST /api/v1/auth/logout`.
  - **Verificación exigida:** Inicio valido lleva a rol propio; sesión cerrada ya no permite GET privado.

- [ ] **M01-09 · Consulta y edición de perfil propio**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M01-08`.
  - **Puerta de ejecución:** `B-09`.
  - **Acción:** Leer/cambiar solo contacto autorizado y conservar trazabilidad; evitar update con user_id externo.
  - **Destino propuesto:** `GET /api/v1/me, contrato de modificación a revisar`.
  - **Verificación exigida:** U04; usuario A no altera perfil B.

- [ ] **M01-10 · Guards de rol y propiedad en endpoints**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M01-08`, `M00-14`.
  - **Puerta de ejecución:** `B-09`.
  - **Acción:** Aplicar middleware transversal y pruebas de recurso por creador en todas las rutas privadas del dominio.
  - **Destino propuesto:** `backend/src/shared/auth/, tests/security/`.
  - **Verificación exigida:** U03 y T-01/T-02; empresa compartida no concede acceso cruzado.

- [ ] **M01-11 · Pantallas Auth y Mi perfil**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M01-08`, `M00-20`, `M00-21`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Implementar layouts referenciados en Figma; estados de envío, validación contextual, modo claro/oscuro y roles coherentes.
  - **Destino propuesto:** `frontend/src/pages/, frontend/src/components/domain/`.
  - **Verificación exigida:** U01–U04 en UI; mensajes verificaciones y foco teclado; no sidebar de Estados de UI.

- [ ] **M01-12 · Pruebas de seguridad de identidad**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M01-08`, `M01-10`, `M00-18`.
  - **Puerta de ejecución:** `B-03`, `B-09`.
  - **Acción:** Casos de cuenta inactiva, sesión inválida, tokens reutilizados, ataques IDOR y límites contra abuso; datos ficticios.
  - **Destino propuesto:** `tests/integration/identity/, tests/security/`.
  - **Verificación exigida:** Pruebas U01–U04 y T-01/T-02 automatizadas con evidencias.

## Criterio de salida del módulo

- [ ] Todas las tareas P0 exigibles están ejecutadas con pruebas positivas y negativas.
- [ ] El recurso de propiedad individual se autoriza **en backend**, no solo ocultando UI.
- [ ] Los estados Ideal/Vacío/Parcial/Carga/Error se aplican por región pertinente y conservan información válida.
- [ ] Cada bloqueo identificado fue aprobado o su funcionalidad sigue expresamente fuera de alcance.
- [ ] Trazabilidad actualizada y resultados de pruebas adjuntos a la revisión del módulo.
