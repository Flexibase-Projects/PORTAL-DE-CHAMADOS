import express from 'express';
import { meController } from '../controllers/meController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);
router.get('/', meController.getMe);

export default router;
