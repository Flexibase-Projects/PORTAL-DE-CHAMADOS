import express from 'express';
import { userController } from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.patch('/:id/toggle-active', userController.toggleActive);

export default router;
