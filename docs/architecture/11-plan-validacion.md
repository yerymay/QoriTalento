# 11 · Plan de validación y pruebas (sin ejecutar)

## Pirámide de pruebas propuesta

1. **Unidad**: validadores, parsing clásico, cuota, transición de negocio, temporizador basado en hora servidor, calificación objetiva, formateo de resultado IA.
2. **Integración**: MySQL transaccional y locks; endpoints auth/propiedad; upload/storage privado; worker de expiración; adaptador Ollama con salida simulada.
3. **Contrato**: OpenAPI y JSON schemas; errores 401/403/404/409/410/422; respuestas consistentes, no PII accidental.
4. **E2E**: flujos reclutador→oferta→examen, candidato→oferta→PDF→confirmación→examen→seguimiento, reclutador→evaluación→decisión.
5. **Accesibilidad visual**: cinco estados por región, Flowbite, móvil, teclado, tema oscuro, contraste; eliminar los 20 saltos entre roles de Figma antes de usar sus recorridos como referencia.
6. **IA responsable**: dataset sintético, resultados de referencia humanos, evidencia verificable, estabilidad, sesgos, ataques de prompt y revisión humana.

## Casos de aceptación de seguridad y concurrencia — mínimos

| ID | Prueba | Resultado esperado | Requisito |
|---|---|---|---|
| T-01 | Dos reclutadores de misma empresa intentan acceder a ofertas del otro | denegado en backend | RSF04/RSNF06 |
| T-02 | Manipular owner_user_id en request | el backend ignora y fuerza principal sesión | RSF04/RSNF07 |
| T-03 | Particular con 1 cupo y 2 publicaciones paralelas | como máximo una publicación adicional | RSF07/A-02 |
| T-04 | Primera oferta particular sin moderación | no aparece pública | RSF07/A-02 |
| T-05 | PDF digital con campos incompletos | No detectado + edición candidato | RSF13–15 |
| T-06 | Reclutador intenta editar perfil confirmado | denegado; notas por separado | RSF16/A-05 |
| T-07 | Respuesta de examen a hora límite | no se admite tardía | RSF20/21/A-06 |
| T-08 | Respuestas rev2 y rev1 llegan invertidas | prevalece la revisión actual, no duplicación | RSF20/RSNF15 |
| T-09 | Reanudar intento después de cierre navegador | deadline original y respuestas aceptadas | RSF20/21 |
| T-10 | Desconexión con respuestas solo locales al vencer | se informa que no cuentan | RNF-09 modificado/A-06 |
| T-11 | IA inventa certificación no presente | score no publicable, revisión requerida | RSF23/24 |
| T-12 | IA devuelve JSON inválido/timeout | fallo aislado; no rompe nota objetiva | RSF24/RSNF04 |
| T-13 | IA devuelve score válido pero no justificado | rechazar resultado; NO mostrar ranking | RSF24/25 |
| T-14 | Reclutador cambia decisión con confirmación | historial actor/fecha, no atribuir decisión a IA | RSF28/29 |
| T-15 | Candidato accede a estado de otra postulación | denegado | RSF12/32 |
| T-16 | UI Estado Vacío del candidato | CTA contextual; nunca ir a crear oferta | RNF-07/RSF04 |

## Rendimiento y pruebas observables

- UI skeleton `< 200 ms` según RNF-01 para listados normales; feedback de interacción `< 100 ms` según RNF-08; mensajes de cierre de operación `< 1 s` según RNF-08, medidos en condiciones establecidas.
- Respuesta normal listados `≤ 3 s`; IA asíncrona no se confunde con endpoint completo; instrumentar histograma.
- Temporizador de UI objetivo desviación `± 1 s` contra reloj servidor; server siempre impide guardado tardío; ensayar pestaña suspendida y reload.
- Rendimiento de Ollama Qwen2.5 7B en equipo 16GB RAM/8GB GPU: **medir**, no prometer latencia o concurrencia sin benchmark.
- Seguridad: test IDOR/BOLA, validación de contenido PDF, rate-limit y CSRF cuando se elija cookie, privacidad en logs/prompts.

## Calidad de evaluación IA

Antes de publicar puntajes: rúbrica consensuada + datos sintéticos diversos + comparación contra expertos + explicación verificable + pruebas de invariancia ante atributos irrelevantes + medición de repetibilidad. Definir umbrales de aceptación en B-06; el resto son **propuestas** de control, no certificación automática.

## Evidencia de finalización

Por cada caso, conservar `test_id`, versión de spec y API, entorno, resultado, métricas, evidencia y enlaces a correcciones. Una tarea de implementación no se declara terminada con Figma únicamente.
