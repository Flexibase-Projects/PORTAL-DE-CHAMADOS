import express from 'express';
import { notificationController } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markRead);
router.post('/mark-all-read', notificationController.markAllRead);

export default router;
