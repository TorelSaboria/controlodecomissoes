// ===== EXPRESS SERVER =====
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/auth.js';
import suppliersRoutes from './routes/suppliers.js';
import servicesRoutes from './routes/services.js';
import salesRoutes from './routes/sales.js';
import logsRoutes from './routes/logs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/logs', logsRoutes);

// SPA fallback — serve index.html for any non-API route
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    }
});

app.listen(PORT, () => {
    console.log('');
    console.log('  HotelCom Server');
    console.log('  ────────────────');
    console.log(`  Local:   http://localhost:${PORT}/`);
    console.log(`  API:     http://localhost:${PORT}/api`);
    console.log('');
});
