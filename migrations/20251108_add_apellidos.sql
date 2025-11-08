-- Migración para agregar campos de apellido paterno y materno
-- Fecha: 2025-11-08

-- 1. Agregar columnas para apellidos
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS apellido_paterno TEXT,
ADD COLUMN IF NOT EXISTS apellido_materno TEXT;

-- 2. Comentarios para documentar
COMMENT ON COLUMN public.profiles.apellido_paterno IS 'Primer apellido del usuario';
COMMENT ON COLUMN public.profiles.apellido_materno IS 'Segundo apellido del usuario';
