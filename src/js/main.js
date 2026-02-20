// ===== MAIN ENTRY POINT =====
import { login, logout, getCurrentUser } from './auth.js';
import { initRouter, navigateTo } from './router.js';
import { initDashboard, refreshDashboard } from './pages/dashboard.js';
import { initSales } from './pages/sales.js';
import { initNewSale } from './pages/newSale.js';
import { initSettings } from './pages/settings.js';
import { showToast } from './utils/helpers.js';

// ===== DOM ELEMENTS =====
const loginScreen = document.getElementById('login-screen');
const appLayout = document.getElementById('app-layout');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const btnLogout = document.getElementById('btn-logout');
const mobileToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('sidebar');

// ===== AUTH FLOW =====
function showLoginScreen() {
    loginScreen.style.display = 'flex';
    appLayout.classList.remove('active');
}

async function showApp(user) {
    loginScreen.style.display = 'none';
    appLayout.classList.add('active');

    // Update user info in sidebar
    document.getElementById('user-avatar').textContent = user.nome.charAt(0).toUpperCase();
    document.getElementById('user-name').textContent = user.nome;
    document.getElementById('user-role').textContent = user.role === 'admin' ? 'Administrador' : 'Operador';

    // Initialize all pages (async)
    await initDashboard();
    await initSales();
    await initNewSale();
    await initSettings();
    initRouter();
}

// Check for existing session
const existingUser = getCurrentUser();
if (existingUser) {
    showApp(existingUser);
} else {
    showLoginScreen();
}

// Login form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-user').value.trim();
    const password = document.getElementById('login-pass').value;

    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entrando...';

    try {
        const user = await login(username, password);
        if (user) {
            loginError.classList.remove('show');
            await showApp(user);
            showToast(`Bem-vindo, ${user.nome}!`);
        } else {
            loginError.textContent = 'Usuário ou senha incorretos.';
            loginError.classList.add('show');
        }
    } catch (err) {
        console.error('Login error:', err);
        loginError.textContent = 'Erro de conexão. Verifique a internet.';
        loginError.classList.add('show');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Entrar';
    }
});

// Logout
btnLogout.addEventListener('click', async () => {
    await logout();
    showLoginScreen();
    loginForm.reset();
    window.location.hash = '';
});

// Mobile sidebar toggle
mobileToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

// Close sidebar on click outside (mobile)
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 &&
        sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== mobileToggle) {
        sidebar.classList.remove('open');
    }
});

// Page change listener to refresh dashboard
window.addEventListener('pagechange', (e) => {
    if (e.detail.page === 'dashboard') {
        refreshDashboard();
    }
});
