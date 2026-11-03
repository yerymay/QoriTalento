# Especificaciones transversales de calidad — RSNF / RNF UI

> **Línea base de trabajo:** Fase 3 / v0.3 / 2026-11-02. **Estado:** especificación preparada para revisión; no equivale a requisitos formalmente aprobados ni a implementación. Los originales PDF/TXT se mantienen intactos. Constitución SDD de Fase 2 aún en borrador.

Los umbrales de esta tabla solo se declaran **medibles** cuando el documento fuente los aporta expresamente. El resto permanece como objetivos que deberán concretarse durante planificación técnica, no promesas de producción.

| Área | IDs | Contrato verificable / criterio de aceptación |
|---|---|---|
| Tiempo de respuesta | RSNF04, RNF-01 | Fuente: máximo 3 s para respuesta normal; UI: mostrar skeleton de listado antes de 200 ms y datos dentro de 3 s bajo condiciones normales. Definir conjunto de prueba, volúmenes, percentil y excepciones antes de certificar. |
| Extracción de PDF | RSNF03 | Tiempo «razonable» sin umbral numérico: pendiente diseñar benchmark según archivo digital, tamaño y carga. La extracción puede ser parcial o fallar de manera explícita. |
| Feedback | RNF-05, RNF-08 | Mensajes de error en ≤1 s, feedback visual de acción en <100 ms y toast ≤1 s después de completar acción, conforme documento UI. No usar toast para afirmar entrega que backend no confirmó. |
| Accesibilidad | RSNF01/02, RNF-02/10/11/13 | Texto normal contraste ≥4.5:1, no solo color; controles táctiles ≥44×44 px con ≥8 px de separación; navegación teclado con foco visible; texto base 16px (revisar excepciones tipográficas para control/ayuda). |
| Responsive | RSNF11, RNF-03 | UI utilizable a 360px de ancho en adelante, sin scroll horizontal **de la página**; tablas pueden tener región propia con scroll. |
| Navegadores | RSNF10, RNF-12 | Últimas 2 versiones estables de Chrome, Edge y Firefox; pruebas sobre una misma matriz de flujo. |
| Tiempo de examen | RSNF17, RNF-04, DEC-05/06 | Cronómetro representativo cada segundo con desviación visual objetivo ±1 s vs referencia servidor; `hora_limite` inmutable; cierre lógico al vencer aun sin cliente; el «envío ≤3s» se comprobará en condiciones con conectividad, no puede prometer transmisión offline. |
| Conexión interrumpida | RNF-09, DEC-05 | Mostrar aviso persistente; respuestas locales solo `Pendiente` hasta confirmación del servidor. No aceptar fuera del plazo. Resolver retención y seguridad del almacenamiento local antes de implementar. |
| Seguridad y privacidad | RSNF05/06/07/08/12/18, RNF-15 | Validación backend de identidad/rol/estado y dueño; prohibir IDOR entre reclutadores de misma empresa; contraseñas protegidas; documentos privados; historial de cambios. Política sesión/OTP y retención aún abiertas. |
| Integridad/confiabilidad | RSNF12/15/17 | Garantizar cierre idempotente; datos de exámenes confirmados persistidos; deduplicación y orden de respuestas, publicación bajo cupo concurrente; transacciones MySQL planificadas en fase técnica. |
| Arquitectura | RSNF13/14, RNF-06 | Mantener separación `frontend/` Astro y `backend/` Express, MySQL; separación modular de responsabilidades; Flowbite y tokens Sky/Inter. Los nombres físicos y librerías de persistencia se decidirán en arquitectura. |
| Estados UI | RNF-07 | Ideal/Vacío/Parcial/Carga/Error definidos por región; acciones de recuperación contextuales; no poner «Estados de UI» en sidebar. |
| Acciones críticas | RNF-14 | Modal de confirmación antes de cierre de oferta, entrega de examen y decisión final; validación en línea, no perder datos ante errores. |
| Disponibilidad | RSNF09 | «Durante horario de uso» sin calendario cuantificado: pendiente definir ventana y objetivo verificable. |

## Estrategia de evidencia de prueba (planificada, no ejecutada)

1. Pruebas de API con usuarios A/B misma empresa y reclutador externo para verificar aislamiento horizontal, también en descargas de PDF y resultados.
2. Simular concurrencia de publicaciones para particular cuando queda un cupo y demostrar que no se excede la cuota.
3. Simular examen con recargas, cambio de reloj local, latencias, red caída y dos solicitudes de cierre al mismo tiempo; la fuente de verdad es el backend.
4. Validar visualmente modo claro/oscuro y las variantes de estados en tamaños desktop 1440px, tablet 768px y móvil 390/360px.
5. Medir con conjuntos de datos reproducibles y entorno declarado; no declarar RSNF03 o RSNF09 «cumplidos» sin definición cuantitativa.

## Conflictos explícitos que deben cerrarse

- `RNF-09` / `HU-12`: «sin pérdida de respuestas offline» no puede implicar aceptación de respuestas recibidas después de `hora_limite` bajo DEC-05.
- `RNF-04`: «envío automático ≤3 s» no garantiza red disponible; definir cierre lógico servidor por separado de confirmación UI.
- `RF-05` / `HU-01`: no permitir que reclutador modifique los datos confirmados; solo lectura y notas (DEC-07).
- `RF-19`: porcentajes/niveles no son valores reales hasta aprobación de RSF23/24.
