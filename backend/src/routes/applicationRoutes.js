import { Router } from 'express';
import { createApplication, listApplications, updateApplicationStatus } from '../controllers/applicationController.js';
import { authorize, protect } from '../middleware/authMiddleware.js';
import { uploadResume } from '../middleware/uploadMiddleware.js';
const router = Router(); router.use(protect); router.get('/', listApplications); router.post('/', authorize('applicant'), uploadResume, createApplication); router.patch('/:id/status', authorize('recruiter', 'admin'), updateApplicationStatus); export default router;
