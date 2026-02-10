import express from 'express';
import { permissionController } from '../controllers/permissionController.js';

const router = express.Router();

router.get('/auth-users', permissionController.listAuthUsers);
router.get('/:authUserId', permissionController.getByAuthUserId);
router.put('/:authUserId', permissionController.setForAuthUser);

export default router;
