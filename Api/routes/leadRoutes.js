import { Router } from 'express';
import { createLead, getLeads } from '../controllers/leadController.js';
import { protectAdmin } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', createLead);
router.get('/', protectAdmin, getLeads);

export default router;
