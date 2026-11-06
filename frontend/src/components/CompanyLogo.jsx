import { useState } from 'react';
import { companyInitials } from '../lib/format';

// Shows the recruiter-supplied logo, falling back to initials (e.g. "AP") when missing or broken.
export default function CompanyLogo({ name, src, className = '' }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return (
      <div className={`logo-tile ${className}`}>
        <img src={src} alt={`${name} logo`} onError={() => setBroken(true)} />
      </div>
    );
  }
  return <div className={`logo-tile ${className}`} aria-hidden="true">{companyInitials(name)}</div>;
}
