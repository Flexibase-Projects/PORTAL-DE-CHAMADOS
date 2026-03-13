import express from 'express';
import { permissionController } from '../controllers/permissionController.js';
import { permissionService } from '../services/permissionService.js';

const router = express.Router();

/** Só permite acesso às rotas de admin de usuários para quem tem departamento TI. */
async function requireTiUser(req, res, next) {
  const authUserId = req.headers['x-auth-user-id'];
  if (!authUserId) {
    return res.status(401).json({ success: false, error: 'Não autenticado' });
  }
  try {
    const departamento = await permissionService.getDepartamentoByAuthUserId(authUserId);
    const isTi = (departamento || '').trim().toUpperCase() === 'TI';
    if (!isTi) {
      return res.status(403).json({ success: false, error: 'Acesso restrito ao departamento TI' });
    }
    next();
  } catch (err) {
    console.error('[permissions] requireTiUser:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
}

router.use(requireTiUser);
router.get('/auth-users', permissionController.listAuthUsers);
router.get('/:authUserId', permissionController.getByAuthUserId);
router.put('/:authUserId', permissionController.setForAuthUser);
router.patch('/:authUserId/departamento', permissionController.setUserDepartamento);

export default router;
