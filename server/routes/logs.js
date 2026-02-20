// ===== LOGS ROUTES =====
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// GET /api/logs
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(500);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/logs
router.post('/', async (req, res) => {
    try {
        const { user_id, action, details } = req.body;

        const { data, error } = await supabase
            .from('logs')
            .insert({ user_id, action, details })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
