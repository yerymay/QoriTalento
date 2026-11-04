# Qori Talento — MVP

MVP académico de reclutamiento organizado en ocho módulos (M01–M08). El proyecto separa el frontend y el backend en dos aplicaciones npm independientes:

- **Backend:** Node.js + Express 5 + TypeScript (ESM), con arquitectura de cuatro capas por módulo.
- **Frontend:** Astro 5 + TypeScript + Tailwind CSS v4 + Flowbite.
- **Base de datos:** MySQL 8.0+ o MariaDB 10.6+ (InnoDB).
- **API:** REST JSON bajo `/api/v1`, documentada con OpenAPI/Swagger.

> **Estado actual:** el repositorio incluye la infraestructura base y el módulo `system` (comprobación de conexión). Los módulos funcionales M01–M08 están planificados y aún no implementados. Las rutas de `docs-mvp/API-PREVISTA.md` son un contrato planeado, no endpoints disponibles.

## Requisitos previos

- **Node.js >= 20.19.0** y npm. Verifica con `node -v` y `npm -v`.
- **MySQL 8.0+ o MariaDB 10.6+** en ejecución.
- Un cliente MySQL (`mysql`) disponible en la terminal.
- Git (opcional, solo si vas a clonar el repositorio).

No existe un `package.json` en la raíz ni workspaces: las dependencias se instalan por separado dentro de `Backend/` y `Frontend/`.

## Estructura del proyecto

```text
QoriTalento_MVP/
├── Backend/                  # API Express + TypeScript
│   ├── src/
│   │   ├── config/           # variables de entorno
│   │   ├── modules/system/   # ejemplo de las cuatro capas
│   │   ├── shared/           # conexión MySQL y utilidades
│   │   ├── app.ts            # montaje de rutas y Swagger
│   │   └── server.ts         # punto de composición e inyección
│   ├── tests/                # pruebas Vitest + Supertest
│   ├── openapi-implemented.yaml
│   └── package.json
├── Frontend/                 # Astro + Tailwind + Flowbite
│   ├── src/
│   │   ├── layouts/
│   │   ├── modules/
│   │   ├── pages/
│   │   └── styles/
│   └── package.json
├── database/01_schema.sql    # esquema inicial (24 tablas)
├── contratos/                # OpenAPI planeado
├── docs-mvp/                 # requerimientos, reglas, arquitectura y progreso
└── AGENTS.md                 # guía para agentes de IA
```

## 1. Preparar la base de datos

El script `database/01_schema.sql` crea la base `qori_talento`, sus 24 tablas y sus índices/relaciones. Es **no destructivo**: usa `CREATE TABLE IF NOT EXISTS` y no elimina datos.

### 1.1 Aplicar el esquema

Desde la raíz del proyecto:

```bash
mysql -u root -p < database/01_schema.sql
```

> **PowerShell:** `cmd /c "mysql -u root -p < database\01_schema.sql"`.
> Si tu cliente no acepta la redirección, entra con `mysql -u root -p` y ejecuta `SOURCE C:/ruta/a/QoriTalento_MVP/database/01_schema.sql;`.

### 1.2 Crear el usuario de la aplicación

Copia y ejecuta en el cliente MySQL, cambiando `TU_PASSWORD_LOCAL` por tu contraseña:

```sql
CREATE USER IF NOT EXISTS 'qori_app'@'localhost' IDENTIFIED BY 'TU_PASSWORD_LOCAL';
GRANT SELECT, INSERT, UPDATE, DELETE ON qori_talento.* TO 'qori_app'@'localhost';
FLUSH PRIVILEGES;
```

> Usa el host correcto (`localhost` o `127.0.0.1`) según tu servidor. No uses `%` sin revisar el acceso.

### 1.3 Comprobar (opcional)

```bash
mysql -u root -p -e "SELECT COUNT(*) AS tablas FROM information_schema.tables WHERE table_schema='qori_talento' AND table_type='BASE TABLE';"
```

Debe devolver **24**. El script no migra ni altera tablas existentes: cualquier cambio de esquema requiere un script aparte.

## 2. Configurar y ejecutar el backend

```powershell
cd Backend
Copy-Item .env.example .env
```

En Bash/macOS/Linux:

```bash
cd Backend
cp .env.example .env
```

Edita `Backend/.env` y coloca la contraseña real de `qori_app`:

```dotenv
NODE_ENV=development
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=qori_app
DB_PASSWORD=TU_PASSWORD_LOCAL
DB_NAME=qori_talento
```

Instala dependencias y arranca:

```powershell
npm install
npm run dev
```

El backend queda disponible en `http://127.0.0.1:3001`.

### Endpoints de comprobación

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de la API; funciona aunque MySQL esté caído. |
| `GET` | `/api/v1/system/health` | Estado de la API bajo el prefijo versionado. |
| `GET` | `/api/v1/system/db-check` | Ejecuta `SELECT 1` contra MySQL. **Solo en desarrollo** (`NODE_ENV !== production`). |
| `GET` | `/api-docs/` | Swagger con los endpoints realmente implementados. |

`/api/v1/system/db-check` responde `503` con un error estructurado si MySQL no está disponible; nunca expone credenciales ni detalles internos.

> Ejecuta siempre el backend desde la carpeta `Backend/`: Swagger resuelve `openapi-implemented.yaml` usando `process.cwd()`.

### Variables de entorno

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `NODE_ENV` | `development` | En `production` no se monta `db-check`. |
| `PORT` | `3001` | Puerto HTTP del backend. |
| `DB_HOST` | `127.0.0.1` | Host de MySQL/MariaDB. |
| `DB_PORT` | `3306` | Puerto de MySQL/MariaDB. |
| `DB_USER` | `qori_app` | Usuario de aplicación. |
| `DB_PASSWORD` | *(vacío)* | Contraseña local; nunca se versiona. |
| `DB_NAME` | `qori_talento` | Nombre de la base de datos. |

## 3. Configurar y ejecutar el frontend

En otra terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Abre `http://127.0.0.1:4321/`. La página comprueba la API y la conexión a la base de datos.

El proxy `/api` hacia `http://127.0.0.1:3001` está configurado **solo para desarrollo** en `Frontend/astro.config.mjs`. En despliegue deberás configurar un reverse proxy o una URL de API con CORS y sesiones seguras.

## 4. Verificación y pruebas

### Backend

```powershell
cd Backend
npm run check   # tsc --noEmit
npm test        # Vitest + Supertest (no requiere MySQL)
npm run build   # compila a dist/
```

- Un archivo de prueba: `npx vitest run tests/system.test.ts`
- Un caso concreto: `npx vitest run -t "texto del caso"`
- Orden recomendado: `npm run check` -> `npm test` -> `npm run build`.
- `npm run check` **no** typechequea la carpeta `tests/` (excluida en `tsconfig.json`).
- Para ejecutar la versión compilada: `npm start` (desde `Backend/`).

### Frontend

```powershell
cd Frontend
npm run check   # astro check
npm run build   # genera dist/
npm run preview # sirve la build localmente
```

No hay linter ni pruebas automatizadas de frontend configuradas.

## Solución de problemas

- **`db-check` devuelve `503`:** confirma que MySQL está en ejecución, que `DB_PASSWORD` es correcta y que el usuario existe para el host usado. Prueba `mysql -u qori_app -p -h 127.0.0.1`.
- **`EADDRINUSE` en el puerto 3001 o 4321:** cierra el proceso que lo ocupa o cambia `PORT` en `Backend/.env`. Si cambias el puerto del backend, actualiza también el proxy en `Frontend/astro.config.mjs`.
- **Swagger da error o no encuentra el YAML:** inicia el backend desde `Backend/`, no desde la raíz del repositorio.
- **PowerShell rechaza `<`:** usa `cmd /c "mysql -u root -p < database\01_schema.sql"` o el comando `SOURCE` dentro del cliente MySQL.
- **`npm install` falla en la raíz:** no hay `package.json` raíz. Ejecuta la instalación dentro de `Backend/` o `Frontend/`.
- **El frontend muestra la API como “No disponible”:** verifica que el backend esté corriendo en `127.0.0.1:3001`. El proxy solo aplica en desarrollo.
- **Versión de Node incorrecta:** actualiza a Node >= 20.19.0; `package.json` declara esa versión mínima.

## Documentación del proyecto

- `docs-mvp/REQUERIMIENTOS.md` — checklist de requisitos (RSF, RSNF, UI).
- `docs-mvp/REGLAS-NEGOCIO.md` — reglas confirmadas y decisiones pendientes B-01..B-10.
- `docs-mvp/ARQUITECTURA.md` — arquitectura de cuatro capas y frontend modular.
- `docs-mvp/PROGRESO.md` — etapas, evidencia y estado real.
- `docs-mvp/API-PREVISTA.md` — catálogo planeado de 38 operaciones (no implementadas).
- `Backend/openapi-implemented.yaml` — contrato OpenAPI de rutas implementadas (Swagger).
- `contratos/openapi-3.1-draft.yaml` — contrato OpenAPI planeado del SDD.

## Alcance y seguridad

- **Nunca** subas `Backend/.env` al repositorio. Las credenciales viven solo en el entorno local.
- El usuario de base de datos debe tener el mínimo privilegio necesario.
- No inventes ni implementes las decisiones pendientes B-01..B-10; consulta `docs-mvp/REGLAS-NEGOCIO.md`.
- El backend verifica propietario y rol en cada operación: no confíes en un `user_id` enviado por el formulario.
- Los CV deben ser PDF con texto y almacenarse de forma privada, fuera de carpetas públicas.
- La evaluación con IA (Ollama `qwen2.5:7b-instruct`) es indicativa y requiere revisión humana.
