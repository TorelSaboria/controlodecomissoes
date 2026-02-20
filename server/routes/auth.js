// ===== AUTH ROUTES =====
import { Router } from 'express';
import { supabase } from '../db.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, username, role, nome')
            .eq('username', username)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.status(401).json({ error: 'Usuário ou senha incorretos' });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
