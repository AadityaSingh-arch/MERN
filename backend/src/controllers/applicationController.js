import Application from '../models/Application.js';
import Job from '../models/Job.js';
import uploadToCloudinary from '../utils/uploadToCloudinary.js';

export async function createApplication(req, res, next) {
  try {
    const job = await Job.findOne({ _id: req.body.jobId, status: 'open' });
    if (!job) return res.status(404).json({ message: 'Open job not found' });
    if (!req.file) {
      return res.status(400).json({ message: 'Please attach your résumé (PDF, DOC or DOCX, up to 5 MB)' });
    }

    const coverLetter = (req.body.coverLetter ?? '').trim();
    if (coverLetter.length > 3000) {
      return res.status(400).json({ message: 'Cover letter must be 3000 characters or fewer' });
    }

    // Check for a duplicate before spending an upload on it.
    if (await Application.exists({ job: job._id, applicant: req.user._id })) {
      return res.status(409).json({ message: 'You have already applied to this job' });
    }

    const file = await uploadToCloudinary(req.file.buffer, 'job-portal/resumes', 'raw');
    const application = await Application.create({
      job: job._id,
      applicant: req.user._id,
      coverLetter,
      resume: { url: file.secure_url, publicId: file.public_id },
    });
    res.status(201).json({ application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'You have already applied to this job' });
    next(error);
  }
}

export async function listApplications(req, res, next) {
  try {
    const query = req.user.role === 'applicant' ? { applicant: req.user._id } : {};
    if (req.query.jobId) query.job = req.query.jobId;
    const applications = await Application.find(query)
      .populate({ path: 'job', match: req.user.role === 'recruiter' ? { recruiter: req.user._id } : {} })
      .populate('applicant', 'name email')
      .sort({ createdAt: -1 });
    res.json({ applications: applications.filter((item) => item.job) });
  } catch (error) {
    next(error);
  }
}

export async function updateApplicationStatus(req, res, next) {
  try {
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (req.user.role !== 'admin' && !application.job.recruiter.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not permitted' });
    }
    application.status = req.body.status;
    await application.save();
    res.json({ application });
  } catch (error) {
    next(error);
  }
}
