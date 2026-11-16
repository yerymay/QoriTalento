import { AppError } from '../../../shared/errors.js';
import type { User } from '../../auth/repositories/auth.repository.js';
import type { AttemptContext, AttemptChange, Exam, ExamInput, ExamenesRepository } from '../repositories/examenes.repository.js';

type Actor = Pick<User, 'id' | 'role'>;
const fail = (message: string): never => { throw new AppError(400, 'INVALID_INPUT', message); };
export function examId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,19}$/.test(value) || BigInt(value) > 18446744073709551615n) return fail('El identificador no es válido.');
  return value;
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Envía un formulario válido.');
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some(key => !keys.includes(key))) return fail('El formulario contiene campos no permitidos.');
  return result;
}
function text(value: unknown, label: string, max: number, min = 0) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) return fail(label + ': revisa su longitud.');
  return value.trim();
}
function input(value: unknown): ExamInput {
  const body = object(value, ['title', 'time_limit_minutes', 'questions']);
  if (!Number.isInteger(body.time_limit_minutes) || Number(body.time_limit_minutes) < 1 || Number(body.time_limit_minutes) > 480) return fail('El tiempo debe ser de 1 a 480 minutos.');
  if (!Array.isArray(body.questions) || body.questions.length > 50) return fail('Puedes registrar hasta 50 preguntas.');
  const result = {
    title: text(body.title, 'Título', 180, 1), time_limit_minutes: Number(body.time_limit_minutes),
    questions: body.questions.map((value, index) => {
      const question = object(value, ['text', 'options']);
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) return fail('Cada pregunta necesita entre 2 y 6 alternativas.');
      const options = question.options.map(value => {
        const option = object(value, ['text', 'is_correct']);
        if (typeof option.is_correct !== 'boolean') return fail('Indica si la alternativa es correcta.');
        return { text: text(option.text, 'Alternativa', 2000), is_correct: option.is_correct };
      });
      if (options.filter(option => option.is_correct).length > 1) return fail('Selecciona solo una respuesta correcta por pregunta.');
      return { text: text(question.text, 'Pregunta ' + (index + 1), 6000), options };
    }),
  };
  // Por debajo del límite JSON compartido, incluso con caracteres multibyte.
  if (Buffer.byteLength(JSON.stringify(result), 'utf8') > 90000) return fail('El examen es demasiado extenso. Reduce el contenido a 90 KB.');
  return result;
}
function complete(exam: Exam) {
  if (!exam.questions.length || exam.questions.some(q => !q.text || q.options.some(o => !o.text) || q.options.filter(o => o.is_correct).length !== 1))
    throw new AppError(409, 'EXAM_INCOMPLETE', 'Completa al menos una pregunta, sus alternativas y una respuesta correcta por pregunta.');
}
function role(actor: Actor, expected: Actor['role']) {
  if (actor.role !== expected) throw new AppError(403, 'FORBIDDEN', 'Tu cuenta no puede realizar esta acción.');
}
function missing(): never { throw new AppError(404, 'EXAM_NOT_FOUND', 'La evaluación no está disponible para tu cuenta.'); }
function expired(context: AttemptContext): AttemptChange {
  return context.attempt.status === 'IN_PROGRESS' && Date.parse(context.server_now) >= Date.parse(context.attempt.deadline_at_utc)
    ? { finish: { status: 'EXPIRED', at: context.attempt.deadline_at_utc } } : {};
}
// Lista blanca: nunca se serializa la clave correcta, ni siquiera después de enviar.
function candidateView({ exam, attempt, server_now }: AttemptContext) {
  return { server_now, attempt, exam: {
    id: exam.id, title: exam.title, job_title: exam.job_title, time_limit_seconds: exam.time_limit_seconds,
    version_number: exam.version_number,
    questions: exam.questions.map(q => ({ id: q.id, text: q.text, options: q.options.map(o => ({ id: o.id, text: o.text })) })),
  }};
}
export class ExamenesService {
  constructor(private repo: ExamenesRepository) {}
  async listOwned(actor: Actor, job?: unknown) {
    role(actor, 'RECRUITER'); return { items: await this.repo.listOwned(actor.id, job === undefined ? undefined : examId(job)) };
  }
  async detail(actor: Actor, id: unknown) {
    role(actor, 'RECRUITER'); return await this.repo.findOwned(actor.id, examId(id)) ?? missing();
  }
  async create(actor: Actor, job: unknown, body: unknown) {
    role(actor, 'RECRUITER'); return await this.repo.create(actor.id, examId(job), input(body)) ?? missing();
  }
  async update(actor: Actor, id: unknown, body: unknown) {
    role(actor, 'RECRUITER'); const fields = input(body);
    return await this.repo.changeOwned(actor.id, examId(id), exam => {
      if (exam.status !== 'DRAFT') throw new AppError(409, 'EXAM_IMMUTABLE', 'Un examen publicado no se puede editar. Crea uno nuevo.');
      return { input: fields };
    }) ?? missing();
  }
  async publish(actor: Actor, id: unknown, body: unknown) {
    role(actor, 'RECRUITER'); object(body, []);
    return await this.repo.changeOwned(actor.id, examId(id), exam => {
      if (exam.status === 'PUBLISHED') return {};
      complete(exam); return { publish: true };
    }) ?? missing();
  }
  async available(actor: Actor) {
    role(actor, 'CANDIDATE'); return { items: await this.repo.listAvailable(actor.id) };
  }
  async start(actor: Actor, id: unknown, value: unknown) {
    role(actor, 'CANDIDATE'); const body = object(value, ['application_id']);
    const result = await this.repo.start(actor.id, examId(id), examId(body.application_id), (exam, existing, _now, finished) => {
      if (exam.status !== 'PUBLISHED') return missing();
      if (!existing && finished) throw new AppError(409, 'PROCESS_FINISHED', 'Este proceso de selección ha finalizado.');
      complete(exam);
    });
    if (!result) return missing();
    return this.read(actor, result.attempt.id);
  }
  async read(actor: Actor, id: unknown) {
    role(actor, 'CANDIDATE');
    const result = await this.repo.changeAttempt(actor.id, examId(id), expired);
    return result ? candidateView(result.context) : missing();
  }
  async answer(actor: Actor, id: unknown, question: unknown, value: unknown) {
    role(actor, 'CANDIDATE'); const body = object(value, ['option_id', 'client_revision']);
    const questionId = examId(question), optionId = examId(body.option_id);
    const revision = body.client_revision;
    if (!Number.isInteger(revision) || Number(revision) < 1 || Number(revision) > 4294967295) return fail('La revisión de respuesta no es válida.');
    const result = await this.repo.changeAttempt(actor.id, examId(id), context => {
      const expiry = expired(context);
      if (expiry.finish || context.attempt.status !== 'IN_PROGRESS') return { ...expiry, rejection: { code: 'ATTEMPT_CLOSED', message: 'El intento terminó. Solo se conservaron las respuestas aceptadas antes del límite.' } };
      const item = context.exam.questions.find(q => q.id === questionId);
      if (!item?.options.some(o => o.id === optionId)) return fail('La alternativa no pertenece a esta pregunta del examen.');
      const previous = context.attempt.answers.find(a => a.question_id === questionId);
      if (previous && Number(revision) <= previous.client_revision) {
        if (revision === previous.client_revision && optionId === previous.option_id) return {};
        return { rejection: { code: 'ANSWER_CONFLICT', message: 'Esta respuesta cambió en otra pestaña. Sincroniza antes de volver a elegir.' } };
      }
      return { answer: { question_id: questionId, option_id: optionId, client_revision: Number(revision), accepted_at_utc: context.server_now } };
    });
    if (!result) return missing();
    if (result.change.rejection) throw new AppError(409, result.change.rejection.code, result.change.rejection.message);
    return candidateView(result.context);
  }
  async submit(actor: Actor, id: unknown, body: unknown) {
    role(actor, 'CANDIDATE'); object(body, []);
    const result = await this.repo.changeAttempt(actor.id, examId(id), context => {
      const expiry = expired(context);
      if (expiry.finish || context.attempt.status !== 'IN_PROGRESS') return expiry;
      return { finish: { status: 'SUBMITTED', at: context.server_now } };
    });
    return result ? candidateView(result.context) : missing();
  }
  expireDue() { return this.repo.expireDue(); }
}
