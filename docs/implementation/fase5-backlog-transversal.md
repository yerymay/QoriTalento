# Fase 5 — Preparación, gobierno y plataforma

**Estado: backlog NO implementado.** Se revisan las puertas y fuentes F1–F4 antes de programar.

**Leyenda:** `P0` crítico, `P1` prioritario, `P2` diferible; tamaños S/M/L relativos. Cada tarea especifica verificaciones, dependencias y bloqueo.

- [ ] **M00-01 · Ratificar la constitución SDD**
  - **Prioridad / tamaño relativo:** `P0` / `S`. **Dependencias:** Ninguna directa.
  - **Puerta de ejecución:** `B-10`.
  - **Acción:** Revisar principios de propiedad, exámenes, IA, privacidad y proceso de cambios; documentar aprobación del responsable. No tratar un borrador como aprobado.
  - **Destino propuesto:** `docs/constitution.md (solo al aprobar), docs/decisions/`.
  - **Verificación exigida:** Registro de versión/aprobador/fecha y ausencia de contradicciones con fuentes.

- [ ] **M00-02 · Revisar decisiones de arquitectura ADR-001 a ADR-010**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Elegir conscientemente monolito modular, SSR e islas, mecanismo de sesión, capa SQL, cola/workers y semántica de API; registrar alternativas descartadas.
  - **Destino propuesto:** `docs/architecture/adr/`.
  - **Verificación exigida:** Cada ADR tiene estado, responsable y consecuencias; no se adopta por omisión.

- [ ] **M00-03 · Resolver política de verificación y acceso excepcional**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-03`, `B-09`.
  - **Acción:** Aprobar proveedor email/SMS o WhatsApp, tiempos de validez, reintentos, activación del postulante y alcance de Jefe de Gestión Humana sin romper propiedad individual.
  - **Destino propuesto:** `docs/decisions/, specs/01-gestion-usuarios/`.
  - **Verificación exigida:** Casos de registro, activación y actor privilegiado definidos para pruebas U01–U04.

- [ ] **M00-04 · Aprobar definición de oferta activa y moderador**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-01`, `B-02`.
  - **Acción:** Especificar estados que consumen cuota de particular; definir quién modera, permisos, rechazos y reintentos.
  - **Destino propuesto:** `docs/decisions/, specs/02-ofertas/`.
  - **Verificación exigida:** Tablas de transición y concurrencia revisadas; regla de primera oferta inequívoca.

- [ ] **M00-05 · Aprobar política de PDFs y postulaciones**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Definir tamaño, antivirus/rechazo, retención, privacidad y cardinalidad de postulaciones para una oferta; no asumir límites arbitrarios.
  - **Destino propuesto:** `docs/decisions/, specs/03-postulaciones/, specs/04-extraccion-cv/`.
  - **Verificación exigida:** Casos límite y política de duplicación documentados.

- [ ] **M00-06 · Aprobar política de intentos y cronología**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-05`.
  - **Acción:** Definir intentos, versión de examen, actualización de respuesta, tolerancia del reloj, caída de servidor y frontera temporal exacta.
  - **Destino propuesto:** `docs/decisions/, specs/05-examenes/`.
  - **Verificación exigida:** Pruebas E01–E05 y T-07–T-10 tienen expectativas precisas.

- [ ] **M00-07 · Aprobar rúbrica y validación de IA**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Definir qué datos laborales entran, escala, instrucciones de puntuación, evidencia, niveles si existen, benchmark sintético, criterios de aceptación y quién aprueba.
  - **Destino propuesto:** `docs/decisions/, specs/06-evaluacion/`.
  - **Verificación exigida:** Conjunto de validación y umbrales definidos ANTES de puntuar expedientes reales.

- [ ] **M00-08 · Resolver reevaluación y máquina de estados**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** `B-07`, `B-08`.
  - **Acción:** Aprobar cambios tras perfil confirmado, estados/transiciones y reversión de decisiones, actores autorizados; no crear estados implícitos.
  - **Destino propuesto:** `docs/decisions/, specs/04-extraccion-cv/, specs/08-seguimiento/`.
  - **Verificación exigida:** Matriz de transición y política de versiones/reevaluación sin ambigüedades.

- [ ] **M00-09 · Sincronizar requisitos y contratos**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-01`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Vincular toda aprobación nueva con RSF/RSNF, RF/RNF UI, spec, plan, OpenAPI, diagramas y casos; mantener originales inmutables.
  - **Destino propuesto:** `docs/requirements/, docs/architecture/09-trazabilidad-tecnica.md`.
  - **Verificación exigida:** Toda discrepancia tiene control de cambios, no cambios silenciosos.

- [ ] **M00-10 · Preparar estructura de repositorio**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-02`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Una vez aprobado ADR, crear configuración local de frontend Astro y backend Express modular en un repositorio sin reemplazar código existente.
  - **Destino propuesto:** `frontend/, backend/, package manifests`.
  - **Verificación exigida:** Instalación y ejecución mínima documentadas; sin endpoints de negocio simulados como reales.

- [ ] **M00-11 · Configurar entorno y secretos**
  - **Prioridad / tamaño relativo:** `P0` / `S`. **Dependencias:** `M00-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Crear ejemplos de configuración, validación de variables, políticas de .gitignore y separación dev/test/prod; nunca versionar CV reales ni credenciales.
  - **Destino propuesto:** `.env.example, .gitignore, docs/implementation/`.
  - **Verificación exigida:** Escaneo de repositorio sin secretos; arranque falla de forma clara si faltan variables críticas.

- [ ] **M00-12 · Elegir y preparar migraciones MySQL**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-02`, `M00-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Aprobar ORM/query builder o SQL, convención FK/índices, migraciones reversibles y transacciones; usar MySQL InnoDB.
  - **Destino propuesto:** `backend/src/db/, backend/migrations/`.
  - **Verificación exigida:** Migración arriba/abajo en BD de prueba; constraint y transacción comprobables.

- [ ] **M00-13 · Validar contrato REST y tipos**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-02`, `M00-09`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Revisar borrador OpenAPI 3.1 por cada operación, DTO, auth, errores, paginación e idempotencia; automatizar comprobación de contrato.
  - **Destino propuesto:** `contratos/openapi-3.1-draft.yaml, tests/contracts/`.
  - **Verificación exigida:** Esquema parseable, ejemplos válidos, reglas de propiedad y errores documentados.

- [ ] **M00-14 · Definir middleware de sesión, roles y propiedad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-12`, `M00-13`.
  - **Puerta de ejecución:** `B-03`, `B-09`.
  - **Acción:** Preparar diseño compartido de autorización basado en identidad validada; propietario jamás se toma del body; negar IDOR/BOLA.
  - **Destino propuesto:** `backend/src/shared/auth/, tests/security/`.
  - **Verificación exigida:** Prueba de acceso denegado con dos reclutadores de la misma empresa (T-01/T-02).

- [ ] **M00-15 · Diseñar base de errores y auditoría**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-13`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Normalizar request_id, códigos 400/401/403/404/409/410/422/429/503, logs minimizados y eventos auditables; no devolver PII.
  - **Destino propuesto:** `backend/src/shared/errors/, backend/src/shared/audit/`.
  - **Verificación exigida:** Contrato consistente; errores sin claves, PDF o datos de otro usuario.

- [ ] **M00-16 · Definir almacenamiento privado y políticas PDF**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-12`.
  - **Puerta de ejecución:** `B-04`.
  - **Acción:** Almacenar CV fuera del webroot, URL de acceso autorizado, hashes/metadatos, políticas de descarga; archivo de prueba sintético.
  - **Destino propuesto:** `backend/src/shared/storage/, tests/fixtures/pdf/`.
  - **Verificación exigida:** No existe descarga pública; URL/ID manipulado produce denegación.

- [ ] **M00-17 · Preparar ejecutores asíncronos y gestión de estados**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M00-12`, `M00-15`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Elegir mecanismo de trabajos persistentes para extracción, expiración e IA; definir reintentos, fallo terminal, idempotencia y trazabilidad.
  - **Destino propuesto:** `backend/src/workers/, backend/src/shared/jobs/`.
  - **Verificación exigida:** Trabajo repetido no duplica resultados; proceso caído puede recuperarse según contrato aprobado.

- [ ] **M00-18 · Configurar entorno de pruebas y fixtures sintéticos**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-10`, `M00-12`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Separar BD test, establecer datos de candidatos, ofertas, PDFs digitales y casos negativos; no reutilizar datos reales.
  - **Destino propuesto:** `tests/fixtures/, tests/integration/, tests/e2e/`.
  - **Verificación exigida:** Reset determinista; fixtures contienen únicamente información ficticia.

- [ ] **M00-19 · Activar automatización de calidad**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M00-10`, `M00-13`, `M00-18`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Configurar TypeScript/lint, formato, pruebas básicas, control de contratos y chequeo de secretos en CI.
  - **Destino propuesto:** `.github/workflows/ o equivalente, backend/, frontend/`.
  - **Verificación exigida:** Pipeline da error ante contrato roto, test fallido o credencial accidental.

- [ ] **M00-20 · Preparar design system y layouts por rol**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M00-10`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Reusar Flowbite, tokens Sky/Inter Light/Dark, layouts Auth/Reclutador/Postulante y sidebar sin Estados de UI; verificar identidad visual Figma.
  - **Destino propuesto:** `frontend/src/styles/, frontend/src/layouts/, frontend/src/components/ui/`.
  - **Verificación exigida:** Componentes reutilizables, foco visible y navegación de rol correcta en mobile y desktop.

- [ ] **M00-21 · Preparar componentes de estados operativos**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M00-20`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Planificar Empty/Partial/Loading/Error/Ideal por región, skeleton estructural y componentes de accesibilidad, sin inventar estado vacío en formularios.
  - **Destino propuesto:** `frontend/src/components/states/`.
  - **Verificación exigida:** Misma región permite carga, parcial y error sin perder datos válidos; CTA por rol.

- [ ] **M00-22 · Corregir referencias de navegación Figma**
  - **Prioridad / tamaño relativo:** `P1` / `M`. **Dependencias:** `M00-09`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Planificar reparación y posterior verificación de 20 enlaces erróneos candidato→reclutador detectados en Fase 1, preservando original/backup.
  - **Destino propuesto:** `Figma (artefacto externo; sin edición en esta fase), docs/`.
  - **Verificación exigida:** Auditar 22 vistas principales y rutas por rol; no afirmar corregido sin verificación.

- [ ] **M00-23 · Definir observabilidad y respaldos**
  - **Prioridad / tamaño relativo:** `P2` / `L`. **Dependencias:** `M00-15`, `M00-17`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Preparar medición de rendimiento, fallo de workers, timeouts de Ollama, trazas sin PII y estrategia de backup/restore MySQL/PDF.
  - **Destino propuesto:** `backend/src/shared/observability/, docs/operations/`.
  - **Verificación exigida:** Ejercicio de restauración verificable; métricas de fallos y latencia disponibles.

- [ ] **M00-24 · Proteger cookies y superficie HTTP**
  - **Prioridad / tamaño relativo:** `P0` / `M`. **Dependencias:** `M00-14`.
  - **Puerta de ejecución:** `B-03`.
  - **Acción:** Tras elegir política de sesión, aplicar Secure/HttpOnly/SameSite, CSRF si corresponde, rate-limits, headers y reglas de CORS; no confiar en navegación UI.
  - **Destino propuesto:** `backend/src/shared/security/, tests/security/`.
  - **Verificación exigida:** Prueba automatizada de CSRF y abuso según ADR; respuesta sin secretos.
