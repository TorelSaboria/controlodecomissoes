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
} from '../data/store.js';
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
    const container = document.getElementById('suppliers-table');
    const admin = isAdmin();

    if (suppliers.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:24px;">Nenhum fornecedor cadastrado</p>';
      return;
    }

    container.innerHTML = `
            <table>
                <thead><tr><th>Nome</th><th>Telefone</th><th>Dia Cobrança</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                    ${suppliers.map(s => `
                        <tr>
                            <td>${s.nome}</td>
                            <td>${s.telefone || '-'}</td>
                            <td>${s.dia_cobranca}</td>
                            <td><span class="badge ${s.ativo ? 'badge-success' : 'badge-danger'}">${s.ativo ? 'Ativo' : 'Inativo'}</span></td>
                            <td class="actions-cell">
                                <button class="btn-icon btn-edit-supplier" data-id="${s.id}" title="Editar">✏️</button>
                                ${admin ? `<button class="btn-icon btn-delete-supplier" data-id="${s.id}" title="Excluir">🗑️</button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

    container.querySelectorAll('.btn-edit-supplier').forEach(btn => {
      btn.addEventListener('click', () => openSupplierModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-delete-supplier').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Excluir este fornecedor?')) {
          try {
            await deleteSupplier(btn.dataset.id);
            const user = getCurrentUser();
            await addLog(user.id, 'DELETE_SUPPLIER', `Fornecedor excluído`);
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
  const modal = document.getElementById('modal-supplier');
  const title = document.getElementById('modal-supplier-title');
  const form = document.getElementById('supplier-form');

  form.reset();
  document.getElementById('supplier-id').value = '';

  if (supplierId) {
    try {
      const supplier = await getSupplier(supplierId);
      if (supplier) {
        title.textContent = 'Editar Fornecedor';
        document.getElementById('supplier-id').value = supplier.id;
        document.getElementById('supplier-name').value = supplier.nome;
        document.getElementById('supplier-phone').value = supplier.telefone || '';
        document.getElementById('supplier-billing-day').value = supplier.dia_cobranca;
        document.getElementById('supplier-active').checked = supplier.ativo;
      }
    } catch (e) {
      showToast('Erro ao carregar fornecedor', 'error');
      return;
    }
  } else {
    title.textContent = 'Novo Fornecedor';
    document.getElementById('supplier-active').checked = true;
  }

  modal.classList.add('active');
}

function setupSupplierActions() {
  document.getElementById('btn-add-supplier')?.addEventListener('click', () => {
    openSupplierModal();
  });

  document.getElementById('btn-save-supplier')?.addEventListener('click', async () => {
    const nome = document.getElementById('supplier-name').value.trim();
    const dia_cobranca = parseInt(document.getElementById('supplier-billing-day').value);

    if (!nome || !dia_cobranca) {
      showToast('Nome e dia de cobrança são obrigatórios', 'error');
      return;
    }

    const supplier = {
      nome,
      telefone: document.getElementById('supplier-phone').value.trim() || null,
      dia_cobranca,
      ativo: document.getElementById('supplier-active').checked
    };

    const id = document.getElementById('supplier-id').value;
    if (id) supplier.id = id;

    try {
      await saveSupplier(supplier);
      const user = getCurrentUser();
      await addLog(user.id, id ? 'EDIT_SUPPLIER' : 'CREATE_SUPPLIER',
        `${id ? 'Editado' : 'Criado'} fornecedor: ${supplier.nome}`);
      showToast(id ? 'Fornecedor atualizado!' : 'Fornecedor criado!');
      document.getElementById('modal-supplier').classList.remove('active');
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
    const container = document.getElementById('services-table');
    const admin = isAdmin();

    if (services.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);padding:24px;">Nenhum serviço cadastrado</p>';
      return;
    }

    const supplierMap = {};
    suppliers.forEach(s => { supplierMap[s.id] = s.nome; });

    container.innerHTML = `
            <table>
                <thead><tr><th>Nome</th><th>Tipo</th><th>Fornecedor</th><th>Comissão</th><th>Valor</th><th>Ações</th></tr></thead>
                <tbody>
                    ${services.map(s => `
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
                    `).join('')}
                </tbody>
            </table>
        `;

    container.querySelectorAll('.btn-edit-service').forEach(btn => {
      btn.addEventListener('click', () => openServiceModal(btn.dataset.id));
    });

    container.querySelectorAll('.btn-delete-service').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (confirm('Excluir este serviço?')) {
          try {
            await deleteService(btn.dataset.id);
            const user = getCurrentUser();
            await addLog(user.id, 'DELETE_SERVICE', `Serviço excluído`);
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
  const modal = document.getElementById('modal-service');
  const title = document.getElementById('modal-service-title');
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
        document.getElementById('service-name').value = service.nome;
        document.getElementById('service-type').value = service.tipo_servico;
        document.getElementById('service-supplier').value = service.fornecedor_id;
        document.getElementById('service-commission-type').value = service.tipo_comissao;
        document.getElementById('service-commission-value').value = service.valor_comissao;
      }
    } catch (e) {
      showToast('Erro ao carregar serviço', 'error');
      return;
    }
  } else {
    title.textContent = 'Novo Serviço';
  }

  modal.classList.add('active');
}

async function populateServiceSupplierDropdown() {
  try {
    const suppliers = await getActiveSuppliers();
    const select = document.getElementById('service-supplier');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Selecione</option>' +
      suppliers.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    if (currentVal) select.value = currentVal;
  } catch (e) {
    console.error('Populate service suppliers error:', e);
  }
}

function setupServiceActions() {
  document.getElementById('btn-add-service')?.addEventListener('click', () => {
    openServiceModal();
  });

  document.getElementById('btn-save-service')?.addEventListener('click', async () => {
    const nome = document.getElementById('service-name').value.trim();
    const tipo_servico = document.getElementById('service-type').value;
    const fornecedor_id = document.getElementById('service-supplier').value;
    const tipo_comissao = document.getElementById('service-commission-type').value;
    const valor_comissao = parseFloat(document.getElementById('service-commission-value').value) || 0;

    if (!nome || !tipo_servico || !fornecedor_id || !tipo_comissao) {
      showToast('Todos os campos são obrigatórios', 'error');
      return;
    }

    const service = { nome, tipo_servico, fornecedor_id, tipo_comissao, valor_comissao };

    const id = document.getElementById('service-id').value;
    if (id) service.id = id;

    try {
      await saveService(service);
      const user = getCurrentUser();
      await addLog(user.id, id ? 'EDIT_SERVICE' : 'CREATE_SERVICE',
        `${id ? 'Editado' : 'Criado'} serviço: ${service.nome}`);
      showToast(id ? 'Serviço atualizado!' : 'Serviço criado!');
      document.getElementById('modal-service').classList.remove('active');
      await renderServicesTable();
    } catch (err) {
      showToast('Erro ao salvar serviço: ' + err.message, 'error');
    }
  });
}
