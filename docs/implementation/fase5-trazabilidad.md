# Fase 5 — Matriz mínima de trazabilidad (planificada)

**Importante:** esta matriz **no sustituye** las matrices Excel originales de F1/F2. Vincula requisitos a tareas y pruebas **planeadas**, no ejecutadas. Los requisitos UI/RNF se revisan por región además de su enlace modular.

| Requisitos RSF | Módulo | Tareas principales | Escenarios fuente | Evidencia futura |
|---|---|---|---|---|
| RSF01–04 | 01 Usuarios | `M01-01–M01-12` | U01–U04, T-01/T-02 | `tests/integration/identity/, tests/security/` |
| RSF05–08 | 02 Ofertas | `M02-01–M02-12` | O01–O05, T-03/T-04 | `tests/integration/jobs/` |
| RSF09–12 | 03 Postulaciones | `M03-01–M03-10` | P01–P04, T-15 | `tests/integration/applications/` |
| RSF13–16 | 04 CV | `M04-01–M04-10` | C01–C04, T-05/T-06 | `tests/integration/cv/` |
| RSF17–21 | 05 Exámenes | `M05-01–M05-12` | E01–E05, T-07–T-10 | `tests/integration/exams/` |
| RSF22–25 | 06 Evaluación | `M06-01–M06-13` | V01–V04, T-11–T-13 | `tests/ai/, tests/integration/evaluation/` |
| RSF26–29 | 07 Selección | `M07-01–M07-08` | R01–R04, T-14 | `tests/integration/selection/` |
| RSF30–32 | 08 Seguimiento | `M08-01–M08-08` | S01–S04, T-15/T-16 | `tests/integration/tracking/` |

## Referencias UI origen por módulo

| RF interfaz (fuente F3) | Módulo / cobertura principal | Validación transversal |
|---|---|---|
| RF-01, RF-11, RF-12, RF-13 | Gestión de usuarios, acceso y autorización (`M01`) | `V00-02`, `V00-03` |
| RF-02, RF-03, RF-14 | Gestión de ofertas (`M02`) | `V00-02`, `V00-03` |
| RF-04, RF-10, RF-15 | Postulación y adjunto PDF (`M03`) | `V00-02`, `V00-03` |
| RF-05, RF-16, RF-17 | Extracción clásica y confirmación de CV (`M04`) | `V00-02`, `V00-03` |
| RF-06, RF-07, RF-18 | Exámenes con reloj y guardado servidor (`M05`) | `V00-02`, `V00-03` |
| RF-08, RF-19 | Calificación de exámenes y evaluación IA (`M06`) | `V00-02`, `V00-03` |
| RF-08, RF-09, RF-19, RF-20 | Resultados y decisión humana (`M07`) | `V00-02`, `V00-03` |
| RF-08, RF-10, RF-13 | Seguimiento y estado de postulaciones (`M08`) | `V00-02`, `V00-03` |

Las referencias se repiten intencionalmente cuando una UI cruza módulos. Revisión formal de RSNF01–18 y RNF UI01–15 en `V00-07`/`V00-10`, junto con los documentos de origen; esta matriz no afirma que cada RNF haya sido satisfecho ni asigna métricas nuevas sin aprobación.

## Casos transversales de fase 4

| Caso | Tarea principal |
|---|---|
| T-01 | `M01-10, M02-12, V00-06` |
| T-02 | `M01-10, V00-06` |
| T-03 | `M02-06, M02-12` |
| T-04 | `M02-07, M02-12` |
| T-05 | `M04-04, M04-10` |
| T-06 | `M04-07, M04-10` |
| T-07 | `M05-06, M05-12` |
| T-08 | `M05-06, M05-12` |
| T-09 | `M05-07, M05-12` |
| T-10 | `M05-09, M05-12` |
| T-11 | `M06-08, M06-13` |
| T-12 | `M06-06, M06-13` |
| T-13 | `M06-08, M06-13` |
| T-14 | `M07-05, M07-08` |
| T-15 | `M03-08, M08-08` |
| T-16 | `M08-07, V00-02` |

## Condición de cierre

- [ ] RSF01–32 vinculados con test real, commit y evidencia.
- [ ] Revisión individual de RSNF01–18, RF UI01–20 y RNF UI01–15 con responsables.
- [ ] Los bloqueos documentados impiden declarar cubierta una funcionalidad que aún no se puede implementar.
