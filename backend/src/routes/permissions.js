import express from 'express';
import { permissionController } from '../controllers/permissionController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor, requireTiUser } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);
router.use(requireTiUser);
router.get('/auth-users', permissionController.listAuthUsers);
router.get('/:authUserId', permissionController.getByAuthUserId);
router.put('/:authUserId', permissionController.setForAuthUser);
router.patch('/:authUserId/departamento', permissionController.setUserDepartamento);

export default router;
