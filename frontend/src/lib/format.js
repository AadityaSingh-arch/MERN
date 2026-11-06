// "Apple" -> "AP", "Tata Consultancy Services" -> "TC"
export function companyInitials(name = '') {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function timeAgo(date) {
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, 'hour');
  const days = Math.floor(hours / 24);
  if (days < 30) return plural(days, 'day');
  return `on ${new Date(date).toLocaleDateString()}`;
}

export function formatSalary(salary) {
  if (!salary || (salary.min == null && salary.max == null)) return '';
  const money = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: salary.currency || 'INR',
    maximumFractionDigits: 0,
  });
  if (salary.min != null && salary.max != null) return `${money.format(salary.min)} – ${money.format(salary.max)}`;
  return salary.min != null ? `From ${money.format(salary.min)}` : `Up to ${money.format(salary.max)}`;
}

export const errorText = (err, fallback) => err.response?.data?.message ?? fallback;
