import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import CompanyLogo from '../components/CompanyLogo';
import { useAuth } from '../context/AuthContext';
import { errorText, formatSalary, timeAgo } from '../lib/format';

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_EXTENSIONS = ['pdf', 'doc', 'docx'];

export default function JobDetailPage() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [existing, setExisting] = useState(null); // this applicant's earlier application, if any
  const [showForm, setShowForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client
      .get(`/jobs/${id}`)
      .then(({ data }) => !cancelled && setJob(data.job))
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Has this applicant already applied?
  useEffect(() => {
    if (authLoading || user?.role !== 'applicant') {
      setExisting(null);
      return;
    }
    client
      .get('/applications', { params: { jobId: id } })
      .then(({ data }) => setExisting(data.applications[0] ?? null))
      .catch(() => setExisting(null));
  }, [id, user, authLoading]);

  const onApplyClick = () => {
    setError('');
    setInfo('');
    if (authLoading) return;
    if (!user) return navigate('/login', { state: { from: location.pathname } });
    if (user.role !== 'applicant') return setInfo('Only applicant accounts can apply for roles.');
    setShowForm((open) => !open);
  };

  const validateResume = (file) => {
    if (!file) return 'Please attach your résumé.';
    const extension = file.name.split('.').pop().toLowerCase();
    if (!RESUME_EXTENSIONS.includes(extension)) return 'Résumé must be a PDF, DOC or DOCX file.';
    if (file.size > MAX_RESUME_BYTES) return 'Résumé must be 5 MB or smaller.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const problem = validateResume(resume);
    if (problem) return setError(problem);

    const body = new FormData();
    body.append('jobId', job._id);
    body.append('coverLetter', coverLetter.trim());
    body.append('resume', resume);

    setSubmitting(true);
    try {
      const { data } = await client.post('/applications', body);
      setExisting(data.application);
      setShowForm(false);
      setInfo('Application submitted. Good luck!');
    } catch (err) {
      if (err.response?.status === 409) {
        setShowForm(false);
        setExisting({ status: 'submitted' });
      }
      setError(errorText(err, 'Could not submit your application. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="center">Loading role…</p>;
  if (notFound || !job) {
    return (
      <section>
        <Link className="back-link" to="/jobs">← All jobs</Link>
        <h1>Role not found</h1>
        <p className="lead">This role may have been removed. Browse the latest openings instead.</p>
      </section>
    );
  }

  const closed = job.status === 'closed';
  const salary = formatSalary(job.salary);

  let buttonLabel = 'Apply now';
  if (existing) buttonLabel = 'Application submitted';
  else if (closed) buttonLabel = 'Applications closed';

  return (
    <section className="job-detail-page">
      <Link className="back-link" to="/jobs">← All jobs</Link>

      <div className="job-detail">
        <article>
          <div className="job-hero">
            <CompanyLogo name={job.companyName} src={job.companyLogo} />
            <div>
              <p className="eyebrow">{job.employmentType}</p>
              <h1>{job.title}</h1>
              <p className="job-meta">
                {job.companyName} · {job.location} · Posted {timeAgo(job.createdAt)}
              </p>
              {salary && <p className="job-meta">{salary}</p>}
            </div>
          </div>

          <div className="job-section">
            <h2>About the role</h2>
            <p className="prewrap">{job.description}</p>
            {job.skills?.length > 0 && (
              <ul className="chips">
                {job.skills.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
            )}
          </div>

          <div className="job-section">
            <h2>About {job.companyName}</h2>
            <p className="prewrap">
              {job.companyDescription || 'Company information will be shared by the recruiter soon.'}
            </p>
          </div>
        </article>

        <aside className="apply-card">
          <p className="eyebrow">Interested?</p>
          <h2>Make your move.</h2>
          <p>Apply directly and keep track of your application from your workspace.</p>

          <button
            type="button"
            className="button apply-button"
            onClick={onApplyClick}
            disabled={Boolean(existing) || closed}
            aria-expanded={showForm}
          >
            {buttonLabel}
          </button>

          {existing && (
            <p className="muted small-text">
              Status: <strong>{existing.status}</strong>
              {existing.createdAt && <> · Applied {new Date(existing.createdAt).toLocaleDateString()}</>}
            </p>
          )}
          {closed && !existing && <p className="muted small-text">This role is no longer accepting applications.</p>}
          {info && <p className={info.startsWith('Application') ? 'success' : 'error'} role="status">{info}</p>}

          {showForm && !existing && (
            <form className="apply-form" onSubmit={submit} noValidate>
              <label>
                Cover letter <span className="hint">optional</span>
                <textarea
                  rows={6}
                  maxLength={3000}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </label>
              <label>
                Résumé <span className="hint">PDF, DOC, or DOCX · 5 MB max</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => setResume(e.target.files[0] ?? null)}
                />
              </label>
              {error && <p className="error" role="alert">{error}</p>}
              <button className="button apply-button" type="submit" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          )}
          {!showForm && error && <p className="error" role="alert">{error}</p>}
        </aside>
      </div>
    </section>
  );
}
