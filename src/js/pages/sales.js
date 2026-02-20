// ===== SALES PAGE =====
import {
    getSales,
    getSuppliers,
    getServices,
    getService,
    getSupplier,
    markSaleAsPaid,
    deleteSale,
    onUpdate,
    addLog
} from '../data/store.js';
import { getCurrentUser, isAdmin } from '../auth.js';
import { exportSalesToCSV } from '../utils/csv.js';
import { formatCurrency, formatDate, showToast } from '../utils/helpers.js';
import { navigateTo } from '../router.js';

let filteredSales = [];

export async function initSales() {
    await populateSupplierFilter();
    setupSalesFilters();
    setupSalesActions();
    await renderSalesTable();
    onUpdate('sales', () => renderSalesTable());
}

async function getFilteredSales() {
    try {
        let sales = await getSales();

        const searchTerm = document.getElementById('filter-guest')?.value.toLowerCase().trim() || '';
        const supplierFilter = document.getElementById('filter-supplier')?.value || '';
        const statusFilter = document.getElementById('filter-status')?.value || '';
        const dateFrom = document.getElementById('filter-date-start')?.value || '';
        const dateTo = document.getElementById('filter-date-end')?.value || '';
        const serviceTypeFilter = document.getElementById('filter-service-type')?.value || '';

        if (searchTerm) {
            sales = sales.filter(s =>
                s.hospede_nome.toLowerCase().includes(searchTerm) ||
                (s.quarto && s.quarto.toLowerCase().includes(searchTerm))
            );
        }

        if (supplierFilter) {
            sales = sales.filter(s => s.fornecedor_id === supplierFilter);
        }

        if (statusFilter) {
            sales = sales.filter(s => s.status === statusFilter);
        }

        if (dateFrom) {
            sales = sales.filter(s => s.data_servico >= dateFrom);
        }

        if (dateTo) {
            sales = sales.filter(s => s.data_servico <= dateTo);
        }

        if (serviceTypeFilter) {
            const services = await getServices();
            const matchingServiceIds = services
                .filter(svc => svc.tipo_servico === serviceTypeFilter)
                .map(svc => svc.id);
            sales = sales.filter(s => matchingServiceIds.includes(s.servico_id));
        }

        return sales;
    } catch (e) {
        console.error('Filter error:', e);
        return [];
    }
}

async function renderSalesTable() {
    try {
        filteredSales = await getFilteredSales();
        const container = document.getElementById('sales-table');
        const admin = isAdmin();

        if (filteredSales.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:24px;">Nenhuma venda encontrada</p>';
            return;
        }

        const rows = [];
        for (const sale of filteredSales) {
            const service = await getService(sale.servico_id);
            const supplier = await getSupplier(sale.fornecedor_id);

            rows.push(`
                <tr>
                    <td>${formatDate(sale.data_servico)}</td>
                    <td>${sale.hospede_nome}</td>
                    <td>${sale.quarto || '-'}</td>
                    <td>${service ? service.nome : '-'}</td>
                    <td>${supplier ? supplier.nome : '-'}</td>
                    <td>${formatCurrency(sale.valor_venda)}</td>
                    <td>${formatCurrency(sale.valor_comissao)}</td>
                    <td><span class="badge ${sale.status === 'pago' ? 'badge-success' : 'badge-warning'}">${sale.status}</span></td>
                    <td class="actions-cell">
                        <button class="btn-icon btn-edit" data-id="${sale.id}" title="Editar">✏️</button>
                        ${sale.status === 'pendente' ? `<button class="btn-icon btn-pay" data-id="${sale.id}" title="Marcar como pago">💰</button>` : ''}
                        ${admin ? `<button class="btn-icon btn-delete" data-id="${sale.id}" title="Excluir">🗑️</button>` : ''}
                    </td>
                </tr>
            `);
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Data</th><th>Hóspede</th><th>Quarto</th><th>Serviço</th>
                        <th>Fornecedor</th><th>Valor</th><th>Comissão</th><th>Status</th><th>Ações</th>
                    </tr>
                </thead>
                <tbody>${rows.join('')}</tbody>
            </table>
        `;

        // Action handlers
        container.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('edit-sale', { detail: { saleId: btn.dataset.id } }));
            });
        });

        container.querySelectorAll('.btn-pay').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Confirmar pagamento desta comissão?')) {
                    try {
                        await markSaleAsPaid(btn.dataset.id);
                        const user = getCurrentUser();
                        await addLog(user.id, 'PAY_SALE', `Venda ${btn.dataset.id} marcada como paga`);
                        showToast('Pagamento registrado!');
                        await renderSalesTable();
                    } catch (e) {
                        showToast('Erro ao registrar pagamento', 'error');
                    }
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja excluir esta venda?')) {
                    try {
                        await deleteSale(btn.dataset.id);
                        const user = getCurrentUser();
                        await addLog(user.id, 'DELETE_SALE', `Venda excluída`);
                        showToast('Venda excluída!');
                        await renderSalesTable();
                    } catch (e) {
                        showToast('Erro ao excluir venda', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Render sales error:', e);
    }
}

function setupSalesFilters() {
    // Standard filters
    ['filter-guest', 'filter-supplier', 'filter-status', 'filter-date-start', 'filter-date-end', 'filter-service-type'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener(id === 'filter-guest' ? 'input' : 'change', () => renderSalesTable());
        }
    });

    // Quick filter buttons
    document.querySelectorAll('.quick-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const quick = btn.dataset.quick;
            const today = new Date();
            const fmt = (d) => d.toISOString().split('T')[0];

            if (quick === 'today') {
                document.getElementById('filter-date-start').value = fmt(today);
                document.getElementById('filter-date-end').value = fmt(today);
            } else if (quick === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                document.getElementById('filter-date-start').value = fmt(weekAgo);
                document.getElementById('filter-date-end').value = fmt(today);
            } else if (quick === 'month') {
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                document.getElementById('filter-date-start').value = fmt(monthAgo);
                document.getElementById('filter-date-end').value = fmt(today);
            } else {
                document.getElementById('filter-guest').value = '';
                document.getElementById('filter-supplier').value = '';
                document.getElementById('filter-status').value = '';
                document.getElementById('filter-date-start').value = '';
                document.getElementById('filter-date-end').value = '';
                document.getElementById('filter-service-type').value = '';
            }
            renderSalesTable();
        });
    });

    // CSV export
    document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
        try {
            const sales = await getFilteredSales();
            const services = await getServices();
            const suppliers = await getSuppliers();
            exportSalesToCSV(sales, suppliers, services);
            showToast('CSV exportado!');
        } catch (e) {
            showToast('Erro ao exportar CSV', 'error');
        }
    });
}

async function populateSupplierFilter() {
    try {
        const suppliers = await getSuppliers();
        const select = document.getElementById('filter-supplier');
        if (!select) return;

        select.innerHTML = '<option value="">Todos</option>' +
            suppliers.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    } catch (e) {
        console.error('Populate supplier filter error:', e);
    }
}

function setupSalesActions() {
    document.getElementById('btn-goto-new-sale')?.addEventListener('click', () => {
        navigateTo('new-sale');
    });
}
