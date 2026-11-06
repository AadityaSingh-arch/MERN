import Job from '../models/Job.js';

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const clean = (value) => (typeof value === 'string' ? value.trim() : value);

// Accepts either an array or a comma-separated string, returns unique, trimmed skills.
function parseSkills(value) {
  const list = Array.isArray(value) ? value : String(value ?? '').split(',');
  return [...new Set(list.map((s) => String(s).trim()).filter(Boolean))].slice(0, 30);
}

function parseAmount(value, label) {
  if (value === undefined || value === null || value === '') return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new HttpError(400, `${label} must be a positive number`);
  return number;
}

function parseLogoUrl(value) {
  const url = clean(value);
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    if (!['http:', 'https:'].includes(protocol)) throw new Error();
  } catch {
    throw new HttpError(400, 'Company logo must be a valid http(s) URL');
  }
  return url;
}

// Whitelist the fields a recruiter is allowed to set (blocks recruiter/status injection).
function buildJobFields(body, { partial = false } = {}) {
  const fields = {};
  const has = (key) => Object.prototype.hasOwnProperty.call(body, key);

  for (const key of ['title', 'companyName', 'location', 'description', 'companyDescription']) {
    if (has(key)) fields[key] = clean(body[key]);
  }
  if (has('companyLogo')) fields.companyLogo = parseLogoUrl(body.companyLogo) ?? '';
  if (has('employmentType')) {
    if (!EMPLOYMENT_TYPES.includes(body.employmentType)) throw new HttpError(400, 'Invalid employment type');
    fields.employmentType = body.employmentType;
  }
  if (has('skills')) fields.skills = parseSkills(body.skills);

  const salaryInput = body.salary ?? {};
  if (has('salary') || has('salaryMin') || has('salaryMax')) {
    const min = parseAmount(salaryInput.min ?? body.salaryMin, 'Minimum salary');
    const max = parseAmount(salaryInput.max ?? body.salaryMax, 'Maximum salary');
    if (min !== undefined && max !== undefined && min > max) {
      throw new HttpError(400, 'Minimum salary cannot be greater than maximum salary');
    }
    fields.salary = { min, max };
  }

  if (!partial) {
    for (const key of ['title', 'companyName', 'location', 'description', 'employmentType']) {
      if (!fields[key]) throw new HttpError(400, `${key} is required`);
    }
  }
  return fields;
}

async function findOwnedJob(req) {
  const job = await Job.findById(req.params.id);
  if (!job) throw new HttpError(404, 'Job not found');
  if (req.user.role !== 'admin' && !job.recruiter.equals(req.user._id)) throw new HttpError(403, 'Not your job post');
  return job;
}

export async function listJobs(req, res, next) {
  try {
    const { keyword, location, employmentType } = req.query;
    const query = { status: 'open' };
    if (keyword) {
      const pattern = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = ['title', 'companyName', 'description', 'skills'].map((field) => ({
        [field]: { $regex: pattern, $options: 'i' },
      }));
    }
    if (location) query.location = { $regex: location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (employmentType) query.employmentType = employmentType;
    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate('recruiter', 'name');
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

// Jobs posted by the signed-in recruiter (admins see everything).
export async function listMyJobs(req, res, next) {
  try {
    const query = req.user.role === 'admin' ? {} : { recruiter: req.user._id };
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    res.json({ jobs });
  } catch (error) {
    next(error);
  }
}

// Public job detail page (also returned for closed jobs so the UI can say they are closed).
export async function getJob(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name');
    if (!job) throw new HttpError(404, 'Job not found');
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

// Owner-only fetch used by the edit screen.
export async function getMyJob(req, res, next) {
  try {
    res.json({ job: await findOwnedJob(req) });
  } catch (error) {
    next(error);
  }
}

export async function createJob(req, res, next) {
  try {
    const job = await Job.create({ ...buildJobFields(req.body), recruiter: req.user._id });
    res.status(201).json({ job });
  } catch (error) {
    next(error);
  }
}

export async function updateJob(req, res, next) {
  try {
    const job = await findOwnedJob(req);
    const fields = buildJobFields(req.body, { partial: true });
    if (req.body.status && ['open', 'closed'].includes(req.body.status)) fields.status = req.body.status;
    if (fields.salary) fields.salary.currency = job.salary?.currency ?? 'INR';
    job.set(fields);
    await job.save();
    res.json({ job });
  } catch (error) {
    next(error);
  }
}

export async function deleteJob(req, res, next) {
  try {
    const job = await findOwnedJob(req);
    await job.deleteOne();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
