// ===== SALES ROUTES =====
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/sales
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .order('data_servico', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sales
router.post('/', async (req, res) => {
    try {
        const {
            hospede_nome, quarto, servico_id, fornecedor_id,
            data_servico, valor_venda, valor_comissao, observacoes
        } = req.body;

        if (!hospede_nome || !servico_id || !data_servico || !valor_venda) {
            return res.status(400).json({ error: 'Campos obrigatórios faltando' });
        }

        const { data, error } = await supabase
            .from('sales')
            .insert({
                hospede_nome,
                quarto: quarto || null,
                servico_id,
                fornecedor_id,
                data_servico,
                valor_venda,
                valor_comissao,
                observacoes: observacoes || null,
                status: 'pendente'
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/sales/:id
router.put('/:id', async (req, res) => {
    try {
        const {
            hospede_nome, quarto, servico_id, fornecedor_id,
            data_servico, valor_venda, valor_comissao, observacoes,
            status, data_pagamento
        } = req.body;

        const { data, error } = await supabase
            .from('sales')
            .update({
                hospede_nome, quarto, servico_id, fornecedor_id,
                data_servico, valor_venda, valor_comissao, observacoes,
                status, data_pagamento
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/sales/:id/pay  — Mark as paid
router.patch('/:id/pay', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .update({
                status: 'pago',
                data_pagamento: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('sales')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
