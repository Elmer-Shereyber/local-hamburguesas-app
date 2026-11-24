import { requireAuth } from '../shared/auth.js';

// Proteger la ruta únicamente para el rol administrador
requireAuth('admin');
