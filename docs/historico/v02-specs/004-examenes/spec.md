# SPEC-004 — Examen cronometrado y entrega estricta

**Estado:** propuesta funcional. **IDs base:** RSF19–RSF22, RSNF12, RSNF15, RSNF17; UI RF-07, RF-18, RNF-04, RNF-09; HU-02, HU-12. **Figma:** `Candidato · Examen en línea`, `Candidato · Examen enviado`, `Candidato · Mis evaluaciones`.

## Fuente de verdad

El **backend** fija `hora_inicio` y `hora_limite` a partir de reloj de servidor confiable; la representación en Astro es solamente visual. Se almacena cada respuesta aceptada por pregunta y por intento. El intento no puede prolongarse porque el usuario recargue, cambie la hora local o desconecte la red.

## Reglas normativas EARS

- **EX-01:** CUANDO el postulante inicie un intento autorizado, EL BACKEND DEBE registrar hora de inicio y calcular una hora límite fija con tiempo del servidor. Un segundo inicio no debe reiniciar ni extender el intento vigente.
- **EX-02:** CUANDO cambie una respuesta, EL CLIENTE DEBE intentar enviarla inmediatamente. EL SERVIDOR DEBE aceptar y confirmar la respuesta solo si la identidad e intento son válidos y **la petición se ha recibido y validado antes de `hora_limite`**.
- **EX-03:** SI la misma respuesta es reintentada por problemas de red, EL SERVIDOR DEBE manejar duplicados de manera idempotente, evitando escrituras incoherentes; política para reordenación de cambios pendientes debe definirse técnicamente.
- **EX-04:** CUANDO la pestaña se cierre o se recargue antes del vencimiento, EL SISTEMA DEBE reconstruir el intento con las respuestas confirmadas en servidor y el tiempo restante calculado con el límite original.
- **EX-05:** MIENTRAS la red esté desconectada, LA INTERFAZ PUEDE conservar un borrador local y DEBE indicar **pendiente de sincronización**; no puede presentarlo como respuesta recibida por el servidor.
- **EX-06:** SI la hora límite ha vencido, EL BACKEND DEBE denegar respuestas tardías y finalizar el intento de manera idempotente utilizando solamente respuestas aceptadas dentro del plazo.
- **EX-07:** CUANDO se cierre el intento por vencimiento, LA INTERFAZ DEBE distinguir entre las respuestas efectivamente contabilizadas y las que no alcanzaron el servidor. No mostrar un falso éxito de sincronización.
- **EX-08:** SI el postulante intenta manipular el reloj del navegador, EL RESULTADO DEBE permanecer gobernado por las horas almacenadas en servidor.

## Semántica técnica sin fijar implementación

- Estados de negocio candidatos: `En_progreso`, `Terminado`, `Expirado` (especificación funcional). Estado visual `Error`/`Parcial` no equivale a `Expirado`.
- Hora fija en UTC como recomendación técnica, sujeto a arquitectura definitiva.
- La regla de admisión estricta es **`recibido_y_validado_por_servidor < hora_limite`**. No se admiten respuestas recibidas al vencer o después, incluso con marca horaria del dispositivo anterior al límite.
- Un proceso de cierre por vencimiento debe funcionar sin depender de un navegador abierto; su mecanismo se decide en el plan técnico.
- **Conflicto documental:** RNF-09 y HU-12 prometían sincronización de respuestas offline sin pérdida; se precisan para excluir aceptación tardía. RNF-04 describe envío automático máximo de 3 s, que requiere prueba y acuerdo sobre qué significa bajo desconexión.

## Criterios de aceptación

```gherkin
Escenario: Retorno antes de vencer
  Dado que un postulante inició un examen de tiempo limitado
  Y guardó tres respuestas confirmadas por servidor
  Cuando recarga la página antes del límite
  Entonces ve las tres respuestas guardadas
  Y el reloj no ha sido reiniciado

Escenario: Respuesta local después del límite
  Dado que el usuario respondió sin conexión poco antes del vencimiento
  Y la respuesta nunca llegó al servidor antes de hora_limite
  Cuando recupera la conexión después del vencimiento
  Entonces el servidor rechaza esa respuesta
  Y la calificación solo considera respuestas oportunamente aceptadas
  Y la UI informa claramente que esa respuesta no fue contabilizada

Escenario: Manipulación del reloj cliente
  Dado que el examen está en progreso
  Cuando el postulante modifica el reloj de su dispositivo
  Entonces la fecha límite del servidor permanece inalterada

Escenario: Peticiones de respuesta concurrentes
  Dado que el examen está próximo a vencer
  Cuando llegan dos escrituras conflictivas para una pregunta
  Entonces el backend aplica una regla determinista de orden/idempotencia
  Y ninguna modificación se acepta después de hora_limite
```

## Riesgo que se debe comunicar

El plazo estricto puede perjudicar a quien sufre una desconexión. El producto debe ser transparente y mostrar qué respuestas fueron confirmadas; es una consecuencia de la decisión aprobada, no un error a ocultar. Mecanismos de mitigación (p. ej. avisos preventivos) son decisiones posteriores, no prórrogas automáticas.
