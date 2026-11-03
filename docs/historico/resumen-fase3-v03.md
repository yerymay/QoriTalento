# Qori Talento — Resumen de Fase 3 SDD (v0.3)

Elaboradas ocho especificaciones por módulo con **70 reglas EARS** y **34 escenarios Gherkin**. Trazabilidad de 32 RSF, 18 RSNF, 20 RF UI y 15 RNF UI.

## Resultado

| Módulo | Requisitos | Estado |
|---|---|---|
| 01. Gestión de usuarios, acceso y autorización | RSF01–RSF04 | Condicionada a políticas operativas de verificación |
| 02. Gestión de ofertas de empleo | RSF05–RSF08 | Condicionada a moderación y definición de oferta activa |
| 03. Postulación y gestión de CV adjunto | RSF09–RSF12 | Lista para revisión condicionada por límites de archivo y duplicados |
| 04. Lectura, extracción y revisión del CV | RSF13–RSF16 | Lista para revisión con límites de parsing pendientes |
| 05. Gestión de exámenes y tiempo límite | RSF17–RSF21 | Regla crítica aprobada; detalles de colisiones y caducidad por precisar |
| 06. Evaluación, compatibilidad y calificación | RSF22–RSF25 | PARCIAL / BLOQUEADA para RSF23–RSF25 hasta aprobar algoritmo |
| 07. Resultados y decisión de selección | RSF26–RSF29 | Condicionada a resultados RSF23/RSF24 y a transiciones |
| 08. Seguimiento y consulta de postulaciones | RSF30–RSF32 | Especificación funcional preparada; transiciones por aprobar |

## Decisiones conservadas

- Particulares: máximo **2 ofertas activas**, primera con moderación manual.
- Reclutadores de empresa: **solo sus ofertas y candidatos propios**.
- CV: extracción **clásica** de PDF digital; postulante confirma; reclutador observa/notas.
- Exámenes: **plazo estricto**, solo respuestas confirmadas por backend antes del vencimiento.
- RSF23/24: compatibilidad/puntaje aún **sin fórmula aprobada**; no inventar valores.

## Puerta de salida pendiente

1. Aprobar formalmente constitución Fase 2; las DEC-01..07 sí están aprobadas.
2. Acordar moderador, «oferta activa», controles de OTP/email, política de archivos PDF y modelo de estados de postulación.
3. Aprobar modelo de compatibilidad para poder especificar RSF23/24 completamente.
4. Luego pasar a Fase 4: arquitectura, ER, contratos API y planes técnicos; **sin código creado en Fase 3**.

Archivo principal: `Qori_Talento_Fase3_SDD_v03.zip`.
