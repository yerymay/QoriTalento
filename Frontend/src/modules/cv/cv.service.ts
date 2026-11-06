import { getJson, requestJson } from '../compartido/services/api';
export interface CvProfile {
  name: string; email: string; phone: string; location: string; summary: string;
  education: string[]; experience: string[]; skills: string[]; languages: string[];
}
export interface Confirmed { id: string; source_cv_id: string; confirmed_at: string; profile: CvProfile }
export interface Review {
  application_id: string; title: string; status: string | null; document: { id: string; filename: string } | null;
  extraction: { profile: CvProfile; warnings: string[]; text: string; evidence: Partial<Record<keyof CvProfile, Array<{page:number;text:string}>>> } | null;
  confirmed: Confirmed | null; current_profile_id: string | null; can_confirm: boolean;
}
export interface Note { id: string; body: string; created_at: string }
const path = (recruiter: boolean, id: string) => `${recruiter ? 'recruiter' : 'candidate'}/applications/${encodeURIComponent(id)}`;
export const cv = {
  review: (recruiter: boolean,id: string) => getJson<Review>(`${path(recruiter,id)}/cv-extraction`),
  confirm: (id: string, review: Review, profile: CvProfile) => requestJson<Review>(`${path(false,id)}/profile-confirmation`, 'PUT', {document_id:review.document!.id,base_profile_id:review.current_profile_id,profile}),
  profile: () => getJson<{profile:Confirmed|null}>('candidate/profile'),
  notes: (id: string) => getJson<{items:Note[]}>(`${path(true,id)}/notes`),
  addNote: (id: string,body: string) => requestJson<{items:Note[]}>(`${path(true,id)}/notes`, 'POST', {body}),
  applications: (jobId: string) => getJson<{items:Array<{id:string;name:string;title:string;confirmed:boolean}>}>(`recruiter/jobs/${encodeURIComponent(jobId)}/applications`),
  documentUrl: (recruiter: boolean,id: string,doc: string) => `/api/v1/${path(recruiter,id)}/cv/${encodeURIComponent(doc)}`,
};
export const fields: Array<{key:keyof CvProfile;label:string;type?:'email'|'tel';max:number;multiline?:boolean;array?:boolean}> = [
  {key:'name',label:'Nombre completo',max:160},{key:'email',label:'Correo de contacto del CV',type:'email',max:254},
  {key:'phone',label:'Teléfono',type:'tel',max:32},{key:'location',label:'Ubicación',max:200},
  {key:'summary',label:'Resumen profesional',max:4000,multiline:true},
  {key:'education',label:'Formación académica',max:60000,multiline:true,array:true},
  {key:'experience',label:'Experiencia laboral',max:60000,multiline:true,array:true},
  {key:'skills',label:'Habilidades',max:16000,multiline:true,array:true},
  {key:'languages',label:'Idiomas',max:16000,multiline:true,array:true},
];
