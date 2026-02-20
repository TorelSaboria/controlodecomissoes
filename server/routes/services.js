// ===== SERVICES ROUTES =====
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/services
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/services
router.post('/', async (req, res) => {
    try {
        const { nome, tipo_servico, fornecedor_id, tipo_comissao, valor_comissao } = req.body;

        if (!nome || !tipo_servico || !fornecedor_id || !tipo_comissao || valor_comissao === undefined) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('services')
            .insert({ nome, tipo_servico, fornecedor_id, tipo_comissao, valor_comissao })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
    try {
        const { nome, tipo_servico, fornecedor_id, tipo_comissao, valor_comissao } = req.body;

        const { data, error } = await supabase
            .from('services')
            .update({ nome, tipo_servico, fornecedor_id, tipo_comissao, valor_comissao })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
