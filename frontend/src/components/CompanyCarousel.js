import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { fetchJobs } from '../api/client';
import JobCard from './JobCard';
import { JobCardSkeleton } from './EmptyState';

const PAGE_SIZE = 10;

const CompanyCarousel = memo(({ company, totalCount, filters }) => {
  const scrollRef = useRef(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const skipRef = useRef(0);
  const [hasMore, setHasMore] = useState(true);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const filterKey = JSON.stringify(filters);

  const loadPage = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const skip = reset ? 0 : skipRef.current;
      const data = await fetchJobs({
        company,
        limit: PAGE_SIZE,
        skip,
        q: filters.activeSearch,
        locations: filters.selectedCountries,
        departments: filters.selectedDepartments,
        workTypes: filters.selectedWorkModes,
        dateFilter: filters.dateFilter,
        startDate: filters.startDate,
        endDate: filters.endDate,
        sort: filters.sortOrder,
        sortBy: 'createdAt',
      });

      if (reset) {
        setJobs(data);
        skipRef.current = data.length;
      } else {
        setJobs((prev) => [...prev, ...data]);
        skipRef.current += data.length;
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, filterKey]);

  useEffect(() => {
    loadPage(true);
  }, [loadPage]);

  const updateArrows = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, jobs]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.8 : clientWidth * 0.8;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (jobs.length === 0 && !loading) return null;

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6 flex items-center justify-between">
        <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 min-w-0">
          <span className="w-2 h-8 bg-indigo-500 rounded-full flex-shrink-0"></span>
          <span className="truncate">{company}</span>
          <span className="flex-shrink-0 text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md border border-slate-200 dark:border-white/5 uppercase tracking-widest">
            {totalCount || jobs.length} Total
          </span>
        </h3>

        <div className="hidden md:flex gap-2 flex-shrink-0">
          <button
            onClick={() => scroll('left')}
            className={`w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all ${showLeftArrow ? 'bg-white dark:bg-white/5 opacity-100 hover:scale-110' : 'opacity-20 cursor-not-allowed'}`}
            disabled={!showLeftArrow}
          >
            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
          </button>
          <button
            onClick={() => scroll('right')}
            className={`w-10 h-10 rounded-full border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all ${showRightArrow ? 'bg-white dark:bg-white/5 opacity-100 hover:scale-110' : 'opacity-20 cursor-not-allowed'}`}
            disabled={!showRightArrow}
          >
            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
          </button>
        </div>
      </div>

      <div className="relative group/row">
        <div className={`hidden md:block absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 dark:from-[#0f172a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`hidden md:block absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 dark:from-[#0f172a] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`}></div>

        <div
          ref={scrollRef}
          onScroll={updateArrows}
          className="flex items-stretch overflow-x-auto gap-4 sm:gap-6 px-4 sm:px-8 lg:px-[calc((100vw-1280px)/2+2rem)] no-scrollbar pb-6 scroll-smooth snap-x"
        >
          {jobs.map((job) => (
            <div key={job._id || job.id} className="flex-shrink-0 w-72 sm:w-80 md:w-[26rem] snap-start">
              <JobCard job={job} />
            </div>
          ))}

          {loading && jobs.length === 0 && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72 sm:w-80 md:w-[26rem]"><JobCardSkeleton /></div>
            ))
          )}

          {hasMore && jobs.length > 0 && (
            <div className="flex-shrink-0 w-72 sm:w-80 flex items-center justify-center pr-8">
              <button
                onClick={() => loadPage()}
                disabled={loading}
                className="group/btn relative w-full h-[320px] sm:h-[340px] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-4"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center group-hover/btn:scale-110 transition-transform">
                  {loading ? (
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                </div>
                <div className="text-center">
                  <span className="block text-slate-900 dark:text-white font-bold text-lg">Load More</span>
                  <span className="text-slate-500 text-sm font-medium">Keep exploring {company}</span>
                </div>
              </button>
            </div>
          )}

          {!hasMore && jobs.length > 0 && (
            <div className="flex-shrink-0 w-24 flex items-center justify-center pr-8 sm:pr-0 text-slate-400 dark:text-slate-600">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">End</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default CompanyCarousel;
