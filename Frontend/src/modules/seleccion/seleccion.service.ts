import { requestJson } from '../compartido/services/api';
import type { EvaluationView } from '../evaluacion/evaluacion.service';
export type State='PENDING'|'IN_REVIEW'|'SHORTLISTED'|'ADVANCES'|'NOT_ADVANCES';
export interface RecordView {id:string;job_id:string;job_title:string;name:string;email:string;status:string|null;submitted_at:string|null;process_finished:boolean;decision:{state:string;reason:string|null;actor_name:string;actor_id:string;at:string}|null}
export interface ResultRow extends RecordView {allowed_actions:State[];results:{grades:{title:string;percent:number}[];exam_count:number;profile_points:number|null;profile_max:number;total:number|null;pending:string[];stale:boolean;reviewed:boolean}|null}
export interface ResultPage {items:ResultRow[];total:number;page:number;page_size:number}
export interface Detail {record:RecordView;allowed_actions:State[];profile:{name:string;email:string;phone:string;location:string;summary:string;education:string[];experience:string[];skills:string[];languages:string[]}|null;evaluation:EvaluationView;history:{previous_state:string|null;next_state:string;actor_name:string|null;at:string}[]}
export const labels:Record<string,string>={PENDING:'Pendiente de evaluación',IN_REVIEW:'En revisión',SHORTLISTED:'Preseleccionado',ADVANCES:'Avanza',NOT_ADVANCES:'No avanza'};
const path=(id:string)=>'recruiter/applications/'+encodeURIComponent(id)+'/selection';
export const selectionApi={
  jobs:()=>requestJson<{items:{id:string;title:string}[]}>('recruiter/selection/jobs'),
  list:(id:string,q:URLSearchParams)=>requestJson<ResultPage>('recruiter/jobs/'+encodeURIComponent(id)+'/results?'+q),
  detail:(id:string)=>requestJson<Detail>(path(id)),
  decide:(id:string,state:State,expected_status:string,reason:string)=>requestJson<{record:RecordView;allowed_actions:State[]}>(path(id),'POST',{state,expected_status,confirmed:true,...(reason?{reason}:{})}),
};
