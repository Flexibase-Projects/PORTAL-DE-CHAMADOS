import express from 'express';
import { templateController } from '../controllers/templateController.js';

const router = express.Router();

router.get('/:departamento', templateController.getTemplate);
router.put('/', templateController.saveTemplate);
router.post('/', templateController.saveTemplate);

export default router;
