export const selectionStates = ['PENDING','IN_REVIEW','SHORTLISTED','ADVANCES','NOT_ADVANCES'] as const;
export type SelectionState = typeof selectionStates[number];
export interface SelectionQuery { search:string; status:SelectionState|null; sort:'name'|'status'|'date'; direction:'asc'|'desc'; page:number; page_size:number }
export interface SelectionRecord {
  id:string; job_id:string; job_title:string; name:string; email:string;
  status:string|null; submitted_at:string|null; process_finished:boolean;
  decision:{state:string; reason:string|null; actor_id:string; actor_name:string; at:string}|null;
}
export interface SelectionEvent { previous_state:string|null; next_state:string; actor_name:string|null; at:string }
export interface SelectionChange { state:SelectionState; reason:string|null }
export interface SeleccionRepository {
  jobs(owner:string):Promise<{id:string;title:string}[]>;
  list(owner:string,jobId:string,query:SelectionQuery):Promise<{items:SelectionRecord[];total:number}|null>;
  read(owner:string,id:string):Promise<{record:SelectionRecord;history:SelectionEvent[]}|null>;
  change(owner:string,id:string,decide:(record:SelectionRecord)=>SelectionChange):Promise<SelectionRecord|null>;
}
