import express from 'express';
import { meController } from '../controllers/meController.js';

const router = express.Router();

router.get('/', meController.getMe);

export default router;
