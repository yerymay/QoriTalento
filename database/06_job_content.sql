-- Campos opcionales de contenido de ofertas. Aplicar una sola vez tras 03_job_details.sql.
-- No elimina ni altera los datos existentes; la ubicación heredada permanece intacta.
ALTER TABLE jobs
  ADD COLUMN modality VARCHAR(30) NULL,
  ADD COLUMN work_schedule VARCHAR(120) NULL,
  ADD COLUMN responsibilities_json TEXT NULL,
  ADD COLUMN benefits_json TEXT NULL;