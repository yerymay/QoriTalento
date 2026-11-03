# 05 · Exámenes: tiempo, guardado, caducidad y consistencia

## Regla aprobada

**El servidor manda:** registra inicio/fecha límite inmutables, mantiene persistencia por pregunta y solo **acepta y contabiliza respuestas confirmadas en servidor antes de `deadline_at_utc`**. La reconexión no prorroga el examen. Esto está aprobado por el usuario.

## Protocolo lógico propuesto

1. **Iniciar:** autenticación, inscripción autorizada, estado/cupo de intento; transacción fija `started_at_utc` con reloj DB (`UTC_TIMESTAMP(6)`) y `deadline_at_utc = started_at_utc + duración`. Retorna hora del servidor para corregir el contador visual del cliente. Política de intentos múltiples pendiente.
2. **Guardar pregunta:** el cliente manda `questionId`, `optionId`, `client_revision` monotonía, y clave de idempotencia si corresponde. Express autentica candidato y propiedad del intento, valida opción del examen y abre transacción.
3. **Aceptar:** transacción toma lock del intento, comprueba estado `EN_PROGRESO` y `UTC_TIMESTAMP(6) < deadline_at_utc`; rechaza sin persistir si venció. Actualiza/crea la respuesta solo si la revisión es más nueva; retorna confirmación con `accepted_at_utc`, revisión y hora límite. No se toman tiempos enviados por el navegador como evidencia de puntualidad.
4. **Reanudar:** `GET /attempts/{id}` recalcula `server_now_utc`, devuelve solo respuestas aceptadas y el deadline original. Si venció, cierra/pide cierre y devuelve estado Expirado.
5. **Finalizar manualmente:** transacción idempotente que acepta una única transición legal antes del plazo. Al vencer, cualquier ruta valida expiración; el worker de barrido reconcilia intentos que no recibieron llamadas después del vencimiento.
6. **Calificar:** usa exclusivamente respuestas aceptadas en DB, versión de preguntas y clave; resultados persistidos y auditables. `GET`/`PUT` no revelan respuestas correctas hasta la política de publicación autorizada.

## Interpretación estricta del tiempo

- Si la petición llega al proxy antes del deadline pero se valida/persiste después, **no se acepta** conforme a la política propuesta de aceptación transaccional en servidor. El instante de aceptación es el de control DB, no el del reloj cliente; documentar esta semántica en UI.
- `<=` vs `<`: se propone **antes**, por lo tanto `< deadline_at_utc`; aprobar precisión y tratamiento de latencia con pruebas.
- En desconexión, el frontend puede conservar borrador local, pero **la UI debe mostrar `pendiente de sincronizar`**, nunca `guardado`. Respuestas no confirmadas antes de límite se descartan de la nota.
- El cierre por tiempo no depende de un `setInterval` de Astro; la API impide guardar después del límite aunque el worker haya tardado en marcar estado Expirado.
- No mezclar `pulsó opción` con `respuesta contabilizada`. Mostrar mensaje accesible de confirmación, recuperación y caducidad.

## Riesgos de concurrencia / fallos

| Riesgo | Mitigación prevista | Test |
|---|---|---|
| Dos cambios rápidos de respuesta | Revisión monotónica e idempotencia | Envío de rev. 2 antes de rev. 1; la vieja no sobrescribe |
| Dos `finish` | Condición idempotente + transacción | Solo un cierre/nota |
| Guardado simultáneo a expiración | Lock de intento y comprobación de reloj transaccional | Rechazo en límite exacto |
| Caída después de escritura | Idempotencia y lectura de estado desde DB | Reintento no duplica ni altera revisión |
| Zona horaria navegador | `UTC` oficial | Reloj local adelantado no extiende examen |
| UI pierde red | Cola local etiquetada pendiente; revalidación | No contabiliza tardías |
| Worker retrasado | Reglas de API previenen respuestas tardías | API bloquea aun `status` temporal no actualizado |

## Despliegue del cierre por tiempo

Worker periódico o job interno **propuesto** para reconciliar expiraciones; no es la autoridad sobre aceptar respuestas. Si el worker cae, la API aplica la hora límite en todas las operaciones. La recuperación no otorga puntos por respuestas offline fuera de plazo.

## Puertas pendientes

Política de `attempts` múltiples, edición de examen con intentos activos, versiones de preguntas, evento de publicación de resultados, discrepancias extremas de reloj entre aplicación y DB, definición de idempotencia/revisión y umbral de sincronización de UI.
