// ===== SEED DATABASE =====
// Run once: node server/seed.js
import 'dotenv/config';
import { supabase } from './db.js';

async function seed() {
    console.log('🌱 Seeding database...\n');

    // 1. Users
    console.log('  → Users...');
    const { error: usersErr } = await supabase.from('users').upsert([
        { username: 'admin', password: 'admin123', role: 'admin', nome: 'Administrador' },
        { username: 'operador', password: 'op123', role: 'operador', nome: 'Operador' }
    ], { onConflict: 'username' });
    if (usersErr) console.error('    ❌', usersErr.message);
    else console.log('    ✅ 2 users');

    // 2. Suppliers
    console.log('  → Suppliers...');
    const suppliers = [
        { nome: 'TransferLux', telefone: '+351 912 345 678', dia_cobranca: 15, ativo: true },
        { nome: 'Algarve Tours', telefone: '+351 965 432 100', dia_cobranca: 10, ativo: true },
        { nome: 'Restaurante Mar Azul', telefone: '+351 289 100 200', dia_cobranca: 5, ativo: true },
        { nome: 'Benagil Caves Boat', telefone: '+351 914 567 890', dia_cobranca: 20, ativo: true },
        { nome: 'VIP Transfers PT', telefone: '+351 936 789 012', dia_cobranca: 1, ativo: false }
    ];

    // Clear and insert suppliers
    await supabase.from('sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { data: supData, error: supErr } = await supabase
        .from('suppliers')
        .insert(suppliers)
        .select();

    if (supErr) { console.error('    ❌', supErr.message); return; }
    console.log(`    ✅ ${supData.length} suppliers`);

    // Map supplier names to IDs
    const supMap = {};
    supData.forEach(s => { supMap[s.nome] = s.id; });

    // 3. Services
    console.log('  → Services...');
    const services = [
        { nome: 'Transfer Aeroporto', tipo_servico: 'Transfer', fornecedor_id: supMap['TransferLux'], tipo_comissao: 'fixa', valor_comissao: 15 },
        { nome: 'Passeio de Barco Benagil', tipo_servico: 'Passeio', fornecedor_id: supMap['Benagil Caves Boat'], tipo_comissao: 'percentual', valor_comissao: 12 },
        { nome: 'Jantar Mar Azul', tipo_servico: 'Restaurante', fornecedor_id: supMap['Restaurante Mar Azul'], tipo_comissao: 'percentual', valor_comissao: 10 },
        { nome: 'City Tour Faro', tipo_servico: 'Passeio', fornecedor_id: supMap['Algarve Tours'], tipo_comissao: 'fixa', valor_comissao: 20 },
        { nome: 'Transfer Hotel-Centro', tipo_servico: 'Transfer', fornecedor_id: supMap['TransferLux'], tipo_comissao: 'fixa', valor_comissao: 8 },
        { nome: 'Jeep Safari Algarve', tipo_servico: 'Passeio', fornecedor_id: supMap['Algarve Tours'], tipo_comissao: 'percentual', valor_comissao: 15 }
    ];

    const { data: svcData, error: svcErr } = await supabase
        .from('services')
        .insert(services)
        .select();

    if (svcErr) { console.error('    ❌', svcErr.message); return; }
    console.log(`    ✅ ${svcData.length} services`);

    // Map service names to IDs
    const svcMap = {};
    svcData.forEach(s => { svcMap[s.nome] = s.id; });

    // 4. Sales
    console.log('  → Sales...');
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

    const sales = [
        { hospede_nome: 'John Smith', quarto: '201', servico_id: svcMap['Transfer Aeroporto'], fornecedor_id: supMap['TransferLux'], data_servico: fmt(today), valor_venda: 60, valor_comissao: 15, status: 'pendente', observacoes: 'Chegada voo TAP 1234' },
        { hospede_nome: 'Maria Garcia', quarto: '305', servico_id: svcMap['Passeio de Barco Benagil'], fornecedor_id: supMap['Benagil Caves Boat'], data_servico: fmt(today), valor_venda: 85, valor_comissao: 10.2, status: 'pendente', observacoes: '' },
        { hospede_nome: 'Hans Müller', quarto: '102', servico_id: svcMap['Jantar Mar Azul'], fornecedor_id: supMap['Restaurante Mar Azul'], data_servico: daysAgo(1), valor_venda: 120, valor_comissao: 12, status: 'pago', data_pagamento: new Date().toISOString(), observacoes: 'Mesa reservada janela' },
        { hospede_nome: 'Sophie Dubois', quarto: '410', servico_id: svcMap['City Tour Faro'], fornecedor_id: supMap['Algarve Tours'], data_servico: daysAgo(2), valor_venda: 45, valor_comissao: 20, status: 'pendente', observacoes: '' },
        { hospede_nome: 'James Wilson', quarto: '208', servico_id: svcMap['Transfer Hotel-Centro'], fornecedor_id: supMap['TransferLux'], data_servico: daysAgo(3), valor_venda: 25, valor_comissao: 8, status: 'pago', data_pagamento: new Date().toISOString(), observacoes: '' },
        { hospede_nome: 'Emma Johnson', quarto: '312', servico_id: svcMap['Jeep Safari Algarve'], fornecedor_id: supMap['Algarve Tours'], data_servico: daysAgo(4), valor_venda: 95, valor_comissao: 14.25, status: 'pendente', observacoes: 'Grupo de 4 pessoas' },
        { hospede_nome: 'Luca Rossi', quarto: '505', servico_id: svcMap['Jantar Mar Azul'], fornecedor_id: supMap['Restaurante Mar Azul'], data_servico: daysAgo(5), valor_venda: 180, valor_comissao: 18, status: 'pago', data_pagamento: new Date().toISOString(), observacoes: 'Aniversário' },
        { hospede_nome: 'Anna Petersen', quarto: '215', servico_id: svcMap['Transfer Aeroporto'], fornecedor_id: supMap['TransferLux'], data_servico: daysAgo(6), valor_venda: 60, valor_comissao: 15, status: 'pendente', observacoes: 'Partida voo Ryanair' },
        { hospede_nome: 'Carlos Mendes', quarto: '118', servico_id: svcMap['Passeio de Barco Benagil'], fornecedor_id: supMap['Benagil Caves Boat'], data_servico: daysAgo(7), valor_venda: 170, valor_comissao: 20.4, status: 'pendente', observacoes: 'Casal + 2 crianças' },
        { hospede_nome: 'Yuki Tanaka', quarto: '401', servico_id: svcMap['City Tour Faro'], fornecedor_id: supMap['Algarve Tours'], data_servico: fmt(today), valor_venda: 45, valor_comissao: 20, status: 'pendente', observacoes: '' }
    ];

    const { data: salesData, error: salesErr } = await supabase
        .from('sales')
        .insert(sales)
        .select();

    if (salesErr) { console.error('    ❌', salesErr.message); return; }
    console.log(`    ✅ ${salesData.length} sales`);

    console.log('\n✅ Seed complete!\n');
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
