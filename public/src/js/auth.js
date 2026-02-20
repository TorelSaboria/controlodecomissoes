// ===== AUTHENTICATION =====
// Login via API, session stored in sessionStorage

import { addLog } from './data/api.js';

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
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!res.ok) return null;

        const user = await res.json();
        const session = { id: user.id, username: user.username, role: user.role, nome: user.nome };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        await addLog(user.id, 'LOGIN', `Usuário ${user.nome} fez login`);
        return session;
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
