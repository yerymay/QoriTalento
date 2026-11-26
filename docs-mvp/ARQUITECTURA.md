# Qori Talento — Arquitectura MVP modular y de cuatro capas

## Decisión técnica del propietario

Frontend **Astro + TypeScript + Tailwind CSS v4 + Flowbite**; Backend **Node.js + Express + TypeScript**; BD **MySQL 8 / MariaDB 10.6+ (InnoDB)**; Swagger/OpenAPI; Ollama local solo al desarrollar M06. No microservicios ni patrones adicionales obligatorios.

## Backend: cuatro capas por módulo

```text
HTTP → Router / Controller → Service (negocio) → Repository (contrato) ← MySQLRepository (persistencia) → MySQL
```

1. **Controladores**: gestionan HTTP, parámetros y validación superficial de payload. Sin SQL ni decisión empresarial.
2. **Negocio/servicios**: permisos, reglas, validación semántica, casos de uso y transacciones. Sin SQL directo.
3. **Acceso a datos/contratos**: interfaces TypeScript (`*Repository`) que describen operaciones permitidas, sin consultas SQL.
4. **Persistencia**: clases que implementan contratos, usan `mysql2/promise` y ejecutan SQL parametrizado. Sin reglas de negocio.

**Matiz TypeScript:** la interfaz de repositorio no ejecuta consultas; la implementación de persistencia **depende del contrato** y se inyecta en el servicio desde el punto de composición. Esta es la forma de conservar cuatro capas sin crear una dependencia circular o hacer que la interfaz "llame" a la implementación. Ninguna capa puede saltar la responsabilidad de otra.

```text
Backend/src/
├── config/                         # variables de entorno
├── shared/                         # errores, conexión y middleware transversal
├── modules/
│   ├── system/                     # ejemplo ejecutable de las cuatro capas
│   │   ├── controllers/             # HTTP
│   │   ├── services/                # negocio
│   │   ├── repositories/            # interfaces/contratos
│   │   ├── persistence/             # MySQL
│   │   └── routes/                  # rutas y ensamblaje
│   ├── auth/                        # M01, según avance
│   ├── ofertas/                     # M02
│   ├── postulaciones/               # M03
│   ├── cv/                          # M04
│   ├── examenes/                    # M05
│   ├── evaluacion/                  # M06
│   ├── seleccion/                   # M07
│   └── seguimiento/                 # M08
└── server.ts
```

Solo crear carpetas de módulos cuando se implementen, no llenar de archivos vacíos.

## Frontend modular, por componentes

```text
Frontend/src/
├── modules/
│   ├── auth/                # M01, components/ y auth.service.ts
│   ├── ofertas/             # M02
│   ├── postulaciones/       # M03
│   ├── cv/                  # M04
│   ├── examenes/            # M05
│   ├── evaluacion/          # M06
│   ├── seleccion/           # M07
│   ├── seguimiento/         # M08
│   └── compartido/          # componentes, cliente API, estados UI
├── layouts/                 # públicos, candidato, reclutador
├── pages/                   # rutas Astro (sin lógica de negocio)
└── styles/                  # tokens Sky, Inter, temas
```

`pages/*.astro` resuelve la ruta y compone vistas; `modules/*/components` contiene UI; `modules/*/*.service.ts` consume API mediante cliente compartido. No importar repositorios MySQL ni secretos en frontend.

## Reglas de comunicación

- Frontend → REST JSON `/api/v1/...` → Controladores → Servicios → Contratos → Implementaciones MySQL.
- Identidad del usuario se obtiene de sesión validada en Express; jamás confiar en `user_id` de un formulario.
- Los archivos de CV se almacenan de forma privada. La UI no decide quién puede verlos.
- Exámenes: servidor es autoridad de tiempo/respuestas; frontend muestra cuenta atrás informativa.
- IA: backend llama Ollama local, con revisión humana y sin exponer el modelo directamente al navegador.
- Respuestas y errores documentados con OpenAPI; publicar Swagger de endpoints **implementados** y mantener el contrato SDD **planeado** separado.
- Estados UI (Ideal/Vacío/Parcial/Carga/Error) por región, Flowbite reutilizable, Sky/Inter, light/dark, sin navegación "Estados de UI". Toda vista principal debe contemplar estos cinco estados: Ideal (contenido completo), Vacío (explica ausencia y siguiente acción), Parcial (datos incompletos), Carga (esqueleto de la estructura esperada) y Error (causa comprensible y recuperación).
- Estados de botones: Reposo, Hover, Presionado, Ejecución y Éxito. Los botones reutilizan `q-primary` o `q-secondary`; Ejecución bloquea duplicados de inmediato y, solo si la operación supera 220 ms, añade `q-button-loading` y `aria-busy="true"` para mostrar shimmer sin ocultar la acción. Éxito se comunica con texto inequívoco y un aviso semántico persistente, por ejemplo `Oferta publicada`. Se respeta `prefers-reduced-motion` y todos los estados conservan foco visible y contraste.

## Flujo verificable inicial (conexión de las capas)

1. Astro muestra página local con comprobación de API.
2. `GET /api/v1/system/health` retorna estado de Express sin conectar MySQL.
3. `GET /api/v1/system/db-check` solo en desarrollo: controller → service → interfaz `SystemRepository` → `MySqlSystemRepository` → `SELECT 1` en MySQL/MariaDB.
4. `/api-docs` muestra **solo endpoints existentes**; `contratos/openapi-3.1-draft.yaml` queda como contrato planeado de ocho módulos.
5. Cuando se implemente una ruta M01–M08, actualizar OpenAPI ejecutable, añadir prueba de autorización/servicio, UI y marcar requisito.

## No implementar aún

Sin autorización adicional: enviar OTP reales, permitir cambios de estado arbitrarios, calcular scores IA reales ni habilitar roles de jefe RRHH. La retención aprobada en B-04 aún requiere eliminación segura o anonimización automatizada. Reclutadores pueden publicar varias ofertas propias sin moderación previa. Revisar `REGLAS-NEGOCIO.md`.

## M06 implementado — 2026-11-22

`evaluacion` mantiene controladores HTTP, servicio de calificación/revisión, interfaces de repositorio/asistente y adaptadores MySQL/Ollama. Las dependencias se inyectan en `server.ts`; `app.ts` monta las cuatro rutas. Ollama se consulta fuera de transacciones y su respuesta se valida contra referencias del perfil confirmado; la persistencia vuelve a verificar versión y fuentes antes de escribir. El historial usa `m06_evaluation_revisions`, creado por una migración separada, sin alterar el esquema inicial.

El frontend compone la ruta con `EvaluacionPostulante.astro` y concentra UI/API en `modules/evaluacion/`. La autorización explícita de M06 prepara la fórmula indicativa con revisión humana; los rankings, umbrales y validación real de B-06, así como la reevaluación de B-07, siguen fuera del alcance implementado. Ver [M06-IMPLEMENTACION.md](M06-IMPLEMENTACION.md).

### M07 — resultados y selección (2026-11-25)

Cuatro capas en modules/seleccion; interfaces SeleccionRepository y EvaluacionRepository inyectadas en server.ts y montaje en app.ts. La pantalla /reclutador/resultados compone modules/seleccion, con ficha en la misma página. Estado, decisión e historial se persisten atómicamente en tablas existentes. El flujo B-08 aprobado no permite reversión ni decisiones automáticas. Ver [M07-IMPLEMENTACION.md](M07-IMPLEMENTACION.md).


### M08 — seguimiento propio (2026-11-25)

Cuatro capas en modules/seguimiento, con SeguimientoRepository inyectado en server.ts y dos rutas de lectura montadas en app.ts. Las consultas restringen la propiedad por la sesión del postulante y leen estado/historial en una instantánea consistente. El DTO público excluye notas, motivos privados, actores y scores. No se requiere nueva migración.

La ruta /postulante/postulaciones compone modules/seguimiento; lista y ficha adaptable, historial real y consulta cada 30 segundos cuando la página está visible y conectada. Los cambios de estado siguen en M07 con B-08 aprobado. Ver [M08-IMPLEMENTACION.md](M08-IMPLEMENTACION.md).
