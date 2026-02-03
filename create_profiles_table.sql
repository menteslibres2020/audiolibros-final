-- 1. Crear tabla de perfiles (Vinculada a auth.users)
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  email text,
  is_pro boolean default false,
  stripe_customer_id text,
  full_name text,
  avatar_url text,
  primary key (id)
);

-- 2. Habilitar seguridad (RLS)
alter table public.profiles enable row level security;

-- 3. Crear políticas de acceso
-- "Cada usuario puede ver SU propio perfil"
create policy "Users can view own profile" 
on public.profiles for select 
using ( auth.uid() = id );

-- "Cada usuario puede actualizar SU propio perfil"
create policy "Users can update own profile" 
on public.profiles for update 
using ( auth.uid() = id );

-- 4. Automatización: Crear perfil automáticamente al registrarse
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger que dispara la función anterior
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
