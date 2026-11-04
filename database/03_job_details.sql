-- M02: campos descriptivos de área, ubicación y modalidad.
-- Ejecutar UNA VEZ sobre qori_talento antes de iniciar esta versión.
-- Compatible con MySQL 8 y MariaDB 10.6+. No altera estados ni datos existentes.
USE qori_talento;
ALTER TABLE jobs
  ADD COLUMN area VARCHAR(120) NULL AFTER description,
  ADD COLUMN location VARCHAR(180) NULL AFTER area;
