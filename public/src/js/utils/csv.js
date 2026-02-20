// ===== CSV EXPORT =====

export function exportSalesToCSV(sales, suppliers, services) {
    const headers = [
        'ID',
        'Hóspede',
        'Quarto',
        'Serviço',
        'Fornecedor',
        'Data do Serviço',
        'Valor Venda (€)',
        'Comissão (€)',
        'Status',
        'Data Pagamento',
        'Observações'
    ];

    const rows = sales.map(sale => {
        const service = services.find(s => s.id === sale.servico_id);
        const supplier = suppliers.find(s => s.id === sale.fornecedor_id);
        return [
            sale.id,
            sale.hospede_nome,
            sale.quarto || '',
            service ? service.nome : '',
            supplier ? supplier.nome : '',
            sale.data_servico,
            parseFloat(sale.valor_venda).toFixed(2),
            parseFloat(sale.valor_comissao).toFixed(2),
            sale.status === 'pago' ? 'Pago' : 'Pendente',
            sale.data_pagamento ? new Date(sale.data_pagamento).toLocaleDateString('pt-BR') : '',
            (sale.observacoes || '').replace(/"/g, '""')
        ];
    });

    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    // BOM for UTF-8
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hotelcom_vendas_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
