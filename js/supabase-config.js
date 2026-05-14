// Supabase configuration can be generated at build time from Render environment variables.
// If build-time generation is not available, this file also falls back to runtime globals.
const url = window.RENDER_SUPABASE_URL || window.SUPABASE_URL || null;
const anonKey = window.RENDER_SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || null;

window.PEPPER_SUPABASE = {
    url,
    anonKey
};

if (!url || !anonKey) {
    console.warn('Supabase URL and anon key were not injected. Set them as Render environment variables.');
}
