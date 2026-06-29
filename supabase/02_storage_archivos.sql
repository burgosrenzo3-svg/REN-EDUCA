-- =========================================================
-- REN EDUCA · Almacenamiento de archivos (Supabase Storage)
-- ---------------------------------------------------------
-- Instrucciones:
-- 1. Entra a tu proyecto en https://supabase.com/dashboard
-- 2. Ve a la sección "SQL Editor"
-- 3. Click en "New query"
-- 4. Copia y pega TODO este archivo
-- 5. Click en "Run" (o Ctrl+Enter / Cmd+Enter)
--
-- Esto crea el "bucket" (carpeta de almacenamiento) llamado
-- "contenido-cursos", donde se guardan las imagenes de los
-- cursos y los archivos (imagen, video, pdf) del contenido
-- de cada modulo, cuando el docente los sube desde su PC.
--
-- Es seguro ejecutar este script mas de una vez.
-- =========================================================


-- =========================================================
-- 1. CREAR EL BUCKET
-- ---------------------------------------------------------
-- "public" = true significa que los archivos se pueden ver
-- con su URL directa (necesario para mostrar imagenes/videos
-- en la pagina), pero SUBIR o BORRAR archivos sigue
-- protegido por las politicas de abajo: solo dueños del
-- curso (docente) o admin pueden hacerlo.
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('contenido-cursos', 'contenido-cursos', true, 52428800) -- 50 MB por archivo
on conflict (id) do update set public = true, file_size_limit = 52428800;


-- =========================================================
-- 2. POLITICAS DE SEGURIDAD DEL BUCKET
-- ---------------------------------------------------------
-- Estructura esperada de las rutas dentro del bucket:
--   {docente_id}/cursos/{curso_id}/portada-xxxx.jpg
--   {docente_id}/modulos/{modulo_id}/archivo-xxxx.pdf
--
-- Asi, cada docente solo puede subir/editar/borrar archivos
-- dentro de SU PROPIA carpeta (la que empieza con su propio
-- id de usuario). El admin puede hacerlo en cualquier carpeta.
-- Cualquier persona (incluso sin sesion) puede VER los
-- archivos, porque el bucket es publico para lectura.
-- =========================================================

drop policy if exists "Lectura publica de archivos de contenido" on storage.objects;

create policy "Lectura publica de archivos de contenido"
    on storage.objects for select
    to public
    using (bucket_id = 'contenido-cursos');

drop policy if exists "El docente sube archivos en su propia carpeta" on storage.objects;

create policy "El docente sube archivos en su propia carpeta"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'contenido-cursos'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.rol_actual() = 'admin'
        )
    );

drop policy if exists "El docente actualiza archivos en su propia carpeta" on storage.objects;

create policy "El docente actualiza archivos en su propia carpeta"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'contenido-cursos'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.rol_actual() = 'admin'
        )
    );

drop policy if exists "El docente elimina archivos en su propia carpeta" on storage.objects;

create policy "El docente elimina archivos en su propia carpeta"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'contenido-cursos'
        and (
            (storage.foldername(name))[1] = auth.uid()::text
            or public.rol_actual() = 'admin'
        )
    );


-- =========================================================
-- FIN DEL SCRIPT
-- ---------------------------------------------------------
-- Ya puedes subir archivos desde el panel docente:
-- - Imagen de portada del curso
-- - Imagen, video o PDF del contenido de cada modulo
--
-- Limite actual por archivo: 50 MB (puedes cambiarlo editando
-- "file_size_limit" arriba y volviendo a correr el script).
-- =========================================================
