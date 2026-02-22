-- 20250221000000_add_roles.sql

-- 1. Crear tipo ENUM para roles
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('client', 'admin');
  end if;
end $$;

-- 2. Agregar columna a la tabla users
alter table public.users 
add column if not exists role public.user_role not null default 'client';

-- 3. Crear índice para búsquedas por rol
create index if not exists users_role_idx on public.users (role);
