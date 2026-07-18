import { Router } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { getOrganizationTree } from '../controllers/organizationController';

const router = Router();

// Secure all organization routes
router.use(authenticateJWT);

router.get('/tree', getOrganizationTree);

export default router;
