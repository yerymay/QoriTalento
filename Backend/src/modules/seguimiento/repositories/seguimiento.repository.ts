export const trackingStates=['PENDING','IN_REVIEW','SHORTLISTED','ADVANCES','NOT_ADVANCES'] as const;
export type TrackingState=typeof trackingStates[number];
export interface TrackingQuery {search:string;status:TrackingState|null;page:number;page_size:number}
export interface TrackingRecord {
  id:string;job_id:string;title:string;status:string|null;job_status:string;
  registered_at:string;process_finished_at:string|null;filename:string|null;
  last_event_state:string|null;last_event_at:string|null;
}
export interface TrackingEvent {previous_state:string|null;next_state:string;at:string}
export interface TrackingContext {application:TrackingRecord;events:TrackingEvent[]}
export interface SeguimientoRepository {
  list(candidateId:string,query:TrackingQuery):Promise<{items:TrackingRecord[];total:number}>;
  read(candidateId:string,applicationId:string):Promise<TrackingContext|null>;
}
