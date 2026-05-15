-- One-time data migration: reset admin@avantycare.com password to a known value
-- so the account can be recovered. The temporary password is "Reset2026!".
-- The user must change it immediately after logging in.
--
-- Hash generated with bcryptjs (cost 10) for the literal string "Reset2026!".
-- Also clears any failed-login lockout state.

UPDATE users
SET password_hash         = '$2b$10$Iqa6CoIPpQCRJh4Aw3Fg5u2.GfVsCEIkhwxCfRu1z3PPn3aTI34Ou',
    failed_login_attempts = 0,
    locked_until          = NULL,
    updated_at            = NOW()
WHERE email = 'admin@avantycare.com';
