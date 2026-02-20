// ===== SEED DATA =====
// Demo data seeded on first run

export function getSeedData() {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    const daysAgo = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return fmt(d); };

    const suppliers = [
        {
            id: 'sup1',
            nome: 'TransferLux',
            telefone: '+351 912 345 678',
            dia_cobranca: 15,
            ativo: true,
            created_at: daysAgo(60) + 'T10:00:00.000Z'
        },
        {
            id: 'sup2',
            nome: 'Algarve Tours',
            telefone: '+351 965 432 100',
            dia_cobranca: 10,
            ativo: true,
            created_at: daysAgo(55) + 'T10:00:00.000Z'
        },
        {
            id: 'sup3',
            nome: 'Restaurante Mar Azul',
            telefone: '+351 289 100 200',
            dia_cobranca: 5,
            ativo: true,
            created_at: daysAgo(50) + 'T10:00:00.000Z'
        },
        {
            id: 'sup4',
            nome: 'Benagil Caves Boat',
            telefone: '+351 914 567 890',
            dia_cobranca: 20,
            ativo: true,
            created_at: daysAgo(40) + 'T10:00:00.000Z'
        },
        {
            id: 'sup5',
            nome: 'VIP Transfers PT',
            telefone: '+351 936 789 012',
            dia_cobranca: 1,
            ativo: false,
            created_at: daysAgo(30) + 'T10:00:00.000Z'
        }
    ];

    const services = [
        {
            id: 'srv1',
            nome: 'Transfer Aeroporto',
            tipo_servico: 'Transfer',
            fornecedor_id: 'sup1',
            tipo_comissao: 'fixa',
            valor_comissao: 15,
            created_at: daysAgo(58) + 'T10:00:00.000Z'
        },
        {
            id: 'srv2',
            nome: 'Passeio de Barco Benagil',
            tipo_servico: 'Passeio',
            fornecedor_id: 'sup4',
            tipo_comissao: 'percentual',
            valor_comissao: 12,
            created_at: daysAgo(53) + 'T10:00:00.000Z'
        },
        {
            id: 'srv3',
            nome: 'Jantar Mar Azul',
            tipo_servico: 'Restaurante',
            fornecedor_id: 'sup3',
            tipo_comissao: 'percentual',
            valor_comissao: 10,
            created_at: daysAgo(48) + 'T10:00:00.000Z'
        },
        {
            id: 'srv4',
            nome: 'City Tour Faro',
            tipo_servico: 'Passeio',
            fornecedor_id: 'sup2',
            tipo_comissao: 'fixa',
            valor_comissao: 20,
            created_at: daysAgo(45) + 'T10:00:00.000Z'
        },
        {
            id: 'srv5',
            nome: 'Transfer Hotel-Centro',
            tipo_servico: 'Transfer',
            fornecedor_id: 'sup1',
            tipo_comissao: 'fixa',
            valor_comissao: 8,
            created_at: daysAgo(40) + 'T10:00:00.000Z'
        },
        {
            id: 'srv6',
            nome: 'Jeep Safari Algarve',
            tipo_servico: 'Passeio',
            fornecedor_id: 'sup2',
            tipo_comissao: 'percentual',
            valor_comissao: 15,
            created_at: daysAgo(35) + 'T10:00:00.000Z'
        }
    ];

    const sales = [
        {
            id: 'sale1',
            hospede_nome: 'John Smith',
            quarto: '201',
            servico_id: 'srv1',
            fornecedor_id: 'sup1',
            data_servico: fmt(today),
            valor_venda: 60,
            valor_comissao: 15,
            status: 'pendente',
            data_pagamento: null,
            observacoes: 'Chegada voo TAP 1234',
            created_at: fmt(today) + 'T09:00:00.000Z'
        },
        {
            id: 'sale2',
            hospede_nome: 'Maria Garcia',
            quarto: '305',
            servico_id: 'srv2',
            fornecedor_id: 'sup4',
            data_servico: fmt(today),
            valor_venda: 85,
            valor_comissao: 10.2,
            status: 'pendente',
            data_pagamento: null,
            observacoes: '',
            created_at: fmt(today) + 'T10:00:00.000Z'
        },
        {
            id: 'sale3',
            hospede_nome: 'Hans Müller',
            quarto: '102',
            servico_id: 'srv3',
            fornecedor_id: 'sup3',
            data_servico: daysAgo(1),
            valor_venda: 120,
            valor_comissao: 12,
            status: 'pago',
            data_pagamento: daysAgo(0) + 'T12:00:00.000Z',
            observacoes: 'Mesa reservada janela',
            created_at: daysAgo(1) + 'T11:00:00.000Z'
        },
        {
            id: 'sale4',
            hospede_nome: 'Sophie Dubois',
            quarto: '410',
            servico_id: 'srv4',
            fornecedor_id: 'sup2',
            data_servico: daysAgo(2),
            valor_venda: 45,
            valor_comissao: 20,
            status: 'pendente',
            data_pagamento: null,
            observacoes: '',
            created_at: daysAgo(2) + 'T14:00:00.000Z'
        },
        {
            id: 'sale5',
            hospede_nome: 'James Wilson',
            quarto: '208',
            servico_id: 'srv5',
            fornecedor_id: 'sup1',
            data_servico: daysAgo(3),
            valor_venda: 25,
            valor_comissao: 8,
            status: 'pago',
            data_pagamento: daysAgo(1) + 'T16:00:00.000Z',
            observacoes: '',
            created_at: daysAgo(3) + 'T08:00:00.000Z'
        },
        {
            id: 'sale6',
            hospede_nome: 'Emma Johnson',
            quarto: '312',
            servico_id: 'srv6',
            fornecedor_id: 'sup2',
            data_servico: daysAgo(4),
            valor_venda: 95,
            valor_comissao: 14.25,
            status: 'pendente',
            data_pagamento: null,
            observacoes: 'Grupo de 4 pessoas',
            created_at: daysAgo(4) + 'T09:30:00.000Z'
        },
        {
            id: 'sale7',
            hospede_nome: 'Luca Rossi',
            quarto: '505',
            servico_id: 'srv3',
            fornecedor_id: 'sup3',
            data_servico: daysAgo(5),
            valor_venda: 180,
            valor_comissao: 18,
            status: 'pago',
            data_pagamento: daysAgo(3) + 'T15:00:00.000Z',
            observacoes: 'Aniversário',
            created_at: daysAgo(5) + 'T17:00:00.000Z'
        },
        {
            id: 'sale8',
            hospede_nome: 'Anna Petersen',
            quarto: '215',
            servico_id: 'srv1',
            fornecedor_id: 'sup1',
            data_servico: daysAgo(6),
            valor_venda: 60,
            valor_comissao: 15,
            status: 'pendente',
            data_pagamento: null,
            observacoes: 'Partida voo Ryanair',
            created_at: daysAgo(6) + 'T07:00:00.000Z'
        },
        {
            id: 'sale9',
            hospede_nome: 'Carlos Mendes',
            quarto: '118',
            servico_id: 'srv2',
            fornecedor_id: 'sup4',
            data_servico: daysAgo(7),
            valor_venda: 170,
            valor_comissao: 20.4,
            status: 'pendente',
            data_pagamento: null,
            observacoes: 'Casal + 2 crianças',
            created_at: daysAgo(7) + 'T10:00:00.000Z'
        },
        {
            id: 'sale10',
            hospede_nome: 'Yuki Tanaka',
            quarto: '401',
            servico_id: 'srv4',
            fornecedor_id: 'sup2',
            data_servico: fmt(today),
            valor_venda: 45,
            valor_comissao: 20,
            status: 'pendente',
            data_pagamento: null,
            observacoes: '',
            created_at: fmt(today) + 'T08:00:00.000Z'
        }
    ];

    const users = [
        {
            id: 'usr1',
            username: 'admin',
            password: 'admin123',
            role: 'admin',
            nome: 'Administrador'
        },
        {
            id: 'usr2',
            username: 'operador',
            password: 'op123',
            role: 'operador',
            nome: 'Operador'
        }
    ];

    return { suppliers, services, sales, users, logs: [] };
}
