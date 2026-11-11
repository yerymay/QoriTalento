import { requestJson } from '../compartido/services/api';
export type Role = 'CANDIDATE' | 'RECRUITER';
export interface User { id:string; name:string; email:string; phone:string|null; dni:string|null; role:Role; kind:'COMPANY'|'INDIVIDUAL'|null; account_state:string }
export interface Session {user:User; expires_at:string}
export const homeFor = (role:Role) => role === 'RECRUITER' ? '/reclutador/ofertas' : '/postulante/ofertas';
export const auth = {
  register:(role:Role,data:Record<string,unknown>)=>requestJson<{user:User;message:string}>(`auth/${role === 'RECRUITER' ? 'recruiters':'candidates'}/register`,'POST',data),
  login:(data:Record<string,unknown>)=>requestJson<Session>('auth/login','POST',data),
  me:()=>requestJson<Session>('me'),
  refresh:()=>requestJson<Session>('auth/session/refresh','POST',{}),
  logout:()=>requestJson<void>('auth/logout','POST',{}),
  update:(data:Record<string,unknown>)=>requestJson<{user:User;verification_required:boolean}>('me','PATCH',data),
};
