// Country normalization for the free-text `locations` field returned by the API.
export const normalizeCountry = (loc) => {
  if (!loc) return null;
  const l = loc.toLowerCase();

  // If explicitly remote or containing remote, categorize as Remote
  if (l.includes('remote')) return 'Remote';

  const text = loc.toUpperCase().trim();

  // Comprehensive Mapping Table
  const mapping = {
    'INDIA': 'India', 'IND': 'India', 'IN': 'India',
    'USA': 'USA', 'US': 'USA', 'UNITED STATES': 'USA', 'AMERICA': 'USA', 'U.S.A.': 'USA',
    'UK': 'UK', 'UNITED KINGDOM': 'UK', 'GB': 'UK', 'GREAT BRITAIN': 'UK', 'U.K.': 'UK',
    'CANADA': 'Canada', 'CA': 'Canada', 'CAN': 'Canada',
    'SINGAPORE': 'Singapore', 'SG': 'Singapore', 'SGP': 'Singapore',
    'GERMANY': 'Germany', 'DE': 'Germany', 'GER': 'Germany',
    'AUSTRALIA': 'Australia', 'AU': 'Australia', 'AUS': 'Australia',
    'FRANCE': 'France', 'FR': 'France',
    'SPAIN': 'Spain', 'ES': 'Spain',
    'ITALY': 'Italy', 'IT': 'Italy',
    'JAPAN': 'Japan', 'JP': 'Japan',
    'CHINA': 'China', 'CN': 'China',
    'BRAZIL': 'Brazil', 'BR': 'Brazil',
    'SWEDEN': 'Sweden', 'SE': 'Sweden',
    'NETHERLANDS': 'Netherlands', 'NL': 'Netherlands',
    'POLAND': 'Poland', 'PL': 'Poland',
    'IRELAND': 'Ireland', 'IE': 'Ireland',
    'SWITZERLAND': 'Switzerland', 'CH': 'Switzerland',
    'MEXICO': 'Mexico', 'MX': 'Mexico',
    'ROMANIA': 'Romania', 'RO': 'Romania',
    'HUNGARY': 'Hungary', 'HU': 'Hungary',
    'EGYPT': 'Egypt', 'EG': 'Egypt',
    'MALAYSIA': 'Malaysia', 'MY': 'Malaysia',
    'THAILAND': 'Thailand', 'TH': 'Thailand',
    'VIETNAM': 'Vietnam', 'VN': 'Vietnam'
  };

  // Check for whole word matches in the entire string first
  for (const [key, value] of Object.entries(mapping)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedKey}\\b`, 'i');
    if (regex.test(text)) return value;
  }

  // Fallback: extract the last part (often the country)
  const parts = loc.split(',');
  const possibleCountry = parts[parts.length - 1].trim();

  // Basic validation for the extracted string
  if (possibleCountry.length > 2 && possibleCountry.length < 30) {
    // Capitalize first letter of each word
    return possibleCountry.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  }

  return null;
};

// workLocationOption is a messy free-text field: it mixes genuine work-mode
// values ("onsite" / "Hybrid" / "Remote", inconsistently cased) with unrelated
// employment-type values ("Permanent", "Full-time") depending on the source.
// This buckets only the recognizable work-mode signal; everything else is
// still shown on the card as a plain tag, just not offered as a filter.
export const WORK_MODES = ['Remote', 'Hybrid', 'Onsite'];

export function normalizeWorkMode(raw) {
  if (!raw) return null;
  const l = raw.toLowerCase();
  if (l.includes('remote')) return 'Remote';
  if (l.includes('hybrid')) return 'Hybrid';
  if (l.includes('onsite') || l.includes('on-site') || l.includes('on site')) return 'Onsite';
  return null;
}

export const WORK_MODE_STYLES = {
  Remote: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Hybrid: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  Onsite: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toDateSafe(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" -> normalize to ISO so every
  // browser parses it consistently (Safari is strict about the space vs "T").
  const isoLike = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/;
  const parseable = isoLike.test(s) ? s.replace(' ', 'T') : s;
  const d = new Date(parseable);
  return isNaN(d.getTime()) ? null : d;
}

function relativeOrAbsolute(d) {
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diffDays < 0) return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// The API's `postedAt` field is inconsistent across source companies: ISO
// datetime, date-only, loose text ("Jul 31, 2026"), an already-human phrase
// ("Posted Yesterday"), or empty. This normalizes all of those into one
// clean, short label. Falls back to the (reliable) `createdAt` ingestion
// timestamp when postedAt is missing.
export function formatPostedLabel(postedAt, createdAt) {
  const raw = (postedAt || '').trim();

  if (raw) {
    if (/posted/i.test(raw)) {
      return raw.replace(/^posted\s*/i, '').trim() || 'Recently';
    }
    const parsed = toDateSafe(raw);
    if (parsed) return relativeOrAbsolute(parsed);
    return raw;
  }

  const fallback = toDateSafe(createdAt);
  if (fallback) return relativeOrAbsolute(fallback);

  return 'Recently';
}
