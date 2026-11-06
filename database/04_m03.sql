-- M03: migración separada para archivos privados y cierre explícito del proceso.
ALTER TABLE jobs ADD COLUMN process_finished_at DATETIME(3) NULL;
CREATE TABLE IF NOT EXISTS cv_private_data (
  cv_document_id BIGINT UNSIGNED PRIMARY KEY,
  contents MEDIUMBLOB NOT NULL,
  CONSTRAINT fk_cv_private_document FOREIGN KEY (cv_document_id) REFERENCES cv_documents(id)
) ENGINE=InnoDB;
