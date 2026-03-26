import express from 'express';
import { dashboardController } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);
router.get('/stats', dashboardController.getStats);

export default router;
