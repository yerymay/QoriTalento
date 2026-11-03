# 04 · Seguridad, privacidad y autorización horizontal

## Modelo de amenazas mínimo

**Activos:** identidad/correo/teléfono, CV y perfiles, exámenes (respuestas y clave de corrección), evaluaciones IA, decisiones, trazas y tokens. **Adversarios:** usuario no autenticado, postulante accediendo a expediente ajeno, reclutador accediendo a oferta de otro aunque pertenezca a la misma empresa, cliente manipulando hora del examen, subida de PDF malicioso, prompt injection en CV, abuso de registro/OTP.

## Controles de autenticación (propuesta)

1. Hash de contraseñas con algoritmo resistente a fuerza bruta; no texto claro ni claves en repositorio.
2. Alta reclutador `INACTIVA`: verificación de correo por enlace; empresas con dirección de dominio corporativo comprobada contra política de proveedores públicos, sin asumir que eso prueba legitimidad empresarial; particulares verifican también teléfono vía SMS/WhatsApp.
3. Habilitar acceso operativo exclusivamente al cumplir verificaciones aplicables; TTL, intentos, bloqueo y proveedores sujetos a decisión D-04.
4. Proponer sesión firmada con JWT de vida corta en **cookie HttpOnly, Secure, SameSite**, rotación de refresh/revocación persistida si se adopta; no guardar secretos en `localStorage`. Control CSRF sobre mutaciones con cookies, HTTPS y política de redirección.
5. Control de sesiones separa `401` no autenticado, `403` no autorizado y `404` no visible; limitar mensajes reveladores.

## Autorización por propietario (obligatoria)

La política del backend para **cada** recurso vinculado a oferta es `owner_user_id === auth.user_id` o `candidate_user_id === auth.user_id` si el recurso pertenece al postulante, verificando FK hasta la oferta. No basta `role = RECLUTADOR` ni `organization_id`.

Ejemplos de matriz:

| Recurso | Candidato | Reclutador dueño | Reclutador de misma empresa pero no dueño |
|---|---|---|---|
| Oferta publicada (datos públicos) | Ver | Ver | Ver (sin expediente interno) |
| Editar/publicar/cerrar oferta | No | Sí, sujeto a cuota | No |
| PDF/postulación | Solo propio | Solo de su oferta | No |
| Nota de revisión CV | No | Agregar a su oferta | No |
| Crear examen | No | Para su oferta | No |
| Intento examen | Solo intento propio | Solo agregados autorizados, nunca editar respuestas | No |
| Evaluaciones IA | Según visibilidad aprobada | Solo oferta propia | No |
| Decisión | No | Solo manual y oferta propia | No |

Si el rol “Jefe de Gestión Humana” finalmente requiere un acceso supra-propietario, ello **contradice** el aislamiento individual aprobado y necesita nuevo permiso explícito (D-10); no inferirlo.

## Seguridad de archivos y modelo

- Validar tamaño/límite, firma del tipo real PDF y estructura; rechazar PDF cifrado/no legible conforme política. Antimalware y límites de consumo de parser antes de producción; almacenamiento en directorio/bucket privado fuera de rutas estáticas.
- URL de descarga nunca es ruta pública directa: Express autentica y autoriza cada petición. No incluir archivos PDF ni texto íntegro en logs de API, worker ni auditorías.
- PDF y datos CV son **contenido no confiable**: instrucciones incrustadas en CV no podrán modificar el prompt de sistema, ni permisos, ni reglas de scoring. El worker solo recibe datos minimizados permitidos.
- Ollama en `localhost`/red privada, no exponer puerto 11434 en Internet; API Express valida modelo, respuesta y versión. Nunca usar el propio texto de salida como decisión ejecutable.
- Bases de datos: credenciales mínimas por servicio, backups cifrados, acceso restringido, TLS en despliegues remotos y controles de borrado/retención pendientes.

## Auditoría y monitoreo

Loguear intentos de autorización, inicios/finales de examen, revisiones, publicación, decisión, y versiones de evaluación IA. Guardar `trace_id`, actor, recurso, tipo de evento y estado, evitando copias de PII. Definir retención/anonimización con las obligaciones de protección de datos aplicables antes de recopilar CV reales.

## Pruebas negativas obligatorias

- A y B, reclutadores de la misma empresa, no pueden consultar/editar ofertas, candidatos, CV, exámenes, rankings o decisiones entre sí; verificar APIs por ID directo y paginación.
- Alterar `owner_user_id` en body/query no cambia el ámbito de los resultados.
- Un candidato no puede ver respuestas correctas, claves ni examen de otro intento.
- Una sesión inactiva/expirada no puede ejecutar acciones protegidas.
- PDF malicioso/sin texto/hostile prompt no altera reglas ni obtiene secretos.
- Evaluación IA nunca ejecuta `Avanza/No avanza`; solo la decisión humana autorizada puede hacerlo.

Las pruebas de cumplimiento normativo y protección de datos deben revisarse con responsables legales locales; este documento no reemplaza dicha revisión.
