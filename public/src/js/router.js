// ===== SPA ROUTER =====

let currentPage = 'dashboard';

export function initRouter() {
    // Handle nav clicks
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });

    // Handle hash changes
    window.addEventListener('hashchange', () => {
        const page = window.location.hash.slice(1) || 'dashboard';
        showPage(page);
    });

    // Initial page from hash
    const initial = window.location.hash.slice(1) || 'dashboard';
    showPage(initial);
}

export function navigateTo(page) {
    window.location.hash = page;
}

function showPage(page) {
    currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const target = document.getElementById('page-' + page);
    if (target) {
        target.classList.add('active');
    }

    // Update nav active state
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.classList.toggle('active', item.dataset.page === page);
    });

    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');

    // Dispatch page change event
    window.dispatchEvent(new CustomEvent('pagechange', { detail: { page } }));
}

export function getCurrentPage() {
    return currentPage;
}
