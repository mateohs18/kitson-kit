-- Guarda la foto de perfil de la cuenta (Google/Discord) que dejó la reseña,
-- para mostrarla real en vez de solo un círculo con la inicial.
-- Corré esto una sola vez en el SQL Editor de Supabase.

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS user_avatar text;
