// ===== DATA STORE =====
// Supabase-backed store — replaces localStorage completely
// Uses @supabase/supabase-js via npm

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// Event system for reactivity (same interface)
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

// ===== SUPPLIERS =====
export async function getSuppliers() {
    const { data, error } = await db.from('suppliers').select('*').order('created_at');
    if (error) throw error;
    return data || [];
}

export async function getActiveSuppliers() {
    const { data, error } = await db.from('suppliers').select('*').eq('ativo', true).order('created_at');
    if (error) throw error;
    return data || [];
}

export async function getSupplier(id) {
    const { data, error } = await db.from('suppliers').select('*').eq('id', id).single();
    if (error) return null;
    return data;
}

export async function saveSupplier(supplier) {
    let result;
    if (supplier.id) {
        const { id, ...rest } = supplier;
        const { data, error } = await db.from('suppliers').update(rest).eq('id', id).select().single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await db.from('suppliers').insert(supplier).select().single();
        if (error) throw error;
        result = data;
    }
    dispatchUpdate('suppliers');
    return result;
}

export async function deleteSupplier(id) {
    const { error } = await db.from('suppliers').delete().eq('id', id);
    if (error) throw error;
    dispatchUpdate('suppliers');
}

// ===== SERVICES =====
let _servicesCache = null;

export async function getServices() {
    const { data, error } = await db.from('services').select('*').order('created_at');
    if (error) throw error;
    _servicesCache = data || [];
    return _servicesCache;
}

export async function getService(id) {
    if (_servicesCache) {
        const found = _servicesCache.find(s => s.id === id);
        if (found) return found;
    }
    const { data, error } = await db.from('services').select('*').eq('id', id).single();
    if (error) return null;
    return data;
}

export async function saveService(service) {
    let result;
    if (service.id) {
        const { id, ...rest } = service;
        const { data, error } = await db.from('services').update(rest).eq('id', id).select().single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await db.from('services').insert(service).select().single();
        if (error) throw error;
        result = data;
    }
    _servicesCache = null;
    dispatchUpdate('services');
    return result;
}

export async function deleteService(id) {
    const { error } = await db.from('services').delete().eq('id', id);
    if (error) throw error;
    _servicesCache = null;
    dispatchUpdate('services');
}

// ===== SALES =====
export async function getSales() {
    const { data, error } = await db.from('sales').select('*').order('data_servico', { ascending: false });
    if (error) throw error;
    return data || [];
}

export async function getSale(id) {
    const { data, error } = await db.from('sales').select('*').eq('id', id).single();
    if (error) return null;
    return data;
}

export async function saveSale(sale) {
    let result;
    if (sale.id) {
        const { id, ...rest } = sale;
        const { data, error } = await db.from('sales').update(rest).eq('id', id).select().single();
        if (error) throw error;
        result = data;
    } else {
        const { data, error } = await db.from('sales').insert({ ...sale, status: 'pendente' }).select().single();
        if (error) throw error;
        result = data;
    }
    dispatchUpdate('sales');
    return result;
}

export async function markSaleAsPaid(id) {
    const { error } = await db.from('sales').update({
        status: 'pago',
        data_pagamento: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
    dispatchUpdate('sales');
}

export async function deleteSale(id) {
    const { error } = await db.from('sales').delete().eq('id', id);
    if (error) throw error;
    dispatchUpdate('sales');
}

// ===== USERS =====
export async function getUsers() {
    const { data, error } = await db.from('users').select('id, username, role, nome, password');
    if (error) throw error;
    return data || [];
}

// ===== LOGS =====
export async function getLogs() {
    const { data, error } = await db.from('logs').select('*').order('timestamp', { ascending: false }).limit(500);
    if (error) throw error;
    return data || [];
}

export async function addLog(userId, action, details) {
    try {
        await db.from('logs').insert({ user_id: userId, action, details });
    } catch (e) {
        console.warn('Log failed:', e.message);
    }
}

// ===== COMMISSION CALCULATOR =====
export async function calculateCommission(serviceId, saleValue) {
    let service;
    if (_servicesCache) {
        service = _servicesCache.find(s => s.id === serviceId);
    }
    if (!service) {
        service = await getService(serviceId);
    }
    if (!service) return 0;

    if (service.tipo_comissao === 'fixa') {
        return parseFloat(service.valor_comissao);
    } else if (service.tipo_comissao === 'percentual') {
        return saleValue * (parseFloat(service.valor_comissao) / 100);
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
    const { data, error } = await db.from('sales').select('*').eq('data_servico', today);
    if (error) throw error;
    return data || [];
}
