import { memo, useMemo, useState } from 'react';
import {
  normalizeWorkMode, WORK_MODE_STYLES, formatPostedLabel, formatUpdatedLabel,
  formatIstDateTime, parseIstTimestamp,
} from '../utils/format';

const AVATAR_PALETTES = [
  'from-indigo-500 to-blue-500',
  'from-fuchsia-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-cyan-500',
  'from-rose-500 to-red-500',
  'from-violet-500 to-purple-500',
];

function avatarGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

const JobCard = memo(({ job }) => {
  const [locationsExpanded, setLocationsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const companyName = job.companyName || 'Unknown';
  const department = job.department && job.department !== 'Not Specified' ? job.department : null;
  const workMode = normalizeWorkMode(job.workLocationOption);
  const rawWorkTag = !workMode && job.workLocationOption && job.workLocationOption !== 'Not Specified'
    ? job.workLocationOption
    : null;
  const locations = job.locations?.length ? job.locations : [];
  const visibleLocations = locationsExpanded ? locations : locations.slice(0, 2);
  const extraLocationCount = locations.length - visibleLocations.length;

  const postedLabel = useMemo(
    () => formatPostedLabel(job.postedAt, job.created_at),
    [job.postedAt, job.created_at]
  );
  const postedTitle = useMemo(() => {
    const instant = parseIstTimestamp(job.postedAt) || parseIstTimestamp(job.created_at);
    return instant ? formatIstDateTime(instant) : undefined;
  }, [job.postedAt, job.created_at]);

  // Shown as an explicit absolute IST timestamp (not "3 days ago") so it's
  // unambiguous on its own - a relative label would need the reader to
  // already know which timezone "now" was measured in.
  const updatedRelative = useMemo(() => formatUpdatedLabel(job.updated_at), [job.updated_at]);
  const updatedAbsolute = useMemo(() => {
    const instant = parseIstTimestamp(job.updated_at);
    return instant ? formatIstDateTime(instant) : null;
  }, [job.updated_at]);

  const handleCopyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!job.positionUrl) return;
    try {
      await navigator.clipboard.writeText(job.positionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard API unavailable - silently ignore, Apply button still works
    }
  };

  return (
    <div className="group relative h-full min-h-[320px] sm:min-h-[340px] rounded-2xl sm:rounded-[2rem] border border-slate-200 bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-100 dark:border-white/5 dark:bg-[#1e293b]/40 dark:shadow-none dark:hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] dark:hover:bg-[#1e293b]/80 p-5 sm:p-7 transition-all duration-500 hover:-translate-y-1.5 backdrop-blur-sm overflow-hidden flex flex-col justify-between">
      {/* Accent Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

      <div className="flex flex-col flex-grow min-w-0">
        <div className="flex items-start gap-3 mb-4">
          <div className={`flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${avatarGradient(companyName)} flex items-center justify-center text-white font-black text-sm shadow-md`}>
            {companyName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-500 dark:text-slate-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider truncate">
              {companyName}
            </p>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-fuchsia-600 dark:group-hover:from-white dark:group-hover:to-indigo-300 group-hover:bg-clip-text transition-all duration-300 leading-snug line-clamp-2">
              {job.name || 'Untitled Position'}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {department && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-tight border border-indigo-500/20 truncate max-w-full">
              {department}
            </span>
          )}
          {workMode && (
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight border ${WORK_MODE_STYLES[workMode]}`}>
              {workMode}
            </span>
          )}
          {rawWorkTag && (
            <span className="px-2.5 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-tight border border-slate-500/20">
              {rawWorkTag}
            </span>
          )}
        </div>

        <div className="space-y-2.5">
          {locations.length > 0 && (
            <div className="flex items-start text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
              <svg className="w-4 h-4 mt-0.5 mr-2 flex-shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="min-w-0">
                {visibleLocations.join(' · ')}
                {extraLocationCount > 0 && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setLocationsExpanded(true); }}
                    className="ml-1.5 font-bold text-indigo-500 dark:text-indigo-400 hover:underline"
                  >
                    +{extraLocationCount} more
                  </button>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium" title={postedTitle}>
            <svg className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Posted {postedLabel}
          </div>
          {updatedRelative && (
            <div className="flex items-center text-slate-400 dark:text-slate-500 text-[11px] sm:text-xs font-medium" title={updatedAbsolute}>
              <svg className="w-4 h-4 mr-2 flex-shrink-0 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Updated {updatedRelative} <span className="ml-1 opacity-60">IST</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
        <button
          onClick={handleCopyLink}
          disabled={!job.positionUrl}
          title="Copy link"
          className="flex-shrink-0 w-10 h-10 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 dark:hover:border-indigo-500/40 dark:hover:text-indigo-400 transition-all disabled:opacity-30 disabled:pointer-events-none"
        >
          {copied ? (
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
          )}
        </button>
        <a
          href={job.positionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 sm:py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-xs sm:text-sm uppercase tracking-wider"
        >
          Apply Now
        </a>
      </div>
    </div>
  );
});

export default JobCard;
