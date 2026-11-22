-- M06: revisión asistida versionada. Aplicar después de 01_schema.sql.
-- No altera ni elimina tablas o evaluaciones existentes.
USE qori_talento;
CREATE TABLE IF NOT EXISTS m06_evaluation_revisions (
  application_id BIGINT UNSIGNED NOT NULL,
  revision INT UNSIGNED NOT NULL,
  document_json JSON NOT NULL,
  actor_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (application_id, revision),
  CONSTRAINT fk_m06_application FOREIGN KEY (application_id) REFERENCES applications(id),
  CONSTRAINT fk_m06_actor FOREIGN KEY (actor_user_id) REFERENCES users(id)
) ENGINE=InnoDB;
