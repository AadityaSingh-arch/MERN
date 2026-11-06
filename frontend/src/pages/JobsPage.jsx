import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import CompanyLogo from '../components/CompanyLogo';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ keyword: '', location: '', employmentType: '' });

  const load = async () => {
    const { data } = await client.get('/jobs', { params: filters });
    setJobs(data.jobs);
  };
  useEffect(() => { load(); }, []);

  return (
    <section>
      <div className="page-heading">
        <p className="eyebrow">Open roles</p>
        <h1>Find your next opportunity</h1>
      </div>
      <form className="filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Title, skill, or company" onChange={(e) => setFilters({ ...filters, keyword: e.target.value })} />
        <input placeholder="Location" onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
        <select onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}>
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <button className="button">Search</button>
      </form>
      <div className="job-grid">
        {jobs.map((job) => (
          <article className="job-card" key={job._id}>
            <CompanyLogo name={job.companyName} src={job.companyLogo} className="small" />
            <p className="pill">{job.employmentType}</p>
            <h2><Link to={`/jobs/${job._id}`}>{job.title}</Link></h2>
            <p>{job.companyName} · {job.location}</p>
            <p className="muted clamp">{job.description}</p>
            <Link className="card-link" to={`/jobs/${job._id}`}>View role →</Link>
          </article>
        ))}
        {!jobs.length && <p>No roles match those filters yet.</p>}
      </div>
    </section>
  );
}
