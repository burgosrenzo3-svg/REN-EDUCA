/* =======================================================
   REN EDUCA · Cliente de Supabase
   -------------------------------------------------------
   Este archivo crea la conexion entre tu pagina web y tu
   base de datos en Supabase. Debe cargarse ANTES que
   auth.js y cualquier otro script que use datos.

   SUPABASE_URL y SUPABASE_ANON_KEY son datos PUBLICOS por
   diseño (el navegador de cada visitante los necesita para
   conectarse). La seguridad real la dan las politicas RLS
   configuradas en la base de datos, no el secreto de esta
   clave. NUNCA se debe poner aqui la "service_role key".
======================================================= */

const SUPABASE_URL = "https://axkvdkyytdlcsrcaueqs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4a3Zka3l5dGRsY3NyY2F1ZXFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MTI4MjcsImV4cCI6MjA5ODE4ODgyN30.D_4zAgbDMfz0Pk78STtTyW4Jo5zw3k5x68U_aJEsGjc";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});
