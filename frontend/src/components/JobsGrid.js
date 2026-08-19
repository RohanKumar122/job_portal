import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobs } from '../api/client';
import JobCard from './JobCard';
import { EmptyState, ErrorState, JobCardSkeleton } from './EmptyState';

const PAGE_SIZE = 24;

export default function JobsGrid({ filters, onClearFilters }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const skipRef = useRef(0);
  const sentinelRef = useRef(null);

  const filterKey = JSON.stringify(filters);

  const loadPage = useCallback(async (reset) => {
    reset ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const skip = reset ? 0 : skipRef.current;
      const data = await fetchJobs({
        q: filters.activeSearch,
        companies: filters.selectedCompanies.length ? filters.selectedCompanies.join(',') : undefined,
        locations: filters.selectedCountries,
        departments: filters.selectedDepartments,
        workTypes: filters.selectedWorkModes,
        dateField: filters.dateBasis,
        dateFilter: filters.dateFilter,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sort: filters.sortOrder,
        sortBy: 'created_at',
        limit: PAGE_SIZE,
        skip,
      });

      setJobs((prev) => (reset ? data : [...prev, ...data]));
      skipRef.current = skip + data.length;
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    loadPage(true);
  }, [loadPage]);

  useEffect(() => {
    if (!hasMore || loading) return undefined;
    const node = sentinelRef.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          loadPage(false);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, loadPage]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 9 }).map((_, i) => <JobCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) return <ErrorState message={error} />;

  if (jobs.length === 0) return <EmptyState onClearFilters={onClearFilters} />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {jobs.map((job, i) => (
          <div key={job._id || job.id} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 11) * 40}ms` }}>
            <JobCard job={job} />
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="h-1" />

      {hasMore && (
        <div className="text-center mt-8 sm:mt-12 pb-4">
          <button
            onClick={() => loadPage(false)}
            disabled={loadingMore}
            className="px-8 py-4 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-700 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all inline-flex items-center gap-3 group disabled:opacity-60"
          >
            {loadingMore ? (
              <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <svg className="w-5 h-5 text-indigo-500 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {loadingMore ? 'Loading...' : 'Load More Jobs'}
          </button>
        </div>
      )}

      {!hasMore && jobs.length > 0 && (
        <p className="text-center text-slate-400 dark:text-slate-600 text-xs font-bold uppercase tracking-widest mt-8 sm:mt-12 pb-4">
          You've reached the end · {jobs.length} jobs shown
        </p>
      )}
    </div>
  );
}
