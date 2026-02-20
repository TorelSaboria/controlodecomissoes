// ===== API CLIENT =====
// Replaces store.js — all data operations go through the REST API
// Same function names, now async with fetch()

const API_BASE = '/api';

// ===== HTTP helpers =====
async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao buscar dados (${res.status})`);
    }
    return res.json();
}

async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao salvar dados (${res.status})`);
    }
    return res.json();
}

async function apiPut(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao atualizar dados (${res.status})`);
    }
    return res.json();
}

async function apiPatch(path, body = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao atualizar dados (${res.status})`);
    }
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Erro ao excluir dados (${res.status})`);
    }
    return res.json();
}

// ===== Event system for reactivity (same interface as old store) =====
const listeners = {};

export function onUpdate(collection, callback) {
    if (!listeners[collection]) listeners[collection] = [];
    listeners[collection].push(callback);
}

function dispatchUpdate(collection) {
    if (listeners[collection]) {
        listeners[collection].forEach(cb => cb());
    }
    if (listeners['any']) {
        listeners['any'].forEach(cb => cb());
    }
}

// ===== In-memory cache for services (used by calculateCommission) =====
let _servicesCache = null;

async function refreshServicesCache() {
    _servicesCache = await apiGet('/services');
}

// ===== SUPPLIERS =====
export async function getSuppliers() {
    return apiGet('/suppliers');
}

export async function getActiveSuppliers() {
    const suppliers = await getSuppliers();
    return suppliers.filter(s => s.ativo);
}

export async function getSupplier(id) {
    const suppliers = await getSuppliers();
    return suppliers.find(s => s.id === id);
}

export async function saveSupplier(supplier) {
    let result;
    if (supplier.id) {
        result = await apiPut(`/suppliers/${supplier.id}`, supplier);
    } else {
        result = await apiPost('/suppliers', supplier);
    }
    dispatchUpdate('suppliers');
    return result;
}

export async function deleteSupplier(id) {
    await apiDelete(`/suppliers/${id}`);
    dispatchUpdate('suppliers');
}

// ===== SERVICES =====
export async function getServices() {
    const data = await apiGet('/services');
    _servicesCache = data; // keep cache fresh
    return data;
}

export async function getService(id) {
    // Use cache if available for sync-like speed
    if (_servicesCache) {
        const found = _servicesCache.find(s => s.id === id);
        if (found) return found;
    }
    const services = await getServices();
    return services.find(s => s.id === id);
}

export async function saveService(service) {
    let result;
    if (service.id) {
        result = await apiPut(`/services/${service.id}`, service);
    } else {
        result = await apiPost('/services', service);
    }
    _servicesCache = null; // invalidate cache
    dispatchUpdate('services');
    return result;
}

export async function deleteService(id) {
    await apiDelete(`/services/${id}`);
    _servicesCache = null;
    dispatchUpdate('services');
}

// ===== SALES =====
export async function getSales() {
    return apiGet('/sales');
}

export async function getSale(id) {
    const sales = await getSales();
    return sales.find(s => s.id === id);
}

export async function saveSale(sale) {
    let result;
    if (sale.id) {
        result = await apiPut(`/sales/${sale.id}`, sale);
    } else {
        result = await apiPost('/sales', sale);
    }
    dispatchUpdate('sales');
    return result;
}

export async function markSaleAsPaid(id) {
    await apiPatch(`/sales/${id}/pay`);
    dispatchUpdate('sales');
}

export async function deleteSale(id) {
    await apiDelete(`/sales/${id}`);
    dispatchUpdate('sales');
}

// ===== USERS =====
export async function getUsers() {
    // Not used directly anymore — login goes through /api/auth/login
    return [];
}

// ===== LOGS =====
export async function getLogs() {
    return apiGet('/logs');
}

export async function addLog(userId, action, details) {
    try {
        await apiPost('/logs', { user_id: userId, action, details });
    } catch (e) {
        console.warn('Log failed:', e.message);
    }
}

// ===== COMMISSION CALCULATOR =====
// Uses cached services for fast calculation
export async function calculateCommission(serviceId, saleValue) {
    let service;
    if (_servicesCache) {
        service = _servicesCache.find(s => s.id === serviceId);
    }
    if (!service) {
        await refreshServicesCache();
        service = _servicesCache?.find(s => s.id === serviceId);
    }
    if (!service) return 0;

    if (service.tipo_comissao === 'fixa') {
        return service.valor_comissao;
    } else if (service.tipo_comissao === 'percentual') {
        return saleValue * (service.valor_comissao / 100);
    }
    return 0;
}

// ===== DASHBOARD CALCULATIONS =====
export async function getDashboardStats() {
    const sales = await getSales();
    return {
        totalVendas: sales.reduce((sum, s) => sum + (parseFloat(s.valor_venda) || 0), 0),
        totalComissoes: sales.reduce((sum, s) => sum + (parseFloat(s.valor_comissao) || 0), 0),
        comissoesPendentes: sales.filter(s => s.status === 'pendente').reduce((sum, s) => sum + (parseFloat(s.valor_comissao) || 0), 0),
        comissoesPagas: sales.filter(s => s.status === 'pago').reduce((sum, s) => sum + (parseFloat(s.valor_comissao) || 0), 0),
    };
}

// ===== BILLING ALERTS =====
export async function getBillingAlerts() {
    const today = new Date();
    const currentDay = today.getDate();
    const suppliers = await getActiveSuppliers();
    const allSales = await getSales();
    const pendingSales = allSales.filter(s => s.status === 'pendente');

    const alerts = [];

    suppliers.forEach(supplier => {
        const supplierPending = pendingSales.filter(s => s.fornecedor_id === supplier.id);
        if (supplierPending.length === 0) return;

        const totalPending = supplierPending.reduce((sum, s) => sum + (parseFloat(s.valor_comissao) || 0), 0);
        const billingDay = parseInt(supplier.dia_cobranca) || 1;

        let daysOverdue = 0;
        if (currentDay >= billingDay) {
            daysOverdue = currentDay - billingDay;
        } else {
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, billingDay);
            const diffTime = today - lastMonth;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 28) {
                daysOverdue = currentDay + (30 - billingDay);
            }
        }

        if (daysOverdue >= 0 && currentDay >= billingDay) {
            alerts.push({ supplier, totalPending, daysOverdue, billingDay });
        }
    });

    return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

// ===== TODAY'S SERVICES =====
export async function getTodayServices() {
    const today = new Date().toISOString().split('T')[0];
    const sales = await getSales();
    return sales.filter(s => s.data_servico === today);
}
