// ===== AUTHENTICATION =====
// Login via Supabase query, session in sessionStorage
import { addLog } from './data/store.js';
import { createClient } from '@supabase/supabase-js';

const SESSION_KEY = 'hotelcom_session';

// We create a separate client here so auth doesn't depend on store initialization
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

export function getCurrentUser() {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

export async function login(username, password) {
    // Query user directly by username and password
    const { data, error } = await db
        .from('users')
        .select('id, username, role, nome')
        .eq('username', username)
        .eq('password', password)
        .maybeSingle();

    if (error) {
        console.error('Supabase login query error:', error);
        throw new Error(error.message);
    }

    if (!data) {
        return null; // No matching user
    }

    const session = { id: data.id, username: data.username, role: data.role, nome: data.nome };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    // Log async but don't block login
    addLog(data.id, 'LOGIN', `Usuário ${data.nome} fez login`).catch(() => { });

    return session;
}

export async function logout() {
    const user = getCurrentUser();
    if (user) {
        addLog(user.id, 'LOGOUT', `Usuário ${user.nome} fez logout`).catch(() => { });
    }
    sessionStorage.removeItem(SESSION_KEY);
}
