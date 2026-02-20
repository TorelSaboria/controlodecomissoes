// ===== SETTINGS PAGE =====
import {
    getSuppliers,
    getActiveSuppliers,
    getSupplier,
    saveSupplier,
    deleteSupplier,
    getServices,
    getService,
    saveService,
    deleteService,
    onUpdate,
    addLog
} from '../data/api.js';
import { getCurrentUser, isAdmin } from '../auth.js';
import { showToast } from '../utils/helpers.js';

export async function initSettings() {
    setupTabs();
    await renderSuppliersTable();
    await renderServicesTable();
    setupSupplierActions();
    setupServiceActions();
    await populateServiceSupplierDropdown();

    onUpdate('suppliers', async () => {
        await renderSuppliersTable();
        await populateServiceSupplierDropdown();
    });
    onUpdate('services', () => renderServicesTable());
}

// ===== TABS =====
function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
        });
    });
}

// ===== SUPPLIERS =====
async function renderSuppliersTable() {
    try {
        const suppliers = await getSuppliers();
        const tbody = document.getElementById('suppliers-table-body');
        const admin = isAdmin();

        if (suppliers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-secondary)">Nenhum fornecedor cadastrado</td></tr>';
            return;
        }

        tbody.innerHTML = suppliers.map(s => `
            <tr>
                <td>${s.nome}</td>
                <td>${s.telefone || '-'}</td>
                <td>${s.dia_cobranca}</td>
                <td>
                    <span class="badge ${s.ativo ? 'badge-success' : 'badge-danger'}">
                        ${s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit-supplier" data-id="${s.id}" title="Editar">✏️</button>
                    ${admin ? `<button class="btn-icon btn-delete-supplier" data-id="${s.id}" title="Excluir">🗑️</button>` : ''}
                </td>
            </tr>
        `).join('');

        // Edit handlers
        tbody.querySelectorAll('.btn-edit-supplier').forEach(btn => {
            btn.addEventListener('click', () => openSupplierModal(btn.dataset.id));
        });

        // Delete handlers
        tbody.querySelectorAll('.btn-delete-supplier').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Excluir este fornecedor?')) {
                    try {
                        await deleteSupplier(btn.dataset.id);
                        const user = getCurrentUser();
                        await addLog(user.id, 'DELETE_SUPPLIER', `Fornecedor excluído: ${btn.dataset.id}`);
                        showToast('Fornecedor excluído!');
                        await renderSuppliersTable();
                    } catch (e) {
                        showToast('Erro ao excluir fornecedor', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Render suppliers error:', e);
    }
}

async function openSupplierModal(supplierId = null) {
    const modal = document.getElementById('supplier-modal');
    const title = document.getElementById('supplier-modal-title');
    const form = document.getElementById('supplier-form');

    form.reset();
    document.getElementById('supplier-id').value = '';

    if (supplierId) {
        try {
            const supplier = await getSupplier(supplierId);
            if (supplier) {
                title.textContent = 'Editar Fornecedor';
                document.getElementById('supplier-id').value = supplier.id;
                document.getElementById('supplier-nome').value = supplier.nome;
                document.getElementById('supplier-telefone').value = supplier.telefone || '';
                document.getElementById('supplier-dia-cobranca').value = supplier.dia_cobranca;
                document.getElementById('supplier-ativo').checked = supplier.ativo;
            }
        } catch (e) {
            showToast('Erro ao carregar fornecedor', 'error');
            return;
        }
    } else {
        title.textContent = 'Novo Fornecedor';
        document.getElementById('supplier-ativo').checked = true;
    }

    modal.classList.add('open');
}

function setupSupplierActions() {
    // Open modal for new supplier
    document.getElementById('btn-new-supplier')?.addEventListener('click', () => {
        openSupplierModal();
    });

    // Close modal
    document.getElementById('btn-close-supplier-modal')?.addEventListener('click', () => {
        document.getElementById('supplier-modal').classList.remove('open');
    });

    // Form submit
    document.getElementById('supplier-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const supplier = {
            nome: document.getElementById('supplier-nome').value.trim(),
            telefone: document.getElementById('supplier-telefone').value.trim(),
            dia_cobranca: parseInt(document.getElementById('supplier-dia-cobranca').value),
            ativo: document.getElementById('supplier-ativo').checked
        };

        const id = document.getElementById('supplier-id').value;
        if (id) supplier.id = id;

        try {
            await saveSupplier(supplier);
            const user = getCurrentUser();
            await addLog(user.id, id ? 'EDIT_SUPPLIER' : 'CREATE_SUPPLIER',
                `${id ? 'Editado' : 'Criado'} fornecedor: ${supplier.nome}`);
            showToast(id ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
            document.getElementById('supplier-modal').classList.remove('open');
            await renderSuppliersTable();
        } catch (err) {
            showToast('Erro ao salvar fornecedor: ' + err.message, 'error');
        }
    });
}

// ===== SERVICES =====
async function renderServicesTable() {
    try {
        const services = await getServices();
        const suppliers = await getSuppliers();
        const tbody = document.getElementById('services-table-body');
        const admin = isAdmin();

        if (services.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-secondary)">Nenhum serviço cadastrado</td></tr>';
            return;
        }

        const supplierMap = {};
        suppliers.forEach(s => { supplierMap[s.id] = s.nome; });

        tbody.innerHTML = services.map(s => `
            <tr>
                <td>${s.nome}</td>
                <td><span class="badge badge-info">${s.tipo_servico}</span></td>
                <td>${supplierMap[s.fornecedor_id] || '-'}</td>
                <td>${s.tipo_comissao === 'fixa' ? 'Fixa' : 'Percentual'}</td>
                <td>${s.tipo_comissao === 'fixa' ? `€ ${s.valor_comissao}` : `${s.valor_comissao}%`}</td>
                <td class="actions-cell">
                    <button class="btn-icon btn-edit-service" data-id="${s.id}" title="Editar">✏️</button>
                    ${admin ? `<button class="btn-icon btn-delete-service" data-id="${s.id}" title="Excluir">🗑️</button>` : ''}
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-edit-service').forEach(btn => {
            btn.addEventListener('click', () => openServiceModal(btn.dataset.id));
        });

        tbody.querySelectorAll('.btn-delete-service').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Excluir este serviço?')) {
                    try {
                        await deleteService(btn.dataset.id);
                        const user = getCurrentUser();
                        await addLog(user.id, 'DELETE_SERVICE', `Serviço excluído: ${btn.dataset.id}`);
                        showToast('Serviço excluído!');
                        await renderServicesTable();
                    } catch (e) {
                        showToast('Erro ao excluir serviço', 'error');
                    }
                }
            });
        });
    } catch (e) {
        console.error('Render services error:', e);
    }
}

async function openServiceModal(serviceId = null) {
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    const form = document.getElementById('service-form');

    form.reset();
    document.getElementById('service-id').value = '';
    await populateServiceSupplierDropdown();

    if (serviceId) {
        try {
            const service = await getService(serviceId);
            if (service) {
                title.textContent = 'Editar Serviço';
                document.getElementById('service-id').value = service.id;
                document.getElementById('service-nome').value = service.nome;
                document.getElementById('service-tipo').value = service.tipo_servico;
                document.getElementById('service-fornecedor').value = service.fornecedor_id;
                document.getElementById('service-tipo-comissao').value = service.tipo_comissao;
                document.getElementById('service-valor-comissao').value = service.valor_comissao;
            }
        } catch (e) {
            showToast('Erro ao carregar serviço', 'error');
            return;
        }
    } else {
        title.textContent = 'Novo Serviço';
    }

    modal.classList.add('open');
}

async function populateServiceSupplierDropdown() {
    try {
        const suppliers = await getActiveSuppliers();
        const select = document.getElementById('service-fornecedor');
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '<option value="">Selecione o fornecedor</option>' +
            suppliers.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
        if (currentVal) select.value = currentVal;
    } catch (e) {
        console.error('Populate service suppliers error:', e);
    }
}

function setupServiceActions() {
    document.getElementById('btn-new-service')?.addEventListener('click', () => {
        openServiceModal();
    });

    document.getElementById('btn-close-service-modal')?.addEventListener('click', () => {
        document.getElementById('service-modal').classList.remove('open');
    });

    document.getElementById('service-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const service = {
            nome: document.getElementById('service-nome').value.trim(),
            tipo_servico: document.getElementById('service-tipo').value,
            fornecedor_id: document.getElementById('service-fornecedor').value,
            tipo_comissao: document.getElementById('service-tipo-comissao').value,
            valor_comissao: parseFloat(document.getElementById('service-valor-comissao').value) || 0
        };

        const id = document.getElementById('service-id').value;
        if (id) service.id = id;

        try {
            await saveService(service);
            const user = getCurrentUser();
            await addLog(user.id, id ? 'EDIT_SERVICE' : 'CREATE_SERVICE',
                `${id ? 'Editado' : 'Criado'} serviço: ${service.nome}`);
            showToast(id ? 'Serviço atualizado!' : 'Serviço criado!');
            document.getElementById('service-modal').classList.remove('open');
            await renderServicesTable();
        } catch (err) {
            showToast('Erro ao salvar serviço: ' + err.message, 'error');
        }
    });
}
