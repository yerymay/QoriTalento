# 08 · Despliegue, entornos y observabilidad — propuesta

## Entornos

| Entorno | Disposición prevista | Condición |
|---|---|---|
| Local académico | Astro, Express, MySQL y Ollama en el equipo del usuario; GPU 8 GB/ RAM 16 GB | pruebas funcionales con datos sintéticos; medir consumo real de qwen2.5:7b-instruct |
| Integración | API + DB de prueba y modelo IA local/servidor reservado o adaptador simulado | no copiar datos personales reales |
| Producción futura | Proxy HTTPS, Astro SSR, Express, MySQL administrado/seguro, almacenamiento PDF privado y worker IA con GPU apropiada | **infraestructura y presupuesto sin aprobar**, no prometer coste cero |

**Restricción:** la API de Ollama (`11434`) no debe ser accesible desde Internet; usar loopback o red privada. Nunca exponer MySQL ni archivos CV. El servicio de inferencia es una dependencia interna y puede estar fuera de línea; el ATS deberá informar `PENDING/FAILED` en vez de bloquear toda la web.

## Operación mínima

- Logs estructurados con `request_id`, rol, recurso y duración; redactar correo, teléfono, CV y prompts de registros ordinarios.
- Métricas: p50/p95 de API, latencia parser PDF, cola IA, tiempo por evaluación, ratio `NEEDS_REVIEW`, fallos de autorización, errores de sincronización examen, expiraciones procesadas, almacenamiento PDF.
- Health checks separados: Astro, Express, MySQL, Ollama; endpoint de readiness para trabajo IA no equivale a disponibilidad del resto del sitio.
- Copias de seguridad MySQL + PDFs privados + claves de recuperación bajo políticas; ensayar restauración antes de usar datos reales.
- Secrets fuera del repositorio: credenciales DB, firmas cookie/JWT, claves de proveedores correo/SMS. `example.env` solo nombres, no valores reales (cuando empiece implementación).
- Evitar reintentos infinitos de IA/SMTP/SMS; definir backoff, límites y cola de errores con revisión humana.
- Controles de concurrencia y transacciones InnoDB + manejo de deadlocks/reintentos seguros; índices conforme consultas de producción.

## Rendimiento y requisitos

- RNF-01 (UI) indica skeleton en menos de 200ms y listados de datos normales ≤3 s. Las evaluaciones IA en GPU local **pueden exceder 3 s**: tratarlas como trabajo asíncrono `202`, UI progresiva. No interpretar el cumplimiento de `202` como que la puntuación final estuvo lista en menos de 3 s.
- RNF-04 temporizador: fuente oficial servidor/DB, no se garantiza desviación ±1s sin pruebas de sincronización, latencia y rehidratación; medir.
- RNF-08: feedback UI rápido con aceptación de estado; no inventar éxito del servidor antes de confirmación.
- Disponibilidad/retención no están cuantificadas completamente en RSNF03, RSNF09, RSNF15: definir SLO en próxima fase.

## Dependencias externas con costo/riesgo no resuelto

Registro de reclutadores exige correo de verificación y SMS/WhatsApp para particulares. **No presupuestar coste cero** ni proveedor hasta aprobación. Registros y moderación deben ser seguros incluso si un proveedor está caído.
