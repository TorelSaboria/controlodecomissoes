// ===== DASHBOARD PAGE =====
import {
  getDashboardStats,
  getBillingAlerts,
  getTodayServices,
  getSales,
  getSuppliers,
  getService,
  getSupplier,
  onUpdate
} from '../data/store.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';

let supplierChart = null;
let timeChart = null;

export async function initDashboard() {
  await refreshDashboard();
  onUpdate('sales', () => refreshDashboard());
}

export async function refreshDashboard() {
  await Promise.all([
    renderCards(),
    renderTodayServices(),
    renderAlerts(),
    renderSupplierChart(),
    renderTimeChart()
  ]);
}

async function renderCards() {
  try {
    const stats = await getDashboardStats();
    const container = document.getElementById('dashboard-cards');
    container.innerHTML = `
            <div class="card">
                <div class="card-icon" style="background:rgba(59,130,246,0.15);color:#3b82f6;">💰</div>
                <div class="card-content">
                    <div class="card-label">Total de Vendas</div>
                    <div class="card-value">${formatCurrency(stats.totalVendas)}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-icon" style="background:rgba(0,214,143,0.15);color:#00d68f;">📊</div>
                <div class="card-content">
                    <div class="card-label">Total de Comissões</div>
                    <div class="card-value">${formatCurrency(stats.totalComissoes)}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-icon" style="background:rgba(249,115,22,0.15);color:#f97316;">⏳</div>
                <div class="card-content">
                    <div class="card-label">Pendentes</div>
                    <div class="card-value">${formatCurrency(stats.comissoesPendentes)}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-icon" style="background:rgba(34,197,94,0.15);color:#22c55e;">✅</div>
                <div class="card-content">
                    <div class="card-label">Pagas</div>
                    <div class="card-value">${formatCurrency(stats.comissoesPagas)}</div>
                </div>
            </div>
        `;
  } catch (e) {
    console.error('Dashboard cards error:', e);
  }
}

async function renderTodayServices() {
  try {
    const todaySales = await getTodayServices();
    const container = document.getElementById('today-services-table');

    if (todaySales.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:24px;">Nenhum serviço registrado hoje</p>';
      return;
    }

    const rows = [];
    for (const sale of todaySales) {
      const service = await getService(sale.servico_id);
      const supplier = await getSupplier(sale.fornecedor_id);
      rows.push(`
                <tr>
                    <td>${sale.hospede_nome}</td>
                    <td>${service ? service.nome : '-'}</td>
                    <td>${supplier ? supplier.nome : '-'}</td>
                    <td>${formatCurrency(sale.valor_venda)}</td>
                    <td><span class="badge ${sale.status === 'pago' ? 'badge-success' : 'badge-warning'}">${sale.status}</span></td>
                </tr>
            `);
    }

    container.innerHTML = `
            <table>
                <thead><tr><th>Hóspede</th><th>Serviço</th><th>Fornecedor</th><th>Valor</th><th>Status</th></tr></thead>
                <tbody>${rows.join('')}</tbody>
            </table>
        `;
  } catch (e) {
    console.error('Today services error:', e);
  }
}

async function renderAlerts() {
  try {
    const alerts = await getBillingAlerts();
    const container = document.getElementById('billing-alerts');

    if (alerts.length === 0) {
      container.innerHTML = '<p style="color:var(--color-text-muted);text-align:center;padding:24px;">Nenhum alerta de cobrança</p>';
      return;
    }

    container.innerHTML = alerts.map(alert => `
            <div class="alert-card ${alert.daysOverdue > 5 ? 'alert-danger' : alert.daysOverdue > 0 ? 'alert-warning' : 'alert-info'}">
                <div class="alert-header">
                    <strong>${alert.supplier.nome}</strong>
                    <span class="badge ${alert.daysOverdue > 5 ? 'badge-danger' : 'badge-warning'}">${alert.daysOverdue} dias</span>
                </div>
                <div class="alert-body">
                    Dia de cobrança: ${alert.billingDay} | Pendente: ${formatCurrency(alert.totalPending)}
                </div>
            </div>
        `).join('');
  } catch (e) {
    console.error('Billing alerts error:', e);
  }
}

async function renderSupplierChart() {
  try {
    const sales = await getSales();
    const suppliers = await getSuppliers();

    const commissionBySupplier = {};
    suppliers.forEach(s => { commissionBySupplier[s.id] = { nome: s.nome, total: 0 }; });

    sales.forEach(s => {
      if (commissionBySupplier[s.fornecedor_id]) {
        commissionBySupplier[s.fornecedor_id].total += parseFloat(s.valor_comissao) || 0;
      }
    });

    const entries = Object.values(commissionBySupplier).filter(e => e.total > 0);
    const labels = entries.map(e => e.nome);
    const data = entries.map(e => e.total);

    const ctx = document.getElementById('chart-suppliers').getContext('2d');

    if (supplierChart) supplierChart.destroy();

    supplierChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Comissões (€)',
          data,
          backgroundColor: [
            'rgba(0, 214, 143, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(249, 115, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `€ ${ctx.parsed.y.toFixed(2)}` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8', callback: (v) => `€${v}` }, grid: { color: 'rgba(148,163,184,0.1)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
      }
    });
  } catch (e) {
    console.error('Supplier chart error:', e);
  }
}

async function renderTimeChart() {
  try {
    const sales = await getSales();

    const today = new Date();
    const days = [];
    const salesByDay = {};

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push(key);
      salesByDay[key] = 0;
    }

    sales.forEach(s => {
      if (salesByDay[s.data_servico] !== undefined) {
        salesByDay[s.data_servico] += parseFloat(s.valor_venda) || 0;
      }
    });

    const labels = days.map(d => {
      const [, m, day] = d.split('-');
      return `${day}/${m}`;
    });
    const data = days.map(d => salesByDay[d]);

    const ctx = document.getElementById('chart-sales-time').getContext('2d');

    if (timeChart) timeChart.destroy();

    timeChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Vendas (€)',
          data,
          borderColor: '#00d68f',
          backgroundColor: 'rgba(0, 214, 143, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00d68f',
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `€ ${ctx.parsed.y.toFixed(2)}` } }
        },
        scales: {
          y: { beginAtZero: true, ticks: { color: '#94a3b8', callback: (v) => `€${v}` }, grid: { color: 'rgba(148,163,184,0.1)' } },
          x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
        }
      }
    });
  } catch (e) {
    console.error('Time chart error:', e);
  }
}
