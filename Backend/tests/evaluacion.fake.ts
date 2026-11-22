import type { EvaluationAssistant, EvaluationChange, EvaluationContext, EvaluacionRepository } from '../src/modules/evaluacion/repositories/evaluacion.repository.js';
export function fixture(): EvaluationContext {
  return { application_id:'1', job_id:'10', job_title:'Desarrollo web',
    confirmed:{id:'5',profile:{name:'Persona privada',email:'privado@example.test',phone:'999999999',location:'Lima',summary:'',
      education:['Ingeniería informática'],experience:['Dos años en desarrollo web'],skills:['TypeScript'],languages:['Inglés básico']}},
    requirements:[{id:'requirement:1',text:'TypeScript'},{id:'requirement:2',text:'Inglés avanzado'}],
    exams:[],evaluation:null };
}
export function withExam(context: EvaluationContext) {
  context.exams=[{exam:{id:'20',job_id:'10',job_title:'Desarrollo web',title:'Prueba',time_limit_seconds:60,version_number:1,status:'PUBLISHED',
    questions:[
      {id:'1',text:'Primera',options:[{id:'11',text:'Sí',is_correct:true},{id:'12',text:'No',is_correct:false}]},
      {id:'2',text:'Segunda',options:[{id:'21',text:'Sí',is_correct:true},{id:'22',text:'No',is_correct:false}]},
      {id:'3',text:'Tercera',options:[{id:'31',text:'Sí',is_correct:true},{id:'32',text:'No',is_correct:false}]},
    ]},attempts:[{id:'30',exam_id:'20',application_id:'1',status:'SUBMITTED',
      started_at_utc:'2026-11-22T10:00:00.000Z',deadline_at_utc:'2026-11-22T10:01:00.000Z',finished_at_utc:'2026-11-22T10:00:50.000Z',
      answers:[{question_id:'1',option_id:'11',client_revision:1,accepted_at_utc:'2026-11-22T10:00:20.000Z'},
        {question_id:'2',option_id:'22',client_revision:1,accepted_at_utc:'2026-11-22T10:00:30.000Z'}]}]}];
  return context;
}
export class MemoryEvaluacion implements EvaluacionRepository {
  context = fixture();
  history: EvaluationContext['evaluation'][]=[];
  grades = new Map<string, number>();
  private queue: Promise<unknown> = Promise.resolve();
  async read(owner:string,id:string) { return owner==='1'&&id==='1'?structuredClone(this.context):null; }
  async change(owner:string,id:string,decide:(c:EvaluationContext)=>EvaluationChange) {
    const run = this.queue.then(async()=>{
      const context = await this.read(owner,id); if(!context)return null;
      const change=decide(context);
      if(change.evaluation){context.evaluation=change.evaluation;this.history.push(structuredClone(change.evaluation));}
      for(const g of change.grades??[])this.grades.set(g.attempt_id,g.percent);
      this.context=context;return structuredClone(context);
    });
    this.queue=run.catch(()=>undefined);return run;
  }
}
export class FakeAssistant implements EvaluationAssistant {
  model='modelo-sintetico';
  calls=0;
  output:unknown={items:[
    {id:'requirement:1',rating:'MEETS',source_refs:['skills:0'],explanation:'TypeScript consta en las habilidades.'},
    {id:'requirement:2',rating:'PARTIAL',source_refs:['languages:0'],explanation:'Inglés básico, inferior al nivel avanzado solicitado.'},
  ]};
  async suggest(){this.calls++;return this.output;}
}
