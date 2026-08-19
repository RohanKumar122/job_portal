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

// The scraper that populates this data runs on an India-based host and
// writes naive "YYYY-MM-DD HH:MM:SS" strings with no timezone suffix - those
// are IST (UTC+5:30) wall-clock values. Everything below treats them as such
// and formats back into IST, so the UI reads correctly (and consistently)
// regardless of the viewer's own browser/system timezone.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Parses a naive "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" string as IST wall-clock
// and returns the real absolute instant it represents (or null if the string
// isn't in that shape - loose text like "Jul 31, 2026" is left to the caller).
export function parseIstTimestamp(raw) {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const isoLike = /^\d{4}-\d{2}-\d{2}([ T]\d{2}:\d{2}:\d{2})?$/;
  if (!isoLike.test(s)) return null;
  const withTime = s.includes(':') ? s.replace(' ', 'T') : `${s}T00:00:00`;
  const d = new Date(`${withTime}+05:30`);
  return isNaN(d.getTime()) ? null : d;
}

// Reads a real instant back out as its IST wall-clock calendar/time parts.
// Done via millisecond math + UTC getters (not Intl timezone data), so it's
// deterministic in every environment.
function istParts(instant) {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
}

export function formatIstAbsolute(instant) {
  const p = istParts(instant);
  return `${p.date} ${MONTH_ABBR[p.month]} ${p.year}`;
}

// Full precision, explicitly labeled IST - used for tooltips.
export function formatIstDateTime(instant) {
  const p = istParts(instant);
  const hour12 = p.hours % 12 || 12;
  const ampm = p.hours >= 12 ? 'PM' : 'AM';
  const minutes = String(p.minutes).padStart(2, '0');
  return `${p.date} ${MONTH_ABBR[p.month]} ${p.year}, ${hour12}:${minutes} ${ampm} IST`;
}

function relativeIstLabel(instant) {
  const nowParts = istParts(new Date());
  const targetParts = istParts(instant);
  const dayDiff = Math.round(
    (Date.UTC(nowParts.year, nowParts.month, nowParts.date) - Date.UTC(targetParts.year, targetParts.month, targetParts.date))
    / 86400000
  );

  if (dayDiff === 0) {
    const diffMs = Date.now() - instant.getTime();
    if (diffMs < 60000) return 'Just now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    return `${Math.floor(diffMs / 3600000)}h ago`;
  }
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff > 1 && dayDiff < 7) return `${dayDiff} days ago`;
  return formatIstAbsolute(instant);
}

// The API's `postedAt` field is inconsistent across source companies: IST
// datetime, date-only, loose text ("Jul 31, 2026"), an already-human phrase
// ("Posted Yesterday"), or empty. This normalizes all of those into one
// clean, short label in IST. Falls back to the reliable `created_at`
// ingestion timestamp when postedAt is missing.
export function formatPostedLabel(postedAt, createdAt) {
  const raw = (postedAt || '').trim();

  if (raw) {
    if (/posted/i.test(raw)) {
      return raw.replace(/^posted\s*/i, '').trim() || 'Recently';
    }
    const parsed = parseIstTimestamp(raw);
    if (parsed) return relativeIstLabel(parsed);
    return raw;
  }

  const fallback = parseIstTimestamp(createdAt);
  if (fallback) return relativeIstLabel(fallback);

  return 'Recently';
}

// `updated_at` is always a clean IST "YYYY-MM-DD HH:MM:SS" string - no
// fallback/loose-format handling needed the way postedAt requires.
export function formatUpdatedLabel(updatedAt) {
  const parsed = parseIstTimestamp(updatedAt);
  return parsed ? relativeIstLabel(parsed) : null;
}
