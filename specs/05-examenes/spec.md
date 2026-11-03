# SPEC-F3-05 — Gestión de exámenes y tiempo límite

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

**Trazabilidad:** RSF17–RSF21  
**UI de origen:** RF-06, RF-07, RF-18  
**RNF relacionados:** RSNF12, RSNF15, RSNF17; RNF-04, RNF-09, RNF-14  
**Estado del módulo:** Regla crítica aprobada; detalles de colisiones y caducidad por precisar

## 1. Propósito, actores y límites

**Objetivo.** Crear exámenes vinculados a ofertas, recoger respuestas oportunas, mantener tiempo oficial de servidor y finalizar sin aceptar respuestas tardías.

**Actores.** Reclutador propietario de oferta y examen; postulante autorizado al intento; backend reloj oficial.

**Referencias Figma.** Reclutador · Crear examen; Reclutador · Exámenes por oferta; Candidato · Mis evaluaciones; Candidato · Examen en línea; Candidato · Examen enviado. Los vínculos del prototipo son referencia de comportamiento visual, no evidencia de backend.

**Restricciones globales.** Aplican propiedad individual por creador, privacidad, conservación de información confirmada, separación de estados operativos y de negocio, y validación de operaciones protegidas por Express. El registro, permisos y tiempos nunca se confían solo al frontend Astro.

## 2. Requisitos normativos detallados (EARS)

- **EX-01** · `RSF17, RF-06` — CUANDO el reclutador propietario configure un examen, EL SISTEMA DEBE asociarlo a una de sus ofertas; un reclutador ajeno no debe consultarlo ni administrarlo.
- **EX-02** · `RSF18, RF-06` — CUANDO agregue preguntas, EL SISTEMA DEBE registrar enunciado, alternativas y respuesta correcta; el postulante no debe recibir claves correctas antes del cierre.
- **EX-03** · `RSF19, DEC-06` — CUANDO el reclutador defina duración en minutos, EL SISTEMA DEBE validar que sea positiva y conservar la duración aplicable al intento; cambio de duración de plantilla no extiende intentos ya iniciados.
- **EX-04** · `RSF20, DEC-06` — CUANDO el postulante autorizado inicie el examen, EL BACKEND DEBE registrar hora_inicio y hora_limite fijas desde reloj confiable; repetir «iniciar» no crea reinicio o prórroga del intento vigente.
- **EX-05** · `RSF20, RF-18` — CUANDO el postulante seleccione una alternativa, EL CLIENTE DEBE enviarla en segundo plano; EL SERVIDOR DEBE confirmar las respuestas aceptadas por pregunta y comunicar pendiente de sincronización si no llega confirmación.
- **EX-06** · `RSF20, DEC-05` — SI la petición de respuesta se recibe o valida después de hora_limite, EL SERVIDOR DEBE rechazarla; una marca horaria del dispositivo no permite excepción.
- **EX-07** · `RSF20, DEC-06` — CUANDO un postulante recargue o regrese antes de hora_limite, EL SISTEMA DEBE restaurar únicamente respuestas confirmadas en servidor y mostrar tiempo restante con base en hora_limite original.
- **EX-08** · `RSF21, DEC-05` — CUANDO hora_limite venza, EL BACKEND DEBE cerrar el intento de forma idempotente, incluso sin navegador abierto, y conservar únicamente respuestas aceptadas antes del plazo.
- **EX-09** · `RSF21, RNF-09` — SI se pierde conexión, LA INTERFAZ DEBE diferenciar borrador local de respuesta confirmada; al vencer debe informar que los cambios no recibidos dentro del plazo no serán calificados.
- **EX-10** · `RSF20, RSF21` — CUANDO el usuario envíe manualmente antes del límite, LA INTERFAZ DEBE pedir confirmación y EL SERVIDOR DEBE cerrar el intento impidiendo escrituras posteriores.
- **EX-11** · `RSNF12, RSNF17` — SI hay escrituras duplicadas o concurrentes, EL BACKEND DEBE evitar que un reintento sobreescriba de forma indebida una respuesta más reciente; esquema de orden definitivo se fija en plan técnico.

## 3. Estados y reglas de autorización

Plantilla examen: en preparación/disponible (nombres provisionales). Intento: En_progreso, Terminado, Expirado. Respuesta: local pendiente, confirmada servidor, rechazada tardía. El temporizador visual no crea estado de negocio.

En todos los accesos: usuario autenticado, rol autorizado, condición de cuenta aplicable y **propiedad efectiva** del recurso. Un permiso oculto en la interfaz no sustituye la validación del backend.

## 4. Interfaz y cinco estados operativos

Constructor con preguntas, controles de alternativas y duración; exam runner con reloj visible y advertencia visual ≤60s, progreso por preguntas, guardado confirmado o pendiente; al expirar mostrar resultado real de envío sin prometer sincronización tardía.

La vista de referencia debe considerar **Ideal** (datos completos), **Vacío** (sin registros pertinentes), **Parcial** (datos válidos disponibles con regiones pendientes), **Carga** (skeleton equivalente a la estructura final) y **Error** (mensaje contextual y recuperación). No se fuerza «Vacío» artificial en formularios; la aplicabilidad se revisa por región. El modo claro/oscuro, los tokens Sky e Inter y la accesibilidad se rigen por el documento transversal.

## 5. Escenarios de aceptación (Gherkin)

### E01 · Tiempo del servidor
```gherkin
Escenario: Tiempo del servidor
  Dado que un postulante comienza un examen de duración configurada
  Cuando inicia un intento y luego recarga la página
  Entonces la hora límite permanece idéntica y se conservan respuestas confirmadas
```

### E02 · Respuesta tardía
```gherkin
Escenario: Respuesta tardía
  Dado que un intento venció mientras el cliente estaba desconectado
  Cuando se intenta subir una respuesta no recibida antes de hora_limite
  Entonces el backend la rechaza y no la contabiliza
```

### E03 · Manipular reloj local
```gherkin
Escenario: Manipular reloj local
  Dado que el postulante adelanta o atrasa el reloj de su computadora
  Cuando continúa el examen
  Entonces el backend conserva el plazo que registró al iniciar
```

### E04 · Dos cierres simultáneos
```gherkin
Escenario: Dos cierres simultáneos
  Dado que un intento alcanzó su límite mientras el usuario presiona Enviar
  Cuando se reciben solicitudes concurrentes de cierre
  Entonces se registra un único cierre lógico con respuestas oportunamente aceptadas
```

### E05 · Clave de examen protegida
```gherkin
Escenario: Clave de examen protegida
  Dado un postulante con un examen vigente
  Cuando solicita el contenido del examen
  Entonces el servidor no revela las respuestas correctas
```

## 6. Condiciones de prueba y casos negativos

- Probar flujo principal **y** validaciones de entrada, autorizaciones fallidas, recursos inexistentes y condiciones de carrera cuando apliquen.
- Verificar el resultado en backend y UI por separado; una interacción Figma no aprueba la lógica del servidor.
- Los datos de prueba deben ser sintéticos y no exponer CVs, credenciales o información privada real.
- Garantizar que los mensajes de error no revelen registros de otros usuarios.

## 7. Decisiones pendientes y condición de salida

Política de intentos (cuántos por postulante), orden de escrituras de una misma respuesta, criterio de recepción validada en frontera temporal, recuperación ante caída de servidor, visibilidad y desbloqueo del examen, política de denuncias/incidencias.

**Criterio de salida:** aprobar las reglas pendientes que cambian comportamiento, integrar los cambios RF/RNF en la línea base y tener criterios de aceptación revisados. Hasta entonces este `spec.md` es **listo para revisión**, no autorización para implementar puntos bloqueados.
