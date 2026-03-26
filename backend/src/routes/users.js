import express from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor, requireTiUser } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);

router.post('/sync-auth', userController.syncAuth);
router.use(requireTiUser);
router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.patch('/:id/toggle-active', userController.toggleActive);

export default router;
