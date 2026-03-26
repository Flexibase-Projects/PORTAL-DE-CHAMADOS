import express from 'express';
import { templateController } from '../controllers/templateController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);

router.get('/:departamento', templateController.getTemplate);
router.put('/', templateController.saveTemplate);
router.post('/', templateController.saveTemplate);

export default router;
