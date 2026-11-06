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

Sin autorización adicional: publicar oferta particular, enviar OTP reales, permitir cambios de estado arbitrarios, calcular scores IA reales, habilitar roles de jefe RRHH ni fijar retención. Revisar `REGLAS-NEGOCIO.md`.
