import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { authenticateJwt } from '../middleware/auth.middleware';

const router = Router();

// Protect all loan routes with JWT authentication middleware
router.use(authenticateJwt);

// Summary endpoint MUST be defined before /:id parameter route
router.get('/summary', LoanController.getSummary);

router.post('/', LoanController.createLoan);
router.get('/', LoanController.getLoans);
router.get('/:id', LoanController.getLoanById);
router.patch('/:id', LoanController.updateLoan);
router.patch('/:id/repay', LoanController.markAsRepaid);
router.delete('/:id', LoanController.deleteLoan);

export default router;
