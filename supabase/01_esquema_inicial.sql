-- =========================================================
-- REN EDUCA · Esquema de base de datos para Supabase
-- ---------------------------------------------------------
-- Instrucciones:
-- 1. Entra a tu proyecto en https://supabase.com/dashboard
-- 2. Ve a la sección "SQL Editor" (icono de consola en el menú izquierdo)
-- 3. Click en "New query"
-- 4. Copia y pega TODO este archivo
-- 5. Click en "Run" (o Ctrl+Enter / Cmd+Enter)
--
-- Este script es seguro de ejecutar una sola vez. Crea las
-- tablas, las relaciones, los indices, y las reglas de
-- seguridad (RLS) para que cada persona solo pueda ver y
-- modificar lo que le corresponde segun su rol.
-- =========================================================


-- =========================================================
-- 1. TABLA: perfiles
-- ---------------------------------------------------------
-- Cada fila representa a un usuario de la plataforma:
-- administrador, docente o estudiante. Esta tabla esta
-- conectada 1 a 1 con la tabla interna de autenticacion
-- de Supabase (auth.users), que es la que de verdad
-- guarda las contraseñas de forma segura y encriptada.
-- =========================================================

create table if not exists public.perfiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre text not null,
    correo text not null unique,
    rol text not null check (rol in ('admin', 'docente', 'estudiante')),
    fecha_registro timestamptz not null default now()
);

comment on table public.perfiles is 'Datos publicos de cada usuario (nombre, correo, rol). La contraseña vive aparte, en auth.users, gestionada por Supabase.';


-- =========================================================
-- 2. TABLA: cursos
-- ---------------------------------------------------------
-- Cada curso pertenece a un docente (docente_id).
-- =========================================================

create table if not exists public.cursos (
    id uuid primary key default gen_random_uuid(),
    docente_id uuid not null references public.perfiles(id) on delete cascade,
    nombre text not null,
    descripcion text,
    categoria text,
    nivel text,
    imagen text,
    visible boolean not null default true,
    creado_en timestamptz not null default now()
);

create index if not exists idx_cursos_docente on public.cursos(docente_id);


-- =========================================================
-- 3. TABLA: modulos
-- ---------------------------------------------------------
-- Cada modulo pertenece a un curso. El contenido (texto,
-- imagen, video, pdf) se guarda como JSON en una sola
-- columna, igual que en la version anterior con localStorage.
-- =========================================================

create table if not exists public.modulos (
    id uuid primary key default gen_random_uuid(),
    curso_id uuid not null references public.cursos(id) on delete cascade,
    nombre text not null,
    orden integer not null default 0,
    contenido jsonb default '{}'::jsonb,
    creado_en timestamptz not null default now()
);

create index if not exists idx_modulos_curso on public.modulos(curso_id);


-- =========================================================
-- 4. TABLA: preguntas_quiz
-- ---------------------------------------------------------
-- Cada pregunta pertenece a un modulo. Las opciones de
-- respuesta (para preguntas de tipo "opcion") se guardan
-- como JSON, igual que en la version anterior.
-- =========================================================

create table if not exists public.preguntas_quiz (
    id uuid primary key default gen_random_uuid(),
    modulo_id uuid not null references public.modulos(id) on delete cascade,
    tipo text not null check (tipo in ('opcion', 'vf')),
    texto text not null,
    opciones jsonb default '[]'::jsonb,
    respuesta_correcta text not null,
    orden integer not null default 0
);

create index if not exists idx_preguntas_modulo on public.preguntas_quiz(modulo_id);


-- =========================================================
-- 5. TABLA: progreso
-- ---------------------------------------------------------
-- Marca que un estudiante completo un modulo especifico.
-- Una fila por cada (estudiante, modulo) completado.
-- =========================================================

create table if not exists public.progreso (
    id uuid primary key default gen_random_uuid(),
    estudiante_id uuid not null references public.perfiles(id) on delete cascade,
    modulo_id uuid not null references public.modulos(id) on delete cascade,
    completado_en timestamptz not null default now(),
    unique (estudiante_id, modulo_id)
);

create index if not exists idx_progreso_estudiante on public.progreso(estudiante_id);


-- =========================================================
-- 6. TABLA: intentos_quiz
-- ---------------------------------------------------------
-- Guarda el resultado de cada estudiante en el quiz de
-- cada modulo: cuantos intentos, mejor nota, si aprobo.
-- =========================================================

create table if not exists public.intentos_quiz (
    id uuid primary key default gen_random_uuid(),
    estudiante_id uuid not null references public.perfiles(id) on delete cascade,
    modulo_id uuid not null references public.modulos(id) on delete cascade,
    intentos integer not null default 0,
    mejor_nota integer not null default 0,
    ultima_nota integer,
    aprobado boolean not null default false,
    ultima_fecha timestamptz default now(),
    unique (estudiante_id, modulo_id)
);

create index if not exists idx_intentos_estudiante on public.intentos_quiz(estudiante_id);


-- =========================================================
-- 7. FUNCION AUXILIAR: obtener el rol del usuario actual
-- ---------------------------------------------------------
-- Las politicas de seguridad (mas abajo) preguntan
-- constantemente "¿que rol tiene quien esta pidiendo esto?".
-- Esta funcion lo resuelve una sola vez, de forma segura.
-- =========================================================

create or replace function public.rol_actual()
returns text
language sql
security definer
stable
as $$
    select rol from public.perfiles where id = auth.uid();
$$;


-- =========================================================
-- 8. SEGURIDAD A NIVEL DE FILA (Row Level Security)
-- ---------------------------------------------------------
-- A partir de aqui se define QUIEN puede ver y modificar
-- QUE. Sin esto, cualquier persona con la URL de tu proyecto
-- podria leer o borrar todos los datos de todos.
-- =========================================================

alter table public.perfiles enable row level security;
alter table public.cursos enable row level security;
alter table public.modulos enable row level security;
alter table public.preguntas_quiz enable row level security;
alter table public.progreso enable row level security;
alter table public.intentos_quiz enable row level security;

-- ---------- PERFILES ----------
-- Cualquier persona logueada puede VER todos los perfiles
-- (se necesita para mostrar "Docente: Juan Perez" en cursos).
-- Pero solo el propio usuario o un admin puede MODIFICAR un perfil.

drop policy if exists "Perfiles visibles para todos los logueados" on public.perfiles;

create policy "Perfiles visibles para todos los logueados"
    on public.perfiles for select
    to authenticated
    using (true);

drop policy if exists "El usuario edita su propio perfil, o el admin edita cualquiera" on public.perfiles;

create policy "El usuario edita su propio perfil, o el admin edita cualquiera"
    on public.perfiles for update
    to authenticated
    using (auth.uid() = id or public.rol_actual() = 'admin');

drop policy if exists "Solo el admin elimina perfiles" on public.perfiles;

create policy "Solo el admin elimina perfiles"
    on public.perfiles for delete
    to authenticated
    using (public.rol_actual() = 'admin');

drop policy if exists "Cualquier persona autenticandose crea su propio perfil" on public.perfiles;

create policy "Cualquier persona autenticandose crea su propio perfil"
    on public.perfiles for insert
    to authenticated
    with check (auth.uid() = id);

-- ---------- CURSOS ----------
-- Cualquier persona (incluso sin sesion) puede VER cursos
-- publicados (visible = true), porque el catalogo se muestra
-- en la pagina de inicio antes de registrarse. El docente
-- dueño y el admin pueden ver y modificar TODOS sus cursos,
-- incluso los ocultos.

drop policy if exists "Cursos publicados visibles para todos, propios visibles siempre" on public.cursos;

create policy "Cursos publicados visibles para todos, propios visibles siempre"
    on public.cursos for select
    to anon, authenticated
    using (
        visible = true
        or docente_id = auth.uid()
        or public.rol_actual() = 'admin'
    );

drop policy if exists "El docente crea sus propios cursos" on public.cursos;

create policy "El docente crea sus propios cursos"
    on public.cursos for insert
    to authenticated
    with check (docente_id = auth.uid() or public.rol_actual() = 'admin');

drop policy if exists "El docente dueño o el admin edita el curso" on public.cursos;

create policy "El docente dueño o el admin edita el curso"
    on public.cursos for update
    to authenticated
    using (docente_id = auth.uid() or public.rol_actual() = 'admin');

drop policy if exists "El docente dueño o el admin elimina el curso" on public.cursos;

create policy "El docente dueño o el admin elimina el curso"
    on public.cursos for delete
    to authenticated
    using (docente_id = auth.uid() or public.rol_actual() = 'admin');

-- ---------- MODULOS ----------
-- Mismo criterio que cursos: visibles si el curso es visible,
-- o si eres el docente dueño / admin.

drop policy if exists "Modulos visibles si el curso es visible o eres el dueño/admin" on public.modulos;

create policy "Modulos visibles si el curso es visible o eres el dueño/admin"
    on public.modulos for select
    to authenticated
    using (
        exists (
            select 1 from public.cursos
            where cursos.id = modulos.curso_id
            and (cursos.visible = true or cursos.docente_id = auth.uid() or public.rol_actual() = 'admin')
        )
    );

drop policy if exists "El docente dueño o el admin gestiona modulos" on public.modulos;

create policy "El docente dueño o el admin gestiona modulos"
    on public.modulos for all
    to authenticated
    using (
        exists (
            select 1 from public.cursos
            where cursos.id = modulos.curso_id
            and (cursos.docente_id = auth.uid() or public.rol_actual() = 'admin')
        )
    );

-- ---------- PREGUNTAS DE QUIZ ----------
-- Mismo criterio: ligado al curso a traves del modulo.

drop policy if exists "Preguntas visibles si el modulo es visible" on public.preguntas_quiz;

create policy "Preguntas visibles si el modulo es visible"
    on public.preguntas_quiz for select
    to authenticated
    using (
        exists (
            select 1 from public.modulos
            join public.cursos on cursos.id = modulos.curso_id
            where modulos.id = preguntas_quiz.modulo_id
            and (cursos.visible = true or cursos.docente_id = auth.uid() or public.rol_actual() = 'admin')
        )
    );

drop policy if exists "El docente dueño o el admin gestiona preguntas" on public.preguntas_quiz;

create policy "El docente dueño o el admin gestiona preguntas"
    on public.preguntas_quiz for all
    to authenticated
    using (
        exists (
            select 1 from public.modulos
            join public.cursos on cursos.id = modulos.curso_id
            where modulos.id = preguntas_quiz.modulo_id
            and (cursos.docente_id = auth.uid() or public.rol_actual() = 'admin')
        )
    );

-- ---------- PROGRESO ----------
-- Cada estudiante solo ve y modifica SU PROPIO progreso.
-- El admin y el docente dueño del curso tambien pueden verlo.

drop policy if exists "El propio estudiante ve su progreso" on public.progreso;

create policy "El propio estudiante ve su progreso"
    on public.progreso for select
    to authenticated
    using (
        estudiante_id = auth.uid()
        or public.rol_actual() = 'admin'
        or exists (
            select 1 from public.modulos
            join public.cursos on cursos.id = modulos.curso_id
            where modulos.id = progreso.modulo_id
            and cursos.docente_id = auth.uid()
        )
    );

drop policy if exists "El propio estudiante registra su progreso" on public.progreso;

create policy "El propio estudiante registra su progreso"
    on public.progreso for insert
    to authenticated
    with check (estudiante_id = auth.uid());

drop policy if exists "El propio estudiante actualiza su progreso" on public.progreso;

create policy "El propio estudiante actualiza su progreso"
    on public.progreso for update
    to authenticated
    using (estudiante_id = auth.uid());

-- ---------- INTENTOS DE QUIZ ----------
-- Mismo criterio que progreso.

drop policy if exists "El propio estudiante ve sus intentos de quiz" on public.intentos_quiz;

create policy "El propio estudiante ve sus intentos de quiz"
    on public.intentos_quiz for select
    to authenticated
    using (
        estudiante_id = auth.uid()
        or public.rol_actual() = 'admin'
        or exists (
            select 1 from public.modulos
            join public.cursos on cursos.id = modulos.curso_id
            where modulos.id = intentos_quiz.modulo_id
            and cursos.docente_id = auth.uid()
        )
    );

drop policy if exists "El propio estudiante registra sus intentos" on public.intentos_quiz;

create policy "El propio estudiante registra sus intentos"
    on public.intentos_quiz for insert
    to authenticated
    with check (estudiante_id = auth.uid());

drop policy if exists "El propio estudiante actualiza sus intentos" on public.intentos_quiz;

create policy "El propio estudiante actualiza sus intentos"
    on public.intentos_quiz for update
    to authenticated
    using (estudiante_id = auth.uid());


-- =========================================================
-- 9. CREACION AUTOMATICA DE PERFIL AL REGISTRARSE
-- ---------------------------------------------------------
-- Cuando alguien se registra (vía supabase.auth.signUp),
-- esta funcion crea automaticamente su fila en "perfiles"
-- usando los datos extra (nombre, rol) que se le pasen.
-- =========================================================

create or replace function public.crear_perfil_automatico()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.perfiles (id, nombre, correo, rol)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'nombre', 'Usuario'),
        new.email,
        coalesce(new.raw_user_meta_data->>'rol', 'estudiante')
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.crear_perfil_automatico();


-- =========================================================
-- FIN DEL SCRIPT
-- ---------------------------------------------------------
-- Si todo se ejecuto sin errores, ya tienes:
-- - 6 tablas: perfiles, cursos, modulos, preguntas_quiz,
--   progreso, intentos_quiz
-- - Seguridad activada (nadie puede ver/borrar lo que no es suyo)
-- - Creacion automatica de perfil al registrarse
--
-- Siguiente paso: crear tu primer usuario administrador
-- (ver archivo "crear-primer-admin.md" en esta misma carpeta).
-- =========================================================
