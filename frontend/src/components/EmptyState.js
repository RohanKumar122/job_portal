export function JobCardSkeleton() {
  return (
    <div className="h-[320px] sm:h-[340px] rounded-2xl sm:rounded-[2rem] border border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 overflow-hidden relative">
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-slate-100 dark:via-white/5 to-transparent bg-[length:800px_100%]"></div>
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-2.5 w-1/3 rounded bg-slate-100 dark:bg-white/10"></div>
            <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-white/10"></div>
          </div>
        </div>
        <div className="h-5 w-24 rounded-full bg-slate-100 dark:bg-white/10"></div>
        <div className="space-y-2">
          <div className="h-3 w-3/4 rounded bg-slate-100 dark:bg-white/10"></div>
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-white/10"></div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ onClearFilters }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-16 sm:py-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">No matching jobs</h3>
      <p className="text-sm sm:text-base text-slate-500 max-w-sm mx-auto px-4 mb-6">
        Try adjusting your filters to find exactly what you're looking for.
      </p>
      {onClearFilters && (
        <button
          onClick={onClearFilters}
          className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2">Something went wrong</h3>
      <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
