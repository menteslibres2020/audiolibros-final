-- 1. Crear tabla de historial de narraciones
create table if not exists public.narrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  project_title text,
  text_content text,
  audio_path text, -- Ruta en el Storage (ej: user_id/audio.wav)
  voice_id text,
  emotion text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Seguridad (RLS) para la tabla
alter table public.narrations enable row level security;

create policy "Ver mis narraciones" 
on public.narrations for select 
using (auth.uid() = user_id);

create policy "Crear narraciones" 
on public.narrations for insert 
with check (auth.uid() = user_id);

create policy "Borrar mis narraciones" 
on public.narrations for delete 
using (auth.uid() = user_id);

-- 3. (OPCIONAL) Configuración de Storage vía SQL
-- Si esto falla, crea el bucket "narrations" manualmente en el panel de Storage.
insert into storage.buckets (id, name, public) 
values ('narrations', 'narrations', true)
on conflict (id) do nothing;

-- Política de Storage: Cualquiera puede ver (porque son audios para la web)
create policy "Public Access" 
on storage.objects for select 
using ( bucket_id = 'narrations' );

-- Política de Storage: Solo usuarios autenticados pueden subir
create policy "Authenticated Upload" 
on storage.objects for insert 
with check ( bucket_id = 'narrations' and auth.role() = 'authenticated' );

-- Política de Storage: Usuario puede borrar sus propios objetos
create policy "User Delete" 
on storage.objects for delete 
using ( bucket_id = 'narrations' and auth.uid() = owner );
