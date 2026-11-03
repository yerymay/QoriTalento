# Fase 5 — Validación integral y cierre

**Estado: backlog NO implementado.** Se revisan las puertas y fuentes F1–F4 antes de programar.

**Leyenda:** `P0` crítico, `P1` prioritario, `P2` diferible; tamaños S/M/L relativos. Cada tarea especifica verificaciones, dependencias y bloqueo.

- [ ] **V00-01 · Corregir y verificar navegación por rol**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-22`, `M01-11`, `M02-11`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Validar rutas y flujos Figma→Astro, sin interacciones candidato→reclutador; planificar actualización Figma autorizada.
  - **Destino propuesto:** `tests/e2e/navigation/, docs/quality/ui-trace.md`.
  - **Verificación exigida:** Se revisan 20 defectos conocidos; evidencia por pantalla y rol.

- [ ] **V00-02 · Auditar 5 estados UI por región aplicable**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-21`, `M01-11`, `M02-10`, `M03-09`, `M04-09`, `M05-11`, `M06-12`, `M07-07`, `M08-07`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Crear matriz de 22 vistas × regiones aplicables: Ideal/Vacío/Parcial/Carga/Error, validaciones y fallos de datos.
  - **Destino propuesto:** `docs/quality/ui-state-matrix.md, tests/e2e/ui-states/`.
  - **Verificación exigida:** No hay sidebar Estados de UI, no existen pantallas artificiales de vacío en formularios.

- [ ] **V00-03 · Verificar diseño responsive y accesibilidad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `V00-02`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Probar resoluciones 360/390/768/1280/1440/1920, tabulación, foco, contraste, textos y lectores de pantalla en flujos críticos.
  - **Destino propuesto:** `tests/a11y/, docs/quality/a11y.md`.
  - **Verificación exigida:** No hay scroll horizontal global; controles accesibles y tema claro/oscuro coherente.

- [ ] **V00-04 · E2E candidato completo**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M01-12`, `M02-12`, `M03-10`, `M04-10`, `M05-12`, `M08-08`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Registro→ofertas→postulación→PDF→confirmación→examen→seguimiento con datos ficticios y fallos por etapa.
  - **Destino propuesto:** `tests/e2e/candidate-journey/`.
  - **Verificación exigida:** Cada etapa usa API real y verifica persistencia; no mocks de backend para aceptación.

- [ ] **V00-05 · E2E reclutador completo**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M01-12`, `M02-12`, `M05-12`, `M06-13`, `M07-08`, `M08-08`.
  - **Puerta de ejecución:** `B-06`, `B-08`.
  - **Acción:** Registro/verificación→oferta/moderación→examen→resultados disponibles→decisión humana→timeline; con dos reclutadores de misma empresa.
  - **Destino propuesto:** `tests/e2e/recruiter-journey/`.
  - **Verificación exigida:** Respeta cuota, propiedad, score no validado oculto y actor decisión.

- [ ] **V00-06 · Auditoría integral IDOR, CSRF y privacidad**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-24`, `M03-10`, `M05-12`, `M07-08`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Probar acceso cruzado por IDs, archivos PDF, exam keys, estados y logs; cookies seguras y límites de uso.
  - **Destino propuesto:** `tests/security/, docs/quality/security.md`.
  - **Verificación exigida:** T-01/T-02/T-06/T-15; ninguna ruta pública revela CV, respuestas ni secretos.

- [ ] **V00-07 · Carga, límites y tiempo de respuesta**
  - **Prioridad / tamaño relativo:** `P1` / `L`. **Dependencias:** `M00-23`, `M02-12`, `M05-12`, `M06-13`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Medir listados ≤3s, skeleton <200ms, feedback <100ms, confirmaciones <1s bajo entornos definidos; IA asíncrona no es SLA síncrono.
  - **Destino propuesto:** `tests/performance/, docs/quality/performance.md`.
  - **Verificación exigida:** Resultados reproducibles con entorno/carga/percentil anotados; no promesas sin medición.

- [ ] **V00-08 · Prueba de resiliencia y backups**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-23`, `M05-12`, `M06-13`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Simular caída de MySQL, reinicio de workers, pérdida de red, Ollama no disponible, expiraciones; verificar restauración de BD/archivo.
  - **Destino propuesto:** `tests/resilience/, docs/operations/`.
  - **Verificación exigida:** No se aceptan respuestas tardías; fallo Ollama no afecta nota objetiva; se recupera información confirmada.

- [ ] **V00-09 · Revisar seguridad y equidad del score IA**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M06-13`.
  - **Puerta de ejecución:** `B-06`.
  - **Acción:** Ejecutar suite sintética y revisión humana documentada antes de exponer score en producción.
  - **Destino propuesto:** `tests/ai/, docs/quality/ai-evaluation.md`.
  - **Verificación exigida:** T-11–T-13; sin rúbrica/benchmark aprobado, score permanece deshabilitado.

- [ ] **V00-10 · Consolidar trazabilidad y evidencia de aceptación**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `M00-09`, `V00-04`, `V00-05`, `V00-06`, `V00-09`.
  - **Puerta de ejecución:** Sin bloqueo de negocio propio (respetar puertas globales).
  - **Acción:** Enlazar 32 RSF, 18 RSNF, 20 RF UI, 15 RNF UI, escenarios, módulos, tareas, tests y resultados reales.
  - **Destino propuesto:** `docs/implementation/fase5-trazabilidad.md, docs/quality/evidence/`.
  - **Verificación exigida:** Ningún requisito sin tratamiento explícito; toda tarea terminada tiene evidencia verificable.

- [ ] **V00-11 · Revisión final de release y despliegue**
  - **Prioridad / tamaño relativo:** `P0` / `L`. **Dependencias:** `V00-03`, `V00-07`, `V00-08`, `V00-10`.
  - **Puerta de ejecución:** `B-10`.
  - **Acción:** Checklist de config/secretos, migración/rollback, jobs, backup, controles de privacidad, métricas y permisos de producción.
  - **Destino propuesto:** `docs/operations/release-checklist.md`.
  - **Verificación exigida:** Sólo se declara listo si todas las puertas relevantes están aprobadas y los tests críticos pasan.
