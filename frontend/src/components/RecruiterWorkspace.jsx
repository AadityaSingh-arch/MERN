import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { errorText } from '../lib/format';

const EMPTY_FORM = {
  title: '',
  companyName: '',
  companyLogo: '',
  companyDescription: '',
  location: '',
  employmentType: 'Full-time',
  skills: '',
  salaryMin: '',
  salaryMax: '',
  description: '',
  status: 'open',
};

const STATUSES = ['submitted', 'reviewing', 'shortlisted', 'rejected', 'hired'];

const jobToForm = (job) => ({
  title: job.title ?? '',
  companyName: job.companyName ?? '',
  companyLogo: job.companyLogo ?? '',
  companyDescription: job.companyDescription ?? '',
  location: job.location ?? '',
  employmentType: job.employmentType ?? 'Full-time',
  skills: (job.skills ?? []).join(', '),
  salaryMin: job.salary?.min ?? '',
  salaryMax: job.salary?.max ?? '',
  description: job.description ?? '',
  status: job.status ?? 'open',
});

/**
 * Two-panel recruiter screen.
 *  - /dashboard                      -> "Post a new role"
 *  - /dashboard/jobs/:id/edit        -> "Edit job post" (pass editJobId)
 */
export default function RecruiterWorkspace({ editJobId = null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editing = Boolean(editJobId);

  const [form, setForm] = useState(EMPTY_FORM);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [loadingJob, setLoadingJob] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState(location.state?.notice ?? '');

  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const loadJobs = useCallback(async () => {
    try {
      const { data } = await client.get('/jobs/mine');
      setJobs(data.jobs);
    } catch (err) {
      setFormError(errorText(err, 'Could not load your job posts.'));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Edit screen: fetch the job through the owner-only API and fill the form.
  useEffect(() => {
    if (!editJobId) return;
    let cancelled = false;
    setLoadingJob(true);
    client
      .get(`/jobs/mine/${editJobId}`)
      .then(({ data }) => !cancelled && setForm(jobToForm(data.job)))
      .catch((err) => !cancelled && setFormError(errorText(err, 'Could not load this job post.')))
      .finally(() => !cancelled && setLoadingJob(false));
    return () => {
      cancelled = true;
    };
  }, [editJobId]);

  const buildPayload = () => ({
    title: form.title.trim(),
    companyName: form.companyName.trim(),
    companyLogo: form.companyLogo.trim(),
    companyDescription: form.companyDescription.trim(),
    location: form.location.trim(),
    employmentType: form.employmentType,
    skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
    salary: {
      min: form.salaryMin === '' ? undefined : Number(form.salaryMin),
      max: form.salaryMax === '' ? undefined : Number(form.salaryMax),
    },
    description: form.description.trim(),
    ...(editing ? { status: form.status } : {}),
  });

  const validate = () => {
    const { title, companyName, location, description } = buildPayload();
    if (!title || !companyName || !location || !description) {
      return 'Job title, company name, location and role description are required.';
    }
    const min = form.salaryMin === '' ? null : Number(form.salaryMin);
    const max = form.salaryMax === '' ? null : Number(form.salaryMax);
    if ((min !== null && !(min >= 0)) || (max !== null && !(max >= 0))) return 'Salary must be a positive number.';
    if (min !== null && max !== null && min > max) return 'Minimum salary cannot be greater than maximum salary.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setFormError('');
    setNotice('');
    const problem = validate();
    if (problem) return setFormError(problem);

    setSaving(true);
    try {
      if (editing) {
        await client.patch(`/jobs/${editJobId}`, buildPayload());
        navigate('/dashboard', { state: { notice: 'Changes saved.' } });
      } else {
        const { data } = await client.post('/jobs', buildPayload());
        setJobs((current) => [data.job, ...current]);
        setForm(EMPTY_FORM);
        setNotice('Job published. Applicants can see it on Find jobs now.');
      }
    } catch (err) {
      setFormError(errorText(err, 'Could not save this job. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const viewSubmissions = async (job) => {
    setSelectedJob(job);
    setApplications([]);
    setAppsError('');
    setAppsLoading(true);
    try {
      const { data } = await client.get('/applications', { params: { jobId: job._id } });
      setApplications(data.applications);
    } catch (err) {
      setAppsError(errorText(err, 'Could not load submissions.'));
    } finally {
      setAppsLoading(false);
    }
  };

  const changeStatus = async (application, status) => {
    const previous = application.status;
    setApplications((current) => current.map((a) => (a._id === application._id ? { ...a, status } : a)));
    try {
      await client.patch(`/applications/${application._id}/status`, { status });
    } catch (err) {
      setApplications((current) => current.map((a) => (a._id === application._id ? { ...a, status: previous } : a)));
      setAppsError(errorText(err, 'Could not update the status.'));
    }
  };

  return (
    <div className="workspace">
      <section className="panel">
        <div className="panel-head">
          <p className="panel-eyebrow">Job management</p>
          {editing && (
            <button type="button" className="link-button accent" onClick={() => navigate('/dashboard')}>
              Cancel edit
            </button>
          )}
        </div>
        <h2>{editing ? 'Edit job post' : 'Post a new role'}</h2>

        {loadingJob ? (
          <p className="muted">Loading job post…</p>
        ) : (
          <form onSubmit={submit} noValidate>
            <div className="field-row">
              <label>
                Job title
                <input required maxLength={120} value={form.title} onChange={update('title')} />
              </label>
              <label>
                Company name
                <input required maxLength={120} value={form.companyName} onChange={update('companyName')} />
              </label>
            </div>

            <label>
              Company logo URL <span className="hint">optional</span>
              <input type="url" placeholder="https://…" value={form.companyLogo} onChange={update('companyLogo')} />
            </label>

            <label>
              About the company <span className="hint">shown on job detail page</span>
              <textarea rows={3} maxLength={2000} value={form.companyDescription} onChange={update('companyDescription')} />
            </label>

            <div className="field-row">
              <label>
                Location
                <input required maxLength={120} value={form.location} onChange={update('location')} />
              </label>
              <label>
                Employment type
                <select value={form.employmentType} onChange={update('employmentType')}>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </label>
            </div>

            <label>
              Skills <span className="hint">comma-separated</span>
              <input placeholder="React, Node.js, MongoDB" value={form.skills} onChange={update('skills')} />
            </label>

            <div className="field-row">
              <label>
                Minimum salary
                <input type="number" min="0" inputMode="numeric" value={form.salaryMin} onChange={update('salaryMin')} />
              </label>
              <label>
                Maximum salary
                <input type="number" min="0" inputMode="numeric" value={form.salaryMax} onChange={update('salaryMax')} />
              </label>
            </div>

            <label>
              Role description
              <textarea rows={6} required maxLength={6000} value={form.description} onChange={update('description')} />
            </label>

            {editing && (
              <label>
                Listing status <span className="hint">closed roles stop accepting applications</span>
                <select value={form.status} onChange={update('status')}>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            )}

            {formError && <p className="error" role="alert">{formError}</p>}
            {notice && <p className="success" role="status">{notice}</p>}

            <button className="button publish" type="submit" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish job'}
            </button>
          </form>
        )}
        {loadingJob === false && formError && editing && !form.title && (
          <p><button type="button" className="link-button accent" onClick={() => navigate('/dashboard')}>← Back to dashboard</button></p>
        )}
      </section>

      <section className="panel">
        <p className="panel-eyebrow">Applications</p>
        <h2>Job submissions</h2>
        <p className="muted subtitle">
          {selectedJob ? `Applicants for ${selectedJob.title}.` : 'Choose a role to see its applicants.'}
        </p>

        {jobsLoading && <p className="muted">Loading your roles…</p>}
        {!jobsLoading && !jobs.length && <p className="muted">You haven't posted any roles yet.</p>}

        <ul className="job-list">
          {jobs.map((job) => (
            <li key={job._id} className={selectedJob?._id === job._id || editJobId === job._id ? 'active' : ''}>
              <div className="job-list-info">
                <div>
                  <strong>{job.title}</strong>
                  <span>
                    {job.companyName} · {job.location}
                    {job.status === 'closed' && <em className="closed"> · Closed</em>}
                  </span>
                </div>
              </div>
              <div className="job-list-actions">
                <button type="button" className="link-button accent" onClick={() => navigate(`/dashboard/jobs/${job._id}/edit`)}>
                  Edit
                </button>
                <button type="button" className="link-button accent" onClick={() => viewSubmissions(job)}>
                  Submissions
                </button>
              </div>
            </li>
          ))}
        </ul>

        {selectedJob && (
          <div className="applicants">
            {appsLoading && <p className="muted">Loading submissions…</p>}
            {appsError && <p className="error">{appsError}</p>}
            {!appsLoading && !appsError && !applications.length && <p className="muted">No applications for this role yet.</p>}
            {applications.map((application) => (
              <article className="applicant" key={application._id}>
                <div className="applicant-head">
                  <div>
                    <strong>{application.applicant?.name ?? 'Unknown applicant'}</strong>
                    <span>{application.applicant?.email}</span>
                  </div>
                  <select
                    aria-label="Application status"
                    value={application.status}
                    onChange={(e) => changeStatus(application, e.target.value)}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                {application.coverLetter && <p className="muted cover">{application.coverLetter}</p>}
                <p className="applicant-meta">
                  Applied {new Date(application.createdAt).toLocaleDateString()}
                  {application.resume?.url && (
                    <> · <a href={application.resume.url} target="_blank" rel="noreferrer">View resume</a></>
                  )}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
