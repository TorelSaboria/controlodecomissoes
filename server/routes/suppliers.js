// ===== SUPPLIERS ROUTES =====
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/suppliers
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/suppliers
router.post('/', async (req, res) => {
    try {
        const { nome, telefone, dia_cobranca, ativo } = req.body;

        if (!nome || !dia_cobranca) {
            return res.status(400).json({ error: 'Nome e dia de cobrança são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('suppliers')
            .insert({ nome, telefone: telefone || null, dia_cobranca, ativo: ativo !== false })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/suppliers/:id
router.put('/:id', async (req, res) => {
    try {
        const { nome, telefone, dia_cobranca, ativo } = req.body;

        const { data, error } = await supabase
            .from('suppliers')
            .update({ nome, telefone, dia_cobranca, ativo })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/suppliers/:id
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('suppliers')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
