import { Router } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleMiddleware';
import {
  getEmployees,
  getEmployeesDropdown,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  bulkImportEmployees
} from '../controllers/employeeController';
import {
  getDirectReportees,
  updateReportingManager
} from '../controllers/organizationController';

const router = Router();

// Secure all employee routes
router.use(authenticateJWT);

router.get('/', getEmployees);
router.get('/dropdown', getEmployeesDropdown);
router.get('/:id', getEmployeeById);
router.get('/:id/reportees', getDirectReportees);

router.post('/', authorizeRoles('Super Admin', 'HR Manager'), createEmployee);
router.post('/bulk', authorizeRoles('Super Admin', 'HR Manager'), bulkImportEmployees);

router.put('/:id', updateEmployee);
router.patch('/:id/manager', authorizeRoles('Super Admin', 'HR Manager'), updateReportingManager);

router.delete('/:id', authorizeRoles('Super Admin'), deleteEmployee);

export default router;
