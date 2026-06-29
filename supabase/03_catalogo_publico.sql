-- =========================================================
-- REN EDUCA · Catalogo publico visible sin iniciar sesion
-- ---------------------------------------------------------
-- Instrucciones:
-- 1. Entra a tu proyecto en https://supabase.com/dashboard
-- 2. Ve a la sección "SQL Editor" → "New query"
-- 3. Copia y pega TODO este archivo
-- 4. Click en "Run"
--
-- Por que se necesita esto:
-- Antes, solo una persona con sesion iniciada podia ver los
-- cursos (politica "to authenticated"). Ahora que el catalogo
-- se muestra en la pagina de inicio ANTES de iniciar sesion,
-- las reglas de seguridad deben permitir tambien la lectura
-- a "anon" (visitante sin cuenta) para los cursos visibles.
--
-- Los modulos, el contenido interno y los quices SIGUEN
-- ocultos para quien no tiene sesion: solo se expone lo minimo
-- para armar las tarjetas del catalogo (nombre, descripcion,
-- categoria, nivel, imagen). El estudiante sigue necesitando
-- registrarse para entrar al aula y ver el contenido real.
--
-- Es seguro ejecutar este script mas de una vez.
-- =========================================================

drop policy if exists "Cursos publicados visibles para todos, propios visibles siempre" on public.cursos;

create policy "Cursos publicados visibles para todos, propios visibles siempre"
    on public.cursos for select
    to anon, authenticated
    using (
        visible = true
        or docente_id = auth.uid()
        or public.rol_actual() = 'admin'
    );

-- =========================================================
-- FIN DEL SCRIPT
-- ---------------------------------------------------------
-- Ahora cualquier visitante (sin iniciar sesion) puede ver,
-- desde index.html, el nombre, descripcion, categoria, nivel
-- e imagen de los cursos marcados como "visible". El resto
-- de la plataforma (modulos, contenido, progreso, quices)
-- sigue protegido y requiere sesion.
-- =========================================================
