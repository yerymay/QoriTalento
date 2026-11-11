-- M01: dato opcional de identidad para perfiles existentes y nuevos.
-- Ejecutar una sola vez sobre la base seleccionada antes de iniciar el backend actualizado.
ALTER TABLE users ADD COLUMN dni CHAR(8) NULL;
