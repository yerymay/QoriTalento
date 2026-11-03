# SPEC-002 — Propiedad, cuota y primera oferta

**Estado:** propuesta funcional. **IDs base:** RSF04, RSF05–RSF08, RSF09, RSF11, RSF30, RSNF06, RSNF07, RSNF12, RSNF18; UI RF-02, RF-03, RF-08, RF-13, RF-14, RF-15, RNF-15; HU-05. **Figma:** `Reclutador · Nueva oferta`, `Reclutador · Ofertas de empleo`, `Candidato · Ofertas disponibles`, `Reclutador · Resultados y comparación`.

## Reglas normativas EARS

- **OFR-01:** CUANDO un reclutador cree una oferta, EL BACKEND DEBE asignar el identificador del creador desde la identidad autenticada, no desde la solicitud del navegador.
- **OFR-02:** CUANDO un reclutador liste, lea, edite, cierre o consulte postulantes de una oferta, EL BACKEND DEBE comprobar que es el creador autorizado de esa oferta. El acceso dentro de una empresa **no es compartido**.
- **OFR-03:** SI el reclutador es persona natural, EL SISTEMA DEBE limitar a **2** el número de ofertas activas simultáneas, comprobando el cupo también ante solicitudes concurrentes.
- **OFR-04:** CUANDO un particular cree su primera oferta, EL SISTEMA DEBE enviarla a revisión manual y NO hacerla pública hasta su aprobación por la autoridad que se designe.
- **OFR-05:** SI la cuota no está disponible o la revisión no está aprobada, EL SISTEMA DEBE impedir la transición a pública y explicar la razón con un mensaje claro.
- **OFR-06:** CUANDO un candidato consulte ofertas disponibles, EL SISTEMA DEBE exponer exclusivamente las ofertas efectivamente publicadas. Cualquier candidato que se postule a una oferta debe quedar accesible únicamente al reclutador creador de esa oferta y a los actores expresamente autorizados por una futura política aprobada.
- **OFR-07:** MIENTRAS una oferta esté cerrada, EL SISTEMA NO DEBE aceptar nuevas postulaciones para ella.

## Aspectos aún abiertos

- Interpretación propuesta de `activa`: `Publicada`; estados `Borrador`, `Pendiente de moderación`, `Publicada`, `Cerrada`. **El conteo de cuota y transiciones exactas necesitan aprobación**, en especial los casos de aprobación tardía.
- Identidad/rol del moderador y qué acciones puede efectuar; no se crea aquí un rol administrador.
- Si una empresa en el futuro necesita compartir ofertas, será un **cambio de alcance**, no comportamiento implícito.

## Criterios de aceptación

```gherkin
Escenario: Límite de dos ofertas de particular
  Dado que un particular activo tiene dos ofertas contabilizadas como activas
  Cuando intenta publicar una tercera oferta
  Entonces el backend impide la publicación y explica el límite de dos

Escenario: Primera oferta del particular
  Dado que el reclutador particular activo nunca publicó una oferta
  Cuando solicita publicar su primera oferta
  Entonces la oferta queda pendiente de revisión y no aparece en el listado público

Escenario: Empresa con dos reclutadores
  Dado que Ana y Luis pertenecen a la misma empresa y son reclutadores activos
  Y Ana creó una oferta con postulantes
  Cuando Luis consulta la oferta o sus postulantes
  Entonces el backend deniega el acceso

Escenario: Simultaneidad de publicaciones
  Dado que un particular dispone de un único cupo de oferta activa
  Cuando envía simultáneamente dos solicitudes de publicación
  Entonces el servidor permite a lo sumo una transición adicional a activa
```
