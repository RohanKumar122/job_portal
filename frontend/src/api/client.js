// REACT_APP_API_URL points at the /jobs endpoint (see frontend/.env); every
// other endpoint lives alongside it, so the base is derived once here instead
// of repeating `.replace('/jobs', ...)` in every component.
const JOBS_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api/jobs';
const API_ROOT = JOBS_URL.replace(/\/jobs\/?$/, '');

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => v !== undefined && v !== null && v !== '' && usp.append(key, v));
    } else {
      usp.append(key, value);
    }
  });
  return usp.toString();
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }
  return response.json();
}

export function fetchJobs(params) {
  const qs = buildQuery(params);
  return getJson(`${JOBS_URL}${qs ? `?${qs}` : ''}`);
}

export function fetchCompanies(q) {
  const qs = buildQuery({ q });
  return getJson(`${API_ROOT}/companies${qs ? `?${qs}` : ''}`);
}

export function fetchMetadata() {
  return getJson(`${API_ROOT}/metadata`);
}
