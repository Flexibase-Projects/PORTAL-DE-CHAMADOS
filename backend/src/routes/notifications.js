import express from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';
import { attachActor } from '../middleware/authorization.js';

const router = express.Router();
router.use(requireAuth, attachActor);

router.get('/', notificationController.list);
router.post('/mark-read-by-ticket/:ticketId', notificationController.markReadByTicket);
router.patch('/:id/read', notificationController.markRead);
router.post('/mark-all-read', notificationController.markAllRead);

export default router;
