# Addendum Fase 4 a SPEC-F3-06 (sin reemplazar ni reescribir F3)

**Estado:** se incorpora la decisión expresa de usar IA para puntaje final y explicación, y Ollama local como motor inicial. Se mantienen bloqueos de rúbrica y calidad.

## RSF23 — comparar CV y oferta

**EARS (propuesta revisada):** Cuando exista una postulación confirmada y criterios de oferta definidos, el servicio de evaluación preparará un paquete minimizado con evidencias del CV, requisitos y nota objetiva del examen; invocará un modelo local controlado para **analizar y justificar coincidencias/no detectados**; el backend validará que cada afirmación tenga referencia verificable.

## RSF24 — proponer puntaje final y explicación

**EARS (propuesta revisada):** Una vez aprobada la rúbrica y superada su validación, el servicio de IA **generará** un puntaje final orientativo en escala validada y una explicación breve basada en evidencias; el backend rechazará el resultado si viola el esquema, inventa evidencia o carece de fundamentos, persistirá versión de modelo/prompt/rúbrica y nunca tomará una decisión final de contratación.

## RSF22 — nota objetiva independiente

Calificación de preguntas según respuestas correctas y oportunas en DB; la IA recibe esta nota **como entrada**, pero no reescribe respuestas o nota examinada.

## RSF25 y RSF26/27 — mostrar resultados

Ranking/compatibilidad no se activa con puntuaciones no validadas; UI distingue nota objetiva, sugerencia IA, evidencia faltante, error y pendiente. No convertir automáticamente «score bajo» en «No avanza».

## Gherkin propuesto

```gherkin
Escenario: Evaluación explicable con datos confirmados
  Dado un candidato que confirmó su perfil y terminó su examen
  Y una oferta con criterios laborales verificados y rúbrica aprobada
  Cuando el worker produce una evaluación con Ollama
  Entonces la API almacena la versión de modelo y las evidencias citadas
  Y presenta el puntaje sugerido con una explicación breve
  Y el estado de selección permanece sin decisión hasta que actúe el reclutador

Escenario: Resultado sin sustento
  Dado que la IA cita una experiencia ausente de las fuentes confirmadas
  Cuando el backend valida la respuesta
  Entonces marca la evaluación como NEEDS_REVIEW
  Y no publica un puntaje validado

Escenario: Sin rúbrica aprobada
  Dado que la rúbrica de puntajes sigue pendiente
  Cuando se solicita un resultado para un candidato real
  Entonces el sistema no calcula ni publica puntajes de clasificación
  Y puede mostrar únicamente el resultado objetivo del examen
```

**Puertas:** D-01 (rúbrica exacta/validación), D-08 (reevaluación al cambiar perfil) y regulación/protección de datos personales antes de producción.
