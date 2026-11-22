import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors.js';
import type { Actor } from '../../cv/repositories/cv.repository.js';
import { examId } from '../../examenes/services/examenes.service.js';
import type { Assessment, Evaluation, EvaluationAssistant, EvaluationContext, EvaluacionRepository, Grade, Rating, Source } from '../repositories/evaluacion.repository.js';

const ratings: Rating[] = ['MEETS', 'PARTIAL', 'DOES_NOT_MEET', 'INSUFFICIENT_EVIDENCE'];
const factors = { MEETS: 1, PARTIAL: 0.5, DOES_NOT_MEET: 0, INSUFFICIENT_EVIDENCE: 0 };
const fail = (message: string): never => { throw new AppError(400, 'INVALID_INPUT', message); };
const conflict = (code: string, message: string): never => { throw new AppError(409, code, message); };
const missing = (): never => { throw new AppError(404, 'APPLICATION_NOT_FOUND', 'La postulación no está disponible para tu cuenta.'); };
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Envía un formulario válido.');
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some(key => !keys.includes(key))) return fail('El formulario contiene campos no permitidos.');
  return body;
}
export function sources(context: EvaluationContext): Source[] {
  const profile = context.confirmed?.profile;
  if (!profile) return [];
  // Lista blanca profesional: no enviar nombre, correo, teléfono, DNI ni ubicación.
  return (['summary', 'education', 'experience', 'skills', 'languages'] as const).flatMap(field => {
    const values = typeof profile[field] === 'string' ? [profile[field] as string] : profile[field] as string[];
    return values.flatMap((text, index) => text.trim() ? [{ ref: field + ':' + index, text }] : []);
  });
}
export function fingerprint(context: EvaluationContext): string {
  return createHash('sha256').update(JSON.stringify({
    profile: context.confirmed?.id ?? null, sources: sources(context),
    requirements: context.requirements,
    exams: context.exams.map(({ exam }) => ({ id: exam.id, version: exam.version_number })),
  })).digest('hex');
}
export function objectiveGrades(context: EvaluationContext): Grade[] {
  return context.exams.flatMap(({ exam, attempts }) => attempts.flatMap(attempt => {
    if (!['SUBMITTED', 'EXPIRED'].includes(attempt.status)) return [];
    if (!exam.questions.length || exam.questions.some(q => q.options.filter(o => o.is_correct).length !== 1))
      return conflict('INVALID_EXAM_KEY', 'El examen no tiene una clave de respuestas válida.');
    let correct = 0, unanswered = 0;
    for (const question of exam.questions) {
      const answer = attempt.answers.find(a => a.question_id === question.id);
      const accepted = answer && Date.parse(answer.accepted_at_utc) >= Date.parse(attempt.started_at_utc)
        && Date.parse(answer.accepted_at_utc) < Date.parse(attempt.deadline_at_utc)
        && attempt.finished_at_utc && Date.parse(answer.accepted_at_utc) <= Date.parse(attempt.finished_at_utc);
      const option = accepted ? question.options.find(o => o.id === answer.option_id) : undefined;
      if (!option) unanswered++;
      else if (option.is_correct) correct++;
    }
    return [{ attempt_id: attempt.id, exam_id: exam.id, title: exam.title, status: attempt.status,
      correct, total: exam.questions.length, unanswered, percent: correct / exam.questions.length * 100 }];
  }));
}
function assessment(value: unknown, allowed: Source[]): Assessment {
  const body = object(value, ['rating', 'source_refs', 'explanation']);
  if (!ratings.includes(body.rating as Rating) || !Array.isArray(body.source_refs) ||
    body.source_refs.length > allowed.length || body.source_refs.some(ref => typeof ref !== 'string' || !allowed.some(s => s.ref === ref)) ||
    new Set(body.source_refs).size !== body.source_refs.length) return fail('Revisa la valoración y sus referencias al perfil confirmado.');
  if (typeof body.explanation !== 'string' || !body.explanation.trim() || body.explanation.length > 2000)
    return fail('Explica la valoración con un máximo de 2000 caracteres.');
  if (body.rating !== 'INSUFFICIENT_EVIDENCE' && !body.source_refs.length)
    return fail('Una valoración necesita evidencia del perfil confirmado; si falta, déjala pendiente.');
  return { rating: body.rating as Rating, source_refs: body.source_refs as string[], explanation: body.explanation.trim() };
}
export function evaluationView(context: EvaluationContext) {
  const evaluation = context.evaluation, grades = objectiveGrades(context);
  const stale = !!evaluation && evaluation.fingerprint !== fingerprint(context);
  const max = evaluation?.profile_max ?? (context.exams.length ? 60 : 100);
  const reviewed = evaluation?.criteria.filter(c => c.review && c.review.rating !== 'INSUFFICIENT_EVIDENCE') ?? [];
  const profilePoints = reviewed.reduce((sum, c) => sum + c.weight * factors[c.review!.rating], 0);
  const pending: string[] = [];
  if (!context.confirmed) pending.push('El postulante aún no ha confirmado su perfil.');
  if (!evaluation) pending.push('Prepara la evaluación para revisar los requisitos.');
  if (stale) pending.push('Las fuentes cambiaron. Se conserva la revisión anterior; la reevaluación está pendiente de B-07.');
  if (evaluation && reviewed.length !== evaluation.criteria.length) pending.push('Hay requisitos sin revisión o sin evidencia suficiente.');
  if (context.exams.length > 1) pending.push('Hay varios exámenes. Falta acordar cómo combinarlos.');
  if (context.exams.length === 1 && (grades.length !== 1 || context.exams[0]!.attempts.length !== 1)) pending.push('El examen está pendiente o no tiene un único intento finalizado.');
  const examPoints = context.exams.length === 1 && grades.length === 1 && context.exams[0]!.attempts.length === 1 ? grades[0]!.correct / grades[0]!.total * 40 : null;
  const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  return { application_id: context.application_id, job_id: context.job_id, job_title: context.job_title,
    candidate_name: context.confirmed?.profile.name ?? null, confirmed: !!context.confirmed, requirement_count: context.requirements.length, evaluation, stale,
    grades, exam_count: context.exams.length, profile_max: max,
    profile_points: round(profilePoints), exam_points: examPoints === null ? null : round(examPoints),
    total: pending.length ? null : round(profilePoints + (examPoints ?? 0)), pending,
    indicative: true, filter_questions_scored: false };
}
export class EvaluacionService {
  constructor(private repo: EvaluacionRepository, private assistant: EvaluationAssistant) {}
  private actor(actor: Actor, id: unknown) {
    if (actor.role !== 'RECRUITER') throw new AppError(403, 'FORBIDDEN', 'Solo el reclutador propietario puede evaluar.');
    return examId(id);
  }
  private current(context: EvaluationContext, revision: unknown): Evaluation {
    if (!Number.isInteger(revision) || Number(revision) < 1) return fail('La revisión no es válida.');
    const evaluation = context.evaluation;
    if (!evaluation || evaluation.revision !== revision) return conflict('EVALUATION_CONFLICT', 'La evaluación cambió. Vuelve a cargarla antes de guardar.');
    if (evaluation.fingerprint !== fingerprint(context)) return conflict('EVALUATION_STALE', 'Las fuentes cambiaron. La reevaluación permanece pendiente de B-07.');
    return evaluation;
  }
  async read(actor: Actor, value: unknown) {
    const context = await this.repo.read(actor.id, this.actor(actor, value));
    return evaluationView(context ?? missing());
  }
  async prepare(actor: Actor, value: unknown, input: unknown) {
    const id = this.actor(actor, value); object(input, []);
    const result = await this.repo.change(actor.id, id, context => {
      const grades = objectiveGrades(context);
      if (context.evaluation) return { grades };
      if (!context.confirmed) return conflict('PROFILE_UNCONFIRMED', 'El postulante debe confirmar su perfil antes de evaluar.');
      if (!context.requirements.length) return conflict('NO_REQUIREMENTS', 'La oferta necesita requisitos para evaluar el perfil.');
      const max = context.exams.length ? 60 : 100;
      // Reparto en centésimas: suma exacta incluso para 3, 7 o más requisitos.
      const units = max * 100, count = context.requirements.length, base = Math.floor(units / count);
      return { grades, evaluation: { revision: 1, fingerprint: fingerprint(context),
        profile_version_id: context.confirmed.id, sources: sources(context), profile_max: max,
        criteria: context.requirements.map((r, i) => ({ ...r, weight: (base + (i < units % count ? 1 : 0)) / 100, suggestion: null, review: null })),
        model: null, prompt_version: null, reviewed_by: null, reviewed_at: null } };
    });
    return evaluationView(result ?? missing());
  }
  async assist(actor: Actor, value: unknown, input: unknown) {
    const id = this.actor(actor, value), body = object(input, ['revision']);
    const before = await this.repo.read(actor.id, id) ?? missing(), evaluation = this.current(before, body.revision);
    const output = await this.assistant.suggest(before.requirements, evaluation.sources);
    let suggestions: { id: string; assessment: Assessment }[];
    try {
      const payload = object(output, ['items']);
      if (!Array.isArray(payload.items) || payload.items.length !== evaluation.criteria.length) throw new Error();
      suggestions = payload.items.map(item => {
        const row = object(item, ['id', 'rating', 'source_refs', 'explanation']);
        if (typeof row.id !== 'string' || !evaluation.criteria.some(c => c.id === row.id)) throw new Error();
        return { id: row.id, assessment: assessment({ rating: row.rating, source_refs: row.source_refs, explanation: row.explanation }, evaluation.sources) };
      });
      if (new Set(suggestions.map(s => s.id)).size !== suggestions.length) throw new Error();
    } catch { throw new AppError(502, 'INVALID_AI_RESPONSE', 'Ollama devolvió evidencia o datos inválidos. Puedes reintentar o revisar manualmente.'); }
    const result = await this.repo.change(actor.id, id, context => {
      const current = this.current(context, body.revision);
      return { evaluation: { ...current, revision: current.revision + 1, model: this.assistant.model, prompt_version: 'm06-evidence-v1',
        criteria: current.criteria.map(c => ({ ...c, suggestion: suggestions.find(s => s.id === c.id)!.assessment })) },
        grades: objectiveGrades(context) };
    });
    return evaluationView(result ?? missing());
  }
  async review(actor: Actor, value: unknown, input: unknown) {
    const id = this.actor(actor, value), body = object(input, ['revision', 'criteria']);
    const result = await this.repo.change(actor.id, id, context => {
      const current = this.current(context, body.revision);
      if (!Array.isArray(body.criteria) || body.criteria.length !== current.criteria.length) return fail('Revisa todos los requisitos.');
      const criteria = body.criteria.map(item => {
        const row = object(item, ['id', 'weight', 'review']);
        const existing = current.criteria.find(c => c.id === row.id);
        if (!existing || typeof row.weight !== 'number' || !Number.isFinite(row.weight) || row.weight < 0 ||
          row.weight > current.profile_max || Math.abs(row.weight * 100 - Math.round(row.weight * 100)) > 0.000001)
          return fail('Los pesos deben ser puntos no negativos con hasta dos decimales.');
        return { ...existing, weight: row.weight, review: row.review === null ? null : assessment(row.review, current.sources) };
      });
      if (new Set(criteria.map(c => c.id)).size !== criteria.length) return fail('No repitas requisitos.');
      if (criteria.reduce((sum, c) => sum + Math.round(c.weight * 100), 0) !== current.profile_max * 100)
        return fail('Los pesos deben sumar ' + current.profile_max + ' puntos.');
      return { grades: objectiveGrades(context), evaluation: { ...current, criteria, revision: current.revision + 1,
        reviewed_by: actor.id, reviewed_at: new Date().toISOString() } };
    });
    return evaluationView(result ?? missing());
  }
}
