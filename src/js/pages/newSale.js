// ===== NEW SALE PAGE =====
import {
    getServices,
    getService,
    getSupplier,
    getSale,
    saveSale,
    calculateCommission,
    onUpdate,
    addLog
} from '../data/store.js';
import { getCurrentUser } from '../auth.js';
import { showToast, formatCurrency } from '../utils/helpers.js';
import { navigateTo } from '../router.js';

let editingId = null;

export async function initNewSale() {
    await populateServiceDropdown();
    setupServiceChange();
    setupValueChange();
    setupFormSubmit();
    setupCancelButton();

    onUpdate('services', () => populateServiceDropdown());

    window.addEventListener('edit-sale', async (e) => {
        try {
            const sale = await getSale(e.detail.saleId);
            if (sale) {
                await loadSaleForEdit(sale);
                navigateTo('new-sale');
            }
        } catch (err) {
            showToast('Erro ao carregar venda para edição', 'error');
        }
    });

    window.addEventListener('pagechange', (e) => {
        if (e.detail.page === 'new-sale' && !editingId) {
            resetForm();
        }
    });

    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
}

async function populateServiceDropdown() {
    try {
        const select = document.getElementById('sale-service');
        const services = await getServices();
        const currentVal = select.value;

        select.innerHTML = '<option value="">Selecione um serviço</option>' +
            services.map(s => `<option value="${s.id}">${s.nome} (${s.tipo_servico})</option>`).join('');

        if (currentVal) select.value = currentVal;
    } catch (e) {
        console.error('Populate services error:', e);
    }
}

function setupServiceChange() {
    document.getElementById('sale-service').addEventListener('change', async (e) => {
        const serviceId = e.target.value;
        if (!serviceId) {
            document.getElementById('sale-supplier').value = '';
            document.getElementById('sale-supplier-id').value = '';
            document.getElementById('sale-commission-type').value = '';
            document.getElementById('sale-commission').value = '';
            return;
        }

        try {
            const service = await getService(serviceId);
            if (service) {
                const supplier = await getSupplier(service.fornecedor_id);
                document.getElementById('sale-supplier').value = supplier ? supplier.nome : '';
                document.getElementById('sale-supplier-id').value = service.fornecedor_id;
                document.getElementById('sale-commission-type').value =
                    service.tipo_comissao === 'fixa' ? `Fixa: ${formatCurrency(service.valor_comissao)}` : `Percentual: ${service.valor_comissao}%`;

                await updateCommission();
            }
        } catch (err) {
            console.error('Service change error:', err);
        }
    });
}

function setupValueChange() {
    document.getElementById('sale-value').addEventListener('input', () => updateCommission());
}

async function updateCommission() {
    const serviceId = document.getElementById('sale-service').value;
    const saleValue = parseFloat(document.getElementById('sale-value').value) || 0;

    if (!serviceId) {
        document.getElementById('sale-commission').value = '';
        return;
    }

    try {
        const commission = await calculateCommission(serviceId, saleValue);
        document.getElementById('sale-commission').value = formatCurrency(commission);
    } catch (e) {
        console.error('Commission calc error:', e);
    }
}

function setupFormSubmit() {
    document.getElementById('sale-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const serviceId = document.getElementById('sale-service').value;
        const saleValue = parseFloat(document.getElementById('sale-value').value) || 0;

        if (!serviceId) {
            showToast('Selecione um serviço válido!', 'error');
            return;
        }

        if (saleValue <= 0) {
            showToast('O valor da venda deve ser maior que zero!', 'error');
            return;
        }

        const submitBtn = document.querySelector('#sale-form button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando...';

        try {
            const commission = await calculateCommission(serviceId, saleValue);

            const sale = {
                hospede_nome: document.getElementById('sale-guest').value.trim(),
                quarto: document.getElementById('sale-room').value.trim(),
                servico_id: serviceId,
                fornecedor_id: document.getElementById('sale-supplier-id').value,
                data_servico: document.getElementById('sale-date').value,
                valor_venda: saleValue,
                valor_comissao: Math.round(commission * 100) / 100,
                observacoes: document.getElementById('sale-observations').value.trim()
            };

            if (editingId) {
                sale.id = editingId;
                const existing = await getSale(editingId);
                if (existing) {
                    sale.status = existing.status;
                    sale.data_pagamento = existing.data_pagamento;
                }
            }

            await saveSale(sale);

            const user = getCurrentUser();
            await addLog(user.id, editingId ? 'EDIT_SALE' : 'CREATE_SALE',
                `${editingId ? 'Editada' : 'Criada'} venda para ${sale.hospede_nome} - ${formatCurrency(saleValue)}`);

            showToast(editingId ? 'Venda atualizada com sucesso!' : 'Venda registrada com sucesso!');

            editingId = null;
            document.getElementById('sale-form-title').textContent = 'Nova Venda';
            resetForm();
            navigateTo('sales');
        } catch (err) {
            showToast('Erro ao salvar venda: ' + err.message, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 Salvar Venda';
        }
    });
}

function setupCancelButton() {
    document.getElementById('btn-cancel-sale').addEventListener('click', () => {
        editingId = null;
        document.getElementById('sale-form-title').textContent = 'Nova Venda';
        resetForm();
        navigateTo('sales');
    });
}

async function loadSaleForEdit(sale) {
    editingId = sale.id;
    document.getElementById('sale-form-title').textContent = 'Editar Venda';
    document.getElementById('sale-id').value = sale.id;
    document.getElementById('sale-guest').value = sale.hospede_nome;
    document.getElementById('sale-room').value = sale.quarto || '';
    document.getElementById('sale-service').value = sale.servico_id;
    document.getElementById('sale-date').value = sale.data_servico;
    document.getElementById('sale-value').value = sale.valor_venda;
    document.getElementById('sale-observations').value = sale.observacoes || '';

    document.getElementById('sale-service').dispatchEvent(new Event('change'));
}

function resetForm() {
    document.getElementById('sale-form').reset();
    document.getElementById('sale-id').value = '';
    document.getElementById('sale-supplier').value = '';
    document.getElementById('sale-supplier-id').value = '';
    document.getElementById('sale-commission-type').value = '';
    document.getElementById('sale-commission').value = '';
    document.getElementById('sale-date').value = new Date().toISOString().split('T')[0];
    editingId = null;
}
