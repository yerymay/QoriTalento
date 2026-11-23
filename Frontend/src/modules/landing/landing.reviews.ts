export const DEMO_DATA = true;
export const REVIEWS: Array<{nombre:string;rol:string;estrellas?:number;texto:string}> = [
  { nombre: "María Quispe", rol: "Reclutadora · Empresa", estrellas: 5,
    texto: "Publicar una oferta y revisar el estado de cada postulación ahora se hace en un solo lugar." },
  { nombre: "Luis Ramos", rol: "Postulante", estrellas: 5,
    texto: "Pude revisar los datos de mi CV antes de enviar mi postulación." },
  { nombre: "Ana Torres", rol: "Docente evaluador", estrellas: 4,
    texto: "El flujo por etapas es claro y fácil de seguir." },
  { nombre: "Diego Flores", rol: "Postulante", estrellas: 5,
    texto: "La prueba técnica muestra el tiempo restante todo el rato." },
];
// Textos de ejemplo hardcodeados para el MVP. Sustituir por opiniones
// reales (con permiso) y poner DEMO_DATA = false.
// "estrellas" es opcional: si falta, no se muestra la fila de estrellas.
