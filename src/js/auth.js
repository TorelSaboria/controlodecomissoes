// ===== AUTHENTICATION =====
// Login via Supabase query, session in sessionStorage
import { getUsers, addLog } from './data/store.js';

const SESSION_KEY = 'hotelcom_session';

export function getCurrentUser() {
    const session = sessionStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

export function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

export async function login(username, password) {
    try {
        const users = await getUsers();
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            const session = { id: user.id, username: user.username, role: user.role, nome: user.nome };
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            await addLog(user.id, 'LOGIN', `Usuário ${user.nome} fez login`);
            return session;
        }
        return null;
    } catch (e) {
        console.error('Login error:', e);
        return null;
    }
}

export async function logout() {
    const user = getCurrentUser();
    if (user) {
        await addLog(user.id, 'LOGOUT', `Usuário ${user.nome} fez logout`);
    }
    sessionStorage.removeItem(SESSION_KEY);
}
