-- M01: ampliación no destructiva. Ejecutar después de 01_schema.sql.
-- No altera usuarios existentes ni activa cuentas pendientes.
USE qori_talento;
CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_expiry (expires_at),
  CONSTRAINT fk_auth_session_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;
