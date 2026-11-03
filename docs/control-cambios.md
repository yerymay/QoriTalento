# Control de cambios respecto de documentación fuente

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

No sobrescribir los originales sin aprobación. Los cambios aquí son candidatos a una revisión controlada del documento principal y de UI; no se incrementa el conteo inicial de 85 requisitos.

| Cambio | Fuente | Nueva interpretación respaldada | Acción documental |
|---|---|---|---|
| CC-01 | RSF01 / RF-11 / HU-07 | Registro segmentado empresa/particular, verificación correo/teléfono y estado Inactivo de reclutador | Actualizar redacción y añadir ADD-RF-01/02 |
| CC-02 | RSF04 / RSNF06/07/18 / RF-13 | Permisos por rol **y creador de oferta**, incluso dentro de empresa | Añadir pruebas negativas cross-owner |
| CC-03 | RSF05/07/08 / RF-02/14 / HU-05 | Dos ofertas activas de particular; primera moderada antes de pública | Añadir ADD-RF-03/04 y definición pendiente de activa |
| CC-04 | RSF13/14/15 / RF-16/17 | Extracción clásica PDF digital y corrección por candidato | Sustituir alusiones del método de IA como extractor del MVP |
| CC-05 | **RF-05 / HU-01** | En origen reclutador corrige; ahora **solo lee/audita/añade notas** | Cambiar interacción y escenario; RSF16 no ordenaba edición |
| CC-06 | RSF19/20/21/22 / RF-07/18 / RNF-04/09 / HU-02/12 | Tiempo servidor, guardado confirmado y vencimiento estricto; offline no admite entrega tardía | Desambiguar «enviado» y «guardado» |
| CC-07 | RSF23/24 / RF-08/19 / HU-13 | Función de compatibilidad persiste pero su algoritmo NO está aprobado | Bloquear fórmula sin borrar el requisito |
| CC-08 | RSF28/29/31 / RF-10/20 | Decisión humana, registro auditable y transitions pending | Definir máquina de estados y reversión |

## Fuentes inalteradas

- `1__Requerimientos_Funcionales_y_no_funcionales_COMPLETO.pdf` — 32 RSF + 18 RSNF, versión 1.0.
- `Texto pegado(5).txt` — 20 RF UI + 15 RNF UI y 13 HU.
- `QoriTalento_SDD_v02` — decisiones DEC-01..07 y cinco specs temáticas utilizadas como antecedente.
- Figma archivo `eoMSNdb9Cl0OmQU6BqKuZD` nodos `7116:2` (fundamentos) y `11106:2` (prototipo v2); no se realizaron cambios.
