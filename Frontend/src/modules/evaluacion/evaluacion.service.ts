import { requestJson } from '../compartido/services/api';
export type Rating = 'MEETS'|'PARTIAL'|'DOES_NOT_MEET'|'INSUFFICIENT_EVIDENCE';
export interface Assessment { rating:Rating; source_refs:string[]; explanation:string }
export interface Criterion { id:string; text:string; weight:number; suggestion:Assessment|null; review:Assessment|null }
export interface Evaluation {
  revision:number; profile_version_id:string; sources:{ref:string;text:string}[]; criteria:Criterion[];
  profile_max:60|100; model:string|null; reviewed_by:string|null; reviewed_at:string|null;
}
export interface EvaluationView {
  application_id:string; job_id:string; job_title:string; candidate_name:string|null; confirmed:boolean; requirement_count:number;
  evaluation:Evaluation|null; stale:boolean; profile_max:60|100; profile_points:number; exam_points:number|null;
  total:number|null; pending:string[]; exam_count:number;
  grades:{attempt_id:string;title:string;correct:number;total:number;unanswered:number;percent:number}[];
}
export interface ReviewInput { revision:number; criteria:{id:string;weight:number;review:Assessment|null}[] }
const path=(id:string)=>'recruiter/applications/'+encodeURIComponent(id)+'/evaluation';
export const evaluationApi={
  read:(id:string)=>requestJson<EvaluationView>(path(id)),
  prepare:(id:string)=>requestJson<EvaluationView>(path(id),'POST',{}),
  assist:(id:string,revision:number)=>requestJson<EvaluationView>(path(id)+'/assist','POST',{revision},130000),
  review:(id:string,input:ReviewInput)=>requestJson<EvaluationView>(path(id)+'/review','PUT',input),
};
