# Trazabilidad de las 13 historias de usuario originales

> Las historias HU-01..HU-13 provienen del documento de UI. Se conserva su ID y se marca cuando una decisión posterior exige una modificación, sin editar el original.

| Historia original | Asunto | Spec F3 | Ajuste respecto de fuente |
|---|---|---|---|
| HU-01 | Revisión/corrección de datos extraídos | 04-extraccion-cv | Cambiar: reclutador revisa y anota; postulante corrige; antiguo criterio queda supersedido por DEC-07 |
| HU-02 | Examen y fin por agotarse tiempo | 05-examenes | Precisar cierre backend con respuestas recibidas oportunamente |
| HU-03 | Comparación de postulantes | 06-evaluacion / 07-resultados-seleccion | Orden/filtro condicionado a fórmula RSF23/24 |
| HU-04 | Carga del CV PDF | 03-postulaciones / 04-extraccion-cv | Clásica, solo PDF; límites pendientes |
| HU-05 | Creación/publicación de oferta | 02-ofertas | Cuota dos particulares y moderación primera oferta |
| HU-06 | Acceso por rol | 01-gestion-usuarios | Cuenta activa y backend por propiedad |
| HU-07 | Registro eligiendo rol | 01-gestion-usuarios | Segmentación empresa/particular, correo/teléfono |
| HU-08 | Confirmar postulación | 03-postulaciones | PDF válido y datos confirmados antes del envío |
| HU-09 | Seguimiento | 08-seguimiento | Transiciones definitivas pendientes |
| HU-10 | Creación de examen | 05-examenes | Propiedad oferta y duración definida |
| HU-11 | Preselección en ficha | 07-resultados-seleccion | Decisión humana, confirmación y auditoría |
| HU-12 | Respuestas ante corte de conexión | 05-examenes | No admitir fuera de plazo, aunque existan borradores locales |
| HU-13 | Compatibilidad explicada | 06-evaluacion / 07-resultados-seleccion | BLOQUEADO: fórmula y umbrales pendientes |

## Control de aprobación

- «Cambiar/precisar» no constituye modificación formal del TXT original sin control de cambios.
- Para HU-12, el borrador local de respuesta **no** equivale a confirmación de recepción en servidor.
- Para HU-13, ninguna representación de puntaje debe presentarse como resultado real sin método aprobado.
