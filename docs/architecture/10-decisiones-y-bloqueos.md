# 10 · Registro de decisiones, ADR y bloqueos

**Convención:** `A` aprobada explícitamente, `P` propuesta de Fase 4 y `B` bloqueada a espera de regla. No confundir propuesta técnica con aprobación del usuario.

## Decisiones de negocio confirmadas

| ID | Estado | Regla |
|---|---|---|
| A-01 | A | Empresas registran reclutador con correo corporativo; particulares admiten correo público y requieren verificación telefónica; email activado por enlace; cuenta inicialmente inactiva |
| A-02 | A | Particulares máximo **dos ofertas activas**, primera moderada antes de publicación |
| A-03 | A | **Propiedad individual** de ofertas/candidatos incluso entre reclutadores de una misma empresa |
| A-04 | A | CV inicial: PDF digital + extracción clásica de texto/campos; sin OCR ni IA generativa en parser MVP |
| A-05 | A | Candidato corrige/confirma perfil; reclutador revisa/añade notas sin alterar fuente |
| A-06 | A | Examen: hora oficial servidor, guardado por pregunta, límite estricto, ninguna respuesta aceptada tras expirar |
| A-07 | A | IA genera **puntaje final orientativo y breve explicación**; el reclutador decide, sin descarte automático |
| A-08 | A (elección inicial) | Motor de IA local **Ollama**, modelo instalado `qwen2.5:7b-instruct` como primera prueba; embeddings opcionales |
| A-09 | A | Astro frontend, Express/Node backend, MySQL BD, Tailwind/Flowbite y sistema visual Sky/Inter |

## ADR técnicos propuestos

| ADR | Estado | Decisión recomendada | Razón | Revisión |
|---|---|---|---|---|
| ADR-001 | P | Monolito modular Express | menos infraestructura, control transaccional | aceptar antes de scaffold |
| ADR-002 | P | Astro SSR selectivo + islas JS | datos autenticados y UI reactivas sin SPA global | decidir adaptador/islas |
| ADR-003 | P | API REST `/api/v1` mismo origen | separación backend, cookie y menor complejidad CORS | revisar endpoints |
| ADR-004 | P | MySQL InnoDB + transacciones/locks | aislar cuota/tiempo, integridad | ORM/query builder pendiente |
| ADR-005 | P | PDF privado + tabla metadatos | protección, versionado, no webroot | retención/límites |
| ADR-006 | P | Worker para IA/expiraciones | evita bloquear solicitudes | decidir implementación |
| ADR-007 | P | `JSON Schema` para Ollama + validación server | formato y evidencia verificable | medir en equipo real |
| ADR-008 | P | Cookies firmadas HttpOnly + protección CSRF | seguridad de sesión frontend | token/caducidad por decidir |
| ADR-009 | P | Respuestas examen con revisión monotónica | previene sobrescritura tardía | semántica exacta por probar |
| ADR-010 | P | `202` y polling de IA | respuesta normal rápida aun inferencia lenta | frecuencia/límites |

## Bloqueos que deben aprobarse antes de implementar su parte

| Bloqueo | Módulo | Decisión requerida | Severidad |
|---|---|---|---|
| B-01 | M02 | Definir qué estados computan como oferta **activa**; propuesta no aprobada: solo Publicada | Alta |
| B-02 | M02 | Quién modera primeras ofertas, permisos, criterios, apelación/rechazo | Alta |
| B-03 | M01 | Proveedores y políticas TTL/intent count OTP y enlace; legitimidad corporativa | Alta |
| B-04 | M03/M04 | Límite PDF, protección, antivirus, retención, duplicados/postulaciones | Alta |
| B-05 | M05 | Múltiples intentos, edición de exámenes, política de revisión/guardado, precisión reloj | Alta |
| B-06 | M06 | Rúbrica de IA, escala, pesos o instrucciones, umbrales de niveles, set de validación y tolerancias de calidad | **Crítica** |
| B-07 | M04/M06 | Re-evaluar si cambia perfil confirmado tras puntuar | Alta |
| B-08 | M07/M08 | Estados/transiciones/reversibilidad de postulación; quién puede anular decisión | Alta |
| B-09 | M01/M07 | Rol Jefe de Gestión Humana vs restricción de acceso individual | Alta |
| B-10 | Todo | Aprobar formalmente Constitución SDD Fase 2; métricas RNF aún cualitativas | Alta |

La decisión A-07/A-08 **reduce** la incertidumbre del anterior D-01 (quién genera score y con qué motor), pero **no elimina** B-06 (cómo se obtiene y valida una puntuación responsable). No etiquetar M06 como terminado.

## Criterios de cambio

Si una regla nueva contradice requisito original, registrar RFC, fuente, actor que aprobó, IDs afectados, cambios en specs y pruebas. La documentación PDF/TXT original permanece intacta; esta F4 es una línea de arquitectura candidata.
