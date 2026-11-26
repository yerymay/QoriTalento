import { getJson } from '../compartido/services/api';
export type TrackingState='PENDING'|'IN_REVIEW'|'SHORTLISTED'|'ADVANCES'|'NOT_ADVANCES';
export interface TrackingApplication {id:string;job_id:string;title:string;status:TrackingState|null;job_status:string;registered_at:string;process_finished_at:string|null;filename:string|null;status_at:string|null;final:boolean;can_replace_cv:boolean}
export interface TrackingPage {items:TrackingApplication[];total:number;page:number;page_size:number;checked_at:string}
export interface TrackingDetail {application:TrackingApplication;history:{status:TrackingState;at:string}[];history_complete:boolean;checked_at:string}
export const trackingLabels:Record<TrackingState,string>={PENDING:'Pendiente de evaluación',IN_REVIEW:'En revisión',SHORTLISTED:'Preseleccionado',ADVANCES:'Avanza',NOT_ADVANCES:'No avanza'};
export const seguimiento={
 list:(query:URLSearchParams)=>getJson<TrackingPage>('candidate/applications/tracking?'+query),
 detail:(id:string)=>getJson<TrackingDetail>('candidate/applications/'+encodeURIComponent(id)+'/tracking'),
};
