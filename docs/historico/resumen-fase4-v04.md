# Qori Talento — Resultado Fase 4 SDD v0.4

## Entrega

Arquitectura conceptual Astro + Tailwind/Flowbite, Express modular, MySQL InnoDB y Ollama local `qwen2.5:7b-instruct`, **sin implementar código de aplicación**.

**Contenido:** `README.md`, 12 documentos técnicos, 8 planes `plan.md`, 1 addendum de RSF23/24, OpenAPI 3.1 en estado de borrador y 3 diagramas Mermaid.

### Decisiones incorporadas

- Particulares: **máximo dos ofertas activas**, primera moderada; qué significa “activa” y quién modera todavía pendientes.
- Empresas: **cada reclutador ve solo sus ofertas y candidatos**, no se comparten internamente.
- CV: extracción **clásica de PDF digital**; postulante confirma; reclutador lee y comenta sin alterar fuente.
- Examen: tiempo y validación de respuestas **autoritativos en servidor**, vencimiento estricto; respuestas locales tardías no cuentan.
- IA: `qwen2.5:7b-instruct` a través de Ollama local, propone **puntaje final y breve explicación**, con evidencias y revisión humana. **Rúbrica/umbrales/calibración NO aprobados**; no publicar rankings reales todavía.

### Decisiones arquitectónicas propuestas (no aprobadas automáticamente)

Monolito modular Express, Astro SSR selectivo, API REST `/api/v1` bajo mismo origen, MySQL InnoDB con transacciones, PDFs privados, worker IA y cookies HttpOnly seguras; deben revisarse antes de scaffold.

### Riesgos/puertas

Moderación de ofertas, definición de activa, políticas de verificación SMS/email, multiplicidad postulación/intento, versionado de examen y CV, rúbrica IA, transiciones de postulación y Constitución SDD de Fase 2 todavía borrador.

### Qué sigue

Revisar y aprobar bloqueos/ADR → Fase 5 generar `tasks.md` y pruebas por módulo → implementación progresiva. **No se han creado frontend/backend ejecutables, migraciones SQL, endpoints ni se ha modificado Figma**.

Archivo ZIP principal: `Qori_Talento_Fase4_SDD_v04.zip`.
