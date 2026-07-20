import { Router } from 'express';
import {
  indexPoliciesHandler,
  testPoliciesSearchHandler,
} from '../controllers/policy-index.controller';

const router = Router();

router.post('/policies', indexPoliciesHandler);
router.get('/test-policies', testPoliciesSearchHandler);

export default router;
