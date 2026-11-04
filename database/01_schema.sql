-- QORI TALENTO | Esquema inicial para MySQL 8.0+ o MariaDB 10.6+
-- PROPUESTA MVP, basada en docs/architecture/02-modelo-datos-conceptual.md.
-- No ejecutar contra una base existente sin respaldo y revisión del diff.
-- No implementa decisiones pendientes B-01..B-10: validarlas en servicios.
-- Script no destructivo: no DROP, no DELETE, no seeds de datos personales.
CREATE DATABASE IF NOT EXISTS qori_talento
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE qori_talento;

-- M01: usuarios y verificación
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(160) NOT NULL,
  email_normalized VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(24) NOT NULL COMMENT 'RECRUITER o CANDIDATE; validar en backend',
  account_state VARCHAR(32) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  phone VARCHAR(32) NULL,
  email_verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_users_email (email_normalized),
  KEY ix_users_role_state (role, account_state)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  legal_name VARCHAR(180) NOT NULL,
  verified_domain VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recruiter_profiles (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  recruiter_kind VARCHAR(24) NOT NULL COMMENT 'COMPANY o INDIVIDUAL',
  organization_id BIGINT UNSIGNED NULL,
  phone_verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_recruiter_organization (organization_id),
  CONSTRAINT fk_recruiter_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_recruiter_org FOREIGN KEY (organization_id) REFERENCES organizations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS verification_challenges (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  challenge_kind VARCHAR(24) NOT NULL,
  secret_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_challenges_user_kind (user_id, challenge_kind),
  CONSTRAINT fk_challenge_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- M02: ofertas, requisitos y moderación
CREATE TABLE IF NOT EXISTS jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  experience_required TEXT NULL,
  education_required TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  published_at DATETIME(3) NULL,
  closed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_jobs_owner_status (owner_user_id, status),
  KEY ix_jobs_publication (status, published_at),
  CONSTRAINT fk_job_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_requirements (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  requirement_kind VARCHAR(48) NULL,
  importance VARCHAR(24) NULL COMMENT 'Sin pesos definitivos aprobados',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_job_requirements_job (job_id, sort_order),
  CONSTRAINT fk_requirement_job FOREIGN KEY (job_id) REFERENCES jobs(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS job_moderation_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  reviewer_user_id BIGINT UNSIGNED NULL COMMENT 'Rol moderador pendiente B-02',
  review_status VARCHAR(32) NOT NULL,
  reason TEXT NULL,
  reviewed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_job_review_job (job_id, created_at),
  CONSTRAINT fk_review_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_review_user FOREIGN KEY (reviewer_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- M03: postulaciones
CREATE TABLE IF NOT EXISTS applications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  candidate_user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NULL COMMENT 'Estado inicial/transiciones pendientes B-08',
  submitted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY ix_applications_job_status (job_id, status),
  KEY ix_applications_candidate (candidate_user_id, created_at),
  CONSTRAINT fk_application_job FOREIGN KEY (job_id) REFERENCES jobs(id),
  CONSTRAINT fk_application_candidate FOREIGN KEY (candidate_user_id) REFERENCES users(id)
  -- Unicidad job+candidato pendiente de B-04: no imponer todavía.
) ENGINE=InnoDB;

-- M04: documentos, extracción, versiones confirmadas y notas del reclutador
CREATE TABLE IF NOT EXISTS cv_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT UNSIGNED NOT NULL,
  storage_key VARCHAR(512) NOT NULL COMMENT 'Clave interna privada, nunca URL pública',
  original_filename VARCHAR(255) NULL,
  sha256 CHAR(64) NOT NULL,
  mime_type VARCHAR(90) NOT NULL,
  byte_size BIGINT UNSIGNED NOT NULL,
  scan_status VARCHAR(32) NULL,
  uploaded_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_cv_application (application_id),
  CONSTRAINT fk_cv_application FOREIGN KEY (application_id) REFERENCES applications(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cv_extraction_runs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  cv_document_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(32) NOT NULL,
  extractor_version VARCHAR(60) NOT NULL,
  detected_json JSON NULL,
  error_code VARCHAR(64) NULL,
  started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  finished_at DATETIME(3) NULL,
  KEY ix_extract_cv (cv_document_id, started_at),
  CONSTRAINT fk_extract_cv FOREIGN KEY (cv_document_id) REFERENCES cv_documents(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS candidate_profile_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  candidate_user_id BIGINT UNSIGNED NOT NULL,
  source_cv_id BIGINT UNSIGNED NULL,
  data_json JSON NOT NULL,
  confirmed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_profiles_candidate (candidate_user_id, created_at),
  CONSTRAINT fk_profile_candidate FOREIGN KEY (candidate_user_id) REFERENCES users(id),
  CONSTRAINT fk_profile_source_cv FOREIGN KEY (source_cv_id) REFERENCES cv_documents(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS application_profile_snapshots (
  application_id BIGINT UNSIGNED NOT NULL,
  profile_version_id BIGINT UNSIGNED NOT NULL,
  linked_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (application_id, profile_version_id),
  CONSTRAINT fk_snapshot_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_snapshot_profile FOREIGN KEY (profile_version_id) REFERENCES candidate_profile_versions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS recruiter_notes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT UNSIGNED NOT NULL,
  author_user_id BIGINT UNSIGNED NOT NULL,
  note_body TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_notes_application (application_id, created_at),
  CONSTRAINT fk_note_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_note_author FOREIGN KEY (author_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- M05: exámenes e intentos (respuestas aceptadas antes de deadline_at)
CREATE TABLE IF NOT EXISTS exams (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  job_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(180) NOT NULL,
  time_limit_seconds INT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_exams_job (job_id, status),
  CONSTRAINT fk_exam_job FOREIGN KEY (job_id) REFERENCES jobs(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_questions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  exam_id BIGINT UNSIGNED NOT NULL,
  question_text TEXT NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  KEY ix_questions_exam (exam_id, sort_order),
  CONSTRAINT fk_question_exam FOREIGN KEY (exam_id) REFERENCES exams(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  question_id BIGINT UNSIGNED NOT NULL,
  option_text TEXT NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Nunca enviar esta columna al candidato',
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY uq_option_question_id (question_id, id),
  KEY ix_options_question (question_id, sort_order),
  CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES exam_questions(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  exam_id BIGINT UNSIGNED NOT NULL,
  application_id BIGINT UNSIGNED NOT NULL,
  started_at_utc DATETIME(3) NOT NULL,
  deadline_at_utc DATETIME(3) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'IN_PROGRESS',
  finished_at_utc DATETIME(3) NULL,
  KEY ix_attempts_application (application_id, exam_id),
  KEY ix_attempts_deadline (status, deadline_at_utc),
  CONSTRAINT fk_attempt_exam FOREIGN KEY (exam_id) REFERENCES exams(id),
  CONSTRAINT fk_attempt_application FOREIGN KEY (application_id) REFERENCES applications(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exam_answers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  question_id BIGINT UNSIGNED NOT NULL,
  option_id BIGINT UNSIGNED NOT NULL,
  client_revision INT UNSIGNED NOT NULL,
  accepted_at_utc DATETIME(3) NOT NULL,
  UNIQUE KEY uq_answer_attempt_question (attempt_id, question_id),
  KEY ix_answer_question_option (question_id, option_id),
  CONSTRAINT fk_answer_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
  CONSTRAINT fk_answer_option_question FOREIGN KEY (question_id, option_id)
    REFERENCES exam_options(question_id, id)
) ENGINE=InnoDB;

-- M06: nota objetiva y evaluación IA propuesta
CREATE TABLE IF NOT EXISTS exam_grades (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  attempt_id BIGINT UNSIGNED NOT NULL,
  score DECIMAL(8,3) NOT NULL COMMENT 'Escala objetiva definir por examen',
  grading_version VARCHAR(64) NOT NULL,
  graded_at_utc DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_grades_attempt (attempt_id, graded_at_utc),
  CONSTRAINT fk_grade_attempt FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_evaluations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT UNSIGNED NOT NULL,
  model_tag VARCHAR(120) NOT NULL,
  model_digest VARCHAR(150) NULL,
  prompt_version VARCHAR(64) NOT NULL,
  rubric_version VARCHAR(64) NULL COMMENT 'B-06 pendiente',
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
  score DECIMAL(8,3) NULL COMMENT 'No publicar hasta aprobar B-06',
  explanation TEXT NULL,
  input_snapshot_json JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  reviewed_at DATETIME(3) NULL,
  KEY ix_ai_application (application_id, created_at),
  CONSTRAINT fk_ai_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_ai_reviewer FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ai_evaluation_evidence (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ai_evaluation_id BIGINT UNSIGNED NOT NULL,
  criterion_id VARCHAR(120) NOT NULL,
  source_ref VARCHAR(255) NOT NULL,
  excerpt TEXT NULL,
  KEY ix_ai_evidence_eval (ai_evaluation_id),
  CONSTRAINT fk_ai_evidence_eval FOREIGN KEY (ai_evaluation_id) REFERENCES ai_evaluations(id)
) ENGINE=InnoDB;

-- M07: selección exclusivamente humana
CREATE TABLE IF NOT EXISTS recruitment_decisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT UNSIGNED NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  decision VARCHAR(32) NOT NULL COMMENT 'Transiciones/reversión pendientes B-08',
  reason TEXT NULL,
  decided_at_utc DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_decisions_app (application_id, decided_at_utc),
  CONSTRAINT fk_decision_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_decision_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- M08: historial de seguimiento
CREATE TABLE IF NOT EXISTS application_status_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  application_id BIGINT UNSIGNED NOT NULL,
  previous_state VARCHAR(32) NULL,
  next_state VARCHAR(32) NOT NULL,
  actor_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_status_events_app (application_id, created_at),
  CONSTRAINT fk_status_event_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_status_event_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Transversal: auditoría sin PII, OTP ni archivos
CREATE TABLE IF NOT EXISTS audit_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_user_id BIGINT UNSIGNED NULL,
  resource_kind VARCHAR(70) NOT NULL,
  resource_id BIGINT UNSIGNED NULL,
  action VARCHAR(90) NOT NULL,
  result VARCHAR(32) NOT NULL,
  trace_id VARCHAR(80) NULL,
  occurred_at_utc DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_audit_resource (resource_kind, resource_id, occurred_at_utc),
  KEY ix_audit_actor (actor_user_id, occurred_at_utc),
  CONSTRAINT fk_audit_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- Verificación no destructiva:
SELECT COUNT(*) AS qori_tables
FROM information_schema.tables
WHERE table_schema = 'qori_talento' AND table_type = 'BASE TABLE';
