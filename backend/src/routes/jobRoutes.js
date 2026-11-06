import { Router } from 'express';
import {
  createJob,
  deleteJob,
  getJob,
  getMyJob,
  listJobs,
  listMyJobs,
  updateJob,
} from '../controllers/jobController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';

const router = Router();
router.get('/', listJobs);
router.get('/mine', protect, authorize('recruiter', 'admin'), listMyJobs);
router.get('/mine/:id', protect, authorize('recruiter', 'admin'), getMyJob);
router.get('/:id', getJob);
router.post('/', protect, authorize('recruiter', 'admin'), createJob);
router.patch('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);
export default router;
